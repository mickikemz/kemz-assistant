const licenseScreen = document.getElementById("licenseScreen");
const appScreen = document.getElementById("appScreen");
const licenseInput = document.getElementById("licenseInput");
const activateBtn = document.getElementById("activateBtn");
const licenseError = document.getElementById("licenseError");

const statusDot = document.getElementById("statusDot");
const modeSelect = document.getElementById("modeSelect");
const systemAudioSelect = document.getElementById("systemAudioSelect");
const systemAudioHint = document.getElementById("systemAudioHint");
const micToggleBtn = document.getElementById("micToggleBtn");
const micMuteBtn = document.getElementById("micMuteBtn");
const systemToggleBtn = document.getElementById("systemToggleBtn");
const stopAllBtn = document.getElementById("stopAllBtn");
const suggestBtn = document.getElementById("suggestBtn");
const saveBtn = document.getElementById("saveBtn");
const resetBtn = document.getElementById("resetBtn");
const resumeRow = document.getElementById("resumeRow");
const resumeUploadBtn = document.getElementById("resumeUploadBtn");
const resumeClearBtn = document.getElementById("resumeClearBtn");
const resumeHint = document.getElementById("resumeHint");
const transcriptEl = document.getElementById("transcript");
const suggestionsEl = document.getElementById("suggestions");
const footer = document.getElementById("footer");
const balanceEl = document.getElementById("balance");

// Fill this in with how people should reach you to buy more minutes.
const CONTACT_INFO = "Contact Kemz to buy more minutes.";

