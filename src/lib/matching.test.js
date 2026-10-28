import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { connectMatch, shuffleAnswers, shuffleMatchingColumns } from "./matching.js";
import { subjectThemes } from "./subjectThemes.js";

const activities = JSON.parse(readFileSync(new URL("../data/matching.json", import.meta.url), "utf8"));

test("both columns are shuffled independently while pair IDs remain linked", () => {
  const pairs = activities.Matematika.pairs;
  const { questions, answers } = shuffleMatchingColumns(pairs, () => 0);
  assert.notDeepEqual(questions, pairs);
  assert.notDeepEqual(questions, answers);
  assert.deepEqual(questions.map((pair) => pair.id).sort(), answers.map((pair) => pair.id).sort());
  for (const question of questions) assert.equal(answers.find((answer) => answer.id === question.id).answer, question.answer);
  assert.deepEqual(shuffleMatchingColumns([pairs[0]]), { questions: [pairs[0]], answers: [pairs[0]] });
  const two = pairs.slice(0, 2);
  assert.notDeepEqual(shuffleMatchingColumns(two, () => 0).questions, shuffleMatchingColumns(two, () => 0.999).questions);
});

test("every subject has one complete matching activity with unique questions, answers and IDs", () => {
  assert.deepEqual(Object.keys(activities).sort(), Object.keys(subjectThemes).sort());
  for (const activity of Object.values(activities)) {
    assert.ok(activity.title.trim());
    assert.equal(activity.pairs.length, 5);
    for (const field of ["id", "question", "answer"]) {
      assert.ok(activity.pairs.every((pair) => typeof pair[field] === "string" && pair[field].trim()));
      assert.equal(new Set(activity.pairs.map((pair) => pair[field])).size, activity.pairs.length);
    }
  }
});

test("correct matches are recorded once, while wrong and unknown pairs do not connect", () => {
  const pairs = activities["Ona tili"].pairs;
  const empty = [];
  assert.equal(connectMatch(pairs, empty, "ot", "sifat"), empty);
  assert.equal(connectMatch(pairs, empty, "unknown", "unknown"), empty);
  const first = connectMatch(pairs, empty, "ot", "ot");
  assert.deepEqual(first, ["ot"]);
  assert.equal(connectMatch(pairs, first, "ot", "ot"), first);
  assert.equal(connectMatch(pairs, first, "sifat", "ot"), first);
  const all = pairs.reduce((matched, pair) => connectMatch(pairs, matched, pair.id, pair.id), []);
  assert.equal(all.length, pairs.length);
  assert.deepEqual(empty, []);
});

test("answer shuffle preserves every pair and never starts in the original order", () => {
  const pairs = activities.Matematika.pairs;
  for (const random of [() => 0, () => 0.999999, () => 0.5]) {
    const result = shuffleAnswers(pairs, random);
    assert.deepEqual(result.map((pair) => pair.id).sort(), pairs.map((pair) => pair.id).sort());
    assert.notDeepEqual(result, pairs);
    assert.equal(pairs[0].id, "add");
  }
});
