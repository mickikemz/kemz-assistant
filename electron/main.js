require("dotenv").config();
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

const { DeepgramSession } = require("../src/services/deepgram");
const backend = require("../src/services/backend");
const store = require("./store");
const resume = require("./resume");

let mainWindow = null;

// Activation state, loaded once at startup (see license:activate below for
// how it gets populated the first time).
let activation = null; // { licenseKey, token, label, minutesRemaining }

// Two independent transcription connections — one per speaker, on separate
// audio channels, so "who said that" is a fact from the source, never a
// guess made after the fact. "you" = the user's mic. "them" = system/loopback
// audio (everyone else on the call). Each has its own start/stop button in
// the UI — the backend session (billing/heartbeat) starts on the first
// channel to go live and ends when the last one stops.
let dgSessions = { you: null, them: null };
let sessionKeys = null; // { deepgramKeyMic, deepgramKeySystem } once the backend session exists
let currentSessionId = null;
let heartbeatTimer = null;

// Deepgram closes a connection that's received no audio for a while (e.g.
// the mic is muted). lastChunkAt tracks when each channel last actually
// sent data; keepAliveTimer pings any channel that's gone quiet so muting
// for a stretch doesn't silently kill the connection.
let lastChunkAt = { you: 0, them: 0 };
let keepAliveTimer = null;
const KEEPALIVE_IDLE_MS = 6000;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 460,
    height: 700,
    minWidth: 380,
    minHeight: 480,
    title: "Kemz Assistant",
    // Deliberately a normal, visible application window: shown in the dock,
    // in Activity Monitor/Task Manager, and in screen shares. Kemz Assistant
    // is built to be used openly in calls where AI note-taking/assistance is
    // disclosed, not to be hidden from the other participants.
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "..", "src", "renderer", "index.html"));
}

app.whenReady().then(() => {
  activation = store.load();
  resume.load();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  // Best-effort: charge any remaining elapsed time before the app dies.
  stopSessionInternal().catch(() => {});
});

// ---- Licensing ----

ipcMain.handle("license:status", () => {
  if (!activation) return { activated: false };
  return {
    activated: true,
    licenseKey: activation.licenseKey,
    label: activation.label,
    minutesRemaining: activation.minutesRemaining,
  };
});

ipcMain.handle("license:activate", async (_event, licenseKey) => {
  const result = await backend.activate(licenseKey); // throws with a readable message on failure
  activation = {
    licenseKey: licenseKey.trim().toUpperCase(),
    token: result.token,
    label: result.label,
    minutesRemaining: result.minutesRemaining,
  };
  store.save(activation);
  return { activated: true, ...activation };
});

// ---- Resume/CV (mock-interview mode only, see ensureBackendSession below) ----

ipcMain.handle("resume:status", () => resume.status());

ipcMain.handle("resume:upload", async () => {
  return resume.upload(mainWindow); // throws a readable message on unsupported file / extraction failure
});

ipcMain.handle("resume:clear", () => {
  resume.clear();
  return { ok: true };
});

// ---- Session lifecycle (backend bookkeeping + Deepgram live sockets) ----

// Starts the backend session (mints both channel keys, starts the heartbeat)
// the first time any channel goes live. A no-op if one's already running —
// whichever channel is toggled on second just reuses it.
async function ensureBackendSession(mode) {
  if (currentSessionId) return;
  if (!activation) throw new Error("Not activated. Enter a license key first.");

  // Resume/CV is only ever sent to the backend for mock-interview mode —
  // that's the only mode with no real listener, so grounding the AI's
  // questions/feedback in the user's real background doesn't risk making a
  // scripted answer sound more convincing to someone who's being deceived.
  const resumeText = mode === "mock-interview" ? resume.getText() : undefined;
  const result = await backend.startSession(activation.token, mode, resumeText);
  currentSessionId = result.sessionId;
  sessionKeys = {
    deepgramKeyMic: result.deepgramKeyMic,
    deepgramKeySystem: result.deepgramKeySystem,
  };
  activation.minutesRemaining = result.minutesRemaining;
  store.save(activation);

  heartbeatTimer = setInterval(async () => {
    if (!activation || !currentSessionId) return;
    try {
      const hb = await backend.heartbeat(activation.token, currentSessionId);
      activation.minutesRemaining = hb.minutesRemaining;
      store.save(activation);
      if (mainWindow) mainWindow.webContents.send("session:balance", { minutesRemaining: hb.minutesRemaining });
      if (hb.exhausted) {
        if (mainWindow) mainWindow.webContents.send("session:exhausted");
        await stopSessionInternal();
      }
    } catch (err) {
      if (mainWindow) mainWindow.webContents.send("deepgram:error", `Heartbeat failed: ${err.message}`);
    }
  }, 20000);

  keepAliveTimer = setInterval(() => {
    const now = Date.now();
    for (const channel of ["you", "them"]) {
      if (dgSessions[channel] && now - lastChunkAt[channel] > KEEPALIVE_IDLE_MS) {
        dgSessions[channel].keepAlive();
      }
    }
  }, KEEPALIVE_IDLE_MS / 2);
}

