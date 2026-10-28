import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { createMemoryState } from "./storage.js";
import { subjectThemes } from "../src/lib/subjectThemes.js";

const sessionLifetime = 8 * 60 * 60 * 1000;

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function requireText(value, label, max = 500) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max) {
    throw new ApiError(400, `${label}ni to‘g‘ri kiriting (1–${max} belgi).`);
  }
  return value.trim();
}

async function readBody(request) {
  if (!request.headers["content-type"]?.startsWith("application/json")) {
    throw new ApiError(415, "JSON ma’lumot yuboring.");
  }
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (Buffer.byteLength(body) > 64 * 1024) throw new ApiError(413, "Ma’lumot juda katta.");
  }
  try {
    const value = JSON.parse(body || "{}");
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
    return value;
  } catch {
    throw new ApiError(400, "JSON noto‘g‘ri yozilgan.");
  }
}

function getTopic(data, subject, topicId) {
  if (typeof subject !== "string" || !Object.hasOwn(data, subject)) {
    throw new ApiError(404, "Fan topilmadi.");
  }
  const topic = data[subject].find((item) => item.id === topicId);
  if (!topic) throw new ApiError(404, "Mavzu topilmadi.");
  return topic;
}

function questionFields(body) {
  const text = requireText(body.text, "Savol", 2000);
  if (!Array.isArray(body.options) || body.options.length < 2 || body.options.length > 4) throw new ApiError(400, "2 tadan 4 tagacha javob variantini yozing.");
  const options = body.options.map((option) => requireText(option, "Variant", 500));
  if (new Set(options.map((option) => option.toLowerCase())).size !== options.length) throw new ApiError(400, "Javob variantlari bir-biridan farq qilishi kerak.");
  if (!Number.isInteger(body.correctAnswer) || body.correctAnswer < 0 || body.correctAnswer >= options.length) throw new ApiError(400, "To‘g‘ri javobni tanlang.");
  return { text, options, correctAnswer: body.correctAnswer };
}

// O‘quvchilarga to‘g‘ri javoblar yuborilmaydi; natija serverda tekshiriladi.
function studentData(data) {
  return Object.fromEntries(Object.entries(data).map(([title, topics]) => [
    title,
    topics.map((topic) => ({
      ...topic,
      questions: topic.questions.map(({ correctAnswer: _answer, ...question }) => question),
    })),
  ]));
}

function matchingFields(body) {
  const title = requireText(body.title, "To‘plam nomi", 150);
  if (typeof body.subject !== "string" || !Object.hasOwn(subjectThemes, body.subject)) throw new ApiError(400, "To‘plam uchun fanni tanlang.");
  if (!Array.isArray(body.pairs) || body.pairs.length < 1 || body.pairs.length > 30) throw new ApiError(400, "1 tadan 30 tagacha savol-javob juftligini kiriting.");
  const pairs = body.pairs.map((pair) => {
    if (!pair || typeof pair !== "object") throw new ApiError(400, "Savol va javobni kiriting.");
    return {
      id: typeof pair.id === "string" && /^[a-zA-Z0-9_-]{1,80}$/.test(pair.id) ? pair.id : randomUUID(),
      question: requireText(pair.question, "Savol", 500),
      answer: requireText(pair.answer, "Javob", 500),
    };
  });
  for (const field of ["id", "question", "answer"]) {
    if (new Set(pairs.map((pair) => pair[field].toLowerCase())).size !== pairs.length) throw new ApiError(400, "Savollar va javoblar takrorlanmasligi kerak.");
  }
  return { title, subject: body.subject, pairs };
}

