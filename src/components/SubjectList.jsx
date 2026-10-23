import SubjectCard from "./SubjectCard";
import useTopics from "../hooks/useTopics";
import bookIcon from "../assets/book.svg";
import calculatorIcon from "../assets/calculator.svg";
import historyIcon from "../assets/history.svg";
import globeIcon from "../assets/globe.svg";
import flaskIcon from "../assets/flask.svg";
import monitorIcon from "../assets/monitor.svg";

const icons = {
  "Ona tili": bookIcon,
  Matematika: calculatorIcon,
  Tarix: historyIcon,
  Geografiya: globeIcon,
  "Tabiiy fanlar": flaskIcon,
  Informatika: monitorIcon,
  Fizika: flaskIcon,
  Kimyo: flaskIcon,
  Biologiya: globeIcon,
  "Ingliz tili": bookIcon,
};

function SubjectList() {
  const { topics, error, loading } = useTopics();

  return (
    <section className="subject-section container">
      <div className="page-heading">
        <h1>Fanlar va savollar</h1>
        <p>Mavzularni ko‘rish uchun fanni tanlang.</p>
      </div>

      {loading && <p role="status">Fanlar yuklanmoqda...</p>}
      {error && <p role="alert">{error}</p>}
      {topics && (
        <div className="subject-grid">
          {Object.keys(topics).map((title) => (
            <SubjectCard key={title} title={title} icon={icons[title] ?? bookIcon} />
          ))}
        </div>
      )}
    </section>
  );
}

export default SubjectList;
