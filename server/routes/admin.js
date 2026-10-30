const express = require("express");
const db = require("../db");
const { requireAdmin } = require("../auth");

const router = express.Router();

router.post("/admin/licenses", requireAdmin, (req, res) => {
  const { label, minutes } = req.body || {};
  const freeMinutes = minutes ?? Number(process.env.DEFAULT_FREE_MINUTES || 30);
  const license = db.createLicense({ label: label || null, minutes: freeMinutes });
  res.json(license);
});

router.get("/admin/licenses", requireAdmin, (_req, res) => {
  res.json(db.listLicenses());
});

router.post("/admin/licenses/:key/credit", requireAdmin, (req, res) => {
  const { minutes } = req.body || {};
  if (typeof minutes !== "number" || minutes <= 0) {
    return res.status(400).json({ error: "minutes must be a positive number." });
  }
  try {
    res.json(db.creditLicense(req.params.key, minutes));
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

router.post("/admin/licenses/:key/revoke", requireAdmin, (req, res) => {
  try {
    res.json(db.setRevoked(req.params.key, true));
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

router.post("/admin/licenses/:key/unrevoke", requireAdmin, (req, res) => {
  try {
    res.json(db.setRevoked(req.params.key, false));
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

module.exports = router;