// Inline Phosphor icons (regular weight) — no emoji, scales cleanly, themes
// with currentColor. Decorative here (always paired with a visible label),
// so each carries aria-hidden.
const ICONS = {
  mic: '<svg class="btn-icon" viewBox="0 0 256 256" aria-hidden="true"><path d="M128,176a48.05,48.05,0,0,0,48-48V64a48,48,0,0,0-96,0v64A48.05,48.05,0,0,0,128,176ZM96,64a32,32,0,0,1,64,0v64a32,32,0,0,1-64,0Zm40,143.6V240a8,8,0,0,1-16,0V207.6A80.11,80.11,0,0,1,48,128a8,8,0,0,1,16,0,64,64,0,0,0,128,0,8,8,0,0,1,16,0A80.11,80.11,0,0,1,136,207.6Z"/></svg>',
  speaker: '<svg class="btn-icon" viewBox="0 0 256 256" aria-hidden="true"><path d="M155.51,24.81a8,8,0,0,0-8.42.88L77.25,80H32A16,16,0,0,0,16,96v64a16,16,0,0,0,16,16H77.25l69.84,54.31A8,8,0,0,0,160,224V32A8,8,0,0,0,155.51,24.81ZM32,96H72v64H32ZM144,207.64,88,164.09V91.91l56-43.55Zm54-106.08a40,40,0,0,1,0,52.88,8,8,0,0,1-12-10.58,24,24,0,0,0,0-31.72,8,8,0,0,1,12-10.58ZM248,128a79.9,79.9,0,0,1-20.37,53.34,8,8,0,0,1-11.92-10.67,64,64,0,0,0,0-85.33,8,8,0,1,1,11.92-10.67A79.83,79.83,0,0,1,248,128Z"/></svg>',
  stop: '<svg class="btn-icon" viewBox="0 0 256 256" aria-hidden="true"><path d="M200,40H56A16,16,0,0,0,40,56V200a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V56A16,16,0,0,0,200,40Zm0,160H56V56H200V200Z"/></svg>',
  micSlash: '<svg class="btn-icon" viewBox="0 0 256 256" aria-hidden="true"><path d="M213.92,218.62l-160-176A8,8,0,0,0,42.08,53.38L80,95.09V128a48,48,0,0,0,69.11,43.12l11.1,12.2A63.41,63.41,0,0,1,128,192a64.07,64.07,0,0,1-64-64,8,8,0,0,0-16,0,80.11,80.11,0,0,0,72,79.6V240a8,8,0,0,0,16,0V207.59a78.83,78.83,0,0,0,35.16-12.22l30.92,34a8,8,0,1,0,11.84-10.76ZM128,160a32,32,0,0,1-32-32V112.69l41.66,45.82A32,32,0,0,1,128,160Zm57.52-3.91A63.32,63.32,0,0,0,192,128a8,8,0,0,1,16,0,79.16,79.16,0,0,1-8.11,35.12,8,8,0,0,1-7.19,4.49,7.88,7.88,0,0,1-3.51-.82A8,8,0,0,1,185.52,156.09ZM84,44.87A48,48,0,0,1,176,64v64a49.19,49.19,0,0,1-.26,5,8,8,0,0,1-8,7.17,8.13,8.13,0,0,1-.84,0,8,8,0,0,1-7.12-8.79c.11-1.1.17-2.24.17-3.36V64A32,32,0,0,0,98.64,51.25,8,8,0,1,1,84,44.87Z"/></svg>',
  sparkle: '<svg class="suggestion-badge-icon" viewBox="0 0 256 256" aria-hidden="true"><path d="M197.58,129.06,146,110l-19-51.62a15.92,15.92,0,0,0-29.88,0L78,110l-51.62,19a15.92,15.92,0,0,0,0,29.88L78,178l19,51.62a15.92,15.92,0,0,0,29.88,0L146,178l51.62-19a15.92,15.92,0,0,0,0-29.88ZM137,164.22a8,8,0,0,0-4.74,4.74L112,223.85,91.78,169A8,8,0,0,0,87,164.22L32.15,144,87,123.78A8,8,0,0,0,91.78,119L112,64.15,132.22,119a8,8,0,0,0,4.74,4.74L191.85,144ZM144,40a8,8,0,0,1,8-8h16V16a8,8,0,0,1,16,0V32h16a8,8,0,0,1,0,16H184V64a8,8,0,0,1-16,0V48H152A8,8,0,0,1,144,40ZM248,88a8,8,0,0,1-8,8h-8v8a8,8,0,0,1-16,0V96h-8a8,8,0,0,1,0-16h8V72a8,8,0,0,1,16,0v8h8A8,8,0,0,1,248,88Z"/></svg>',
  caretRight: '<svg class="suggestion-bullet-icon" viewBox="0 0 256 256" aria-hidden="true"><path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"/></svg>',
  upload: '<svg class="btn-icon" viewBox="0 0 256 256" aria-hidden="true"><path d="M224,144v64a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V144a8,8,0,0,1,16,0v56H208V144a8,8,0,0,1,16,0ZM93.66,77.66,120,51.31V144a8,8,0,0,0,16,0V51.31l26.34,26.35a8,8,0,0,0,11.32-11.32l-40-40a8,8,0,0,0-11.32,0l-40,40A8,8,0,0,0,93.66,77.66Z"/></svg>',
  xCircle: '<svg class="btn-icon" viewBox="0 0 256 256" aria-hidden="true"><path d="M165.66,101.66,139.31,128l26.35,26.34a8,8,0,0,1-11.32,11.32L128,139.31l-26.34,26.35a8,8,0,0,1-11.32-11.32L116.69,128,90.34,101.66a8,8,0,0,1,11.32-11.32L128,116.69l26.34-26.35a8,8,0,0,1,11.32,11.32ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"/></svg>',
};

// Only rewrites a toggle button's DOM when its active state actually
// changes (not on every refreshControls() call, which can fire many times
// a second from transcript events) — avoids needless innerHTML churn.
const _btnRendered = { mic: null, system: null, mute: null };
function renderToggleButton(button, key, idleIcon, activeIcon, activeLabel, idleLabel, active, { pulse = true } = {}) {
  if (_btnRendered[key] === active) return;
  _btnRendered[key] = active;
  button.classList.toggle("active", active);
  button.setAttribute("aria-pressed", String(active));
  button.innerHTML = `
    <span class="btn-icon-wrap">${active ? activeIcon : idleIcon}${active && pulse ? '<span class="pulse-ring" aria-hidden="true"></span>' : ""}</span>
    <span class="btn-label">${active ? activeLabel : idleLabel}</span>
  `;
}

