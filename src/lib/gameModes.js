export const gameModes = [
  { value: "normal", label: "Oddiy" },
  { value: "wheel", label: "Baraban" },
  { value: "lotto", label: "Lotto" },
  { value: "tug", label: "Arqon tortish" },
];

export function normalizeMode(value) {
  return gameModes.some((mode) => mode.value === value) ? value : "normal";
}

export function modeQuery(mode) {
  const normalized = normalizeMode(mode);
  return normalized === "normal" ? "" : `?mode=${normalized}`;
}

// Faqat hali javob berilmagan savollar orasidan tanlash.
export function remainingQuestions(questions, answers) {
  return questions.map((question, index) => ({ question, index }))
    .filter(({ question }) => !Object.hasOwn(answers, question.id));
}

export function pickUnusedQuestion(questions, answers, random = Math.random) {
  const available = remainingQuestions(questions, answers);
  if (!available.length) return null;
  return available[Math.min(available.length - 1, Math.floor(random() * available.length))].index;
}

// Ko‘rsatkich yuqorida turadi; tanlangan bo‘lakning markazi unga kelib to‘xtaydi.
export function wheelRotation(current, index, count) {
  const target = 360 - (index + 0.5) * 360 / count;
  const adjustment = ((target - current) % 360 + 360) % 360;
  return current + 5 * 360 + adjustment;
}

export function wheelPoint(angle, radius = 125) {
  const radians = (angle - 90) * Math.PI / 180;
  return { x: 160 + radius * Math.cos(radians), y: 160 + radius * Math.sin(radians) };
}

export function teamScores(answers) {
  return Object.values(answers).reduce((scores, record) => {
    if (record.feedback.correct && (record.team === 0 || record.team === 1)) scores[record.team]++;
    return scores;
  }, [0, 0]);
}
