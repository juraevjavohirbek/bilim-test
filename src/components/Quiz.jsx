import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import QuestionCard from "./QuestionCard";
import EditActions from "./EditActions";
import { api } from "../lib/api";
import checkIcon from "../assets/check-circle.svg";
import useFullscreen from "../hooks/useFullscreen";
import FullscreenButton from "./FullscreenButton";
import { subjectBackground } from "../lib/subjectBackgrounds";
import AnswerReactionModal from "./AnswerReactionModal";
import { preloadFeedbackAudio, unlockFeedbackAudio } from "../lib/feedbackSounds";

function Quiz({ topic, subjectTitle, user, onEdit, onDelete }) {
  const fullscreen = useFullscreen();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [feedbacks, setFeedbacks] = useState({});
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reaction, setReaction] = useState(null);
  const checking = useRef(false);
  const question = topic.questions[index];
  const total = topic.questions.length;
  const feedback = question ? feedbacks[question.id] : null;
  const background = subjectBackground(subjectTitle, index);
  useEffect(() => { void preloadFeedbackAudio(); }, []);

  function restart() {
    setIndex(0); setAnswers({}); setFeedbacks({}); setResult(null); setError(""); setReaction(null);
  }

  async function checkAnswer(answer) {
    if (checking.current || feedback || busy) return;
    checking.current = true;
    unlockFeedbackAudio();
    setAnswers((current) => ({ ...current, [question.id]: answer }));
    setBusy(true);
    setError("");
    try {
      const checked = await api("/answer", {
        method: "POST",
        body: { subject: subjectTitle, topicId: topic.id, questionId: question.id, answer },
      });
      setFeedbacks((current) => ({ ...current, [question.id]: checked }));
      setReaction(checked);
    } catch (err) {
      setError(err.message);
      setAnswers((current) => { const copy = { ...current }; delete copy[question.id]; return copy; });
    }
    finally { setBusy(false); checking.current = false; }
  }

  async function finish() {
    setBusy(true);
    setError("");
    try {
      const grade = await api("/grade", {
        method: "POST",
        body: {
          subject: subjectTitle, topicId: topic.id,
          answers: topic.questions.map((q) => ({ questionId: q.id, answer: answers[q.id] })),
        },
      });
      fullscreen.collapse();
      setResult(grade);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  if (!total) return <p>Hozircha savollar qo‘shilmagan.</p>;
  if (result) return (
    <div className="result-card" role="status">
      <img src={checkIcon} alt="" />
      <h2>Test yakunlandi!</h2>
      <p>{result.total} ta savoldan {result.correct} tasiga to‘g‘ri javob berdingiz.</p>
      <div className="result-score"><strong>{result.correct} / {result.total}</strong><span>{result.percentage}%</span></div>
      <div className="quiz-navigation">
        <button type="button" className="primary-button" onClick={restart}>Qayta yechish</button>
        <Link to={`/subjects/${encodeURIComponent(subjectTitle)}`} className="secondary-button">Mavzularga qaytish</Link>
      </div>
    </div>
  );

  return (
    <div className={`quiz-panel subject-quiz-panel${fullscreen.expanded ? " is-expanded" : ""}`} style={background.style}>
      <div className="quiz-progress-row">
        <progress value={index + 1} max={total} aria-label="Savol tartibi" />
        <span className="question-counter" aria-live="polite">{index + 1} / {total}</span>
        <FullscreenButton fullscreen={fullscreen} label="Savol" />
      </div>
      {user && <div className="question-toolbar"><span>O‘qituvchi boshqaruvi</span>
        <EditActions label={`Savol ${index + 1}`} onEdit={() => onEdit(question)} onDelete={() => onDelete(question)} />
      </div>}
      <QuestionCard key={question.id} question={question} number={index + 1}
        feedback={feedback} busy={busy}
        selectedAnswer={answers[question.id]} onSelect={checkAnswer} />
      <p className="quiz-hint" role="status">{busy ? "Tekshirilmoqda..." : feedback ? "Javob qabul qilindi. Keyingi savolga o‘ting." : "Javob variantini bosing."}</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="quiz-navigation">
        <button type="button" className="secondary-button" disabled={index === 0 || busy} onClick={() => setIndex(index - 1)}>← Oldingi</button>
        {index < total - 1 ? (
          <button type="button" className="primary-button" disabled={busy || !feedback} onClick={() => { setError(""); setIndex(index + 1); }}>Keyingi →</button>
        ) : (
          <button type="button" className="primary-button" disabled={busy || topic.questions.some((q) => !feedbacks[q.id])} onClick={finish}>
            {busy ? "Tekshirilmoqda..." : "Yakunlash"}
          </button>
        )}
      </div>
      {reaction && <AnswerReactionModal feedback={reaction} number={index + 1}
        correctAnswer={question.options[reaction.correctAnswer]}
        continueLabel={index < total - 1 ? "Keyingi savol →" : "Natijani ko‘rish"}
        onContinue={() => {
          setReaction(null);
          if (index < total - 1) { setError(""); setIndex(index + 1); }
          else finish();
        }} />}
    </div>
  );
}

export default Quiz;