let micStream = null;
let micRecorder = null;
let micBusy = false; // guards against double-click while start/stop is in flight
let micMuted = false; // mic keeps running/billing; muted chunks just aren't sent
let systemStream = null;
let systemRecorder = null;
let systemBusy = false;
let currentBalance = null;

// Every finalized line, from either channel, in one merged timeline:
// { speaker: "you" | "them", text, at }. Interim (not-yet-final) text is
// kept separately per channel since it's still being revised live.
let finalTurns = [];
let interimYou = "";
let interimThem = "";

let suggestionHistory = [];
let sessionMode = "meeting";

// Auto-suggest is edge-triggered off Deepgram's is_final flag, not polled:
// every final segment on the trigger channel (re)starts a debounce timer,
// and the request only actually fires once ~1.5s passes with no further
// final segment (i.e. the speaker paused). The trigger channel is live, not
// fixed at session start: whenever system audio is currently on, only
// "them" pauses drive it (so reading a suggestion back out loud on your own
// mic never counts as a new question); with system audio off, it falls
// back to "you".
const SUGGEST_DEBOUNCE_MS = 1500;
let suggestDebounceTimer = null;
let suggestInFlight = false; // hard guard against overlapping requests — the
// old bug: a slow API response let multiple 1s poll ticks all fire before
// the first one returned, producing one duplicate suggestion box per tick.
let pendingRerunNeeded = false; // new final content arrived while a request was in flight
let lastRequestedTranscript = ""; // last transcript actually sent to the API
let lastRenderedTranscript = ""; // transcript behind the currently-shown top box
let lastSuggestionBlock = null; // DOM ref to that box, for in-place replace

// ---- Audio device setup ----

async function populateSystemAudioDevices() {
  let devices;
  try {
    devices = await navigator.mediaDevices.enumerateDevices();
  } catch {
    return;
  }
  const inputs = devices.filter((d) => d.kind === "audioinput");
  const previousValue = systemAudioSelect.value;

  systemAudioSelect.innerHTML = '<option value="">None selected</option>';
  for (const device of inputs) {
    const option = document.createElement("option");
    option.value = device.deviceId;
    option.textContent = device.label || `Microphone (${device.deviceId.slice(0, 6)})`;
    systemAudioSelect.appendChild(option);
  }

  if (previousValue && inputs.some((d) => d.deviceId === previousValue)) {
    systemAudioSelect.value = previousValue;
  } else {
    // Best-effort: auto-select a BlackHole-style loopback device if one exists.
    const loopback = inputs.find((d) => /blackhole|loopback|soundflower/i.test(d.label));
    if (loopback) systemAudioSelect.value = loopback.deviceId;
  }

  updateSystemAudioHint();
}

function updateSystemAudioHint() {
  systemAudioHint.textContent = systemAudioSelect.value
    ? "Ready — this device will be captured separately from your mic as \"Them\"."
    : "Pick a loopback device (e.g. BlackHole) to capture the other side of the call.";
}

systemAudioSelect.addEventListener("change", updateSystemAudioHint);
navigator.mediaDevices.addEventListener?.("devicechange", populateSystemAudioDevices);

// ---- Resume/CV (mock-interview mode only) ----

function renderResumeStatus(status) {
  if (status) {
    resumeHint.textContent = `${status.fileName} — ${status.textLength.toLocaleString()} characters ready for mock interviews.`;
    resumeClearBtn.classList.remove("hidden");
  } else {
    resumeHint.textContent = "Upload your resume so questions and feedback reference your real background.";
    resumeClearBtn.classList.add("hidden");
  }
  resumeHint.classList.remove("hidden");
}

async function refreshResumeUi() {
  renderResumeStatus(await window.kemz.getResumeStatus());
}

function updateModeVisibility() {
  const isMockInterview = modeSelect.value === "mock-interview";
  resumeRow.classList.toggle("hidden", !isMockInterview);
  if (isMockInterview) refreshResumeUi();
  else resumeHint.classList.add("hidden");
}

modeSelect.addEventListener("change", updateModeVisibility);

