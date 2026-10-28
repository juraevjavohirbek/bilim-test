import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { applauseUrl, buzzerSamples, unlockFeedbackAudio, playFeedbackSound, stopFeedbackSound } from "./feedbackSounds.js";

function energy(samples, from, to, rate) {
  const slice = samples.subarray(Math.floor(from * rate), Math.floor(to * rate));
  return slice.reduce((sum, value) => sum + value * value, 0) / Math.max(1, slice.length);
}

test("real applause recording is bundled as a local MP3 asset", () => {
  const bytes = readFileSync(new URL(applauseUrl));
  assert.ok(bytes.length > 100000);
  assert.ok(bytes.subarray(0, 3).toString() === "ID3" || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0));
});

test("wrong-answer buzzer has two audible bursts separated by silence", () => {
  const rate = 24000;
  const [left, right] = buzzerSamples(rate);
  assert.deepEqual(left, right);
  assert.ok(energy(left, 0.06, 0.25, rate) > 0.005);
  assert.equal(energy(left, 0.29, 0.4, rate), 0);
  assert.ok(energy(left, 0.44, 0.63, rate) > 0.005);
  assert.equal(energy(left, 0.7, 0.8, rate), 0);
});

test("recorded applause fades within the modal and cancelled loading cannot start late playback", async (t) => {
  const bytes = readFileSync(new URL(applauseUrl));
  const starts = [];
  const gains = [];
  let finishDecoding;
  let stopped = 0;
  const recording = { duration: 10.76 };
  class AudioContext {
    state = "running";
    currentTime = 12;
    decodeAudioData(data) {
      assert.deepEqual(Buffer.from(data), bytes);
      return new Promise((resolve) => { finishDecoding = resolve; });
    }
    createBufferSource() {
      return { connect: () => ({ connect() {} }), disconnect() {}, start: (...args) => starts.push(args), stop: () => stopped++ };
    }
    createGain() {
      return { gain: { setValueAtTime() {}, linearRampToValueAtTime: (...args) => gains.push(args) }, disconnect() {} };
    }
  }
  const previousWindow = globalThis.window;
  globalThis.window = { AudioContext };
  t.after(() => { stopFeedbackSound(); if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow; });
  t.mock.method(globalThis, "fetch", async (url) => {
    assert.equal(url, applauseUrl);
    return { ok: true, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) };
  });
  unlockFeedbackAudio();
  const pending = playFeedbackSound(true);
  stopFeedbackSound();
  // Fetch and decode are deliberately delayed until after the modal closes.
  await new Promise((resolve) => setImmediate(resolve));
  finishDecoding(recording);
  await pending;
  assert.deepEqual(starts, []);
  await playFeedbackSound(true);
  assert.deepEqual(starts, [[0, 0, 2]]);
  assert.deepEqual(gains, [[0, 14]]);
  stopFeedbackSound();
  assert.equal(stopped, 1);
});
