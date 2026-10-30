const { createClient } = require("@deepgram/sdk");

// Constructed lazily (not at module load) because the SDK throws
// synchronously if the key is missing — that would crash the whole server
// on boot instead of just failing the one route that needs Deepgram.
let deepgram = null;
function client() {
  if (!deepgram) {
    if (!process.env.DEEPGRAM_API_KEY) {
      throw new Error("DEEPGRAM_API_KEY is not set. Copy .env.example to .env and add it.");
    }
    deepgram = createClient(process.env.DEEPGRAM_API_KEY);
  }
  return deepgram;
}

let cachedProjectId = process.env.DEEPGRAM_PROJECT_ID || null;

async function getProjectId() {
  if (cachedProjectId) return cachedProjectId;
  const { result, error } = await client().manage.getProjects();
  if (error) throw new Error(`Deepgram getProjects failed: ${error.message || error}`);
  const first = result?.projects?.[0];
  if (!first) throw new Error("No Deepgram project found for this API key.");
  cachedProjectId = first.project_id;
  return cachedProjectId;
}

/**
 * Mints a short-lived, scoped Deepgram key so the desktop app can open a
 * live-transcription socket directly without ever holding the permanent
 * project key. `usage:write` is the minimum scope needed to stream audio.
 */
async function mintTemporaryKey({ ttlSeconds, comment }) {
  const projectId = await getProjectId();
  const { result, error } = await client().manage.createProjectKey(projectId, {
    comment,
    scopes: ["usage:write"],
    time_to_live_in_seconds: ttlSeconds,
  });
  if (error) throw new Error(`Deepgram createProjectKey failed: ${error.message || error}`);
  return { key: result.key, expiresAt: Date.now() + ttlSeconds * 1000 };
}

module.exports = { mintTemporaryKey };
