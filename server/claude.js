// Provider-agnostic entry point for AI suggestions. Pick the active
// provider with AI_PROVIDER=anthropic|gemini|groq in .env — routes/suggest.js
// only ever calls getSuggestions() from here, so switching providers (e.g.
// moving from Groq back to Claude once things are running smoothly) is a
// one-line .env change, not a rewrite.
const PROVIDER = (process.env.AI_PROVIDER || "anthropic").toLowerCase();

const PROVIDERS = {
  anthropic: () => require("./providers/anthropic"),
  gemini: () => require("./providers/gemini"),
  groq: () => require("./providers/groq"),
};

function resolveProvider() {
  const load = PROVIDERS[PROVIDER];
  if (!load) {
    throw new Error(`Unknown AI_PROVIDER "${PROVIDER}". Use one of: ${Object.keys(PROVIDERS).join(", ")}`);
  }
  return load();
}

async function getSuggestions(transcript, mode = "meeting", resumeText) {
  const provider = resolveProvider();
  return provider.getSuggestions(transcript, mode, resumeText);
}

// Optional per-provider connection warm-up (only Groq implements one right
// now — no-op for providers that don't need/have it).
async function warmUp() {
  const provider = resolveProvider();
  if (typeof provider.warmUp === "function") await provider.warmUp();
}

module.exports = { getSuggestions, warmUp };
