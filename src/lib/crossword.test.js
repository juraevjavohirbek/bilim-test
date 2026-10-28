import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { assessCrossword, buildCrossword, generateCrossword, normalizeCrosswordText } from "./crossword.js";

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

test("generator places every answer in one connected grid with no extra adjacent words", () => {
  const questions = ["OLMA", "KITOB", "QALAM", "OLIM", "RASM"].map((answer) => ({ clue: answer, answer }));
  const puzzle = generateCrossword(questions); const model = buildCrossword(puzzle);
  assert.equal(model.entries.length, questions.length);
  assert.deepEqual(puzzle.entries.map((entry) => entry.answer), questions.map((question) => question.answer));
  assert.deepEqual(generateCrossword(questions), puzzle);
  for (const entry of model.entries) assert.ok(entry.keys.some((key) => model.cells.get(key).entries.length > 1));
  // Every run of touching cells must correspond to exactly one intended word.
  for (const direction of ["across", "down"]) for (const cell of model.cells.values()) {
    const dr = direction === "down" ? 1 : 0; const dc = 1 - dr;
    if (model.cells.has(`${cell.row - dr}:${cell.column - dc}`)) continue;
    const keys = []; let r = cell.row; let c = cell.column;
    while (model.cells.has(`${r}:${c}`)) { keys.push(`${r}:${c}`); r += dr; c += dc; }
    if (keys.length > 1) assert.ok(model.entries.some((entry) => entry.direction === direction && JSON.stringify(entry.keys) === JSON.stringify(keys)));
  }
});
test("generator rejects disconnected, duplicate, invalid and excessive input without dropping answers", () => {
  assert.throws(() => generateCrossword([{ clue: "First", answer: "AAA" }, { clue: "Second", answer: "BBB" }]), /joylashtirib/);
  assert.throws(() => generateCrossword([{ clue: "First", answer: "olma" }, { clue: "Second", answer: "OLMA" }]), /takrorlanmasligi/);
  for (const answer of ["", "X", "123", "🍎", "A".repeat(25)]) assert.throws(() => generateCrossword([{ clue: "Meva", answer }]));
  assert.throws(() => generateCrossword([]));
  assert.equal(buildCrossword(generateCrossword([{ clue: "Bitta so‘z", answer: "O‘quvchi" }])).entries[0].answer, "OQUVCHI");
});
