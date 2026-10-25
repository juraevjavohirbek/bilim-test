import { getSubjectTheme } from "./subjectThemes";

const images = import.meta.glob("../assets/subject-backgrounds/*.svg", {
  eager: true, query: "?url", import: "default",
});

export function subjectBackground(subject, variant = 0) {
  const theme = getSubjectTheme(subject);
  const index = ((variant % 3) + 3) % 3;
  return {
    theme: theme.key,
    variant: index,
    style: {
      "--subject-ink": theme.color,
      "--subject-paper": theme.paper,
      "--subject-scene": `url("${images[`../assets/subject-backgrounds/${theme.key}-${index}.svg`]}")`,
    },
  };
}