resumeUploadBtn.addEventListener("click", async () => {
  resumeUploadBtn.disabled = true;
  try {
    const result = await window.kemz.uploadResume();
    if (!result.canceled) {
      renderResumeStatus(result);
      setFooter(`Resume loaded: ${result.fileName}.`);
    }
  } catch (err) {
    setFooter(`Resume upload failed: ${err.message || err}`);
  } finally {
    refreshControls();
  }
});

resumeClearBtn.addEventListener("click", async () => {
  await window.kemz.clearResume();
  renderResumeStatus(null);
  setFooter("Resume removed.");
});

// ---- Licensing ----

function renderBalance(minutes) {
  currentBalance = typeof minutes === "number" ? minutes : null;
  if (currentBalance === null) {
    balanceEl.textContent = "";
    return;
  }
  balanceEl.textContent = `${currentBalance.toFixed(1)} min left`;
  balanceEl.classList.toggle("low", currentBalance < 5);
}

async function showAppIfActivated() {
  const status = await window.kemz.getLicenseStatus();
  if (status.activated) {
    licenseScreen.classList.add("hidden");
    appScreen.classList.remove("hidden");
    renderBalance(status.minutesRemaining);
    setFooter(status.minutesRemaining > 0 ? "Ready. Start your mic and/or system audio." : `Out of minutes. ${CONTACT_INFO}`);
    populateSystemAudioDevices();
    updateModeVisibility();
    refreshControls();
  } else {
    licenseScreen.classList.remove("hidden");
    appScreen.classList.add("hidden");
  }
}

activateBtn.addEventListener("click", async () => {
  const key = licenseInput.value.trim();
  if (!key) return;
  activateBtn.disabled = true;
  licenseError.textContent = "";
  try {
    await window.kemz.activateLicense(key);
    await showAppIfActivated();
  } catch (err) {
    licenseError.textContent = err.message || String(err);
  } finally {
    activateBtn.disabled = false;
  }
});

licenseInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") activateBtn.click();
});

// ---- UI helpers ----

function setFooter(text) {
  footer.textContent = text;
}

function setStatus(state) {
  statusDot.className = "dot" + (state === "live" ? " live" : state === "error" ? " error" : "");
}

function footerForActiveChannels() {
  const micLabel = micMuted ? "mic muted" : "mic";
  if (micRecorder && systemRecorder) return `Listening (${micLabel} + system audio)…`;
  if (systemRecorder) return "Listening (system audio only)…";
  if (micRecorder) return micMuted ? "Mic muted — still connected, not sending audio." : "Listening (mic only)…";
  return "Idle.";
}

// Single source of truth for every button/select's enabled state and label —
// called after any start/stop so the UI can't drift out of sync.
function refreshControls() {
  const anyActive = !!(micRecorder || systemRecorder);
  const outOfMinutes = currentBalance !== null && currentBalance <= 0;

  renderToggleButton(micToggleBtn, "mic", ICONS.mic, ICONS.stop, "Stop My Mic", "Start My Mic", !!micRecorder);
  micToggleBtn.disabled = micBusy || (!micRecorder && outOfMinutes);

  renderToggleButton(micMuteBtn, "mute", ICONS.mic, ICONS.micSlash, "Unmute", "Mute", micMuted, { pulse: false });
  micMuteBtn.disabled = !micRecorder;

  renderToggleButton(systemToggleBtn, "system", ICONS.speaker, ICONS.stop, "Stop System Audio", "Start System Audio", !!systemRecorder);
  systemToggleBtn.disabled = systemBusy || (!systemRecorder && outOfMinutes);

  modeSelect.disabled = anyActive;
  systemAudioSelect.disabled = anyActive;
  resumeUploadBtn.disabled = anyActive;
  resumeClearBtn.disabled = anyActive;
  stopAllBtn.disabled = !anyActive;
  suggestBtn.disabled = !anyActive || suggestInFlight;
  saveBtn.disabled = finalTurns.length === 0;
  resetBtn.disabled = finalTurns.length === 0 && suggestionHistory.length === 0;
}

