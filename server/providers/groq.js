const Groq = require("groq-sdk");
const { systemPromptFor, userMessageFor } = require("./prompts");

// gpt-oss-20b is Groq's fastest production model (~1000 tok/s on their LPU
// hardware) — picked specifically for latency, since short 2-4 bullet
// suggestions don't need a bigger/slower model's extra reasoning depth.
const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-20b";

let client = null;
function groq() {
  if (!client) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not set. Copy .env.example to .env and add it.");
    }
    client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return client;
}

async function getSuggestions(transcript, mode, resumeText) {
  const completion = await groq().chat.completions.create({
    model: MODEL,
    max_tokens: 200,
    // gpt-oss-20b always does some internal reasoning before answering;
    // "low" is the minimum this model accepts. Without it (or with a small
    // max_tokens and no setting at all) the reasoning step alone can eat
    // the whole token budget and return empty content — verified directly
    // against the API before shipping this.
    reasoning_effort: "low",
    messages: [
      { role: "system", content: systemPromptFor(mode) },
      { role: "user", content: userMessageFor(transcript, resumeText) },
    ],
  });

  return completion.choices[0]?.message?.content ?? "";
}

// Fires a minimal request so the HTTP connection to Groq is already
// established (DNS + TCP + TLS handshake done) before the user's first real
// suggestion — that cold-connection cost measured ~200-300ms slower than a
// warm one in testing. Called fire-and-forget from session/start.
async function warmUp() {
  try {
    await groq().chat.completions.create({
      model: MODEL,
      max_tokens: 1,
      reasoning_effort: "low",
      messages: [{ role: "user", content: "hi" }],
    });
  } catch {
    // best effort — a failed warm-up just means the first real call pays
    // the cold-connection cost instead; not worth surfacing as an error.
  }
}

module.exports = { getSuggestions, warmUp };
