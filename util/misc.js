function Sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function secondsToHms(d) {
  d = Number(d);
  var h = Math.floor(d / 3600);
  var m = Math.floor((d % 3600) / 60);
  var s = Math.floor((d % 3600) % 60);

  var hDisplay = h > 0 ? h + " hour " : "";
  var mDisplay = m > 0 ? m + " minute " : "";
  var sDisplay = s > 0 ? s + " second " : "";

  return hDisplay + mDisplay + sDisplay;
}

function excelDateToJSDate(date) {
  return date;
}

function validateEmail(email) {
  return String(email)
    .toLowerCase()
    .match(
      /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/
    );
}

function messageToRFC822Email(message) {
  let rfc822Email = "From: " + message.from + "\r\n";
  rfc822Email += "To: " + message.to + "\r\n";
  rfc822Email += "Subject: " + message.subject + "\r\n";
  rfc822Email += "Date: " + new Date().toUTCString() + "\r\n";
  rfc822Email += "Content-Type: text/html; charset=utf-8\r\n";
  rfc822Email += "\r\n";
  rfc822Email += message.html;
  return rfc822Email;
}

module.exports = {
  Sleep,
  secondsToHms,
  excelDateToJSDate,
  validateEmail,
  messageToRFC822Email,
};
