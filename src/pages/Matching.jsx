import { Link, useParams } from "react-router-dom";
import activities from "../data/matching.json";
import LearningBackdrop from "../components/LearningBackdrop";
import SubjectCard from "../components/SubjectCard";
import MatchingBoard from "../components/MatchingBoard";
import { getSubjectTheme } from "../lib/subjectThemes";
import { defaultSubjectIcon, subjectIcons } from "../lib/subjectIcons";

export default function Matching() {
  const { title } = useParams();
  const activity = Object.hasOwn(activities, title) ? activities[title] : null;
  if (!title) return <section className="subject-section container illustrated-subjects matching-catalog">
    <LearningBackdrop />
    <div className="page-heading"><h1>Bog‘lash</h1><p>Fanni tanlang va savolni o‘z javobiga bog‘lang!</p></div>
    <div className="subject-grid">{Object.keys(activities).map((subject) => <SubjectCard key={subject}
      title={subject} icon={subjectIcons[subject] ?? defaultSubjectIcon} description="Bog‘lash mashqi"
      to={`/matching/${encodeURIComponent(subject)}`} />)}</div>
  </section>;

  if (!activity) return <section className="subject-section container"><h1>Fan topilmadi</h1><Link to="/matching" className="back-link">← Bog‘lash fanlariga qaytish</Link></section>;
  const theme = getSubjectTheme(title);
  return <section className="subject-section container matching-page" style={{ "--match-ink": theme.color, "--match-paper": theme.paper }}>
    <LearningBackdrop subject={title} />
    <Link to="/matching" className="back-link">← Bog‘lash fanlari</Link>
    <div className="matching-page-heading">
      <span className="matching-subject-icon" aria-hidden="true"><img src={subjectIcons[title] ?? defaultSubjectIcon} alt="" /></span>
      <div className="page-heading"><p>{title} · Bog‘lash</p><h1>{activity.title}</h1></div>
    </div>
    <MatchingBoard key={title} activity={activity} />
  </section>;
}
