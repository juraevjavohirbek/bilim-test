import { Link, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import LearningBackdrop from "../components/LearningBackdrop";
import MatchingBoard from "../components/MatchingBoard";
import MatchingEditor from "../components/MatchingEditor";
import { getSubjectTheme } from "../lib/subjectThemes";
import { defaultSubjectIcon, subjectIcons } from "../lib/subjectIcons";
import useMatching from "../hooks/useMatching";
import { useApp } from "../hooks/useApp";
import editIcon from "../assets/edit.svg";

export default function Matching() {
  const { title: groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useApp();
  const { groups, error, loading, save } = useMatching();
  const [editor, setEditor] = useState(null);
  // Eski fan havolalari ham avvalgi tayyor mashqni ochadi.
  const group = groups?.find((item) => item.id === groupId) ?? groups?.find((item) => item.subject === groupId);

  async function saveGroup(values) {
    const data = await save(values, Boolean(editor.group));
    const saved = data.find((item) => item.id === values.id) ?? data.find((item) => item.title === values.title.trim());
    setEditor(null);
    navigate(`/matching/${encodeURIComponent(saved.id)}`);
  }

  const editorModal = editor && <MatchingEditor key={editor.group?.id ?? "new"} group={editor.group}
    onClose={() => setEditor(null)} onSave={saveGroup} />;

  if (!groupId) return <section className="subject-section container matching-collections">
    <LearningBackdrop />
    <div className="matching-collection-header">
      <div className="page-heading"><h1>Bog‘lash</h1><p>To‘plamni tanlang va savollarni javoblariga bog‘lang.</p></div>
      {user && <button type="button" className="primary-button" onClick={() => setEditor({ group: null })}>+ Yangi to‘plam qo‘shish</button>}
    </div>
    {loading && <p role="status">To‘plamlar yuklanmoqda...</p>}
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="topic-list">{groups?.map((item, index) => <article className="topic-card matching-collection-card" key={item.id}>
      <Link to={`/matching/${encodeURIComponent(item.id)}`} className="topic-link">
        <span className="topic-number">{index + 1}</span><div><h2>{item.title}</h2><p>{item.pairs.length} ta savol va javob</p></div><span className="matching-row-arrow" aria-hidden="true">→</span>
      </Link>
      {user && <button type="button" className="icon-button" aria-label={`${item.title} — tahrirlash`} onClick={() => setEditor({ group: item })}><img src={editIcon} alt="" /></button>}
    </article>)}</div>
    {groups?.length === 0 && <p>Hozircha to‘plam qo‘shilmagan.</p>}
    {editorModal}
  </section>;

  if (!group) return <section className="subject-section container">
    <LearningBackdrop /><Link to="/matching" className="back-link">← Bog‘lash to‘plamlari</Link>
    {loading ? <p role="status">To‘plam yuklanmoqda...</p> : <h1>{error || "To‘plam topilmadi"}</h1>}
  </section>;
  const theme = getSubjectTheme(group.subject);
  return <section className="subject-section container matching-page" style={{ "--match-ink": theme.color, "--match-paper": theme.paper }}>
    <LearningBackdrop subject={group.subject} />
    <Link to="/matching" className="back-link">← Bog‘lash to‘plamlari</Link>
    <div className="matching-page-heading">
      <span className="matching-subject-icon" aria-hidden="true"><img src={subjectIcons[group.subject] ?? defaultSubjectIcon} alt="" /></span>
      <div className="page-heading"><p>{group.subject} · Bog‘lash</p><h1>{group.title}</h1></div>
      {user && <button type="button" className="secondary-button matching-edit-button" onClick={() => setEditor({ group })}><img src={editIcon} alt="" /> Tahrirlash</button>}
    </div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <MatchingBoard key={`${group.id}:${JSON.stringify(group.pairs)}`} activity={group} />
    {editorModal}
  </section>;
}
