import test from "node:test";
import assert from "node:assert/strict";
import { getStore } from "@netlify/blobs";
import { createNetlifyApi } from "./netlify-api.js";
import { loadTeachers, defaultTeachers } from "./teachers.js";

const accounts = [{ name: "Test teacher", email: "teacher@example.com", password: "test-password-123" }];
const seed = { "Ona tili": [{ id: "ot", title: "Ot", questions: [
  { id: 1, text: "Otni toping", options: ["Kitob", "Yaxshi", "Uch", "Bormoq"], correctAnswer: 0 },
] }] };

// Rasmiy SDK haqiqiy HTTP formatidan foydalanadi; faqat Netlify ombori o‘rniga
// xotiradagi transport beriladi. Har API nusxasi bir xil tashqi omborni ko‘radi.
function blobService() {
  const entries = new Map();
  let version = 0;
  let conflicts = 0;
  const fetch = async (url, options) => {
    await Promise.resolve();
    assert.equal(new URL(url).origin, "https://strong-blobs.example");
    const key = new URL(url).pathname;
    const headers = new Headers(options.headers);
    const entry = entries.get(key);
    if (options.method.toUpperCase() === "GET") {
      return entry ? new Response(entry.body, { headers: { etag: entry.etag } }) : new Response(null, { status: 404 });
    }
    if (options.method.toUpperCase() === "DELETE") {
      entries.delete(key);
      return new Response(null, { status: 204 });
    }
    assert.equal(options.method.toUpperCase(), "PUT");
    if ((headers.get("if-none-match") === "*" && entry) ||
        (headers.has("if-match") && entry?.etag !== headers.get("if-match"))) {
      conflicts++;
      return new Response(null, { status: 412 });
    }
    const etag = `"v${++version}"`;
    entries.set(key, { body: options.body, etag });
    return new Response(null, { headers: { etag } });
  };
  return {
    getStore: () => getStore({ name: "bilimtest-test", consistency: "strong", siteID: "test-site", token: "test-token",
      edgeURL: "https://cached-blobs.example", uncachedEdgeURL: "https://strong-blobs.example", fetch }),
    get conflicts() { return conflicts; },
    entries,
  };
}

function client(api, cookie = "") {
  return (path, method = "GET", body, extraHeaders = {}) => api(new Request(`https://school.netlify.app${path}`, {
    method,
    headers: { ...(body === undefined ? {} : { "Content-Type": "application/json", Origin: "https://school.netlify.app" }),
      ...(cookie ? { Cookie: cookie } : {}), ...extraHeaders },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }), { ip: "192.0.2.10" });
}

async function login(api) {
  const response = await client(api)("/api/login", "POST", accounts[0]);
  assert.equal(response.status, 200);
  const cookie = response.headers.get("set-cookie");
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /Secure/);
  return cookie.split(";")[0];
}

