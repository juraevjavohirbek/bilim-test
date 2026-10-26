// Qarsak va ikki qisqa buzzer ovozi lokal yaratiladi: internetdan audio olinmaydi.
export function feedbackSamples(correct, sampleRate = 24000) {
  const length = Math.ceil(sampleRate * (correct ? 2.25 : 0.8));
  const samples = [new Float32Array(length), new Float32Array(length)];
  let seed = 1729;
  function random() { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }
  if (correct) {
    for (let clap = 0; clap < 120; clap++) {
      const start = Math.floor(random() * sampleRate * 1.95);
      const duration = Math.floor(sampleRate * (0.025 + random() * 0.055));
      const pan = random();
      const strength = (0.1 + random() * 0.16) * (1 - start / length * 0.6);
      let previous = 0;
      for (let i = 0; i < duration && start + i < length; i++) {
        const noise = random() * 2 - 1;
        const attack = Math.min(1, i / (sampleRate * 0.001));
        const value = (noise - previous * 0.65) * attack * Math.exp(-i / duration * 7) * strength;
        samples[0][start + i] += value * (0.4 + pan * 0.6);
        samples[1][start + i] += value * (1 - pan * 0.6);
        previous = noise;
      }
    }
    for (const channel of samples) for (let i = 0; i < length; i++) channel[i] = Math.tanh(channel[i] * 2);
  } else {
    for (let i = 0; i < length; i++) {
      const time = i / sampleRate;
      const local = time >= 0.42 ? time - 0.42 : time - 0.04;
      if (local < 0 || local > 0.23) continue;
      const phase = local * (135 - local * 30);
      const wave = (2 * (phase % 1) - 1) * 0.55 + Math.sin(phase * Math.PI * 4) * 0.2;
      const envelope = Math.min(1, local / 0.012, (0.23 - local) / 0.025);
      samples[0][i] = samples[1][i] = wave * Math.max(0, envelope) * 0.35;
    }
  }
  return samples;
}

let context;
const buffers = new Map();
let playing;

export function unlockFeedbackAudio() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    context ??= new AudioContext();
    // Variant bosilgan gesture ichida ruxsat olinadi, API javobini kutmasdan.
    if (context.state === "suspended") context.resume().catch(() => {});
  } catch { /* Ovoz qo‘llanmasa ham test ishlaydi. */ }
}

export function playFeedbackSound(correct) {
  try {
    if (!context) return;
    playing?.stop();
    if (!buffers.has(correct)) {
      const channels = feedbackSamples(correct, context.sampleRate);
      const buffer = context.createBuffer(2, channels[0].length, context.sampleRate);
      channels.forEach((channel, index) => buffer.copyToChannel(channel, index));
      buffers.set(correct, buffer);
    }
    const source = context.createBufferSource();
    source.buffer = buffers.get(correct);
    const volume = context.createGain();
    volume.gain.value = 0.65;
    source.connect(volume).connect(context.destination);
    source.onended = () => { source.disconnect(); volume.disconnect(); if (playing === source) playing = null; };
    playing = source;
    source.start();
  } catch { /* Brauzer ovozni bloklasa, natija oynasi baribir chiqadi. */ }
}

export function stopFeedbackSound() {
  try { playing?.stop(); } catch { /* Ovoz allaqachon tugagan bo‘lishi mumkin. */ }
  playing = null;
}
