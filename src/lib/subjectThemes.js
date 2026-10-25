export const subjectThemes = {
  "Ona tili": { key: "language", color: "#a75a80", paper: "#fff0ed", icon: "book", extras: ["pencil", "book"], marks: ["Aa", "O‘", "Bb"] },
  Matematika: { key: "math", color: "#7761b4", paper: "#f0ebff", icon: "calculator", extras: ["ruler", "pencil"], marks: ["2 + 3", "×", "½"] },
  Tarix: { key: "history", color: "#af7d38", paper: "#fff2d9", icon: "temple", extras: ["scroll", "compass"], marks: ["✦", "•", "✧"] },
  Geografiya: { key: "geography", color: "#408f86", paper: "#e9f6ed", icon: "globe", extras: ["compass", "leaf"], marks: ["N", "E", "W"] },
  "Tabiiy fanlar": { key: "nature", color: "#739345", paper: "#f1f6df", icon: "plant", extras: ["leaf", "globe"], marks: ["☀", "✦", "✧"] },
  Informatika: { key: "computing", color: "#567fa3", paper: "#eaf2fa", icon: "computer", extras: ["calculator", "ruler"], marks: ["</>", "01", "{ }"] },
  Fizika: { key: "physics", color: "#8870b4", paper: "#f4edff", icon: "atom", extras: ["ruler", "compass"], marks: ["F = ma", "+", "−"] },
  Kimyo: { key: "chemistry", color: "#489e92", paper: "#e6f7f1", icon: "flask", extras: ["atom", "flask"], marks: ["H₂O", "O₂", "+"] },
  Biologiya: { key: "biology", color: "#649858", paper: "#eaf6e5", icon: "leaf", extras: ["plant", "atom"], marks: ["DNA", "✦", "✧"] },
  "Ingliz tili": { key: "english", color: "#b4775b", paper: "#fff0df", icon: "book", extras: ["pencil", "scroll"], marks: ["ABC", "Hello!", "Aa"] },
};

export function getSubjectTheme(subject) {
  return subjectThemes[subject] ?? subjectThemes["Ona tili"];
}
