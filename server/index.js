require("dotenv").config();
const express = require("express");

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use(require("./routes/activate"));
app.use(require("./routes/session"));
app.use(require("./routes/suggest"));
app.use(require("./routes/admin"));

// Centralized error handler so a thrown/rejected error becomes clean JSON
// instead of an HTML stack trace or a hung request.
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error." });
});

const port = Number(process.env.PORT || 8787);

for (const name of ["ANTHROPIC_API_KEY", "DEEPGRAM_API_KEY", "ADMIN_SECRET"]) {
  if (!process.env[name]) {
    console.warn(`⚠ ${name} is not set — copy .env.example to .env and fill it in.`);
  }
}

app.listen(port, () => {
  console.log(`Kemz Assistant server listening on http://localhost:${port}`);
});
