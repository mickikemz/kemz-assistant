const express = require("express");
const db = require("../db");
const { issueToken } = require("../auth");

const router = express.Router();

router.post("/activate", (req, res) => {
  const { licenseKey } = req.body || {};
  if (!licenseKey || typeof licenseKey !== "string") {
    return res.status(400).json({ error: "licenseKey is required." });
  }

  const license = db.getLicense(licenseKey.trim().toUpperCase());
  if (!license) {
    return res.status(404).json({ error: "Unknown license key. Contact Kemz to get one." });
  }
  if (license.revoked) {
    return res.status(403).json({ error: "This license key has been revoked." });
  }

  const token = issueToken(license.key);
  res.json({
    token,
    label: license.label,
    minutesRemaining: license.minutes_remaining,
  });
});

module.exports = router;
