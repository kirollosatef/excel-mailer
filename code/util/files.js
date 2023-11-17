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

const getConfig = () => {
  const AUTH_PATH = path.resolve("../settings/config.json");
  const auth = JSON.parse(fs.readFileSync(AUTH_PATH));
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
};
