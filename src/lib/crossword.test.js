import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { assessCrossword, buildCrossword, normalizeCrosswordText } from "./crossword.js";

const puzzles = JSON.parse(await readFile(new URL("../data/crosswords.json", import.meta.url), "utf8"));
test("published crossword has consistent crossings and numbered clues", () => {
  const model = buildCrossword(puzzles[0]);
  assert.equal(model.entries.length, 6);
  assert.deepEqual(model.entries.map((entry) => entry.number), [1, 2, 3, 4, 5, 6]);
  assert.equal(model.cells.get("0:2").solution, "M");
  assert.equal(model.cells.get("0:2").entries.length, 2);
  for (const entry of model.entries) assert.ok(entry.keys.some((key) => model.cells.get(key).entries.length > 1));
});
test("conflicting crossings and words outside the board are rejected", () => {
  const conflicting = structuredClone(puzzles[0]);
  conflicting.entries[1].answer = "XAKTABLAR";
  assert.throws(() => buildCrossword(conflicting), /mos kelmadi/);
  const outside = structuredClone(puzzles[0]);
  outside.entries[0].column = 6;
  assert.throws(() => buildCrossword(outside), /chegarasidan/);
});
test("assessment distinguishes empty, wrong and solved shared cells", () => {
  const model = buildCrossword(puzzles[0]);
  assert.equal(assessCrossword(model, {}).complete, false);
  const values = Object.fromEntries([...model.cells.values()].map((cell) => [cell.key, cell.solution]));
  assert.equal(assessCrossword(model, values).complete, true);
  assert.equal(assessCrossword(model, values).correctWords, 6);
  values["0:2"] = "X";
  const result = assessCrossword(model, values);
  assert.deepEqual(result.errors, ["0:2"]);
  assert.equal(result.correctWords, 4);
  assert.equal(result.complete, false);
});
test("typed and pasted letters normalize to uppercase", () => {
  assert.equal(normalizeCrosswordText("olma 123!"), "OLMA");
  assert.equal(normalizeCrosswordText("o‘quvchi"), "OQUVCHI");
});
