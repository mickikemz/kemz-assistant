// In-memory only, keyed by sessionId. Resume/CV text is sensitive personal
// data — it's never written to the SQLite DB or to disk on the server, only
// held for the lifetime of the session that uploaded it, then discarded.
const resumes = new Map();

function set(sessionId, resumeText) {
  if (resumeText && resumeText.trim()) resumes.set(sessionId, resumeText.trim());
}

function get(sessionId) {
  return resumes.get(sessionId);
}

function clear(sessionId) {
  resumes.delete(sessionId);
}

module.exports = { set, get, clear };
