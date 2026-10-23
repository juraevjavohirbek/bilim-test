import { Link, useParams, useSearchParams } from "react-router-dom";
import useTopics from "../hooks/useTopics";
import { useState } from "react";
import { useApp } from "../hooks/useApp";
import Quiz from "../components/Quiz";
import EditorModal from "../components/EditorModal";
import plusIcon from "../assets/plus.svg";
import GameModeSelect from "../components/GameModeSelect";
import GameQuiz from "../components/GameQuiz";
import { normalizeMode, modeQuery } from "../lib/gameModes";

function TopicPage() {
  const { title, topicId } = useParams();
  const { topics, error, loading } = useTopics();
  const { user, mutate } = useApp();
  const [editor, setEditor] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = normalizeMode(searchParams.get("mode"));
  const subjectTitle = { Onatili: "Ona tili", Tabiiyfanlar: "Tabiiy fanlar" }[title] ?? title;
  const topic = topics?.[subjectTitle]?.find((item) => item.id === topicId);

  return (
    <section className={`subject-section container${mode !== "normal" ? " game-topic-page" : ""}`}>
      <Link to={`/subjects/${encodeURIComponent(subjectTitle)}${modeQuery(mode)}`} className="back-link">
        ← {subjectTitle} mavzulari
      </Link>

      {loading && <p role="status">Savollar yuklanmoqda...</p>}
      {error && <p role="alert">{error}</p>}
      {topics && !topic && <p>Bunday mavzu topilmadi.</p>}
      {topic && (
        <>
          <div className="subject-mode-header">
            <div className="page-heading">
              <h1>{topic.title}</h1>
              <p>{subjectTitle} · {topic.questions.length} ta savol</p>
            </div>
            <GameModeSelect mode={mode} onChange={(value) => setSearchParams(value === "normal" ? {} : { mode: value })} />
          </div>

          {user && <div className="topic-toolbar">
            <button type="button" className="primary-button" onClick={() => setEditor({ mode: "create", kind: "question", topic })}>
              <img src={plusIcon} alt="" /> Savol qo‘shish
            </button>
          </div>}

          {mode === "normal" ? <Quiz key={`${subjectTitle}/${topic.id}/${JSON.stringify(topic.questions)}`} topic={topic}
            subjectTitle={subjectTitle} user={user}
            onEdit={(question) => setEditor({ mode: "edit", topic, question })}
            onDelete={(question) => setEditor({ mode: "delete", topic, question })} />
            : <GameQuiz key={`${mode}/${subjectTitle}/${topic.id}/${JSON.stringify(topic.questions)}`} mode={mode} topic={topic}
              subjectTitle={subjectTitle} user={user}
              onEdit={(question) => setEditor({ mode: "edit", topic, question })}
              onDelete={(question) => setEditor({ mode: "delete", topic, question })} />}
        </>
      )}
      {user && editor && <EditorModal editor={editor} onClose={() => setEditor(null)}
        onSave={(values) => mutate("/questions", editor.mode === "create" ? "POST" : editor.mode === "delete" ? "DELETE" : "PATCH", {
          subject: subjectTitle, topicId: editor.topic.id, questionId: editor.question?.id, ...values,
        })} />}
    </section>
  );
}

export default TopicPage;
