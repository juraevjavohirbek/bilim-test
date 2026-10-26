import { useEffect, useId, useRef } from "react";
import { playFeedbackSound, stopFeedbackSound, unlockFeedbackAudio } from "../lib/feedbackSounds";

const praise = [
  { title: "Perfect!", emoji: "🏆" },
  { title: "Bravo!", emoji: "👏" },
  { title: "Barakalla!", emoji: "🌟" },
];

export default function AnswerReactionModal({ feedback, number, correctAnswer, onContinue, continueLabel = "Davom etish" }) {
  const dialog = useRef(null);
  const titleId = useId();
  const message = feedback.correct ? praise[(number - 1) % praise.length] : { title: "Afsus, keyingi safar!", emoji: "💪" };

  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    playFeedbackSound(feedback.correct);
    return () => { element.close(); stopFeedbackSound(); };
  }, [feedback.correct]);

  return <dialog ref={dialog} className={`answer-reaction-modal ${feedback.correct ? "is-celebration" : "is-encouragement"}`}
    aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); onContinue(); }}>
    {feedback.correct && <div className="reaction-confetti" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <i key={index} style={{ "--piece": index }} />)}</div>}
    <span className="reaction-emoji" aria-hidden="true">{message.emoji}</span>
    <h2 id={titleId}>{message.title}</h2>
    <p>{feedback.correct ? "Ajoyib! To‘g‘ri javob topdingiz." : "Xafa bo‘lmang, keyingi savolda albatta uddalaysiz!"}</p>
    {!feedback.correct && correctAnswer && <p className="reaction-answer">To‘g‘ri javob: <strong>{correctAnswer}</strong></p>}
    <div className="reaction-actions">
      <button type="button" className="icon-button reaction-replay" aria-label="Ovozni qayta eshitish" title="Ovozni qayta eshitish"
        onClick={() => { unlockFeedbackAudio(); playFeedbackSound(feedback.correct); }}>🔊</button>
      <button type="button" className="primary-button" onClick={onContinue}>{continueLabel}</button>
    </div>
  </dialog>;
}
