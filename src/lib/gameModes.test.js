import test from "node:test";
import assert from "node:assert/strict";
import { normalizeMode, modeQuery, remainingQuestions, pickUnusedQuestion, wheelRotation, teamScores } from "./gameModes.js";
import { stepLotto } from "./lottoPhysics.js";

test("invalid or missing game mode safely uses the normal quiz", () => {
  assert.equal(normalizeMode("wheel"), "wheel");
  assert.equal(normalizeMode("tug"), "tug");
  assert.equal(normalizeMode("unknown"), "normal");
  assert.equal(normalizeMode(null), "normal");
  assert.equal(modeQuery("normal"), "");
  assert.equal(modeQuery("unknown"), "");
  assert.equal(modeQuery("lotto"), "?mode=lotto");
});

test("random draw never repeats answered questions, including wrong answers", () => {
  const questions = [{ id: 1 }, { id: "uuid" }, { id: 3 }];
  const answers = { 1: { feedback: { correct: false } } };
  assert.equal(pickUnusedQuestion(questions, answers, () => 0), 1);
  assert.equal(pickUnusedQuestion(questions, answers, () => .999), 2);
  answers.uuid = {}; answers[3] = {};
  assert.equal(pickUnusedQuestion(questions, answers), null);
  assert.equal(pickUnusedQuestion([], {}), null);
});

test("wheel lands on the chosen numbered sector for one, two and many questions", () => {
  let rotation = 0;
  for (const count of [1, 2, 3, 10, 50]) {
    for (let index = 0; index < count; index++) {
      const next = wheelRotation(rotation, index, count);
      assert.ok(next - rotation >= 1800);
      const pointerAngle = (360 - next % 360) % 360;
      assert.equal(Math.floor(pointerAngle / (360 / count)), index);
      rotation = next;
    }
  }
});

test("rope score only counts correct answers for the answering team", () => {
  assert.deepEqual(teamScores({
    a: { team: 0, feedback: { correct: true } },
    b: { team: 1, feedback: { correct: false } },
    c: { team: 1, feedback: { correct: true } },
    d: { team: 0, feedback: { correct: true } },
    e: { team: null, feedback: { correct: true } },
  }), [2, 1]);
});

test("remaining wheel and lotto numbers retain original numbering after correct and wrong answers", () => {
  const questions = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];
  const answers = { a: { feedback: { correct: true } }, c: { feedback: { correct: false } } };
  const remaining = remainingQuestions(questions, answers);
  assert.deepEqual(remaining.map(({ index }) => index + 1), [2, 4]);
  for (const original of [1, 3]) {
    const position = remaining.findIndex(({ index }) => index === original);
    const rotation = wheelRotation(0, position, remaining.length);
    const pointer = Math.floor(((360 - rotation % 360) % 360) / (360 / remaining.length));
    assert.equal(remaining[pointer].index, original);
  }
});

test("lotto balls stay within the circular drum during mixing and settling", () => {
  const balls = Array.from({ length: 12 }, (_, i) => ({
    seed: i * 2.4, x: Math.cos(i) * 0.6, y: Math.sin(i) * 0.6, vx: 2 - i / 3, vy: -2,
  }));
  for (let i = 0; i < 1200; i++) {
    stepLotto(balls, 0.12, 1 / 120, i < 600, i / 120);
    for (const ball of balls) {
      assert.ok(Number.isFinite(ball.x) && Number.isFinite(ball.vx));
      assert.ok(Math.hypot(ball.x, ball.y) <= 0.88 + 1e-8);
    }
  }
  assert.ok(balls.reduce((sum, ball) => sum + ball.y, 0) / balls.length > 0.3);
});

test("colliding lotto balls bounce apart instead of passing through each other", () => {
  const balls = [
    { x: -0.12, y: 0, vx: 1, vy: 0, seed: 0 },
    { x: 0.12, y: 0, vx: -1, vy: 0, seed: 1 },
  ];
  stepLotto(balls, 0.15, 1 / 120, false, 0);
  assert.ok(balls[0].vx < 0 && balls[1].vx > 0);
  assert.ok(Math.hypot(balls[1].x - balls[0].x, balls[1].y - balls[0].y) >= 0.3 - 1e-8);
});
