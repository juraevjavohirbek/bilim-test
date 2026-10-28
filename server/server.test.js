import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, unlink, rmdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApiServer } from "./index.js";

const accounts = [{ name: "Test teacher", email: "teacher@example.com", password: "test-password-123" }];
const fixture = {
  "Ona tili": [
    { id: "ot", title: "Ot", questions: [
      { id: 1, text: "Otni toping", options: ["Kitob", "Yaxshi", "Uch", "Bormoq"], correctAnswer: 0 },
      { id: 2, text: "Sifatni toping", options: ["Kitob", "Yaxshi", "Uch", "Bormoq"], correctAnswer: 1 },
    ] },
    { id: "sifat", title: "Sifat", questions: [] },
  ],
};

async function setup(t) {
  const directory = await mkdtemp(join(tmpdir(), "bilimtest-api-test-"));
  const dataFile = join(directory, "tests.json");
  const matchingFile = join(directory, "matching.json");
  await writeFile(dataFile, JSON.stringify(fixture));
  const server = createApiServer({ dataFile, accounts });
  await new Promise((ready) => server.listen(0, "127.0.0.1", ready));
  const base = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => {
    await new Promise((ready) => server.close(ready));
    await unlink(dataFile);
    await unlink(matchingFile).catch((error) => { if (error.code !== "ENOENT") throw error; });
    await rmdir(directory);
  });
  let cookie = "";
  async function request(path, method = "GET", body, authenticated = false) {
    return fetch(`${base}/api${path}`, {
      method,
      headers: { ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...(authenticated ? { Cookie: cookie } : {}) },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  }
  async function login() {
    const response = await request("/login", "POST", { email: accounts[0].email, password: accounts[0].password });
    assert.equal(response.status, 200);
    cookie = response.headers.get("set-cookie").split(";")[0];
    assert.match(response.headers.get("set-cookie"), /HttpOnly/);
  }
  return { request, login, dataFile, matchingFile, base };
}

test("matching groups can only be created and edited by teachers and persist separately from tests", async (t) => {
  const { request, login, dataFile, matchingFile } = await setup(t);
  const initial = await Promise.all([request("/matching"), request("/matching")]);
  const [first, second] = await Promise.all(initial.map((response) => response.json()));
  assert.equal(first[0].title, "Ona tili 1");
  assert.deepEqual(first, second);
  const body = { title: "Ona tili 2", subject: "Ona tili", pairs: [{ question: "Kitob", answer: "Ot" }, { question: "Besh", answer: "Son" }] };
  assert.equal((await request("/matching", "POST", body)).status, 401);
  assert.equal((await request("/matching", "PATCH", { ...body, id: first[0].id })).status, 401);
  assert.equal((await request("/matching", "DELETE", { id: first[0].id })).status, 401);
  await login();
  const created = await request("/matching", "POST", body, true);
  assert.equal(created.status, 200);
  const group = (await created.json()).at(-1);
  assert.ok(group.id);
  assert.equal(new Set(group.pairs.map((pair) => pair.id)).size, 2);
  assert.equal((await request("/matching", "POST", body, true)).status, 409);
  const updated = { ...group, title: "Tahrirlangan to‘plam", pairs: [...group.pairs, { question: "Chiroyli", answer: "Sifat" }] };
  assert.equal((await request("/matching", "PATCH", updated, true)).status, 200);
  const saved = JSON.parse(await readFile(matchingFile, "utf8"));
  assert.equal(saved.at(-1).pairs.length, 3);
  assert.equal(saved.at(-1).pairs[0].id, group.pairs[0].id);
  assert.equal((await (await request("/matching")).json()).at(-1).title, updated.title);
  const before = await readFile(matchingFile, "utf8");
  for (const changes of [
    { pairs: [] }, { subject: "Missing" }, { title: " " },
    { pairs: [{ question: "A", answer: " " }] },
    { pairs: [{ id: "same", question: "A", answer: "B" }, { id: "same", question: "C", answer: "D" }] },
    { pairs: [{ question: "A", answer: "B" }, { question: "a", answer: "C" }] },
    { pairs: [{ question: "A", answer: "B" }, { question: "C", answer: "b" }] },
    { pairs: Array.from({ length: 31 }, (_, i) => ({ question: `Q${i}`, answer: `A${i}` })) },
  ]) assert.equal((await request("/matching", "POST", { ...body, ...changes }, true)).status, 400);
  assert.equal((await request("/matching", "PATCH", { ...body, id: "missing" }, true)).status, 404);
  assert.equal(await readFile(matchingFile, "utf8"), before);
  assert.deepEqual(JSON.parse(await readFile(dataFile, "utf8")), fixture);
  const removed = await request("/matching", "DELETE", { id: group.id }, true);
  assert.equal(removed.status, 200);
  assert.equal((await removed.json()).some((item) => item.id === group.id), false);
  assert.equal(JSON.parse(await readFile(matchingFile, "utf8")).some((item) => item.id === group.id), false);
  assert.equal((await request("/matching", "DELETE", { id: group.id }, true)).status, 404);
});

test("anonymous users cannot edit or delete JSON, and do not receive answer keys", async (t) => {
  const { request, dataFile } = await setup(t);
  const data = await (await request("/tests")).json();
  assert.equal(Object.hasOwn(data["Ona tili"][0].questions[0], "correctAnswer"), false);
  for (const endpoint of ["/topics", "/questions"]) {
    for (const method of ["POST", "PATCH", "DELETE"]) {
      assert.equal((await request(endpoint, method, { subject: "Ona tili", topicId: "ot", questionId: 1 })).status, 401);
    }
  }
  assert.deepEqual(JSON.parse(await readFile(dataFile, "utf8")), fixture);
});

test("only configured credentials work; logout revokes the existing cookie", async (t) => {
  const { request, login } = await setup(t);
  assert.equal((await request("/login", "POST", { email: accounts[0].email, password: "wrong" })).status, 401);
  assert.equal((await request("/login", "POST", { email: "stranger@example.com", password: accounts[0].password })).status, 401);
  await login();
  assert.equal((await (await request("/session", "GET", undefined, true)).json()).user.email, accounts[0].email);
  assert.equal((await (await request("/tests", "GET", undefined, true)).json())["Ona tili"][0].questions[0].correctAnswer, 0);
  assert.equal((await request("/logout", "POST", {}, true)).status, 200);
  assert.equal((await (await request("/session", "GET", undefined, true)).json()).user, null);
  assert.equal((await request("/topics", "PATCH", { subject: "Ona tili", topicId: "ot", title: "New" }, true)).status, 401);
});

test("topic renaming persists to disk and keeps the stable topic route id", async (t) => {
  const { request, login, dataFile } = await setup(t);
  await login();
  const response = await request("/topics", "PATCH", { subject: "Ona tili", topicId: "ot", title: "Ot va uning turlari" }, true);
  assert.equal(response.status, 200);
  const saved = JSON.parse(await readFile(dataFile, "utf8"));
  assert.equal(saved["Ona tili"][0].title, "Ot va uning turlari");
  assert.equal(saved["Ona tili"][0].id, "ot");
  assert.equal((await (await request("/tests")).json())["Ona tili"][0].title, "Ot va uning turlari");
});

test("question edits persist text, all options, and correct answer; invalid updates leave disk unchanged", async (t) => {
  const { request, login, dataFile } = await setup(t);
  await login();
  const update = { subject: "Ona tili", topicId: "ot", questionId: 1, text: "Yangilangan savol", options: ["A javob", "B javob", "C javob", "D javob"], correctAnswer: 2 };
  assert.equal((await request("/questions", "PATCH", update, true)).status, 200);
  const saved = JSON.parse(await readFile(dataFile, "utf8"));
  assert.deepEqual(saved["Ona tili"][0].questions[0], { id: 1, text: update.text, options: update.options, correctAnswer: 2 });
  for (const changes of [{ text: " " }, { options: ["A", "A", "C", "D"] }, { correctAnswer: 4 }, { options: ["A"] }]) {
    assert.equal((await request("/questions", "PATCH", { ...update, ...changes }, true)).status, 400);
  }
  assert.deepEqual(JSON.parse(await readFile(dataFile, "utf8")), saved);
});

test("question deletion and topic deletion really remove their JSON records", async (t) => {
  const { request, login, dataFile } = await setup(t);
  await login();
  assert.equal((await request("/questions", "DELETE", { subject: "Ona tili", topicId: "ot", questionId: 1 }, true)).status, 200);
  assert.deepEqual(JSON.parse(await readFile(dataFile, "utf8"))["Ona tili"][0].questions.map((q) => q.id), [2]);
  assert.equal((await request("/questions", "DELETE", { subject: "Ona tili", topicId: "ot", questionId: 2 }, true)).status, 200);
  assert.equal(JSON.parse(await readFile(dataFile, "utf8"))["Ona tili"][0].questions.length, 0);
  assert.equal((await request("/topics", "DELETE", { subject: "Ona tili", topicId: "ot" }, true)).status, 200);
  assert.deepEqual(JSON.parse(await readFile(dataFile, "utf8"))["Ona tili"].map((topic) => topic.id), ["sifat"]);
});

test("server grades answers and rejects duplicate, missing or stale question IDs", async (t) => {
  const { request } = await setup(t);
  const body = { subject: "Ona tili", topicId: "ot", answers: [{ questionId: 1, answer: 0 }, { questionId: 2, answer: 2 }] };
  assert.deepEqual(await (await request("/grade", "POST", body)).json(), { correct: 1, total: 2, percentage: 50 });
  assert.equal((await request("/grade", "POST", { ...body, answers: [body.answers[0]] })).status, 409);
  assert.equal((await request("/grade", "POST", { ...body, answers: [body.answers[0], body.answers[0]] })).status, 400);
  assert.equal((await request("/grade", "POST", { ...body, topicId: "missing" })).status, 404);
});

test("concurrent JSON updates preserve both changes; prototype-like subjects are rejected", async (t) => {
  const { request, login, dataFile } = await setup(t);
  await login();
  const responses = await Promise.all([
    request("/topics", "PATCH", { subject: "Ona tili", topicId: "ot", title: "Yangi ot" }, true),
    request("/topics", "PATCH", { subject: "Ona tili", topicId: "sifat", title: "Yangi sifat" }, true),
  ]);
  assert.ok(responses.every((response) => response.status === 200));
  assert.deepEqual(JSON.parse(await readFile(dataFile, "utf8"))["Ona tili"].map((topic) => topic.title), ["Yangi ot", "Yangi sifat"]);
  assert.equal((await request("/topics", "DELETE", { subject: "__proto__", topicId: "ot" }, true)).status, 404);
});

test("cross-site mutation requests are denied before credentials are processed", async (t) => {
  const { base } = await setup(t);
  const response = await fetch(`${base}/api/login`, {
    method: "POST", headers: { Origin: "https://unrelated.example", "Content-Type": "application/json" },
    body: JSON.stringify({ email: accounts[0].email, password: accounts[0].password }),
  });
  assert.equal(response.status, 403);
});

test("teachers can create topics and questions, with unique IDs and persistent JSON", async (t) => {
  const { request, login, dataFile } = await setup(t);
  await login();
  assert.equal((await request("/topics", "POST", { subject: "Ona tili", title: "Yangi mavzu" }, true)).status, 200);
  let saved = JSON.parse(await readFile(dataFile, "utf8"));
  const added = saved["Ona tili"].at(-1);
  assert.equal(added.title, "Yangi mavzu");
  assert.ok(added.id);
  assert.deepEqual(added.questions, []);
  const question = { subject: "Ona tili", topicId: added.id, text: "Yangi savol", options: ["Birinchi", "Ikkinchi", "Uchinchi", "To‘rtinchi"], correctAnswer: 2 };
  assert.equal((await request("/questions", "POST", question, true)).status, 200);
  assert.equal((await request("/questions", "POST", question, true)).status, 200);
  saved = JSON.parse(await readFile(dataFile, "utf8"));
  const items = saved["Ona tili"].at(-1).questions;
  assert.equal(items.length, 2);
  assert.notEqual(items[0].id, items[1].id);
  assert.equal(items[0].correctAnswer, 2);
  const student = await (await request("/tests")).json();
  assert.equal(student["Ona tili"].at(-1).questions[0].correctAnswer, undefined);
});

test("invalid additions do not modify JSON and topic names cannot be duplicated", async (t) => {
  const { request, login, dataFile } = await setup(t);
  await login();
  assert.equal((await request("/topics", "POST", { subject: "Ona tili", title: " ot " }, true)).status, 409);
  assert.equal((await request("/topics", "POST", { subject: "Ona tili", title: " " }, true)).status, 400);
  assert.equal((await request("/topics", "POST", { subject: "__proto__", title: "New" }, true)).status, 404);
  const question = { subject: "Ona tili", topicId: "ot", text: "Savol", options: ["A", "B", "C", "D"], correctAnswer: 4 };
  assert.equal((await request("/questions", "POST", question, true)).status, 400);
  assert.equal((await request("/questions", "POST", { ...question, correctAnswer: 0, options: ["A", "A", "C", "D"] }, true)).status, 400);
  assert.equal((await request("/questions", "POST", { ...question, correctAnswer: 0, topicId: "missing" }, true)).status, 404);
  assert.deepEqual(JSON.parse(await readFile(dataFile, "utf8")), fixture);
});

test("two and three options persist, can be edited and graded, and reject missing or excess answer keys", async (t) => {
  const { request, login, dataFile } = await setup(t);
  await login();
  const body = { subject: "Ona tili", topicId: "ot", text: "Ikki variantli savol", options: ["Ha", "Yo‘q"], correctAnswer: 1 };
  assert.equal((await request("/questions", "POST", body, true)).status, 200);
  const saved = JSON.parse(await readFile(dataFile, "utf8"))["Ona tili"][0].questions.at(-1);
  assert.deepEqual(saved.options, body.options);
  const identify = { subject: body.subject, topicId: body.topicId, questionId: saved.id };
  assert.deepEqual(await (await request("/answer", "POST", { ...identify, answer: 1 })).json(), { correct: true, correctAnswer: 1 });
  assert.equal((await request("/answer", "POST", { ...identify, answer: 2 })).status, 400);
  assert.equal((await request("/questions", "PATCH", { ...body, ...identify, options: ["Ha", "Yo‘q", "Balki"], correctAnswer: 2 }, true)).status, 200);
  assert.equal((await request("/questions", "PATCH", { ...body, ...identify, correctAnswer: 0 }, true)).status, 200);
  for (const changes of [{ options: ["Ha"] }, { options: ["A", "B", "C", "D", "E"] }, { correctAnswer: 2 }, { options: ["Ha", "ha"] }, { options: ["Ha", " "] }]) {
    assert.equal((await request("/questions", "POST", { ...body, ...changes }, true)).status, 400);
  }
});

test("answer checking returns correct/wrong feedback without changing JSON", async (t) => {
  const { request, dataFile } = await setup(t);
  const body = { subject: "Ona tili", topicId: "ot", questionId: 1, answer: 0 };
  assert.deepEqual(await (await request("/answer", "POST", body)).json(), { correct: true, correctAnswer: 0 });
  assert.deepEqual(await (await request("/answer", "POST", { ...body, answer: 2 })).json(), { correct: false, correctAnswer: 0 });
  for (const answer of [-1, 4, "0", null]) {
    assert.equal((await request("/answer", "POST", { ...body, answer })).status, 400);
  }
  assert.equal((await request("/answer", "POST", { ...body, questionId: 999 })).status, 404);
  assert.deepEqual(JSON.parse(await readFile(dataFile, "utf8")), fixture);
});
