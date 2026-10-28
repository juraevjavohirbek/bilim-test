import { Link, useParams } from "react-router-dom";
import puzzles from "../data/crosswords.json";
import LearningBackdrop from "../components/LearningBackdrop";
import CrosswordGame from "../components/CrosswordGame";

export default function Crosswords() {
  const { id } = useParams();
  const puzzle = puzzles.find((item) => item.id === id);
  if (!id) return <section className="subject-section container matching-collections crossword-catalog">
    <LearningBackdrop />
    <div className="page-heading"><h1>Krasvord</h1><p>To‘plamni tanlang, savollarni o‘qib kataklarni to‘ldiring.</p></div>
    <div className="topic-list">{puzzles.map((item, index) => <article className="topic-card" key={item.id}>
      <Link to={`/crosswords/${item.id}`} className="topic-link"><span className="topic-number">{index + 1}</span>
        <div><h2>{item.title}</h2><p>{item.entries.length} ta savol · {item.description}</p></div><span className="matching-row-arrow" aria-hidden="true">→</span></Link>
    </article>)}</div>
  </section>;
  if (!puzzle) return <section className="subject-section container"><Link to="/crosswords" className="back-link">← Krasvordlar</Link><h1>Krasvord topilmadi</h1></section>;
  return <section className="subject-section container crossword-page">
    <LearningBackdrop subject="Ona tili" />
    <Link to="/crosswords" className="back-link">← Krasvordlar</Link>
    <div className="page-heading"><h1>{puzzle.title}</h1><p>{puzzle.description}</p></div>
    <CrosswordGame key={puzzle.id} puzzle={puzzle} />
  </section>;
}
