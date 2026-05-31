/**
 * Lightweight Web-Audio sound effects — no audio files required.
 * All sounds are synthesised programmatically.
 *
 * Rules:
 *  - AudioContext is created lazily on first call (requires user gesture).
 *  - Every public function is wrapped in try/catch so audio never breaks the UI.
 *  - Volume is kept low (~0.18) so it's pleasant rather than intrusive.
 */

let _ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!_ctx) {
    _ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  // iOS suspends the context until a user gesture — resume it on every call
  if (_ctx.state === 'suspended') void _ctx.resume();
  return _ctx;
}

/** Schedules a single tone burst. */
function tone(
  freq: number,
  startOff: number,
  dur: number,
  vol = 0.18,
  type: OscillatorType = 'sine',
) {
  const c = getCtx();
  const osc  = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);
  osc.type          = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, c.currentTime + startOff);
  gain.gain.linearRampToValueAtTime(vol,    c.currentTime + startOff + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + startOff + dur);
  osc.start(c.currentTime + startOff);
  osc.stop (c.currentTime + startOff + dur + 0.02);
}

/* ── public sounds ──────────────────────────────────────────────── */

/** Soft UI tap — for any regular button. */
export function playClick() {
  try { tone(780, 0, 0.07, 0.13); tone(1020, 0.018, 0.05, 0.08); }
  catch { /* silently ignore */ }
}

/** Step-advance ding — moving to the next wizard step. */
export function playStep() {
  try { tone(660, 0, 0.20, 0.17); tone(880, 0.07, 0.16, 0.12); }
  catch { /* silently ignore */ }
}

/** Ascending C-major arpeggio — played when YES is clicked. */
export function playYes() {
  try {
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => {
      tone(f, i * 0.09, 0.38, 0.20 - i * 0.012);
    });
  } catch { /* silently ignore */ }
}

/** Quick descending blip — for the No-button escape game. */
export function playNo() {
  try { tone(380, 0, 0.04, 0.11); tone(290, 0.045, 0.05, 0.09); }
  catch { /* silently ignore */ }
}

/** Bright ping — when a photo is successfully added. */
export function playPhotoAdd() {
  try { tone(1200, 0, 0.10, 0.10); tone(1500, 0.06, 0.09, 0.07); }
  catch { /* silently ignore */ }
}

/** Three-note chime — final confirm / link generated. */
export function playConfirm() {
  try {
    [523.25, 659.25, 783.99].forEach((f, i) => tone(f, i * 0.08, 0.32, 0.19));
  } catch { /* silently ignore */ }
}

/**
 * Soft paper page-flip — quick whoosh + flick.
 * Layered over playStep so the wizard still feels cute,
 * but adds a tactile book-page feel.
 */
export function playPageFlip() {
  try {
    const c = getCtx();
    // 1) Short noise burst (the "whoosh")
    const buf = c.createBuffer(1, c.sampleRate * 0.18, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      // White noise that fades out, with a soft attack envelope
      const t = i / data.length;
      const env = Math.sin(Math.PI * t) * (1 - t);
      data[i] = (Math.random() * 2 - 1) * env * 0.35;
    }
    const noise = c.createBufferSource();
    noise.buffer = buf;
    // Band-pass to make it sound like paper rather than static
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2200;
    bp.Q.value = 0.9;
    const ng = c.createGain();
    ng.gain.value = 0.22;
    noise.connect(bp); bp.connect(ng); ng.connect(c.destination);
    noise.start();
    noise.stop(c.currentTime + 0.22);

    // 2) High-pitched "flick" tap at the end of the flip
    tone(2400, 0.12, 0.05, 0.08, 'triangle');
  } catch { /* silently ignore */ }
}
