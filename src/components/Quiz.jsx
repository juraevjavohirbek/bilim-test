import { useState } from "react";
import { Link } from "react-router-dom";
import QuestionCard from "./QuestionCard";
import EditActions from "./EditActions";
import { api } from "../lib/api";
import checkIcon from "../assets/check-circle.svg";

function Quiz({ topic, subjectTitle, user, onEdit, onDelete }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [feedbacks, setFeedbacks] = useState({});
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const question = topic.questions[index];
  const total = topic.questions.length;
  const feedback = question ? feedbacks[question.id] : null;

  function restart() {
    setIndex(0); setAnswers({}); setFeedbacks({}); setResult(null); setError("");
  }

  async function checkAnswer() {
    setBusy(true);
    setError("");
    try {
      const checked = await api("/answer", {
        method: "POST",
        body: { subject: subjectTitle, topicId: topic.id, questionId: question.id, answer: answers[question.id] },
      });
      setFeedbacks((current) => ({ ...current, [question.id]: checked }));
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
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
    <div className="quiz-panel">
      <div className="quiz-progress-row">
        <progress value={index + 1} max={total} aria-label="Savol tartibi" />
        <span className="question-counter" aria-live="polite">{index + 1} / {total}</span>
      </div>
      {user && <div className="question-toolbar"><span>O‘qituvchi boshqaruvi</span>
        <EditActions label={`Savol ${index + 1}`} onEdit={() => onEdit(question)} onDelete={() => onDelete(question)} />
      </div>}
      <QuestionCard key={question.id} question={question} number={index + 1}
        feedback={feedback} busy={busy}
        selectedAnswer={answers[question.id]} onSelect={(answer) => setAnswers((current) => ({ ...current, [question.id]: answer }))} />
      {feedback ? (
        <p className={`answer-feedback ${feedback.correct ? "feedback-correct" : "feedback-error"}`} role="status">
          {feedback.correct ? "To‘g‘ri javob!" : `Noto‘g‘ri. To‘g‘ri javob: ${String.fromCharCode(65 + feedback.correctAnswer)} — ${question.options[feedback.correctAnswer]}.`}
        </p>
      ) : <p className="quiz-hint">Variantni tanlang va “Javob berish” tugmasini bosing.</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="quiz-navigation">
        <button type="button" className="secondary-button" disabled={index === 0 || busy} onClick={() => setIndex(index - 1)}>← Oldingi</button>
        {!feedback ? (
          <button type="button" className="primary-button" disabled={busy || answers[question.id] === undefined} onClick={checkAnswer}>
            {busy ? "Tekshirilmoqda..." : "Javob berish"}
          </button>
        ) : index < total - 1 ? (
          <button type="button" className="primary-button" disabled={busy} onClick={() => { setError(""); setIndex(index + 1); }}>Keyingi →</button>
        ) : (
          <button type="button" className="primary-button" disabled={busy || topic.questions.some((q) => !feedbacks[q.id])} onClick={finish}>
            {busy ? "Tekshirilmoqda..." : "Yakunlash"}
          </button>
        )}
      </div>
    </div>
  );
}

export default Quiz;
