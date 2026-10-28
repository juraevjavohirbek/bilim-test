import { useEffect, useId, useRef, useState } from "react";
import { buildCrossword, generateCrossword } from "../lib/crossword";
import { subjectThemes } from "../lib/subjectThemes";

const emptyQuestion = () => ({ id: crypto.randomUUID(), clue: "", answer: "" });

export default function CrosswordEditor({ puzzle, onClose, onSave }) {
  const dialog = useRef(null); const headingId = useId();
  const [title, setTitle] = useState(puzzle?.title ?? "");
  const [subject, setSubject] = useState(puzzle?.subject ?? "Ona tili");
  const [questions, setQuestions] = useState(() => puzzle?.entries.map(({ id, clue, answer }) => ({ id, clue, answer })) ?? [emptyQuestion()]);
  const [preview, setPreview] = useState(null); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => { const element = dialog.current; element.showModal(); return () => element.close(); }, []);
  function updateQuestions(next) { setQuestions(next); setPreview(null); setError(""); }
  function generate(event) {
    event.preventDefault(); setError(""); setPreview(null);
    try { setPreview(buildCrossword(generateCrossword(questions))); }
    catch (error) { setError(error.message); }
  }
  async function save() {
    if (!preview || !title.trim()) return;
    setBusy(true); setError("");
    try { await onSave({ ...(puzzle ? { id: puzzle.id } : {}), title, subject, questions }); }
    catch (error) { setError(error.message); setBusy(false); }
  }
  return <dialog ref={dialog} className="editor-modal matching-editor crossword-editor" aria-labelledby={headingId}
    onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}>
    <form onSubmit={generate}>
      <div className="modal-heading"><h2 id={headingId}>{puzzle ? "Krasvordni tahrirlash" : "Yangi krasvord"}</h2><button type="button" className="icon-button" aria-label="Yopish" disabled={busy} onClick={onClose}>×</button></div>
      <p className="matching-editor-hint">Har savol tagiga javobini yozing. Javoblar umumiy harflari orqali kesishadi. Bo‘sh joy, tire va tutuq belgisi alohida katak olmaydi.</p>
      <fieldset className="modal-fields" disabled={busy}>
        <div className="matching-editor-meta form-fields">
          <label>Krasvord nomi<input autoFocus required maxLength={150} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Masalan: Krasvord 2" /></label>
          <label>Fan<select value={subject} onChange={(event) => setSubject(event.target.value)}>{Object.keys(subjectThemes).map((name) => <option key={name}>{name}</option>)}</select></label>
        </div>
        <div className="matching-editor-pairs">{questions.map((question, index) => <section className="matching-edit-pair" key={question.id}>
          <div className="matching-pair-heading"><strong>{index + 1}-savol va javob</strong>{questions.length > 1 && <button type="button" className="matching-remove-pair" aria-label={`${index + 1}-savolni olib tashlash`} onClick={() => updateQuestions(questions.filter((item) => item.id !== question.id))}>Olib tashlash</button>}</div>
          <label>{index + 1}-savol<textarea required maxLength={500} rows={2} value={question.clue} onChange={(event) => updateQuestions(questions.map((item) => item.id === question.id ? { ...item, clue: event.target.value } : item))} /></label>
          <span className="matching-editor-connector" aria-hidden="true"><i />↕<i /></span>
          <label className="matching-edit-answer">{index + 1}-javob<input required maxLength={60} value={question.answer} onChange={(event) => updateQuestions(questions.map((item) => item.id === question.id ? { ...item, answer: event.target.value } : item))} placeholder="2–24 ta lotin harfi" /></label>
        </section>)}</div>
        <button type="button" className="matching-add-pair" disabled={questions.length >= 20} onClick={() => updateQuestions([...questions, emptyQuestion()])}>+ Savol va javob qo‘shish</button>
        <button type="submit" className="primary-button crossword-generate">✦ Generatsiya qilish</button>
      </fieldset>
      {error && <p className="form-error" role="alert">{error}</p>}
      {preview && <section className="crossword-preview" aria-label="Tayyor krasvord namunasi"><h3>Krasvord tayyor — {preview.entries.length} ta savol joylashtirildi</h3>
        <div className="crossword-grid" style={{ "--crossword-columns": preview.columns }}>
          {Array.from({ length: preview.rows * preview.columns }, (_, index) => { const cell = preview.cells.get(`${Math.floor(index / preview.columns)}:${index % preview.columns}`);
            return cell ? <span className="crossword-cell crossword-preview-letter" key={index}>{cell.number && <small className="crossword-cell-number">{cell.number}</small>}{cell.solution}</span> : <span className="crossword-block" key={index} />;
          })}
        </div><p>Joylashuv ma’qul bo‘lsa, saqlang. Savol yoki javob o‘zgarsa, qayta generatsiya qiling.</p>
      </section>}
      <div className="modal-actions matching-editor-actions"><button type="button" className="secondary-button" disabled={busy} onClick={onClose}>Bekor qilish</button>
        {preview && <button type="button" className="primary-button" disabled={busy || !title.trim()} onClick={save}>{busy ? "Saqlanmoqda..." : "Saqlash"}</button>}</div>
    </form>
  </dialog>;
}
