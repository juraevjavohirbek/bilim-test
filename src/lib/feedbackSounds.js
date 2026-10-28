export const applauseUrl = new URL("../assets/applause.mp3", import.meta.url).href;
export const feedbackDurationSeconds = 5;

// Noto‘g‘ri javob uchun ikki qisqa buzzer.
export function buzzerSamples(sampleRate = 24000) {
  const length = Math.ceil(sampleRate * 0.8);
  const samples = [new Float32Array(length), new Float32Array(length)];
  for (let i = 0; i < length; i++) {
    const time = i / sampleRate;
    const local = time >= 0.42 ? time - 0.42 : time - 0.04;
    if (local < 0 || local > 0.23) continue;
    const phase = local * (135 - local * 30);
    const wave = (2 * (phase % 1) - 1) * 0.55 + Math.sin(phase * Math.PI * 4) * 0.2;
    const envelope = Math.min(1, local / 0.012, (0.23 - local) / 0.025);
    samples[0][i] = samples[1][i] = wave * Math.max(0, envelope) * 0.35;
  }
  return samples;
}

let context;
let applauseBytes;
let applauseBuffer;
let buzzerBuffer;
let playing;
let playbackId = 0;

export function preloadFeedbackAudio() {
  applauseBytes ??= fetch(applauseUrl).then((response) => {
    if (!response.ok) throw new Error("Qarsak yozuvini yuklab bo‘lmadi");
    return response.arrayBuffer();
  }).catch(() => { applauseBytes = undefined; return null; });
  return applauseBytes;
}

function decodeApplause() {
  applauseBuffer ??= preloadFeedbackAudio().then((bytes) => {
    if (!bytes) throw new Error("Qarsak yozuvi yuklanmadi");
    return context.decodeAudioData(bytes.slice(0));
  })
    .catch(() => { applauseBuffer = undefined; return null; });
  return applauseBuffer;
}

export function unlockFeedbackAudio() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    context ??= new AudioContext();
    // API javobini kutmasdan, variant bosilgan gesture ichida ovozga ruxsat olinadi.
    if (context.state === "suspended") context.resume().catch(() => {});
    void decodeApplause();
  } catch { /* Ovoz qo‘llanmasa ham test ishlaydi. */ }
}

export async function playFeedbackSound(correct) {
  stopFeedbackSound();
  const id = playbackId;
  try {
    if (!context) return;
    let buffer;
    if (correct) buffer = await decodeApplause();
    else {
      if (!buzzerBuffer) {
        const channels = buzzerSamples(context.sampleRate);
        buzzerBuffer = context.createBuffer(2, channels[0].length, context.sampleRate);
        channels.forEach((channel, index) => buzzerBuffer.copyToChannel(channel, index));
      }
      buffer = buzzerBuffer;
    }
    // Modal yopilgach yoki qayta eshitish bosilgach kechikkan audio boshlanmasin.
    if (!buffer || id !== playbackId) return;
    const source = context.createBufferSource();
    source.buffer = buffer;
    const volume = context.createGain();
    // Buzzerning qisqa namunasi takrorlanadi, qarsak haqiqiy yozuvdan yangraydi.
    source.loop = !correct;
    const seconds = correct ? Math.min(feedbackDurationSeconds, buffer.duration) : feedbackDurationSeconds;
    const start = context.currentTime;
    volume.gain.setValueAtTime(correct ? 0.9 : 0.65, start);
    volume.gain.setValueAtTime(correct ? 0.9 : 0.65, start + Math.max(0, seconds - 0.3));
    volume.gain.linearRampToValueAtTime(0, start + seconds);
    source.connect(volume).connect(context.destination);
    source.onended = () => { source.disconnect(); volume.disconnect(); if (playing === source) playing = null; };
    playing = source;
    source.start(0, 0, seconds);
  } catch { /* Brauzer ovozni bloklasa, natija oynasi baribir chiqadi. */ }
}

export function stopFeedbackSound() {
  playbackId++;
  try { playing?.stop(); } catch { /* Ovoz allaqachon tugagan bo‘lishi mumkin. */ }
  playing = null;
}
