const express = require("express");
const crypto = require("crypto");
const db = require("../db");
const { requireAuth } = require("../auth");
const { mintTemporaryKey } = require("../deepgram");
const { warmUp } = require("../claude");
const resumeStore = require("../resumeStore");

const router = express.Router();

const MAX_SESSION_MINUTES = 90; // hard ceiling per Deepgram key, regardless of balance
const MAX_HEARTBEAT_GAP_MINUTES = 5; // clock-jump / suspended-laptop guard

router.post("/session/start", requireAuth, async (req, res) => {
  const license = req.license;
  if (license.minutes_remaining <= 0) {
    return res.status(402).json({ error: "Out of minutes. Contact Kemz to buy more.", exhausted: true });
  }

  const ttlMinutes = Math.min(license.minutes_remaining, MAX_SESSION_MINUTES);
  const ttlSeconds = Math.ceil(ttlMinutes * 60) + 60; // small buffer so the key doesn't expire mid-final-chunk

  // Two independent keys/connections, one per audio channel (your mic vs.
  // system/loopback audio for everyone else on the call). Separate
  // connections — not one connection guessing who's speaking — is what lets
  // the app tell "them" and "you" apart with certainty.
  let mic, system;
  try {
    [mic, system] = await Promise.all([
      mintTemporaryKey({ ttlSeconds, comment: `session ${license.key} — mic` }),
      mintTemporaryKey({ ttlSeconds, comment: `session ${license.key} — system` }),
    ]);
  } catch (err) {
    return res.status(502).json({ error: `Could not start transcription: ${err.message}` });
  }

  const sessionId = crypto.randomUUID();
  db.createSession(sessionId, license.key, req.body?.mode || "meeting");
  resumeStore.set(sessionId, req.body?.resumeText);

  // Fire-and-forget: warm the LLM connection now so the user's first real
  // suggestion doesn't pay the cold-connection cost. Never block the
  // response on this.
  warmUp();

  res.json({
    sessionId,
    deepgramKeyMic: mic.key,
    deepgramKeySystem: system.key,
    deepgramKeyExpiresAt: mic.expiresAt,
    minutesRemaining: license.minutes_remaining,
  });
});

function chargeElapsed(session) {
  const now = Date.now();
  const elapsedMinutes = Math.min(
    (now - session.last_heartbeat_at) / 60000,
    MAX_HEARTBEAT_GAP_MINUTES
  );
  const remaining = db.deductMinutes(session.license_key, Math.max(0, elapsedMinutes));
  db.touchSession(session.id, now);
  return remaining;
}

router.post("/session/heartbeat", requireAuth, (req, res) => {
  const { sessionId } = req.body || {};
  const session = db.getSession(sessionId);
  if (!session || session.license_key !== req.license.key) {
    return res.status(404).json({ error: "Unknown session." });
  }
  if (session.ended_at) return res.status(410).json({ error: "Session already ended." });

  const minutesRemaining = chargeElapsed(session);
  res.json({ minutesRemaining, exhausted: minutesRemaining <= 0 });
});

router.post("/session/end", requireAuth, (req, res) => {
  const { sessionId } = req.body || {};
  const session = db.getSession(sessionId);
  if (!session || session.license_key !== req.license.key) {
    return res.status(404).json({ error: "Unknown session." });
  }
  if (!session.ended_at) {
    chargeElapsed(session);
    db.endSession(sessionId);
  }
  resumeStore.clear(sessionId);
  const license = db.getLicense(req.license.key);
  res.json({ minutesRemaining: license.minutes_remaining });
});

module.exports = router;
