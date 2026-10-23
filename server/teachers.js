// Netlify: parol faqat Environment variables ichida saqlanadi.
// Mahalliy parol faylini faqat server/index.js o‘qiydi.
export function loadTeachers({ env = process.env } = {}) {
  if (env.TEACHER_EMAIL || env.TEACHER_PASSWORD) {
    if (!env.TEACHER_EMAIL?.trim() || !env.TEACHER_PASSWORD || env.TEACHER_PASSWORD.length > 256) {
      throw new Error("TEACHER_EMAIL va TEACHER_PASSWORD sozlamalarini tekshiring.");
    }
    return [{ name: env.TEACHER_NAME?.trim() || "O‘qituvchi", email: env.TEACHER_EMAIL.trim(), password: env.TEACHER_PASSWORD }];
  }
  return [];
}
