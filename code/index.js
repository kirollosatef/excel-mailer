const path = require("node:path");
const XLSX = require("xlsx");
const nodemailer = require("nodemailer");
const { ImapFlow } = require("imapflow");
var ProgressBar = require("progress");

const {
  listDatabase,
  ReadFile,
  getConfig,
  setBackup,
  fileExists,
  getBackup,
  RemoveFile,
  WriteFile,
  listAttachments,
} = require("./util/files");
const { logger } = require("./util/terminal");
const {
  excelDateToJSDate,
  validateEmail,
  Sleep,
  secondsToHms,
  messageToRFC822Email,
} = require("./util/misc");
const { log } = require("node:console");

const TEMP_PATH = path.resolve("../template");
const DATA_PATH = path.resolve("../data");
const BACKUP_PATH = path.resolve("../settings/backup.json");

main();

async function main() {
  //Email
  try {
    const { auth, waitInterval, sentfoldername } = getConfig();
    global.sentfoldername = sentfoldername || "Sent";
    //lock :|
    // if (!(auth.host.includes("zak") || auth.host.includes("alkhabeer"))) process.exit(1);

    global.auth = auth;
    global.waitInterval = waitInterval;
    var transporter = nodemailer.createTransport(auth);
    var imap = new ImapFlow({ ...auth, port: 993, logger: false });
    await imap.connect();
  } catch (error) {
    console.log(error);
    logger("CANNOT CONNECT TO EMAIL SERVER\nCHECK INTERNET CONNECTION", "red");
    process.exit(1);
  }

  //template
  global.template = await getTemplate();

  //data
  const isResumed = await fileExists(BACKUP_PATH);
  let data;
  if (isResumed) {
    data = await getBackup();
    let unprocessed = data.filter((e) => !e.processed);
    logger("RESUME Sending", "yellow");
    logger(`${unprocessed.length} Emails Remaining`);
    unprocessed.length == 0 && logger(`${secondsToHms((unprocessed.length * waitInterval) / 1000)}to Finish`);
  } else {
    data = await getData();
    logger(`${secondsToHms((data.length * waitInterval) / 1000)}to Finish`);
  }

  //send
  await Mailer(transporter, imap, data);

  //report
  let successful = data.filter((e) => e.sent);
  let failed = data.filter((e) => !e.sent);

  logger(`No of Sent Emails = ${successful.length}`, "yellow");
  logger(`No of Failed Emails = ${failed.length}`, "yellow");

  let report = `No of Failed Emails = ${failed.length}\n\n`;
  for await (const emaildata of failed) {
    let { email, errormsg } = emaildata;
    report += `---\nEMAIL: ${email}\nERROR: ${errormsg}\n---`;
  }
  const REPORT_PATH = path.resolve("../report.txt");
  await WriteFile(REPORT_PATH, report);

  //cleanup
  await RemoveFile(BACKUP_PATH);
}

async function getData() {
  const alldatafiles = await listDatabase(DATA_PATH);
  if (alldatafiles.length === 0) {
    logger("No Data Files Found", "red");
    process.exit(1);
  }
  if (alldatafiles.length > 1) {
    logger("More Than 1 Data File Found", "yellow");
  }
  const datafile = path.join(DATA_PATH, alldatafiles[0]);
  const workbook = XLSX.readFile(datafile);
  const sheet_name_list = workbook.SheetNames;
  let xlData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
  logger(`Excel File: ${datafile}`);
  //filter
  xlData = xlData.filter((e) => e.Email != " ");

  // const valid = xlData.filter(
  //   (obj) =>
  //     obj["الاسم"] &&
  //     obj["رقم الخدمة"] &&
  //     obj[" مبلغ المديونية "] &&
  //     obj["رقم حساب سداد"] &&
  //     obj["تاريخ تفعيل الخدمة"] &&
  //     obj.Email &&
  //     validateEmail(obj.Email)
  // );

  /*   const notvalid = xlData.reduce((acc, obj) => {
    if (
      !obj["الاسم"] ||
      !obj["رقم الخدمة"] ||
      !obj[" مبلغ المديونية "] ||
      !obj["رقم حساب سداد"] ||
      !obj["تاريخ تفعيل الخدمة"] ||
      !obj.Email
    ) {
      acc.push(obj);
    }
    return acc;
  }, []); */


  const filteredData = xlData.map((obj) => {
    const additionalData = { ...obj };
  
    return {
      ...additionalData,
    name: obj["الاسم"],
    serviceid: obj["رقم الخدمة"],
    amount: Number(obj[" مبلغ المديونية "]).toFixed(2),
    sadad: obj["رقم حساب سداد"],
    date: excelDateToJSDate(obj["تاريخ تفعيل الخدمة"]),
    email: obj.Email,
    processed: false,
    sent: false,
    errormsg: null,
    };
  });

  logger(`Emails Found: ${filteredData.length}`, "mag");

  return filteredData;
}

async function getTemplate() {
  try {
    const html = await ReadFile(path.join(TEMP_PATH, "template.htm"));
    const { username, subject } = JSON.parse(await ReadFile(path.join(TEMP_PATH, "template.json")));
    global.username = username;
    global.subject = subject;
    return html.toString();
  } catch (error) {
    logger("CAN NOT READ TEMPLATE FILE", "red");
    process.exit(1);
  }
}

function subHTML(dataObj) {
  let data = global.template;

  for (const [key, value] of Object.entries(dataObj)) {
    const placeholder = `[${key.toUpperCase()}]`;
    data = data.replaceAll(placeholder, value);
  }

  return data;
}

async function Mailer(transporter, imap, data) {
  //Backup
  await setBackup(data);

  var bar = new ProgressBar("  Sending Emails [:bar] :percent :email", {
    complete: "=",
    incomplete: " ",
    width: 30,
    total: data.length,
  });

  for await (const [index, emaildata] of data.entries()) {
    let dataToSend = emaildata;
    let attatchments = [];
    const attachmentsPath = path.resolve("../attatchments");
    const attachments = await listAttachments(dataToSend.serviceid,attachmentsPath);
    console.log(attachments);
    for (const file of attachments) {
      attatchments.push({
        filename: file,
        path: path.join(attachmentsPath, file),
      });
    }
    if (!dataToSend.processed) {
      const html = subHTML(dataToSend);
      const { sent, error } = await sendMail(transporter, imap, {
        to: dataToSend.email,
        html,
        attatchments
      });
      //backup
      data[index].sent = sent;
      data[index].errormsg = error;
      data[index].processed = true;
      setBackup(data);

      await Sleep(global.waitInterval);
    }
    bar.tick({ email: dataToSend.email });
  }
}

async function sendMail(transporter, imap, { to, html, attatchments }) {
  try {
    const message = {
      from: `"${global.username}" <${global.auth.auth.user}>`,
      to,
      subject: global.subject,
      text: null,
      html,
      attachments: attatchments
    };

    const [emailinfo, imapinfo] = await Promise.all([
      await transporter.sendMail(message),
      await imap.append(global.sentfoldername, messageToRFC822Email(message)),
    ]);
    //console.dir({ emailinfo, imapinfo }, { depth: null });

    return { sent: true, error: null };
  } catch (error) {
    return { sent: false, error: JSON.stringify(error) };
  }
}
