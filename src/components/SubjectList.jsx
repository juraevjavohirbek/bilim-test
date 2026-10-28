import SubjectCard from "./SubjectCard";
import useTopics from "../hooks/useTopics";
import LearningBackdrop from "./LearningBackdrop";
import { subjectIcons, defaultSubjectIcon } from "../lib/subjectIcons";

function SubjectList() {
  const { topics, error, loading } = useTopics();

  return (
    <section className="subject-section container illustrated-subjects">
      <LearningBackdrop />
      <div className="page-heading">
        <h1>Fanlar va savollar</h1>
        <p>Mavzularni ko‘rish uchun fanni tanlang.</p>
      </div>

      {loading && <p role="status">Fanlar yuklanmoqda...</p>}
      {error && <p role="alert">{error}</p>}
      {topics && (
        <div className="subject-grid">
          {Object.keys(topics).map((title) => (
            <SubjectCard key={title} title={title} icon={subjectIcons[title] ?? defaultSubjectIcon} />
          ))}
        </div>
      )}
    </section>
  );
}

export default SubjectList;
