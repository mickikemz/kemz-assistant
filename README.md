# Kemz Assistant

A real-time AI conversation copilot: live transcription + AI-generated talking
points, for conversations where AI assistance is disclosed and welcome —
sales calls, internal meetings, mock interview practice, language practice,
and self-study. Free trial minutes per license key, then buy more from Kemz.

**Two-part project**: an Electron desktop app (what the user runs) and a
Node.js/Express backend (what you, the operator, run — it's the only thing
holding real API keys and deciding how many minutes each license has left).

## Contents

- [Tech stack](#tech-stack)
- [Quick start (VS Code)](#quick-start-vs-code)
- [System audio setup](#system-audio-setup-macos--capture-what-you-hear-not-just-your-mic)
- [Managing license keys](#managing-license-keys-server-admin-clijs)
- [Architecture](#architecture)
- [What this app intentionally does not do](#what-this-app-intentionally-does-not-do)
- [Current limitations](#current-limitations-mvp-not-yet-solved)
- [Project layout](#project-layout)

## Tech stack

| Layer | Technology | Why |
|---|---|---|
| Desktop app shell | **Electron 32** | Cross-platform native window + Node.js access from a web UI |
| Desktop UI | Plain **HTML / CSS / JavaScript** (no framework, no bundler) | Small enough surface area that React/Vue would be pure overhead |
| Icons | Inline **Phosphor** SVGs | No emoji-as-icon, no icon-font dependency |
| Backend server | **Node.js + Express 4** | Small, well-understood REST API layer |
| Backend database | **SQLite** via `better-sqlite3` | Zero-ops embedded DB — no separate DB server to run |
| Live transcription | **Deepgram** (`@deepgram/sdk`, `nova-2` model) | Low-latency streaming speech-to-text over WebSocket |
| AI suggestions (pluggable) | **Groq** (`groq-sdk`, `openai/gpt-oss-20b`) *(active by default)*, **Anthropic Claude** (`@anthropic-ai/sdk`), **Google Gemini** (`@google/genai`) | One `AI_PROVIDER` env var switches between them — see `server/providers/` |
| Resume/CV parsing | **pdf-parse** | Extracts text from an uploaded PDF for Mock Interview mode |
| Auth | Bearer tokens + custom license-key system (hand-rolled, `crypto.randomBytes`) | No third-party auth provider needed for this scale |
| Env config | `dotenv` | Standard `.env` file loading |

No build step, no bundler, no TypeScript compilation — every file runs as-is.
Requires **Node.js 18+** (uses native `fetch` and `crypto.randomUUID`).

## Quick start (VS Code)

1. **Open the folder** — `File → Open Folder…` and select this project's root
   folder (the one this README is in).
2. **Open a terminal in VS Code** — `` Ctrl+` `` (or Terminal → New Terminal).
   Everything below runs in that terminal; no extensions required.
3. **Start the backend** (holds your real API keys — do this first):
   ```bash
   cd server
   npm install
   cp .env.example .env
   ```
   Open the new `server/.env` in VS Code and fill in:
   - `ANTHROPIC_API_KEY` / `GEMINI_API_KEY` / `GROQ_API_KEY` — at least one,
     matching whichever `AI_PROVIDER` you set (defaults to `groq`, which has
     the most generous free tier)
   - `DEEPGRAM_API_KEY` — needs **Owner/Admin** role in the Deepgram console
     (Member-role keys can transcribe but can't mint the short-lived
     per-session keys this app uses — the app checks for this and mints
     nothing if the role is wrong, so you'll get a clear error message, not
     a silent failure)
   - `ADMIN_SECRET` — any long random string; generate one with:
     ```bash
     node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
     ```
   Then:
   ```bash
   npm start
   # -> Kemz Assistant server listening on http://localhost:8787
   ```
4. **Issue yourself a license key** (new terminal tab, still in `server/`):
   ```bash
   node admin-cli.js create --label="me, testing"
   # -> Created license key: KEMZ-AB12-CD34-EF56  (30.0 min, active)
   ```
5. **Start the desktop app** (new terminal tab, back at the project root):
   ```bash
   cd ..
   npm install
   cp .env.example .env    # default KEMZ_BACKEND_URL=http://localhost:8787 is correct for local dev
   npm start
   ```
   A window opens. Paste the license key from step 4 into the activation
   screen — you start with a 30-minute free trial.

That's the whole setup: two `npm install`s, two `.env` files, two
`npm start`s, running side by side in two VS Code terminal tabs.

## System audio setup (macOS — capture what you hear, not just your mic)

macOS has no built-in way for an app to "hear" what's playing through your
speakers — that requires a virtual audio driver. **BlackHole** (free,
open-source) is the standard one:

```bash
brew install --cask blackhole-2ch
```

This needs your admin password and **a reboot** to take effect — run it
yourself in a real terminal, not through an automated tool.

After rebooting:

1. Open **Audio MIDI Setup** (Spotlight → "Audio MIDI Setup")
2. Click **+** (bottom left) → **Create Multi-Output Device**
3. Check both your normal output (e.g. "MacBook Pro Speakers") and
   **BlackHole 2ch** — this way audio still plays out loud for you *and*
   gets routed to BlackHole
4. In **System Settings → Sound → Output**, select that new Multi-Output
   Device as your output
5. In Kemz Assistant, open the **System audio device** dropdown and pick
   **BlackHole 2ch** — the app auto-detects and preselects it if found

Now the call's audio (interviewer, prospect, other meeting participants)
plays through your speakers as normal *and* reaches Kemz Assistant as a
separate "Them" channel. Skip this entirely to just use mic-only mode.

## What's actually working right now

- **Meeting / Sales Call mode**: live transcription (mic + optional system
  audio, correctly separated by speaker), pause-triggered AI talking-point
  suggestions, structured suggestion cards (not a raw text dump), manual
  "Get Suggestions", Mute (pause your mic without ending the session or
  losing the connection), Reset (clear transcript/suggestions, keep
  listening), Save Session (writes a JSON transcript locally)
- **Mock Interview mode**: AI plays interviewer, asks role-relevant
  questions, gives feedback on your spoken answers — optionally grounded in
  an uploaded resume/CV (PDF or `.txt`) so questions and feedback reference
  your real background
- **Licensing & billing**: license-key activation, 30-minute free trial per
  key, time-based credit metering (server-enforced, not client-trusted),
  admin CLI to issue/credit/revoke keys
- **Language Practice** and **Self-Study** modes: system prompts exist but
  the interaction loop isn't fully built out yet (see Limitations)

## Managing license keys (`server/admin-cli.js`)

```bash
node admin-cli.js create [--minutes=30] [--label="Someone's name"]   # issue a new key
node admin-cli.js credit <key> <minutes>                             # after they pay you, add minutes
node admin-cli.js revoke <key>                                       # disable a key
node admin-cli.js unrevoke <key>
node admin-cli.js list                                               # see every key + balance
```

Payment is manual for now (bank transfer / whatever you agree with the
buyer) — there's no in-app checkout. When someone pays, run `credit`.
Wiring up an automated payment provider (Stripe/Paystack) later is a
matter of calling `db.creditLicense()` from a webhook handler instead of
the CLI — the metering/activation system underneath doesn't change.

## Architecture

- **`server/`** is the trust boundary. It's the only thing holding real
  Deepgram/Anthropic/Gemini/Groq keys, the only thing that can
  create/credit/revoke license keys (via `x-admin-secret`), and the only
  thing that decides how many minutes a license has left. A tampered or
  reverse-engineered desktop app can't grant itself free usage — it has
  nothing to tamper with locally except a cached balance display.
- **License keys** (`KEMZ-XXXX-XXXX-XXXX`) map to a `minutes_remaining`
  balance in `server/data/kemz.db` (SQLite). Activating exchanges a key for
  a 24h auth token; the desktop app caches `{licenseKey, token,
  minutesRemaining}` in `app.getPath('userData')/activation.json`.
- **Credit metering is time-based** (matches how Parakeet AI itself prices
  — "0.5 credit = 30 min session"): every ~20s while a session is running,
  the desktop app pings `/session/heartbeat`, and the server deducts the
  elapsed minutes from that license's balance server-side. AI suggestion
  calls don't cost anything extra — they're proxied through `/suggest` and
  gated on "does this session still have balance."
- **Per-session Deepgram keys**: `/session/start` mints two short-lived
  Deepgram API keys — one per audio channel — (`server/deepgram.js`, scope
  `usage:write`, TTL capped to the license's remaining balance) instead of
  ever handing the desktop app your permanent Deepgram key. The "them" key
  only gets connected if the renderer actually has a system-audio device to
  feed it.
- **Two independent audio channels, not one guessed apart after the
  fact**: your mic ("You") and, optionally, system/loopback audio for
  everyone else on the call ("Them") — each with its own Deepgram
  connection, own short-lived key, own start/stop/mute control. The AI's
  auto-suggest trigger watches "Them" pauses when that channel is active
  (so reading a suggestion back out loud on your own mic never counts as a
  new question), falling back to "You" pauses in mic-only mode.
- **Pluggable AI provider**: `server/claude.js` resolves whichever provider
  `AI_PROVIDER` names (`server/providers/{anthropic,gemini,groq}.js`), all
  sharing one set of prompts (`server/providers/prompts.js`). Switching
  providers is a one-line `.env` change.
- **Electron desktop app.** `electron/main.js` is the only place in the
  app that holds the activation token or talks to the backend
  (`src/services/backend.js`). The renderer (`src/renderer/*`) only ever
  talks through the narrow bridge in `electron/preload.js`
  (`contextIsolation: true`, `sandbox: true`).
- **Resume/CV storage is deliberately shallow.** `electron/resume.js`
  extracts text (PDF via `pdf-parse`, or plain `.txt`) and keeps it in the
  app's local `userData` folder only — never sent to the server except as
  part of `/session/start` for `mock-interview` mode specifically.
  `server/resumeStore.js` holds it in an in-memory `Map` keyed by
  `sessionId`, never written to the SQLite DB or disk server-side, and is
  discarded on `/session/end`.

## What this app intentionally does *not* do

This is a normal, visible application window — shown in the dock, in
Activity Monitor/Task Manager, and in screen shares, like any other app.
It does not implement OS-level cloaking (hiding from screen-share capture,
spoofing window/process visibility, evading tab-switch detection) and it
does not have an "exam mode." Those features only make sense when the
other party in the conversation — an interviewer, a proctor, a meeting
host — hasn't agreed to AI assistance and would object if they knew.
That's outside what this project is for. Every mode here assumes the
assistance is disclosed, same as tools like Otter.ai or Gong. Mock
Interview mode's resume-grounded questions/feedback are scoped to that mode
specifically, because it's the only one with no real listener — you're
practicing against the AI, not being fed lines to say to someone else.

## Current limitations (MVP, not yet solved)

- **System audio capture is macOS-only for now** (BlackHole, see above).
  Windows needs the equivalent (a WASAPI loopback device, e.g. VB-Cable) —
  same app-side code path, just different setup instructions.
- **No packaging/installer** — everyone currently runs the desktop app
  from source with `npm start`. Packaging with `electron-builder` and
  pointing `KEMZ_BACKEND_URL` at a deployed server is the next step to
  actually hand this to other people.
- **No automated payments** — see "Managing license keys" above.
- **Server needs a real deployment** (e.g. Fly.io, Render, a VPS) once you
  want to give the desktop app to people other than yourself on the same
  machine — right now `KEMZ_BACKEND_URL` defaults to `localhost`.
- `meeting` and `mock-interview` modes are fully wired; `language-practice`
  and `self-study` still just have a scaffolded system prompt and need
  their own conversation flow.
- Resume parsing supports PDF and `.txt` only — DOCX isn't handled yet
  (convert to PDF as a workaround for now).

## Project layout

```
kemz-assistant/
├── electron/
│   ├── main.js       Main process: window, IPC, session/licensing state, owns nothing secret
│   ├── preload.js     contextBridge — the only surface the renderer can call
│   ├── store.js        Local activation cache (~/Library/Application Support/kemz-assistant/activation.json)
│   └── resume.js        Resume upload/extraction (PDF/.txt), stored locally only
├── src/
│   ├── services/
│   │   ├── deepgram.js   Live transcription wrapper (used with a per-session temp key)
│   │   └── backend.js    HTTP client for server/
│   └── renderer/
│       ├── index.html    License gate + main UI
│       ├── index.js       UI logic
│       └── style.css
├── server/
│   ├── index.js           Express app entry point
│   ├── db.js               SQLite schema + license/session queries
│   ├── auth.js              Bearer-token + admin-secret middleware
│   ├── deepgram.js           Mints short-lived per-session Deepgram keys
│   ├── claude.js              Provider-agnostic suggestion entry point
│   ├── resumeStore.js          In-memory per-session resume text (never persisted)
│   ├── admin-cli.js             Terminal tool: create/credit/revoke license keys
│   ├── providers/
│   │   ├── anthropic.js
│   │   ├── gemini.js
│   │   ├── groq.js
│   │   └── prompts.js         Shared per-mode system prompts
│   └── routes/
│       ├── activate.js        POST /activate
│       ├── session.js          POST /session/start, /heartbeat, /end
│       ├── suggest.js           POST /suggest
│       └── admin.js              POST/GET /admin/licenses/*
├── package.json           Desktop app manifest
└── server/package.json    Backend manifest
```

`node_modules/`, `.env` files, `sessions/` (saved transcripts), and
`server/data/` (the SQLite DB) are all git-ignored / excluded from
distribution — they're either regenerable (`npm install`) or
machine-local state, never something to ship or share.
