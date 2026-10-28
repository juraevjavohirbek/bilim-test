import { Link, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import useMatching from "../hooks/useMatching";
import { useApp } from "../hooks/useApp";
import CrosswordEditor from "../components/CrosswordEditor";
import editIcon from "../assets/edit.svg";
import LearningBackdrop from "../components/LearningBackdrop";
import CrosswordGame from "../components/CrosswordGame";

export default function Crosswords() {
  const { id } = useParams();
  const navigate = useNavigate(); const { user } = useApp();
  const { groups: puzzles, loading, error, save } = useMatching("/crosswords");
  const [editor, setEditor] = useState(null);
  const puzzle = puzzles?.find((item) => item.id === id);
  async function savePuzzle(values) {
    const data = await save(values, Boolean(editor.puzzle));
    const saved = data.find((item) => item.id === values.id) ?? data.find((item) => item.title === values.title.trim());
    setEditor(null); navigate(`/crosswords/${encodeURIComponent(saved.id)}`);
  }
  const editorModal = editor && <CrosswordEditor key={editor.puzzle?.id ?? "new"} puzzle={editor.puzzle} onClose={() => setEditor(null)} onSave={savePuzzle} />;
  if (!id) return <section className="subject-section container matching-collections crossword-catalog">
    <LearningBackdrop />
    <div className="matching-collection-header"><div className="page-heading"><h1>Krasvord</h1><p>To‘plamni tanlang, savollarni o‘qib kataklarni to‘ldiring.</p></div>
      {user && <button type="button" className="primary-button" onClick={() => setEditor({ puzzle: null })}>+ Yangi krasvord qo‘shish</button>}</div>
    {loading && <p role="status">Krasvordlar yuklanmoqda...</p>}{error && <p className="form-error" role="alert">{error}</p>}
    <div className="topic-list">{puzzles?.map((item, index) => <article className="topic-card matching-collection-card" key={item.id}>
      <Link to={`/crosswords/${item.id}`} className="topic-link"><span className="topic-number">{index + 1}</span>
        <div><h2>{item.title}</h2><p>{item.entries.length} ta savol · {item.description}</p></div><span className="matching-row-arrow" aria-hidden="true">→</span></Link>
      {user && <button type="button" className="icon-button" aria-label={`${item.title} — tahrirlash`} onClick={() => setEditor({ puzzle: item })}><img src={editIcon} alt="" /></button>}
    </article>)}</div>{editorModal}
  </section>;
  if (!puzzle) return <section className="subject-section container"><Link to="/crosswords" className="back-link">← Krasvordlar</Link><h1>{loading ? "Yuklanmoqda..." : error || "Krasvord topilmadi"}</h1></section>;
  return <section className="subject-section container crossword-page">
    <LearningBackdrop subject={puzzle.subject ?? "Ona tili"} />
    <Link to="/crosswords" className="back-link">← Krasvordlar</Link>
    <div className="matching-collection-header"><div className="page-heading"><h1>{puzzle.title}</h1><p>{puzzle.description}</p></div>
      {user && <button type="button" className="secondary-button matching-edit-button" onClick={() => setEditor({ puzzle })}><img src={editIcon} alt="" /> Tahrirlash</button>}</div>
    <CrosswordGame key={`${puzzle.id}:${JSON.stringify(puzzle.entries)}`} puzzle={puzzle} />{editorModal}
  </section>;
}
