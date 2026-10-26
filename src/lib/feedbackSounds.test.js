import test from "node:test";
import assert from "node:assert/strict";
import { feedbackSamples } from "./feedbackSounds.js";

function energy(samples, from, to, rate) {
  const slice = samples.subarray(Math.floor(from * rate), Math.floor(to * rate));
  return slice.reduce((sum, value) => sum + value * value, 0) / Math.max(1, slice.length);
}

test("applause is audible stereo audio with finite samples and a fading tail", () => {
  const rate = 24000;
  const [left, right] = feedbackSamples(true, rate);
  assert.equal(left.length, Math.ceil(rate * 2.25));
  assert.equal(right.length, left.length);
  assert.ok(left.some((value, index) => value !== right[index]));
  for (const channel of [left, right]) {
    assert.ok(channel.every((value) => Number.isFinite(value) && Math.abs(value) <= 1));
    assert.ok(energy(channel, 0, 1, rate) > 0.001);
    assert.ok(energy(channel, 2, 2.25, rate) < energy(channel, 0, 1, rate));
  }
});

test("wrong-answer buzzer has two audible bursts separated by silence", () => {
  const rate = 24000;
  const [left, right] = feedbackSamples(false, rate);
  assert.deepEqual(left, right);
  assert.ok(energy(left, 0.06, 0.25, rate) > 0.005);
  assert.equal(energy(left, 0.29, 0.4, rate), 0);
  assert.ok(energy(left, 0.44, 0.63, rate) > 0.005);
  assert.equal(energy(left, 0.7, 0.8, rate), 0);
});
