import activities from "../src/data/matching.json" with { type: "json" };
import { getSubjectTheme } from "../src/lib/subjectThemes.js";

export const matchingSeed = Object.entries(activities).map(([subject, activity]) => ({
  id: `${getSubjectTheme(subject).key}-1`,
  title: `${subject} 1`,
  subject,
  pairs: activity.pairs,
}));
