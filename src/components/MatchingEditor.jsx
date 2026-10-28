import { useEffect, useId, useRef, useState } from "react";
import { subjectThemes } from "../lib/subjectThemes";

const emptyPair = () => ({ id: crypto.randomUUID(), question: "", answer: "" });

export default function MatchingEditor({ group, onClose, onSave }) {
  const dialog = useRef(null);
  const headingId = useId();
  const [title, setTitle] = useState(group?.title ?? "");
  const [subject, setSubject] = useState(group?.subject ?? "Ona tili");
  const [pairs, setPairs] = useState(() => group?.pairs.map((pair) => ({ ...pair })) ?? [emptyPair()]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);

  function updatePair(id, field, value) {
    setPairs((current) => current.map((pair) => pair.id === id ? { ...pair, [field]: value } : pair));
  }

  async function submit(event) {
    event.preventDefault(); setBusy(true); setError("");
    try { await onSave({ ...(group ? { id: group.id } : {}), title, subject, pairs }); }
    catch (error) { setError(error.message); setBusy(false); }
  }

  return <dialog ref={dialog} className="editor-modal matching-editor" aria-labelledby={headingId}
    onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}>
    <form onSubmit={submit}>
      <div className="modal-heading"><h2 id={headingId}>{group ? "Bog‘lashni tahrirlash" : "Yangi bog‘lash to‘plami"}</h2>
        <button type="button" className="icon-button" aria-label="Yopish" onClick={onClose} disabled={busy}>×</button></div>
      <p className="matching-editor-hint">Har bir savolning tagiga uning to‘g‘ri javobini yozing.</p>
      <fieldset className="modal-fields" disabled={busy}>
        <div className="matching-editor-meta form-fields">
          <label>To‘plam nomi<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Masalan: Ona tili 2" maxLength={150} required autoFocus /></label>
          <label>Fan<select value={subject} onChange={(event) => setSubject(event.target.value)}>
            {Object.keys(subjectThemes).map((title) => <option key={title}>{title}</option>)}
          </select></label>
        </div>
        <div className="matching-editor-pairs">
          {pairs.map((pair, index) => <section className="matching-edit-pair" key={pair.id} aria-label={`${index + 1}-juftlik`}>
            <div className="matching-pair-heading"><strong>{index + 1}-juftlik</strong>
              {pairs.length > 1 && <button type="button" className="matching-remove-pair" aria-label={`${index + 1}-juftlikni olib tashlash`}
                onClick={() => setPairs((current) => current.filter((item) => item.id !== pair.id))}>Olib tashlash</button>}</div>
            <label className="matching-edit-question">{index + 1}-savol
              <textarea rows={2} value={pair.question} onChange={(event) => updatePair(pair.id, "question", event.target.value)} placeholder="Savol yoki tushunchani yozing" required maxLength={500} /></label>
            <span className="matching-editor-connector" aria-hidden="true"><i />↕<i /></span>
            <label className="matching-edit-answer">{index + 1}-to‘g‘ri javob
              <textarea rows={2} value={pair.answer} onChange={(event) => updatePair(pair.id, "answer", event.target.value)} placeholder="Yuqoridagi savolning to‘g‘ri javobi" required maxLength={500} /></label>
          </section>)}
        </div>
        <button type="button" className="matching-add-pair" disabled={pairs.length >= 30}
          onClick={() => setPairs((current) => [...current, emptyPair()])}>+ Savol va javob qo‘shish</button>
      </fieldset>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="modal-actions matching-editor-actions">
        <button type="button" className="secondary-button" disabled={busy} onClick={onClose}>Bekor qilish</button>
        <button type="submit" className="primary-button" disabled={busy}>{busy ? "Saqlanmoqda..." : "Yakunlash"}</button>
      </div>
    </form>
  </dialog>;
}