test("Netlify CRUD, grading, sessions and logout survive cold starts and redeploys", async () => {
  const service = blobService();
  const makeApi = (initial = seed) => createNetlifyApi({ getStore: service.getStore, accounts, seed: initial });
  let api = makeApi();
  const initial = await (await client(api)("/api/tests")).json();
  assert.equal(initial["Ona tili"][0].questions[0].correctAnswer, undefined);
  const cookie = await login(api);
  // Login boshqa serverless instance ichida ham taniladi.
  api = makeApi();
  const request = client(api, cookie);
  assert.equal((await (await request("/api/session")).json()).user.email, accounts[0].email);
  assert.equal((await request("/api/topics", "POST", { subject: "Ona tili", title: "Yangi mavzu" })).status, 200);
  let data = await (await request("/api/tests")).json();
  const topicId = data["Ona tili"].at(-1).id;
  const question = { subject: "Ona tili", topicId, text: "Yangi savol?", options: ["A", "B", "C", "D"], correctAnswer: 1 };
  assert.equal((await request("/api/questions", "POST", question)).status, 200);
  data = await (await request("/api/tests")).json();
  const questionId = data["Ona tili"].at(-1).questions[0].id;
  assert.equal((await request("/api/topics", "PATCH", { subject: "Ona tili", topicId, title: "Yangi nom" })).status, 200);
  assert.equal((await request("/api/questions", "PATCH", { ...question, questionId, text: "Tahrirlangan savol?", correctAnswer: 2 })).status, 200);
  // Yangi deploydagi boshlang‘ich JSON eski ma’lumotlarni bosib ketmasin.
  api = makeApi({ "Ona tili": [] });
  const afterDeploy = client(api, cookie);
  data = await (await afterDeploy("/.netlify/functions/api/tests")).json();
  assert.equal(data["Ona tili"].at(-1).title, "Yangi nom");
  assert.equal(data["Ona tili"].at(-1).questions[0].text, "Tahrirlangan savol?");
  assert.deepEqual(await (await client(api)("/api/answer", "POST", { subject: "Ona tili", topicId, questionId, answer: 2 })).json(), { correct: true, correctAnswer: 2 });
  assert.deepEqual(await (await client(api)("/api/grade", "POST", { subject: "Ona tili", topicId, answers: [{ questionId, answer: 2 }] })).json(), { correct: 1, total: 1, percentage: 100 });
  assert.equal((await afterDeploy("/api/questions", "DELETE", { subject: "Ona tili", topicId, questionId })).status, 200);
  assert.equal((await afterDeploy("/api/topics", "DELETE", { subject: "Ona tili", topicId })).status, 200);
  assert.equal((await afterDeploy("/api/logout", "POST", {})).status, 200);
  assert.equal((await (await client(makeApi(), cookie)("/api/session")).json()).user, null);
  assert.equal((await client(makeApi(), cookie)("/api/topics", "DELETE", { subject: "Ona tili", topicId: "ot" })).status, 401);
  const saved = await (await client(makeApi())("/api/tests")).json();
  assert.equal(saved["Ona tili"].length, 1);
  assert.equal(saved["Ona tili"][0].questions.length, 1);
});

test("matching collections survive redeploys and concurrent teacher additions without changing quiz storage", async () => {
  const service = blobService();
  const makeApi = (matchingSeed) => createNetlifyApi({ getStore: service.getStore, accounts, seed, ...(matchingSeed ? { matchingSeed } : {}) });
  const first = makeApi();
  const initial = await (await client(first)("/api/matching")).json();
  assert.equal(initial[0].title, "Ona tili 1");
  const body = { subject: "Matematika", title: "Matematika 2", pairs: [{ question: "2 + 2", answer: "4" }, { question: "3 + 3", answer: "6" }] };
  assert.equal((await client(first)("/api/matching", "POST", body)).status, 401);
  const cookie = await login(first);
  assert.equal((await client(first, cookie)("/api/matching", "POST", body)).status, 200);
  const afterDeploy = makeApi([]);
  const groups = await (await client(afterDeploy)("/api/matching")).json();
  const group = groups.at(-1);
  assert.equal(group.title, body.title);
  assert.equal((await client(afterDeploy, cookie)("/api/matching", "PATCH", { ...group, title: "Hisoblash 2" })).status, 200);
  const responses = await Promise.all([0, 1, 2].map((i) => client(makeApi(), cookie)("/api/matching", "POST", { ...body, title: `Yangi to‘plam ${i}` })));
  assert.deepEqual(responses.map((response) => response.status), [200, 200, 200]);
  const final = await (await client(makeApi([]))("/api/matching")).json();
  assert.equal(final.length, initial.length + 4);
  assert.equal(final.find((item) => item.id === group.id).title, "Hisoblash 2");
  assert.equal(final.find((item) => item.id === group.id).pairs[0].id, group.pairs[0].id);
  assert.equal((await (await client(makeApi())("/api/tests")).json())["Ona tili"][0].questions[0].text, seed["Ona tili"][0].questions[0].text);
  assert.ok([...service.entries.keys()].some((key) => key.endsWith("data/matching.json")));
});

