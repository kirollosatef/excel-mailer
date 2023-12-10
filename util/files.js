const fs = require("fs-extra");
const { promisify } = require("node:util");
const path = require("node:path");

const WriteFile = promisify(fs.writeFile);
const writeJSON = promisify(fs.writeJSON);
const ReadFile = promisify(fs.readFile);
const RemoveFile = promisify(fs.unlink);
const RenameFile = promisify(fs.rename);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

function getJsonFiles(dir) {
  const files = fs.readdirSync(dir);
  return files.filter(
    (file) =>
      path.extname(file).toLowerCase() === ".json" && path.basename(file, ".json").toLowerCase() != "backup"
  );
}

const getConfig = () => {
  const AUTH_PATH = path.resolve("../settings");
  const configFiles = getJsonFiles(AUTH_PATH);
  //console.log(configFiles);
  const configFile = path.join("../settings/", configFiles[0]);
  const auth = JSON.parse(fs.readFileSync(configFile));
  return auth;
};

const setBackup = async (backup) => {
  const BACKUP_PATH = path.resolve("../settings/backup.json");
  await WriteFile(BACKUP_PATH, JSON.stringify(backup));
};
const getBackup = async () => {
  const BACKUP_PATH = path.resolve("../settings/backup.json");
  const backup = JSON.parse(fs.readFileSync(BACKUP_PATH));
  return backup;
};

const fileExists = (s) => new Promise((r) => fs.access(s, fs.F_OK, (e) => r(!e)));

async function listDatabase(dir) {
  let files = [];
  for (const file of await readdir(dir)) {
    if ((await stat(path.join(dir, file))).isFile() && file.includes(".xlsx") && !file.includes("~$")) {
      files = [...files, file];
    }
  }
  return files;
}

async function listAttachments(serviceid,dir) {
  try {
    const files = await readdir(dir);

    // Filter files based on the serviceid in their names
    const filteredFiles = files.filter(file => {
      const fileName = path.parse(file).name; // Get the file name without extension
      return fileName.includes(serviceid);
    });
    return filteredFiles;
  } catch (error) {

    return [];
  }
}
module.exports = {
  getConfig,
  setBackup,
  getBackup,
  fileExists,
  listDatabase,
  ReadFile,
  WriteFile,
  writeJSON,
  RemoveFile,
  RenameFile,
  listAttachments,
};
