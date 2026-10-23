import { Link, useParams, useSearchParams } from "react-router-dom";
import useTopics from "../hooks/useTopics";
import { useState } from "react";
import { useApp } from "../hooks/useApp";
import EditActions from "../components/EditActions";
import EditorModal from "../components/EditorModal";
import plusIcon from "../assets/plus.svg";
import GameModeSelect from "../components/GameModeSelect";
import { normalizeMode, modeQuery } from "../lib/gameModes";

function SubjectPage() {
  const { title } = useParams();
  const { topics, error, loading } = useTopics();
  const { user, mutate } = useApp();
  const [editor, setEditor] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = normalizeMode(searchParams.get("mode"));
  // Oldingi bo‘sh joysiz manzillar ham ochiladi.
  const subjectTitle = { Onatili: "Ona tili", Tabiiyfanlar: "Tabiiy fanlar" }[title] ?? title;
  const subjectTopics = topics?.[subjectTitle];

  return (
    <section className="subject-section container">
      <Link to="/subjects" className="back-link">← Barcha fanlar</Link>
      <div className="subject-mode-header">
        <div className="page-heading">
          <h1>{subjectTitle}</h1>
          <p>Fan mavzulari va testlari</p>
        </div>
        <GameModeSelect mode={mode} onChange={(value) => setSearchParams(value === "normal" ? {} : { mode: value })} />
      </div>

      {loading && <p role="status">Mavzular yuklanmoqda...</p>}
      {error && <p role="alert">{error}</p>}
      {topics && !subjectTopics && <p>Bunday fan topilmadi.</p>}
      {user && subjectTopics && <div className="add-topic-card">
        <button type="button" onClick={() => setEditor({ mode: "create", kind: "topic" })}>
          <img src={plusIcon} alt="" /> Yangi mavzu qo‘shish
        </button>
      </div>}
      {subjectTopics?.length === 0 && <p>Hozircha mavzular yo‘q.</p>}
      <div className="topic-list">
        {subjectTopics?.map((topic, index) => (
          <article className="topic-card" key={topic.id}>
            <Link className="topic-link" to={`/subjects/${encodeURIComponent(subjectTitle)}/topics/${encodeURIComponent(topic.id)}${modeQuery(mode)}`}>
              <span className="topic-number" aria-hidden="true">{index + 1}</span>
              <div>
                <h2>{topic.title}</h2>
                <p>{topic.questions.length} ta savol</p>
              </div>
              <span className="topic-arrow" aria-hidden="true">→</span>
            </Link>
            {user && <EditActions label={topic.title}
              onEdit={() => setEditor({ mode: "edit", topic })}
              onDelete={() => setEditor({ mode: "delete", topic })} />}
          </article>
        ))}
      </div>
      {user && editor && <EditorModal editor={editor} onClose={() => setEditor(null)}
        onSave={(values) => mutate("/topics", editor.mode === "create" ? "POST" : editor.mode === "delete" ? "DELETE" : "PATCH", {
          subject: subjectTitle, topicId: editor.topic?.id, ...values,
        })} />}
    </section>
  );
}

export default SubjectPage;
