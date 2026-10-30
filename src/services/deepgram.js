const { createClient, LiveTranscriptionEvents } = require("@deepgram/sdk");

const CONNECT_TIMEOUT_MS = 12000;
const CONNECT_ATTEMPTS = 2;
const RETRY_DELAY_MS = 1000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Thin wrapper around Deepgram's live-transcription WebSocket.
 * Lives entirely in the main process so the API key never touches the renderer.
 */
class DeepgramSession {
  constructor(apiKey) {
    this.client = createClient(apiKey);
    this.connection = null;
    this._onTranscript = () => {};
    this._onError = () => {};
  }

  onTranscript(callback) {
    this._onTranscript = callback;
  }

  onError(callback) {
    this._onError = callback;
  }

  async start() {
    let lastError;
    for (let attempt = 1; attempt <= CONNECT_ATTEMPTS; attempt++) {
      try {
        await this._connectOnce();
        return;
      } catch (err) {
        lastError = err;
        if (attempt < CONNECT_ATTEMPTS) await sleep(RETRY_DELAY_MS);
      }
    }
    throw new Error(
      `Could not connect to Deepgram after ${CONNECT_ATTEMPTS} attempts: ${lastError.message}`
    );
  }

  _connectOnce() {
    return new Promise((resolve, reject) => {
      const connection = this.client.listen.live({
        model: "nova-2",
        smart_format: true,
        interim_results: true,
        punctuate: true,
        // No `encoding`/`sample_rate` set on purpose: audio arrives as
        // WebM/Opus chunks from the renderer's MediaRecorder, and Deepgram
        // reads the codec from the container.
      });

      let settled = false;
      const finish = (fn, arg) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        fn(arg);
      };

      const timeout = setTimeout(() => {
        // Close the half-open connection instead of abandoning it — otherwise
        // it can complete moments later as an untracked, never-closed socket.
        try {
          connection.requestClose();
        } catch {
          // already dead, nothing to clean up
        }
        finish(reject, new Error("connection timed out"));
      }, CONNECT_TIMEOUT_MS);

      connection.on(LiveTranscriptionEvents.Open, () => {
        this.connection = connection;
        finish(resolve);
      });

      connection.on(LiveTranscriptionEvents.Transcript, (data) => {
        const alt = data?.channel?.alternatives?.[0];
        if (!alt || !alt.transcript) return;
        this._onTranscript({ text: alt.transcript, isFinal: !!data.is_final });
      });

      connection.on(LiveTranscriptionEvents.Error, (err) => {
        this._onError(err);
        finish(reject, err instanceof Error ? err : new Error(String(err)));
      });

      connection.on(LiveTranscriptionEvents.Close, () => {
        if (this.connection === connection) this.connection = null;
        finish(reject, new Error("connection closed before it opened"));
      });
    });
  }

  sendChunk(buffer) {
    if (this.connection && this.connection.getReadyState() === 1 /* OPEN */) {
      this.connection.send(buffer);
    }
  }

  // Deepgram closes a live connection after a period of no audio (e.g. the
  // user muted their mic for a while). A KeepAlive message tells it the
  // connection is still wanted, without sending real audio data.
  keepAlive() {
    if (this.connection && this.connection.getReadyState() === 1 /* OPEN */) {
      this.connection.keepAlive();
    }
  }

  stop() {
    if (this.connection) {
      this.connection.requestClose();
      this.connection = null;
    }
  }
}

module.exports = { DeepgramSession };