function renderTranscript() {
  transcriptEl.innerHTML = "";
  const sorted = [...finalTurns].sort((a, b) => a.at - b.at);
  for (const turn of sorted) {
    const line = document.createElement("span");
    line.className = "line";
    const label = document.createElement("span");
    label.className = `speaker speaker-${turn.speaker}`;
    label.textContent = turn.speaker === "them" ? "Them:" : "You:";
    line.appendChild(label);
    line.appendChild(document.createTextNode(turn.text));
    transcriptEl.appendChild(line);
  }
  for (const [speaker, text] of [
    ["them", interimThem],
    ["you", interimYou],
  ]) {
    if (!text) continue;
    const line = document.createElement("span");
    line.className = "line interim";
    const label = document.createElement("span");
    label.className = `speaker speaker-${speaker}`;
    label.textContent = speaker === "them" ? "Them:" : "You:";
    line.appendChild(label);
    line.appendChild(document.createTextNode(text));
    transcriptEl.appendChild(line);
  }
  transcriptEl.scrollTop = transcriptEl.scrollHeight;
}

function recentTranscript(maxChars = 2000) {
  const sorted = [...finalTurns].sort((a, b) => a.at - b.at);
  const text = sorted.map((t) => `${t.speaker === "them" ? "Them" : "You"}: ${t.text}`).join("\n");
  return text.length > maxChars ? text.slice(-maxChars) : text;
}

