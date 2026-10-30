// Thin client for the Kemz Assistant backend (server/). This is the ONLY
// place the desktop app talks to, for both licensing and AI features — it
// never calls Deepgram/Anthropic with a permanent key of its own.

const BASE_URL = process.env.KEMZ_BACKEND_URL || "http://localhost:8787";

async function request(path, { method = "GET", token, body } = {}) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new Error(`Could not reach Kemz Assistant server at ${BASE_URL}: ${err.message}`);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

const activate = (licenseKey) => request("/activate", { method: "POST", body: { licenseKey } });

const startSession = (token, mode, resumeText) =>
  request("/session/start", { method: "POST", token, body: { mode, resumeText } });

const heartbeat = (token, sessionId) =>
  request("/session/heartbeat", { method: "POST", token, body: { sessionId } });

const endSession = (token, sessionId) =>
  request("/session/end", { method: "POST", token, body: { sessionId } });

const suggest = (token, sessionId, transcript, mode) =>
  request("/suggest", { method: "POST", token, body: { sessionId, transcript, mode } });

module.exports = { activate, startSession, heartbeat, endSession, suggest };