test("deleting the last matching collection remains empty across Netlify cold starts", async () => {
  const service = blobService();
  const collection = { id: "last", title: "Ona tili 1", subject: "Ona tili", pairs: [{ id: "a", question: "Kitob", answer: "Ot" }] };
  const makeApi = (matchingSeed) => createNetlifyApi({ getStore: service.getStore, accounts, seed, ...(matchingSeed ? { matchingSeed } : {}) });
  const api = makeApi([collection]);
  assert.deepEqual(await (await client(api)("/api/matching")).json(), [collection]);
  assert.equal((await client(api)("/api/matching", "DELETE", { id: "last" })).status, 401);
  const cookie = await login(api);
  const deleted = await client(makeApi(), cookie)("/api/matching", "DELETE", { id: "last" });
  assert.equal(deleted.status, 200);
  assert.deepEqual(await deleted.json(), []);
  assert.deepEqual(await (await client(makeApi())("/api/matching")).json(), []);
  assert.equal((await client(makeApi(), cookie)("/api/matching", "DELETE", { id: "last" })).status, 404);
  assert.equal((await (await client(makeApi())("/api/tests")).json())["Ona tili"].length, 1);
});

test("parallel Netlify instances retry ETag conflicts without losing added questions", async () => {
  const service = blobService();
  const makeApi = () => createNetlifyApi({ getStore: service.getStore, accounts, seed });
  const first = makeApi();
  const cookie = await login(first);
  const requests = [first, makeApi(), makeApi(), makeApi()].map((api, i) =>
    client(api, cookie)("/api/questions", "POST", { subject: "Ona tili", topicId: "ot", text: `Savol ${i}`, options: ["A", "B", "C", "D"], correctAnswer: 0 }));
  const responses = await Promise.all(requests);
  assert.deepEqual(responses.map((response) => response.status), [200, 200, 200, 200]);
  assert.ok(service.conflicts > 0);
  const data = await (await client(makeApi())("/api/tests")).json();
  assert.equal(data["Ona tili"][0].questions.length, 5);
  assert.equal(new Set(data["Ona tili"][0].questions.map((q) => q.id)).size, 5);
});

test("production API rejects other origins, missing teacher configuration and oversized bodies", async () => {
  const service = blobService();
  const api = createNetlifyApi({ getStore: service.getStore, accounts, seed });
  for (const origin of ["https://unrelated.example", "http://school.netlify.app", "null"]) {
    assert.equal((await client(api)("/api/login", "POST", accounts[0], { Origin: origin })).status, 403);
  }
  assert.equal((await client(api)("/api/login", "POST", { ...accounts[0], padding: "x".repeat(66000) })).status, 413);
  const unconfigured = createNetlifyApi({ getStore: service.getStore, accounts: [], seed });
  assert.equal((await client(unconfigured)("/api/tests")).status, 200);
  assert.equal((await client(unconfigured)("/api/login", "POST", accounts[0])).status, 503);
});

test("login rate limit and session revocation work across independent instances", async () => {
  const service = blobService();
  const makeApi = (users = accounts) => createNetlifyApi({ getStore: service.getStore, accounts: users, seed });
  const cookie = await login(makeApi());
  const changed = [{ ...accounts[0], password: "a-new-password" }];
  assert.equal((await (await client(makeApi(changed), cookie)("/api/session")).json()).user, null);
  for (let i = 0; i < 10; i++) {
    assert.equal((await client(makeApi())("/api/login", "POST", { ...accounts[0], password: "wrong" })).status, 401);
  }
  assert.equal((await client(makeApi())("/api/login", "POST", accounts[0])).status, 429);
});

test("configured teacher accounts work without environment variables; environment overrides remain available", () => {
  assert.deepEqual(loadTeachers({ env: {} }), defaultTeachers);
  assert.ok(defaultTeachers.length > 0);
  assert.throws(() => loadTeachers({ env: { TEACHER_EMAIL: "teacher@example.com" } }));
  assert.deepEqual(loadTeachers({ env: { TEACHER_EMAIL: " teacher@example.com ", TEACHER_PASSWORD: "secret", TEACHER_NAME: "Ustoz" } }),
    [{ name: "Ustoz", email: "teacher@example.com", password: "secret" }]);
});