// Small, dependency-free markdown-lite: renders the model's "- bullet" /
// "**bold**" output as a real structured list instead of a raw text dump.
// Escapes HTML first, then applies formatting on the escaped string so
// nothing in the model's output can inject markup.
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inlineFormat(str) {
  return escapeHtml(str).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function renderSuggestionBody(text) {
  const bulletRe = /^[-*•]\s+/;
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const intro = lines.filter((l) => !bulletRe.test(l));
  const bullets = lines.filter((l) => bulletRe.test(l)).map((l) => l.replace(bulletRe, ""));

  if (bullets.length === 0) {
    // Model didn't use bullets this time — still format bold text, as prose.
    return lines.map((l) => `<p class="suggestion-intro">${inlineFormat(l)}</p>`).join("");
  }

  const introHtml = intro.map((l) => `<p class="suggestion-intro">${inlineFormat(l)}</p>`).join("");
  const listHtml = `<ul class="suggestion-list">${bullets
    .map((b) => `<li>${ICONS.caretRight}<span>${inlineFormat(b)}</span></li>`)
    .join("")}</ul>`;
  return introHtml + listHtml;
}

// Same underlying transcript as what's currently shown -> refresh that box
// in place. Different transcript -> keep the old box in history and add a
// fresh one on top. This is what stops "re-answering the same question"
// from stacking up duplicate boxes.
function upsertSuggestion(text, transcript) {
  const time = new Date().toLocaleTimeString();
  const bodyHtml = renderSuggestionBody(text);

  if (lastSuggestionBlock && transcript === lastRenderedTranscript) {
    lastSuggestionBlock.querySelector(".suggestion-time").textContent = time;
    lastSuggestionBlock.querySelector(".suggestion-body").innerHTML = bodyHtml;
    if (suggestionHistory.length > 0) {
      suggestionHistory[suggestionHistory.length - 1] = { time, text };
    }
    return;
  }

  const block = document.createElement("div");
  block.className = "suggestion-block";
  block.innerHTML = `
    <div class="suggestion-head">
      <span class="suggestion-badge">${ICONS.sparkle}</span>
      <span class="suggestion-time">${time}</span>
    </div>
    <div class="suggestion-body">${bodyHtml}</div>
  `;
  suggestionsEl.prepend(block);
  suggestionHistory.push({ time, text });
  lastSuggestionBlock = block;
  lastRenderedTranscript = transcript;
}

// Called on every final segment on the trigger channel — restarts the
// debounce window. Only fires the actual request once SUGGEST_DEBOUNCE_MS
// passes with no further final segment.
function scheduleSuggestionCheck() {
  if (suggestDebounceTimer) clearTimeout(suggestDebounceTimer);
  suggestDebounceTimer = setTimeout(() => {
    suggestDebounceTimer = null;
    const transcript = recentTranscript();
    if (!transcript.trim()) return;
    if (transcript === lastRequestedTranscript) return; // nothing new — this is the duplicate-request fix
    runSuggestionRequest(transcript);
  }, SUGGEST_DEBOUNCE_MS);
}

async function runSuggestionRequest(transcript) {
  if (suggestInFlight) {
    // A request is already running; once it finishes, re-check against
    // whatever the transcript looks like by then instead of firing a
    // second concurrent request for content that's about to be stale.
    pendingRerunNeeded = true;
    return;
  }

  suggestInFlight = true;
  lastRequestedTranscript = transcript;
  refreshControls();
  setFooter("Thinking…");
  try {
    const text = await window.kemz.getSuggestions(transcript, modeSelect.value);
    upsertSuggestion(text, transcript);
    setFooter(footerForActiveChannels());
  } catch (err) {
    setFooter(`Suggestion error: ${err.message || err}`);
  } finally {
    suggestInFlight = false;
    refreshControls();
    if (pendingRerunNeeded) {
      pendingRerunNeeded = false;
      scheduleSuggestionCheck();
    }
  }
}

// Manual button: always asks fresh for the current transcript (even if
// unchanged since the last auto-request), but still can't run concurrently
// with an in-flight request, and still replaces rather than duplicates.
function manualRequestSuggestion() {
  const transcript = recentTranscript();
  if (!transcript.trim()) return;
  runSuggestionRequest(transcript);
}

function makeRecorder(stream, channel) {
  const recorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
  recorder.ondataavailable = async (event) => {
    if (event.data.size === 0) return;
    // Muted: keep the connection/session alive (main process sends Deepgram
    // keep-alives while idle), just stop forwarding your actual audio.
    if (channel === "you" && micMuted) return;
    const buffer = await event.data.arrayBuffer();
    window.kemz.sendAudioChunk(channel, buffer);
  };
  recorder.start(250);
  return recorder;
}

function stopLocalMic() {
  micMuted = false;
  if (micRecorder) {
    micRecorder.stop();
    micRecorder = null;
  }
  if (micStream) {
    micStream.getTracks().forEach((track) => track.stop());
    micStream = null;
  }
}

function stopLocalSystem() {
  if (systemRecorder) {
    systemRecorder.stop();
    systemRecorder = null;
  }
  if (systemStream) {
    systemStream.getTracks().forEach((track) => track.stop());
    systemStream = null;
  }
}

function onSessionFullyStopped(reasonFooter) {
  if (suggestDebounceTimer) {
    clearTimeout(suggestDebounceTimer);
    suggestDebounceTimer = null;
  }
  setStatus("idle");
  setFooter(reasonFooter || "Stopped. You can save this session or start again.");
}

// ---- Mic toggle ----

micToggleBtn.addEventListener("click", async () => {
  if (micBusy) return;
  micBusy = true;
  refreshControls();

  try {
    if (micRecorder) {
      stopLocalMic();
      const result = await window.kemz.stopChannel("you");
      renderBalance(result.minutesRemaining);
      if (result.sessionEnded) onSessionFullyStopped();
      else setFooter(footerForActiveChannels());
    } else {
      if (!micStream && !systemStream) sessionMode = modeSelect.value; // lock mode on the first channel of a fresh session
      const { minutesRemaining } = await window.kemz.startChannel("you", sessionMode);
      renderBalance(minutesRemaining);
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micRecorder = makeRecorder(micStream, "you");
      populateSystemAudioDevices();
      setStatus("live");
      setFooter(footerForActiveChannels());
    }
  } catch (err) {
    setStatus("error");
    setFooter(`Mic error: ${err.message || err}`);
    stopLocalMic();
    await window.kemz.stopChannel("you").catch(() => {});
  } finally {
    micBusy = false;
    refreshControls();
  }
});

micMuteBtn.addEventListener("click", () => {
  if (!micRecorder) return;
  micMuted = !micMuted;
  refreshControls();
  setFooter(footerForActiveChannels());
});

// ---- System audio toggle ----

systemToggleBtn.addEventListener("click", async () => {
  if (systemBusy) return;

  if (!systemRecorder && !systemAudioSelect.value) {
    setFooter("Pick a system audio device first (dropdown below).");
    return;
  }

  systemBusy = true;
  refreshControls();

  try {
    if (systemRecorder) {
      stopLocalSystem();
      const result = await window.kemz.stopChannel("them");
      renderBalance(result.minutesRemaining);
      if (result.sessionEnded) onSessionFullyStopped();
      else setFooter(footerForActiveChannels());
    } else {
      const deviceId = systemAudioSelect.value;
      if (!micStream && !systemStream) sessionMode = modeSelect.value;
      const { minutesRemaining } = await window.kemz.startChannel("them", sessionMode);
      renderBalance(minutesRemaining);
      systemStream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: { exact: deviceId } } });
      systemRecorder = makeRecorder(systemStream, "them");
      setStatus("live");
      setFooter(footerForActiveChannels());
    }
  } catch (err) {
    setStatus("error");
    setFooter(`System audio error: ${err.message || err}`);
    stopLocalSystem();
    await window.kemz.stopChannel("them").catch(() => {});
  } finally {
    systemBusy = false;
    refreshControls();
  }
});

