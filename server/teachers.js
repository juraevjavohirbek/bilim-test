import { readFileSync } from "node:fs";

// Netlify: parol faqat Environment variables ichida saqlanadi.
// Kompyuteringizda: GitHub'ga yuklanmaydigan teachers.local.json ishlatiladi.
export function loadTeachers({ env = process.env, allowLocal = true } = {}) {
  if (env.TEACHER_EMAIL || env.TEACHER_PASSWORD) {
    if (!env.TEACHER_EMAIL?.trim() || !env.TEACHER_PASSWORD || env.TEACHER_PASSWORD.length > 256) {
      throw new Error("TEACHER_EMAIL va TEACHER_PASSWORD sozlamalarini tekshiring.");
    }
    return [{ name: env.TEACHER_NAME?.trim() || "O‘qituvchi", email: env.TEACHER_EMAIL.trim(), password: env.TEACHER_PASSWORD }];
  }
  if (!allowLocal) return [];
  try {
    return JSON.parse(readFileSync(new URL("./teachers.local.json", import.meta.url), "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}