ipcMain.handle("channel:start", async (_event, { channel, mode }) => {
  await ensureBackendSession(mode);

  const key = channel === "them" ? sessionKeys.deepgramKeySystem : sessionKeys.deepgramKeyMic;
  const label = channel === "them" ? "System audio" : "Mic";

  const session = new DeepgramSession(key);
  session.onTranscript((payload) => {
    if (mainWindow) mainWindow.webContents.send("deepgram:transcript", { ...payload, channel });
  });
  session.onError((err) => {
    if (mainWindow) mainWindow.webContents.send("deepgram:error", `${label}: ${err.message || err}`);
  });
  await session.start();
  dgSessions[channel] = session;
  lastChunkAt[channel] = Date.now();

  return { minutesRemaining: activation.minutesRemaining };
});

ipcMain.handle("channel:stop", async (_event, channel) => {
  if (dgSessions[channel]) {
    dgSessions[channel].stop();
    dgSessions[channel] = null;
  }

  if (dgSessions.you || dgSessions.them) {
    // Other channel is still live — keep the backend session running.
    return { minutesRemaining: activation?.minutesRemaining ?? 0, sessionEnded: false };
  }

  const minutesRemaining = await stopSessionInternal();
  return { minutesRemaining, sessionEnded: true };
});

async function stopSessionInternal() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }
  for (const channel of ["you", "them"]) {
    if (dgSessions[channel]) {
      dgSessions[channel].stop();
      dgSessions[channel] = null;
    }
  }
  let minutesRemaining = activation?.minutesRemaining ?? 0;
  if (activation && currentSessionId) {
    try {
      const result = await backend.endSession(activation.token, currentSessionId);
      minutesRemaining = result.minutesRemaining;
      activation.minutesRemaining = minutesRemaining;
      store.save(activation);
    } catch {
      // best effort — don't block shutdown/stop on a network error
    }
  }
  currentSessionId = null;
  sessionKeys = null;
  return minutesRemaining;
}

// Full stop, regardless of which individual channels are live — used by the
// "Stop All" button and by the exhausted-balance auto-stop above.
ipcMain.handle("session:stop", async () => {
  const minutesRemaining = await stopSessionInternal();
  return { minutesRemaining };
});

ipcMain.on("deepgram:audio-chunk", (_event, { channel, buffer }) => {
  const session = dgSessions[channel];
  if (!session) return;
  session.sendChunk(Buffer.from(buffer));
  lastChunkAt[channel] = Date.now();
});

// ---- AI suggestions (proxied through the backend, metered by the active session) ----

ipcMain.handle("claude:suggest", async (_event, { transcript, mode }) => {
  if (!activation || !currentSessionId) throw new Error("No active session.");
  const result = await backend.suggest(activation.token, currentSessionId, transcript, mode);
  return result.text;
});

// ---- Session save (local transcript history, unrelated to credit metering) ----

ipcMain.handle("session:save", async (_event, session) => {
  const dir = path.join(__dirname, "..", "sessions");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${session.mode}-${session.timestamp}.json`);
  fs.writeFileSync(file, JSON.stringify(session, null, 2));
  return { ok: true, file };
});
