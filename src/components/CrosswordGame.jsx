import { useEffect, useMemo, useRef, useState } from "react";
import { assessCrossword, buildCrossword, normalizeCrosswordText } from "../lib/crossword";
import { preloadFeedbackAudio, unlockFeedbackAudio } from "../lib/feedbackSounds";
import AnswerReactionModal from "./AnswerReactionModal";

export default function CrosswordGame({ puzzle }) {
  const model = useMemo(() => buildCrossword(puzzle), [puzzle]);
  const inputs = useRef(new Map());
  const activeRef = useRef(model.entries[0].id);
  const [activeId, setActiveId] = useState(model.entries[0].id);
  const [focusedKey, setFocusedKey] = useState(model.entries[0].keys[0]);
  const [values, setValues] = useState({});
  const [checked, setChecked] = useState(false);
  const [solved, setSolved] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [message, setMessage] = useState("Savolni yoki katakni bosing va javobni yozing.");
  const active = model.entries.find((entry) => entry.id === activeId);
  const progress = assessCrossword(model, values);
  useEffect(() => { void preloadFeedbackAudio(); }, []);

  function activate(id) { activeRef.current = id; setActiveId(id); }
  function focusCell(key) { inputs.current.get(key)?.focus(); inputs.current.get(key)?.select(); }
  function selectCell(key) {
    const cell = model.cells.get(key);
    if (!cell.entries.includes(activeRef.current)) activate(cell.entries[0]);
    setFocusedKey(key);
  }
  function selectClue(entry) {
    activate(entry.id);
    focusCell(entry.keys.find((key) => !values[key]) ?? entry.keys[0]);
  }

  function writeLetters(key, text) {
    if (solved) return;
    const entry = model.entries.find((entry) => entry.id === activeRef.current);
    const index = entry.keys.indexOf(key);
    if (index < 0) return;
    const letters = normalizeCrosswordText(text);
    const updates = {};
    if (!letters) updates[key] = "";
    else [...letters].slice(0, entry.keys.length - index).forEach((letter, offset) => { updates[entry.keys[index + offset]] = letter; });
    setValues((current) => ({ ...current, ...updates }));
    setChecked(false);
    setMessage("Yozib bo‘lgach, «Tekshirish» tugmasini bosing.");
    if (letters) focusCell(entry.keys[Math.min(index + letters.length, entry.keys.length - 1)]);
  }

  function handleKey(event, key) {
    const entry = model.entries.find((entry) => entry.id === activeRef.current);
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
      event.preventDefault();
      const direction = event.key === "ArrowLeft" || event.key === "ArrowRight" ? "across" : "down";
      const nextEntry = model.entries.find((item) => item.direction === direction && item.keys.includes(key));
      if (!nextEntry) return;
      activate(nextEntry.id);
      const step = event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1;
      const nextKey = nextEntry.keys[nextEntry.keys.indexOf(key) + step];
      if (nextKey) focusCell(nextKey);
    } else if (event.key === "Backspace") {
      event.preventDefault();
      if (solved) return;
      const previous = values[key] ? key : entry.keys[Math.max(0, entry.keys.indexOf(key) - 1)];
      setValues((current) => ({ ...current, [previous]: "" })); setChecked(false); focusCell(previous);
    } else if (event.key === "Delete") {
      event.preventDefault(); if (!solved) writeLetters(key, "");
    } else if (event.key === "Enter") {
      event.preventDefault(); selectClue(model.entries[(model.entries.indexOf(entry) + 1) % model.entries.length]);
    } else if (event.key === " ") {
      event.preventDefault();
      const other = model.cells.get(key).entries.find((id) => id !== activeRef.current);
      if (other) activate(other);
    }
  }

  function check() {
    setChecked(true);
    if (progress.complete) {
      unlockFeedbackAudio(); setSolved(true); setCelebrate(true);
      setMessage("Krasvord to‘liq va to‘g‘ri yechildi!");
    } else if (progress.errors.length) setMessage(`${progress.correctWords} ta so‘z to‘g‘ri. Belgilangan kataklarni yana tekshiring.`);
    else setMessage(`Hali ${model.cells.size - progress.filled} ta katak bo‘sh. Davom eting!`);
  }

  function reset() {
    setValues({}); setChecked(false); setSolved(false); setCelebrate(false);
    setMessage("Yangi urinish! Savolni tanlab javob yozing.");
    activate(model.entries[0].id); focusCell(model.entries[0].keys[0]);
  }

  return <div className="crossword-shell">
    <div className="crossword-clues-heading"><h2>Savollar</h2><span>→ Gorizontal · ↓ Vertikal</span></div>
    <div className="crossword-clues">{model.entries.map((entry) => <button type="button" key={entry.id}
      className={`crossword-clue${entry.id === activeId ? " is-active" : ""}`} aria-pressed={entry.id === activeId}
      onClick={() => selectClue(entry)}>
      <span className="crossword-clue-number">{entry.number}{entry.direction === "across" ? "→" : "↓"}</span>
      <span>{entry.clue}<small>{entry.answer.length} ta harf</small></span>
    </button>)}</div>
    <div className="crossword-toolbar"><span className="question-counter">{progress.writtenWords} / {model.entries.length} so‘z yozildi</span>
      <div className="crossword-actions"><button type="button" className="secondary-button" onClick={reset}>↻ Qayta boshlash</button>
        <button type="button" className="primary-button" onClick={check} disabled={solved}>Tekshirish</button></div></div>
    <div className="crossword-active-clue" aria-live="polite"><strong>{active.number}{active.direction === "across" ? " →" : " ↓"}</strong><span>{active.clue}</span></div>
    <p className="crossword-status" role="status">{message}</p>
    <div className="crossword-paper">
      <div className="crossword-grid" role="group" aria-label="Krasvord kataklari" style={{ "--crossword-columns": model.columns }}>
        {Array.from({ length: model.rows * model.columns }, (_, index) => {
          const row = Math.floor(index / model.columns); const column = index % model.columns;
          const key = `${row}:${column}`; const cell = model.cells.get(key);
          if (!cell) return <span className="crossword-block" key={key} aria-hidden="true" />;
          const invalid = checked && progress.errors.includes(key);
          return <label key={key} className={`crossword-cell${active.keys.includes(key) ? " is-word" : ""}${focusedKey === key ? " is-current" : ""}${invalid ? " is-invalid" : ""}${solved ? " is-solved" : ""}`}>
            {cell.number && <span className="crossword-cell-number" aria-hidden="true">{cell.number}</span>}
            <input ref={(element) => { if (element) inputs.current.set(key, element); else inputs.current.delete(key); }}
              data-cell={key} value={values[key] ?? ""} maxLength={1} readOnly={solved} aria-invalid={invalid}
              aria-label={`${row + 1}-qator, ${column + 1}-ustun${cell.number ? `, ${cell.number}-savol boshi` : ""}`}
              autoComplete="off" autoCapitalize="characters" spellCheck={false}
              onFocus={(event) => { selectCell(key); event.currentTarget.select(); }} onClick={(event) => event.currentTarget.select()}
              onChange={(event) => writeLetters(key, event.target.value)} onKeyDown={(event) => handleKey(event, key)}
              onPaste={(event) => { event.preventDefault(); writeLetters(key, event.clipboardData.getData("text")); }} />
          </label>;
        })}
      </div>
    </div>
    <p className="matching-help">Katakni bosib yozing. Strelkalar bilan yuring, Backspace bilan o‘chiring. Kesishgan katakda bo‘sh joy tugmasi yo‘nalishni almashtiradi.</p>
    {celebrate && <AnswerReactionModal feedback={{ correct: true }} celebration={{ title: "Barakalla!", emoji: "🏆", description: "Krasvordni to‘g‘ri yechdingiz!" }} onContinue={() => setCelebrate(false)} />}
  </div>;
}
