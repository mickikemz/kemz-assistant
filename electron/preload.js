const { contextBridge, ipcRenderer } = require("electron");

// Everything sensitive (API keys, network calls, license tokens) stays in
// the main process. The renderer only ever sees this narrow, safe surface.
contextBridge.exposeInMainWorld("kemz", {
  // Licensing
  getLicenseStatus: () => ipcRenderer.invoke("license:status"),
  activateLicense: (licenseKey) => ipcRenderer.invoke("license:activate", licenseKey),

  // Resume/CV — only ever used for mock-interview mode (see main.js)
  getResumeStatus: () => ipcRenderer.invoke("resume:status"),
  uploadResume: () => ipcRenderer.invoke("resume:upload"),
  clearResume: () => ipcRenderer.invoke("resume:clear"),

  // Session lifecycle — two independent channels, each with its own
  // start/stop. The backend session (billing/heartbeat) starts on the first
  // channel to go live and ends when the last one stops (see channel:stop's
  // `sessionEnded` flag). channel is "you" (mic) or "them" (system audio).
  startChannel: (channel, mode) => ipcRenderer.invoke("channel:start", { channel, mode }),
  stopChannel: (channel) => ipcRenderer.invoke("channel:stop", channel),
  stopSession: () => ipcRenderer.invoke("session:stop"), // force-stops both channels
  sendAudioChunk: (channel, arrayBuffer) =>
    ipcRenderer.send("deepgram:audio-chunk", { channel, buffer: arrayBuffer }),

  onTranscript: (callback) =>
    ipcRenderer.on("deepgram:transcript", (_event, payload) => callback(payload)),
  onTranscriptError: (callback) =>
    ipcRenderer.on("deepgram:error", (_event, message) => callback(message)),
  onBalanceUpdate: (callback) =>
    ipcRenderer.on("session:balance", (_event, payload) => callback(payload)),
  onSessionExhausted: (callback) => ipcRenderer.on("session:exhausted", () => callback()),

  // AI suggestions, proxied through the backend and metered by the active session
  getSuggestions: (transcript, mode) =>
    ipcRenderer.invoke("claude:suggest", { transcript, mode }),

  saveSession: (session) => ipcRenderer.invoke("session:save", session),
});
