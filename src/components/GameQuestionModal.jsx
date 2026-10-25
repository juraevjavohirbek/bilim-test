import { useEffect, useId, useRef, useState } from "react";
import QuestionCard from "./QuestionCard";
import EditActions from "./EditActions";
import { api } from "../lib/api";
import { subjectBackground } from "../lib/subjectBackgrounds";

export default function GameQuestionModal({ question, number, subjectTitle, topicId, team, record, user, onAnswered, onClose, onEdit, onDelete, backgroundVariant = 0 }) {
  const dialog = useRef(null);
  const headingId = useId();
  const [selected, setSelected] = useState(record?.answer);
  const [feedback, setFeedback] = useState(record?.feedback ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const background = subjectBackground(subjectTitle, backgroundVariant);

  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);

  async function answer() {
    setBusy(true);
    setError("");
    try {
      const checked = await api("/answer", {
        method: "POST",
        body: { subject: subjectTitle, topicId, questionId: question.id, answer: selected },
      });
      setFeedback(checked);
      onAnswered({ answer: selected, feedback: checked, team });
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return (
    <dialog ref={dialog} className="editor-modal game-question-modal" aria-labelledby={headingId}
      data-theme={background.theme} data-background-variant={background.variant} style={background.style}
      onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}>
      <div className="modal-heading">
        <h2 id={headingId}>{number}-savol{team !== null ? ` · ${team + 1}-jamoa` : ""}</h2>
        <button type="button" className="icon-button" aria-label="Savolni yopish" disabled={busy} onClick={onClose}>×</button>
      </div>
      {user && <div className="question-toolbar"><span>O‘qituvchi boshqaruvi</span>
        <EditActions label={`Savol ${number}`} onEdit={() => { onClose(); onEdit(question); }} onDelete={() => { onClose(); onDelete(question); }} />
      </div>}
      <QuestionCard question={question} number={number} selectedAnswer={selected} onSelect={setSelected} feedback={feedback} busy={busy} />
      {feedback && <p className={`answer-feedback ${feedback.correct ? "feedback-correct" : "feedback-error"}`} role="status">
        {feedback.correct ? "To‘g‘ri javob!" : `Noto‘g‘ri. To‘g‘ri javob: ${String.fromCharCode(65 + feedback.correctAnswer)} — ${question.options[feedback.correctAnswer]}.`}
      </p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="modal-actions">
        {feedback
          ? <button type="button" className="primary-button" onClick={onClose}>O‘yinga qaytish</button>
          : <button type="button" className="primary-button" disabled={busy || selected === undefined} onClick={answer}>{busy ? "Tekshirilmoqda..." : "Javob berish"}</button>}
      </div>
    </dialog>
  );
}
