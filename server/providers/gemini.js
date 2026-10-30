const { GoogleGenAI } = require("@google/genai");
const { systemPromptFor, userMessageFor } = require("./prompts");

// gemini-2.5-flash was retired for new users; gemini-3.6-flash is current
// as of writing. Override via GEMINI_MODEL if Google moves the lineup again.
const MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

let client = null;
function gemini() {
  if (!client) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set. Copy .env.example to .env and add it.");
    }
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return client;
}

async function getSuggestions(transcript, mode, resumeText) {
  const response = await gemini().models.generateContent({
    model: MODEL,
    contents: userMessageFor(transcript, resumeText),
    config: {
      systemInstruction: systemPromptFor(mode),
    },
  });
  return response.text;
}

module.exports = { getSuggestions };
