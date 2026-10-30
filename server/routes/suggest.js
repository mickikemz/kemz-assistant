const express = require("express");
const db = require("../db");
const { requireAuth } = require("../auth");
const { getSuggestions } = require("../claude");
const resumeStore = require("../resumeStore");

const router = express.Router();

router.post("/suggest", requireAuth, async (req, res) => {
  const { sessionId, transcript, mode } = req.body || {};

  const session = db.getSession(sessionId);
  if (!session || session.license_key !== req.license.key) {
    return res.status(404).json({ error: "Unknown session." });
  }
  if (req.license.minutes_remaining <= 0) {
    return res.status(402).json({ error: "Out of minutes. Contact Kemz to buy more.", exhausted: true });
  }

  try {
    const resumeText = resumeStore.get(sessionId);
    const text = await getSuggestions(transcript, mode, resumeText);
    res.json({ text });
  } catch (err) {
    res.status(502).json({ error: `Claude request failed: ${err.message}` });
  }
});

module.exports = router;
