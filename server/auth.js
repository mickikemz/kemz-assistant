const db = require("./db");

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function issueToken(licenseKey) {
  return db.createAuthToken(licenseKey, TOKEN_TTL_MS);
}

// Verifies the Bearer token, attaches req.license, or responds 401.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing Authorization header." });

  const record = db.getAuthToken(token);
  if (!record || record.expires_at < Date.now()) {
    return res.status(401).json({ error: "Session expired. Please re-activate your license key." });
  }

  const license = db.getLicense(record.license_key);
  if (!license || license.revoked) {
    return res.status(403).json({ error: "This license key has been revoked." });
  }

  req.license = license;
  next();
}

// Separate check for the admin-only routes.
function requireAdmin(req, res, next) {
  const secret = req.headers["x-admin-secret"];
  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: "Invalid admin secret." });
  }
  next();
}

module.exports = { issueToken, requireAuth, requireAdmin, TOKEN_TTL_MS };
