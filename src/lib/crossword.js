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

// Har bir javob joylashishi shart: bog‘lanmaydigan javoblar yashirib tashlanmaydi.
export function generateCrossword(questions) {
  if (!Array.isArray(questions) || questions.length < 1 || questions.length > 20) throw new Error("1 tadan 20 tagacha savol kiriting.");
  const words = questions.map((item, index) => {
    const raw = String(item.answer ?? "").trim();
    const answer = normalizeCrosswordText(raw);
    const clue = String(item.clue ?? "").trim();
    if (!clue || clue.length > 500 || !/^[a-zA-Z‘’ʻʼ'`\s-]+$/.test(raw) || answer.length < 2 || answer.length > 24) throw new Error(`${index + 1}-savol va javobni tekshiring. Javob 2–24 ta lotin harfidan iborat bo‘lsin.`);
    return { id: `word-${index + 1}`, clue, answer };
  });
  if (new Set(words.map((word) => word.answer)).size !== words.length) throw new Error("Javoblar takrorlanmasligi kerak.");
  let bestMissing = words;
  for (let attempt = 0; attempt < words.length; attempt++) {
    const grid = new Map(); const placed = [];
    const key = (r, c) => `${r}:${c}`;
    function place(word, row, column, direction) {
      const entry = { ...word, row, column, direction };
      placed.push(entry);
      [...word.answer].forEach((letter, index) => {
        const r = row + (direction === "down" ? index : 0); const c = column + (direction === "across" ? index : 0);
        const cell = grid.get(key(r, c));
        if (cell) cell.directions.push(direction);
        else grid.set(key(r, c), { r, c, letter, directions: [direction] });
      });
    }
    const first = words[attempt]; place(first, 0, 0, "across");
    let remaining = words.filter((word) => word !== first).sort((a, b) => b.answer.length - a.answer.length);
    let changed = true;
    while (remaining.length && changed) {
      changed = false;
      for (const word of [...remaining]) {
        const candidates = [];
        for (const cell of grid.values()) for (let i = 0; i < word.answer.length; i++) {
          if (word.answer[i] !== cell.letter) continue;
          for (const direction of ["across", "down"]) {
            const dr = direction === "down" ? 1 : 0; const dc = 1 - dr;
            const row = cell.r - dr * i; const column = cell.c - dc * i;
            if (grid.has(key(row - dr, column - dc)) || grid.has(key(row + dr * word.answer.length, column + dc * word.answer.length))) continue;
            let valid = true; let crossings = 0;
            for (let j = 0; j < word.answer.length; j++) {
              const r = row + dr * j; const c = column + dc * j; const existing = grid.get(key(r, c));
              if (existing) { if (existing.letter !== word.answer[j] || existing.directions.includes(direction)) { valid = false; break; } crossings++; }
              else if (grid.has(key(r + dc, c + dr)) || grid.has(key(r - dc, c - dr))) { valid = false; break; }
            }
            if (!valid) continue;
            const rows = [...grid.values()].map((cell) => cell.r).concat(row, row + dr * (word.answer.length - 1));
            const cols = [...grid.values()].map((cell) => cell.c).concat(column, column + dc * (word.answer.length - 1));
            const height = Math.max(...rows) - Math.min(...rows) + 1; const width = Math.max(...cols) - Math.min(...cols) + 1;
            if (height <= 35 && width <= 35) candidates.push({ row, column, direction, score: height * width - crossings * 10 });
          }
        }
        candidates.sort((a, b) => a.score - b.score);
        if (candidates.length) { const chosen = candidates[0]; place(word, chosen.row, chosen.column, chosen.direction); remaining = remaining.filter((item) => item !== word); changed = true; }
      }
    }
    if (remaining.length < bestMissing.length) bestMissing = remaining;
    if (remaining.length) continue;
    const rows = [...grid.values()].map((cell) => cell.r); const cols = [...grid.values()].map((cell) => cell.c);
    const minRow = Math.min(...rows); const minCol = Math.min(...cols);
    return { rows: Math.max(...rows) - minRow + 1, columns: Math.max(...cols) - minCol + 1,
      entries: words.map((word) => { const entry = placed.find((item) => item.id === word.id); return { ...entry, row: entry.row - minRow, column: entry.column - minCol }; }) };
  }
  throw new Error(`Bu javoblarni kesishadigan qilib joylashtirib bo‘lmadi: ${bestMissing.map((word) => word.answer).join(", ")}. Umumiy harflari bor javoblar tanlang yoki ayrim javoblarni o‘zgartiring.`);
}