// ---- Stop All ----

stopAllBtn.addEventListener("click", async () => {
  stopAllBtn.disabled = true;
  stopLocalMic();
  stopLocalSystem();
  try {
    const result = await window.kemz.stopSession();
    renderBalance(result.minutesRemaining);
  } catch (err) {
    setFooter(`Stop failed: ${err.message || err}`);
  }
  onSessionFullyStopped();
  refreshControls();
});

suggestBtn.addEventListener("click", manualRequestSuggestion);

saveBtn.addEventListener("click", async () => {
  const sorted = [...finalTurns].sort((a, b) => a.at - b.at);
  const session = {
    mode: sessionMode,
    timestamp: Date.now(),
    transcript: sorted.map((t) => `${t.speaker === "them" ? "Them" : "You"}: ${t.text}`).join("\n"),
    suggestions: suggestionHistory,
  };
  try {
    const result = await window.kemz.saveSession(session);
    setFooter(`Saved to ${result.file}`);
  } catch (err) {
    setFooter(`Save failed: ${err.message || err}`);
  }
});

// Clears the transcript and suggestions feed only — mic/system audio keep
// running uninterrupted and the billed session/credit balance is untouched
// (metering is time-based, not tied to transcript content). For starting a
// fresh round of questions without reconnecting anything.
resetBtn.addEventListener("click", () => {
  finalTurns = [];
  interimYou = "";
  interimThem = "";
  suggestionHistory = [];
  suggestionsEl.innerHTML = "";

  if (suggestDebounceTimer) {
    clearTimeout(suggestDebounceTimer);
    suggestDebounceTimer = null;
  }
  pendingRerunNeeded = false;
  lastRequestedTranscript = "";
  lastRenderedTranscript = "";
  lastSuggestionBlock = null;

  renderTranscript();
  refreshControls();
  setFooter(micRecorder || systemRecorder ? `Cleared. ${footerForActiveChannels()}` : "Cleared.");
});

// ---- Events from main process ----

window.kemz.onTranscript(({ text, isFinal, channel }) => {
  const speaker = channel === "them" ? "them" : "you";
  // Live, not fixed at session start: whenever system audio is currently
  // running, only "them" pauses drive auto-suggest; otherwise fall back to
  // "you" (mic-only mode), since that's all there is.
  const isTriggerChannel = systemRecorder ? speaker === "them" : speaker === "you";

  if (isFinal) {
    finalTurns.push({ speaker, text, at: Date.now() });
    if (speaker === "them") interimThem = "";
    else interimYou = "";

    if (isTriggerChannel) scheduleSuggestionCheck();
  } else if (speaker === "them") {
    interimThem = text;
  } else {
    interimYou = text;
  }
  renderTranscript();
  refreshControls();
});

window.kemz.onTranscriptError((message) => {
  setStatus("error");
  setFooter(message);
});

window.kemz.onBalanceUpdate(({ minutesRemaining }) => {
  renderBalance(minutesRemaining);
  refreshControls();
});

window.kemz.onSessionExhausted(() => {
  stopLocalMic();
  stopLocalSystem();
  onSessionFullyStopped(`Out of minutes. ${CONTACT_INFO}`);
  refreshControls();
});

showAppIfActivated();
