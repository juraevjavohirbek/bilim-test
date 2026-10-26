import { useId } from "react";

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
          return (
          <label className="question-option" key={index}>
            <input type="radio" name={groupName} value={index}
              disabled={Boolean(feedback) || busy}
              checked={selectedAnswer === index} onChange={() => onSelect(index)} />
            <span className="option-letter" aria-hidden="true">
              {String.fromCharCode(65 + index)}
            </span>
            <span className="option-text">{option}</span>
          </label>
          );
        })}
      </div>
    </section>
  );
}

export default QuestionCard;