export function createApiHandler({ accounts = [], storage, matchingStorage,
  state = createMemoryState(), secureCookies = false } = {}) {
  const salt = randomBytes(32);
  const users = accounts.map(({ password, ...user }) => ({
    ...user,
    email: user.email.trim().toLowerCase(),
    hash: scryptSync(password, salt, 64),
    fingerprint: createHash("sha256").update(`${user.email.toLowerCase()}\0${password}`).digest("hex"),
  }));
  const dummyHash = scryptSync(randomBytes(32), salt, 64);
  const load = () => storage.load();
  const update = (change) => storage.update(change);
  const cookieFlags = `HttpOnly; SameSite=Strict; Path=/${secureCookies ? "; Secure" : ""}`;

  async function session(request) {
    const token = request.headers.cookie?.split(";").map((part) => part.trim())
      .find((part) => part.startsWith("bilimtest_session="))?.slice("bilimtest_session=".length);
    if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
    const key = `sessions/${createHash("sha256").update(token).digest("hex")}`;
    const current = await state.get(key);
    if (current && current.expires > Date.now() && users.some((user) => user.email === current.user.email && user.fingerprint === current.fingerprint)) return { ...current, key };
    if (current) await state.delete(key);
    return null;
  }

  return async (request, response) => {
    function send(status, value) {
      response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
      response.end(JSON.stringify(value));
    }

    try {
      const path = new URL(request.url, "http://localhost").pathname;
      const method = request.method;
      const current = await session(request);

      if (method === "GET" && path === "/api/session") return send(200, { user: current?.user ?? null });
      if (method === "GET" && path === "/api/tests") {
        const data = await load();
        return send(200, current ? data : studentData(data));
      }
      if (method === "GET" && path === "/api/matching") return send(200, await matchingStorage.load());

      // SameSite cookie va Origin tekshiruvi boshqa saytdan yozishni to‘sadi.
      if (request.headers.origin) {
        const expected = request.trustedOrigin ?? `http://${request.headers.host}`;
        if (request.headers.origin !== expected) {
          throw new ApiError(403, "Bu manzildan o‘zgartirish mumkin emas.");
        }
      }

      if (method === "POST" && path === "/api/login") {
        if (!users.length) throw new ApiError(503, "O‘qituvchi kirishi sozlanmagan. TEACHER_EMAIL va TEACHER_PASSWORD ni hosting sozlamalariga kiriting.");
        const key = `attempts/${createHash("sha256").update(request.socket.remoteAddress || "unknown").digest("hex")}`;
        await state.update(key, (previous) => {
          const attempt = previous?.until > Date.now() ? previous : { count: 0, until: Date.now() + 15 * 60 * 1000 };
          if (attempt.count >= 10) throw new ApiError(429, "Ko‘p urinish bo‘ldi. 15 daqiqadan keyin urinib ko‘ring.");
          return { ...attempt, count: attempt.count + 1 };
        });
        const body = await readBody(request);
        const email = requireText(body.email, "Email", 254).toLowerCase();
        if (typeof body.password !== "string" || body.password.length > 256) throw new ApiError(400, "Parolni kiriting.");
        const account = users.find((user) => user.email === email);
        const passwordHash = scryptSync(body.password, salt, 64);
        const validPassword = timingSafeEqual(passwordHash, account?.hash ?? dummyHash);
        if (!account || !validPassword) {
          throw new ApiError(401, "Email yoki parol noto‘g‘ri.");
        }
        await state.delete(key);
        if (current) await state.delete(current.key);
        const user = { email: account.email, name: account.name };
        const token = randomBytes(32).toString("hex");
        const sessionKey = `sessions/${createHash("sha256").update(token).digest("hex")}`;
        await state.set(sessionKey, { user, fingerprint: account.fingerprint, expires: Date.now() + sessionLifetime });
        response.setHeader("Set-Cookie", `bilimtest_session=${token}; ${cookieFlags}; Max-Age=${sessionLifetime / 1000}`);
        return send(200, { user });
      }

      if (method === "POST" && path === "/api/logout") {
        await readBody(request);
        if (current) await state.delete(current.key);
        response.setHeader("Set-Cookie", `bilimtest_session=; ${cookieFlags}; Max-Age=0`);
        return send(200, { user: null });
      }

      if (method === "POST" && path === "/api/answer") {
        const body = await readBody(request);
        const topic = getTopic(await load(), body.subject, body.topicId);
        const question = topic.questions.find((item) => String(item.id) === String(body.questionId));
        if (!question) throw new ApiError(404, "Savol topilmadi. Testni qayta oching.");
        if (!Number.isInteger(body.answer) || body.answer < 0 || body.answer >= question.options.length) {
          throw new ApiError(400, "Javob variantini tanlang.");
        }
        return send(200, { correct: body.answer === question.correctAnswer, correctAnswer: question.correctAnswer });
      }

      if (method === "POST" && path === "/api/grade") {
        const body = await readBody(request);
        const topic = getTopic(await load(), body.subject, body.topicId);
        if (!Array.isArray(body.answers)) throw new ApiError(400, "Javoblarni yuboring.");
        if (!topic.questions.length) throw new ApiError(400, "Mavzuda savollar yo‘q.");
        const answers = new Map();
        for (const answer of body.answers) {
          if (!answer || answers.has(String(answer.questionId)) || !Number.isInteger(answer.answer) || answer.answer < 0 || answer.answer > 3) throw new ApiError(400, "Javoblar noto‘g‘ri.");
          answers.set(String(answer.questionId), answer.answer);
        }
        if (answers.size !== topic.questions.length || topic.questions.some((q) => !answers.has(String(q.id)))) {
          throw new ApiError(409, "Savollar o‘zgargan yoki javoblar to‘liq emas. Testni qayta oching.");
        }
        const correct = topic.questions.filter((q) => answers.get(String(q.id)) === q.correctAnswer).length;
        return send(200, { correct, total: topic.questions.length, percentage: Math.round(correct / topic.questions.length * 100) });
      }

      if (["POST", "PATCH", "DELETE"].includes(method) && path === "/api/matching") {
        if (!current) throw new ApiError(401, "O‘zgartirish uchun o‘qituvchi sifatida kiring.");
        const body = await readBody(request);
        if (method === "DELETE") {
          const data = await matchingStorage.update((draft) => {
            const index = draft.findIndex((item) => item.id === body.id);
            if (index < 0) throw new ApiError(404, "Bog‘lash to‘plami topilmadi.");
            draft.splice(index, 1);
          });
          return send(200, data);
        }
        const fields = matchingFields(body);
        const newId = randomUUID();
        const data = await matchingStorage.update((draft) => {
          const group = method === "PATCH" ? draft.find((item) => item.id === body.id) : null;
          if (method === "PATCH" && !group) throw new ApiError(404, "Bog‘lash to‘plami topilmadi.");
          if (draft.some((item) => item.id !== group?.id && item.title.toLowerCase() === fields.title.toLowerCase())) throw new ApiError(409, "Bunday to‘plam nomi mavjud.");
          if (group) Object.assign(group, fields);
          else draft.push({ id: newId, ...fields });
        });
        return send(200, data);
      }

      if (["POST", "PATCH", "DELETE"].includes(method) && ["/api/topics", "/api/questions"].includes(path)) {
        if (!current) throw new ApiError(401, "O‘zgartirish uchun o‘qituvchi sifatida kiring.");
        const body = await readBody(request);
        const data = await update((draft) => {
          if (method === "POST" && path === "/api/topics") {
            if (typeof body.subject !== "string" || !Object.hasOwn(draft, body.subject)) throw new ApiError(404, "Fan topilmadi.");
            const title = requireText(body.title, "Mavzu nomi", 150);
            if (draft[body.subject].some((item) => item.title.toLowerCase() === title.toLowerCase())) throw new ApiError(409, "Bunday mavzu nomi mavjud.");
            draft[body.subject].push({ id: randomUUID(), title, questions: [] });
            return;
          }
          const topic = getTopic(draft, body.subject, body.topicId);
          if (method === "POST" && path === "/api/questions") {
            topic.questions.push({ id: randomUUID(), ...questionFields(body) });
            return;
          }
          if (path === "/api/topics") {
            if (method === "DELETE") {
              draft[body.subject] = draft[body.subject].filter((item) => item.id !== topic.id);
            } else {
              const title = requireText(body.title, "Mavzu nomi", 150);
              if (draft[body.subject].some((item) => item.id !== topic.id && item.title.toLowerCase() === title.toLowerCase())) throw new ApiError(409, "Bunday mavzu nomi mavjud.");
              topic.title = title;
            }
          } else {
            const question = topic.questions.find((item) => String(item.id) === String(body.questionId));
            if (!question) throw new ApiError(404, "Savol topilmadi.");
            if (method === "DELETE") {
              topic.questions = topic.questions.filter((item) => item.id !== question.id);
            } else {
              Object.assign(question, questionFields(body));
            }
          }
        });
        return send(200, data);
      }
      throw new ApiError(404, "Bunday so‘rov topilmadi.");
    } catch (error) {
      if (!error.status) console.error("API xatosi:", error.message);
      send(error.status ?? 500, { error: error.status ? error.message : "Serverda xato. Keyinroq urinib ko‘ring." });
    }
  };
}

