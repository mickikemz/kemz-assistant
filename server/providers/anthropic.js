const Anthropic = require("@anthropic-ai/sdk");
const { systemPromptFor, userMessageFor } = require("./prompts");

const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-5";

let client = null;
function anthropic() {
  if (!client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not set. Copy .env.example to .env and add it.");
    }
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

async function getSuggestions(transcript, mode, resumeText) {
  const message = await anthropic().messages.create({
    model: MODEL,
    max_tokens: 300,
    system: systemPromptFor(mode),
    messages: [{ role: "user", content: userMessageFor(transcript, resumeText) }],
  });

  return message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");
}

module.exports = { getSuggestions };
