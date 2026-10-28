export function normalizeCrosswordText(value) {
  return String(value).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z]/g, "");
}

export function buildCrossword(puzzle) {
  if (!Number.isInteger(puzzle.rows) || !Number.isInteger(puzzle.columns) || puzzle.rows < 1 || puzzle.columns < 1) throw new Error("Krasvord o‘lchami noto‘g‘ri.");
  const cells = new Map();
  const ids = new Set();
  const entries = puzzle.entries.map((entry) => {
    const answer = normalizeCrosswordText(entry.answer);
    if (!answer || ids.has(entry.id) || !["across", "down"].includes(entry.direction)) throw new Error("Krasvord savoli noto‘g‘ri.");
    ids.add(entry.id);
    const keys = [...answer].map((letter, index) => {
      const row = entry.row + (entry.direction === "down" ? index : 0);
      const column = entry.column + (entry.direction === "across" ? index : 0);
      if (row < 0 || column < 0 || row >= puzzle.rows || column >= puzzle.columns) throw new Error("So‘z krasvord chegarasidan chiqdi.");
      const key = `${row}:${column}`;
      const cell = cells.get(key);
      if (cell && (cell.solution !== letter || cell.entries.some((id) => puzzle.entries.find((item) => item.id === id).direction === entry.direction))) throw new Error("Kesishgan so‘zlar mos kelmadi.");
      if (cell) cell.entries.push(entry.id);
      else cells.set(key, { key, row, column, solution: letter, entries: [entry.id] });
      return key;
    });
    return { ...entry, answer, keys };
  });
  const starts = [...new Set(entries.map((entry) => entry.keys[0]))].sort((a, b) => {
    const first = cells.get(a); const second = cells.get(b);
    return first.row - second.row || first.column - second.column;
  });
  for (const [index, key] of starts.entries()) cells.get(key).number = index + 1;
  for (const entry of entries) entry.number = cells.get(entry.keys[0]).number;
  return { rows: puzzle.rows, columns: puzzle.columns, cells, entries: entries.sort((a, b) => a.number - b.number) };
}

export function assessCrossword(model, values) {
  const errors = [...model.cells.values()].filter((cell) => values[cell.key] && values[cell.key] !== cell.solution).map((cell) => cell.key);
  const filled = [...model.cells.keys()].filter((key) => values[key]).length;
  const writtenWords = model.entries.filter((entry) => entry.keys.every((key) => values[key])).length;
  const correctWords = model.entries.filter((entry) => entry.keys.every((key, index) => values[key] === entry.answer[index])).length;
  return { errors, filled, writtenWords, correctWords, complete: filled === model.cells.size && errors.length === 0 };
}
