import { useEffect, useId, useRef } from "react";
import { Link } from "react-router-dom";
import { resultStars } from "../lib/gameModes";

export default function ResultSummary({ title, correct, total, onRestart, subjectTitle, children }) {
  const dialog = useRef(null);
  const headingId = useId();
  const stars = resultStars(correct, total);
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);

  return <dialog ref={dialog} className="answer-reaction-modal completion-modal" aria-labelledby={headingId}
    onCancel={(event) => event.preventDefault()}>
    <div className="result-stars" role="img" aria-label={`${stars} ta yulduz`}>
      {Array.from({ length: stars }, (_, index) => <span key={index} aria-hidden="true">★</span>)}
    </div>
    <h2 id={headingId}>{title}</h2>
    <p className="result-praise">{stars === 3 ? "Barakalla! Barchasini topdingiz!" : stars === 2 ? "Ajoyib natija! Yana bir urinib ko‘ring!" : "Har bir urinish — yangi bilim!"}</p>
    <div className="completion-score"><strong>{correct} / {total}</strong><span>{Math.round(correct / total * 100)}%</span></div>
    {children && <div className="completion-teams">{children}</div>}
    <div className="completion-actions">
      <button type="button" className="primary-button" onClick={onRestart}>Qayta boshlash</button>
      <Link className="secondary-button" to={`/subjects/${encodeURIComponent(subjectTitle)}`}>Mavzularga qaytish</Link>
    </div>
  </dialog>;
}
