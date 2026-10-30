const fs = require("fs");
const path = require("path");
const { app } = require("electron");

function filePath() {
  return path.join(app.getPath("userData"), "activation.json");
}

function load() {
  try {
    return JSON.parse(fs.readFileSync(filePath(), "utf8"));
  } catch {
    return null;
  }
}

function save(data) {
  fs.mkdirSync(path.dirname(filePath()), { recursive: true });
  fs.writeFileSync(filePath(), JSON.stringify(data, null, 2));
}

function clear() {
  try {
    fs.unlinkSync(filePath());
  } catch {
    // nothing to clear
  }
}

module.exports = { load, save, clear };
