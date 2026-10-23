import { useId } from "react";
import correctIcon from "../assets/check-circle.svg";
import errorIcon from "../assets/error-circle.svg";

function QuestionCard({ question, number, selectedAnswer, onSelect, feedback, busy }) {
  const groupName = useId();
  const headingId = `${groupName}-title`;

  return (
    <section className="question-card" aria-labelledby={headingId}>
      <h2 className="question-title" id={headingId}>
        <span className="question-number">{number}</span>
        <span>{question.text}</span>
      </h2>
      <div className="question-options" role="radiogroup" aria-labelledby={headingId}>
        {question.options.map((option, index) => {
          const correct = feedback && index === feedback.correctAnswer;
          const wrong = feedback && index === selectedAnswer && !correct;
          return (
          <label className={`question-option${correct ? " is-correct" : wrong ? " is-wrong" : ""}`} key={index}>
            <input type="radio" name={groupName} value={index}
              disabled={Boolean(feedback) || busy}
              checked={selectedAnswer === index} onChange={() => onSelect(index)} />
            <span className="option-letter" aria-hidden="true">
              {String.fromCharCode(65 + index)}
            </span>
            <span className="option-text">{option}</span>
            {(correct || wrong) && <>
              <img className={`answer-icon ${correct ? "answer-icon-correct" : "answer-icon-error"}`} src={correct ? correctIcon : errorIcon} alt="" />
              <span className="sr-only">{correct ? "To‘g‘ri javob" : "Noto‘g‘ri javob"}</span>
            </>}
          </label>
          );
        })}
      </div>
    </section>
  );
}

export default QuestionCard;
