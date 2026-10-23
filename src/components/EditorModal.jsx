import { useEffect, useId, useRef, useState } from "react";

// Mavzu va savollarni tahrirlash/o‘chirish uchun umumiy modal.
function EditorModal({ editor, onClose, onSave }) {
  const dialog = useRef(null);
  const headingId = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const deleting = editor.mode === "delete";
  const creating = editor.mode === "create";
  const question = editor.question;
  const isQuestion = editor.kind === "question" || Boolean(question);
  const [title, setTitle] = useState(editor.topic?.title ?? "");
  const [text, setText] = useState(question?.text ?? "");
  const [options, setOptions] = useState(question?.options ?? ["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState(question?.correctAnswer ?? 0);

  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSave(isQuestion ? { text, options, correctAnswer } : { title });
      onClose();
    } catch (err) { setError(err.message); setBusy(false); }
  }

  return (
    <dialog ref={dialog} className="editor-modal" aria-labelledby={headingId}
      onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}>
      <form onSubmit={submit} className="form-fields">
        <div className="modal-heading">
          <h2 id={headingId}>{creating
            ? `Yangi ${isQuestion ? "savol" : "mavzu"} qo‘shish`
            : `${isQuestion ? "Savolni" : "Mavzuni"} ${deleting ? "o‘chirish" : "tahrirlash"}`}</h2>
          <button type="button" className="icon-button" aria-label="Yopish" onClick={onClose} disabled={busy}>×</button>
        </div>
        <fieldset disabled={busy} className="modal-fields">
          {deleting ? (
            <p>“{question?.text ?? editor.topic.title}” o‘chirilsinmi?
              {!question && " Mavzudagi barcha savollar ham o‘chadi."} Bu amal JSON faylidan ham o‘chiradi.</p>
          ) : isQuestion ? (
            <>
              <label>Savol matni
                <textarea value={text} onChange={(event) => setText(event.target.value)} required maxLength={2000} rows={3} autoFocus />
              </label>
              {options.map((option, index) => (
                <label key={index}>{String.fromCharCode(65 + index)} variant
                  <input value={option} onChange={(event) => setOptions((current) => current.map((value, i) => i === index ? event.target.value : value))} required maxLength={500} />
                </label>
              ))}
              <label>To‘g‘ri javob
                <select value={correctAnswer} onChange={(event) => setCorrectAnswer(Number(event.target.value))}>
                  {options.map((_, index) => <option key={index} value={index}>{String.fromCharCode(65 + index)}</option>)}
                </select>
              </label>
            </>
          ) : (
            <label>Mavzu nomi
              <input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={150} autoFocus />
            </label>
          )}
        </fieldset>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose} disabled={busy}>Bekor qilish</button>
          <button type="submit" className={deleting ? "danger-button" : "primary-button"} disabled={busy}>
            {busy ? "Saqlanmoqda..." : deleting ? "O‘chirish" : creating ? "Qo‘shish" : "Saqlash"}
          </button>
        </div>
      </form>
    </dialog>
  );
}

export default EditorModal;
