// ============================================================
// Block Blast — Sound Effects (Web Audio API, no files needed)
// ============================================================

let audioCtx: AudioContext | null = null;

function ctx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

/** Resume audio context on first user interaction */
export function unlockAudio() {
  const c = ctx();
  if (c.state === 'suspended') c.resume();
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.12, delay = 0) {
  const c = ctx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, c.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + duration);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(c.currentTime + delay);
  osc.stop(c.currentTime + delay + duration);
}

/** Place piece on grid */
export function sfxPlace() {
  playTone(600, 0.08, 'square', 0.06);
}

/** Line(s) cleared */
export function sfxClear(lines: number) {
  const baseFreq = 400 + lines * 60;
  for (let i = 0; i < Math.min(lines, 4); i++) {
    playTone(baseFreq + i * 120, 0.15, 'sine', 0.1, i * 0.06);
  }
}

/** Combo active */
export function sfxCombo(combo: number) {
  const freq = 500 + Math.min(combo, 8) * 80;
  playTone(freq, 0.2, 'triangle', 0.1);
  playTone(freq * 1.5, 0.15, 'sine', 0.06, 0.05);
}

/** Game over */
export function sfxGameOver() {
  playTone(300, 0.3, 'sawtooth', 0.08);
  playTone(200, 0.4, 'sawtooth', 0.06, 0.15);
  playTone(100, 0.5, 'sawtooth', 0.05, 0.3);
}

/** New best score */
export function sfxNewBest() {
  const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
  notes.forEach((f, i) => playTone(f, 0.2, 'sine', 0.1, i * 0.12));
}
