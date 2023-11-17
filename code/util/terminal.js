const term = require("terminal-kit").terminal;
const { Sleep } = require("./misc");

const log = (text) => {
  console.log(text);
};
const reset = () => {
  term.reset();
};

const green = (text) => {
  term.clear();
  term.bold.bgGreen(`${text}\n`);
};
const red = (text) => {
  //term.clear();
  term.bgRed.bold(`${text}\n`);
};

const logger = (text, code = "green") => {
  switch (code) {
    case "yellow":
      term.bold.brightYellow(`${text}\n`);
      break;
    case "red":
      term.bold.brightRed(`${text}\n`);
      break;
    case "mag":
      term.bold.brightMagenta(`${text}\n`);
      break;
    default:
      term.bold.brightGreen(`${text}\n`);
      break;
  }
};

const splash = async (text) => {
  term.reset();
  term.moveTo.bold.bgGreen(term.width / 2, term.height / 2, `${text}`);
  await Sleep(2000);
  term.reset();
};
const stay = (text) => {
  term.clear();
  term.moveTo.bold.bgGreen(term.width / 2, term.height / 2, `${text}`);
};

const progressBarStart = (text, title) => {
  green(text);

  const progressBar = term.progressBar({
    width: 80,
    title,
    eta: true,
    percent: true,
  });

  return progressBar;
};

module.exports = {
  log,
  logger,
  reset,
  green,
  red,
  splash,
  stay,
  progressBarStart,
  term,
};
