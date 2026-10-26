import { useEffect, useId, useRef, useState } from "react";
import QuestionCard from "./QuestionCard";
import EditActions from "./EditActions";
import { api } from "../lib/api";
import { subjectBackground } from "../lib/subjectBackgrounds";
import useFullscreen from "../hooks/useFullscreen";
import FullscreenButton from "./FullscreenButton";
import AnswerReactionModal from "./AnswerReactionModal";
import { unlockFeedbackAudio } from "../lib/feedbackSounds";

export default function GameQuestionModal({ question, number, subjectTitle, topicId, team, record, user, onAnswered, onClose, onContinue, onEdit, onDelete, backgroundVariant = 0 }) {
  const dialog = useRef(null);
  const fullscreen = useFullscreen();
  const headingId = useId();
  const [selected, setSelected] = useState(record?.answer);
  const [feedback, setFeedback] = useState(record?.feedback ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reaction, setReaction] = useState(null);
  const checking = useRef(false);
  const background = subjectBackground(subjectTitle, backgroundVariant);

  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);

  async function answer(value) {
    if (checking.current || feedback) return;
    checking.current = true;
    unlockFeedbackAudio();
    setSelected(value);
    setBusy(true);
    setError("");
    try {
      const checked = await api("/answer", {
        method: "POST",
        body: { subject: subjectTitle, topicId, questionId: question.id, answer: value },
      });
      setFeedback(checked);
      onAnswered({ answer: value, feedback: checked, team });
      setReaction(checked);
    } catch (err) { setError(err.message); setSelected(undefined); }
    finally { setBusy(false); checking.current = false; }
  }

  return (
    <dialog ref={dialog} className={`editor-modal game-question-modal${fullscreen.expanded ? " is-expanded" : ""}`} aria-labelledby={headingId}
      data-theme={background.theme} data-background-variant={background.variant} style={background.style}
      onCancel={(event) => {
        event.preventDefault();
        if (fullscreen.expanded) fullscreen.collapse(true);
        else if (!fullscreen.consumeEscape() && !busy) onClose();
      }}>
      <div className="modal-heading">
        <h2 id={headingId}>{number}-savol{team !== null ? ` · ${team + 1}-jamoa` : ""}</h2>
        <div className="panel-corner-actions">
          <FullscreenButton fullscreen={fullscreen} label="Savol" />
          <button type="button" className="icon-button" aria-label="Savolni yopish" disabled={busy} onClick={onClose}>×</button>
        </div>
      </div>
      {user && <div className="question-toolbar"><span>O‘qituvchi boshqaruvi</span>
        <EditActions label={`Savol ${number}`} onEdit={() => { onClose(); onEdit(question); }} onDelete={() => { onClose(); onDelete(question); }} />
      </div>}
      <QuestionCard question={question} number={number} selectedAnswer={selected} onSelect={answer} feedback={feedback} busy={busy} />
      {!feedback && <p className="answer-tap-hint" role="status">{busy ? "Tekshirilmoqda..." : "Javob variantini bosing."}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="modal-actions">
        {feedback && <button type="button" className="primary-button" onClick={onClose}>O‘yinga qaytish</button>}
      </div>
      {reaction && <AnswerReactionModal feedback={reaction} number={number}
        correctAnswer={question.options[reaction.correctAnswer]} continueLabel="Keyingi savol" onContinue={onContinue} />}
    </dialog>
  );
}
