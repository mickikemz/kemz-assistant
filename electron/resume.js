const { app, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

// Stored locally only, in the app's own userData folder — never uploaded to
// the server at rest (see server/resumeStore.js: the backend only ever
// holds it in memory for the lifetime of a mock-interview session).
function resumeFilePath() {
  return path.join(app.getPath("userData"), "resume.json");
}

let cache = null; // { fileName, text, uploadedAt }

function load() {
  try {
    cache = JSON.parse(fs.readFileSync(resumeFilePath(), "utf8"));
  } catch {
    cache = null;
  }
  return cache;
}

function status() {
  if (!cache) return null;
  return { fileName: cache.fileName, textLength: cache.text.length, uploadedAt: cache.uploadedAt };
}

function getText() {
  return cache?.text;
}

function clear() {
  cache = null;
  try {
    fs.unlinkSync(resumeFilePath());
  } catch {
    // nothing to remove
  }
}

async function extractText(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".pdf") {
    const { PDFParse } = require("pdf-parse");
    const buffer = fs.readFileSync(filePath);
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    // Strip pdf-parse's "-- N of M --" page-separator lines — not real content.
    return result.text.replace(/^--\s*\d+\s*of\s*\d+\s*--\s*$/gm, "").trim();
  }

  if (ext === ".txt") {
    return fs.readFileSync(filePath, "utf8").trim();
  }

  throw new Error(`Unsupported file type "${ext}". Use a PDF or .txt file.`);
}

async function upload(browserWindow) {
  const result = await dialog.showOpenDialog(browserWindow, {
    title: "Upload your resume/CV",
    properties: ["openFile"],
    filters: [{ name: "Resume", extensions: ["pdf", "txt"] }],
  });
  if (result.canceled || result.filePaths.length === 0) return { canceled: true };

  const filePath = result.filePaths[0];
  const text = await extractText(filePath);
  if (!text) throw new Error("Couldn't extract any text from that file.");

  cache = { fileName: path.basename(filePath), text, uploadedAt: Date.now() };
  fs.mkdirSync(path.dirname(resumeFilePath()), { recursive: true });
  fs.writeFileSync(resumeFilePath(), JSON.stringify(cache, null, 2));

  return status();
}

module.exports = { load, status, getText, clear, upload };
