const path = require("path");
const crypto = require("crypto");
const Database = require("better-sqlite3");

const db = new Database(path.join(__dirname, "data", "kemz.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS licenses (
    key TEXT PRIMARY KEY,
    label TEXT,
    minutes_remaining REAL NOT NULL,
    revoked INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS auth_tokens (
    token TEXT PRIMARY KEY,
    license_key TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    license_key TEXT NOT NULL,
    mode TEXT,
    started_at INTEGER NOT NULL,
    last_heartbeat_at INTEGER NOT NULL,
    ended_at INTEGER
  );
`);

// Groups of 4 alphanumeric chars, uppercase, excluding ambiguous 0/O/1/I.
const KEY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function generateLicenseKey() {
  const group = () =>
    Array.from({ length: 4 }, () => KEY_ALPHABET[crypto.randomInt(KEY_ALPHABET.length)]).join("");
  return `KEMZ-${group()}-${group()}-${group()}`;
}

function createLicense({ label = null, minutes }) {
  const key = generateLicenseKey();
  db.prepare(
    `INSERT INTO licenses (key, label, minutes_remaining, revoked, created_at) VALUES (?, ?, ?, 0, ?)`
  ).run(key, label, minutes, Date.now());
  return getLicense(key);
}

function getLicense(key) {
  return db.prepare(`SELECT * FROM licenses WHERE key = ?`).get(key);
}

function listLicenses() {
  return db.prepare(`SELECT * FROM licenses ORDER BY created_at DESC`).all();
}

function creditLicense(key, minutes) {
  const info = db
    .prepare(`UPDATE licenses SET minutes_remaining = minutes_remaining + ? WHERE key = ?`)
    .run(minutes, key);
  if (info.changes === 0) throw new Error("License not found");
  return getLicense(key);
}

function setRevoked(key, revoked) {
  const info = db.prepare(`UPDATE licenses SET revoked = ? WHERE key = ?`).run(revoked ? 1 : 0, key);
  if (info.changes === 0) throw new Error("License not found");
  return getLicense(key);
}

// Deduct minutes, floored at 0. Returns the new balance.
function deductMinutes(key, minutes) {
  const license = getLicense(key);
  if (!license) throw new Error("License not found");
  const next = Math.max(0, license.minutes_remaining - minutes);
  db.prepare(`UPDATE licenses SET minutes_remaining = ? WHERE key = ?`).run(next, key);
  return next;
}

function createAuthToken(licenseKey, ttlMs) {
  const token = crypto.randomBytes(32).toString("hex");
  const now = Date.now();
  db.prepare(
    `INSERT INTO auth_tokens (token, license_key, created_at, expires_at) VALUES (?, ?, ?, ?)`
  ).run(token, licenseKey, now, now + ttlMs);
  return token;
}

function getAuthToken(token) {
  return db.prepare(`SELECT * FROM auth_tokens WHERE token = ?`).get(token);
}

function createSession(id, licenseKey, mode) {
  const now = Date.now();
  db.prepare(
    `INSERT INTO sessions (id, license_key, mode, started_at, last_heartbeat_at, ended_at) VALUES (?, ?, ?, ?, ?, NULL)`
  ).run(id, licenseKey, mode, now, now);
}

function getSession(id) {
  return db.prepare(`SELECT * FROM sessions WHERE id = ?`).get(id);
}

function touchSession(id, timestamp) {
  db.prepare(`UPDATE sessions SET last_heartbeat_at = ? WHERE id = ?`).run(timestamp, id);
}

function endSession(id) {
  db.prepare(`UPDATE sessions SET ended_at = ? WHERE id = ?`).run(Date.now(), id);
}

module.exports = {
  db,
  generateLicenseKey,
  createLicense,
  getLicense,
  listLicenses,
  creditLicense,
  setRevoked,
  deductMinutes,
  createAuthToken,
  getAuthToken,
  createSession,
  getSession,
  touchSession,
  endSession,
};
