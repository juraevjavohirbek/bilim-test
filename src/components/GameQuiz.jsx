import { useEffect, useRef, useState } from "react";
import GameQuestionModal from "./GameQuestionModal";
import LottoBalls from "./LottoBalls";
import { gameModes, remainingQuestions, pickUnusedQuestion, teamScores, wheelPoint, wheelRotation } from "../lib/gameModes";
import boyHost from "../assets/doppi-boy.png";
import { subjectBackground } from "../lib/subjectBackgrounds";
import useFullscreen from "../hooks/useFullscreen";
import FullscreenButton from "./FullscreenButton";
import { preloadFeedbackAudio } from "../lib/feedbackSounds";

const colors = ["#a454cf", "#dc567e", "#d9a027", "#258e79", "#e07739", "#6f62cb"];

function Wheel({ questions, answers, rotation, spinning, duration, onDraw, pending }) {
  const available = remainingQuestions(questions, answers);
  const step = 360 / available.length;
  return (
    <div className="wheel-stage">
      <img src={boyHost} alt="Barabanni ushlab turgan do‘ppili bola" className="game-character" />
      <div className="wheel-shell">
        <span className="wheel-pointer" aria-hidden="true" />
        <svg viewBox="0 0 320 320" className="wheel-disc" role="img" aria-label={`${available.length} ta raqamli baraban`}
          style={{ transform: `rotate(${rotation}deg)`, transitionDuration: `${duration}ms` }}>
          {available.map(({ question, index: originalIndex }, index) => {
            const start = wheelPoint(index * step, 157);
            const end = wheelPoint((index + 1) * step, 157);
            const label = wheelPoint((index + 0.5) * step, 120);
            const fill = colors[originalIndex % colors.length];
            return <g key={question.id}>
              {available.length === 1
                ? <circle cx="160" cy="160" r="157" fill={fill} />
                : <path d={`M160 160 L${start.x} ${start.y} A157 157 0 ${step > 180 ? 1 : 0} 1 ${end.x} ${end.y} Z`} fill={fill} stroke="#fff2ce" strokeWidth="2" />}
              <text x={label.x} y={label.y} textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize={Math.max(6, Math.min(25, 350 / available.length))} fontWeight="800">{originalIndex + 1}</text>
            </g>;
          })}
        </svg>
        <button type="button" className="wheel-center" onClick={onDraw} disabled={spinning}
          aria-label={pending ? "Savolni davom ettirish" : "Barabanni aylantirish"}>
          <span aria-hidden="true">{spinning ? "✦" : "↻"}</span>
          {spinning ? "Aylanmoqda" : pending ? "Davom etish" : "Aylantir"}
        </button>
      </div>
    </div>
  );
}

function Lotto({ questions, answers, spinning, selectedIndex, onDraw, pending }) {
  const count = remainingQuestions(questions, answers).length;
  return (
    <div className="lotto-stage">
      <div className="lotto-machine">
      <img src={boyHost} alt="Lotto o‘yinini olib borayotgan do‘ppili bola" className="game-character" />
      <div className={`lotto-drum${spinning ? " is-spinning" : ""}`} aria-label={`${count} ta raqamli lotto`}>
        <LottoBalls questions={questions} answers={answers} spinning={spinning} colors={colors} />
        {!spinning && pending && selectedIndex !== null && <span className="lotto-selected" aria-hidden="true">{selectedIndex + 1}</span>}
      </div>
      <div className="lotto-base" aria-hidden="true" />
      </div>
      <button type="button" className="primary-button lotto-draw" onClick={onDraw} disabled={spinning}>
        {spinning ? "Aralashtirilmoqda..." : pending ? "Savolni davom ettirish" : "Lotto aylantirish"}
      </button>
    </div>
  );
}

function TugBoard({ answers, total, turn, onDraw, pending }) {
  const scores = teamScores(answers);
  const offset = (scores[1] - scores[0]) / total * 38;
  return (
    <div className="tug-board">
      <div className="team-cards">
        {[boyHost, boyHost].map((host, team) => <div key={team} className={`team-card team-${team}${turn === team ? " is-active" : ""}`}>
          <img src={host} alt="" />
          <strong>{team + 1}-jamoa</strong><span>{scores[team]} ball</span>
          {turn === team && <small>Hozir sizning navbatingiz!</small>}
        </div>)}
      </div>
      <div className="rope-arena" aria-label={`Arqon tortish hisobi: ${scores[0]} — ${scores[1]}`}>
        <span className="rope-center-line" aria-hidden="true" />
        <div className="rope-slider" style={{ transform: `translateX(${offset}%)` }} aria-hidden="true"><div className="rope-line" /><span className="rope-knot">⚑</span></div>
        <span className="rope-ground" aria-hidden="true" />
      </div>
      <p className="game-instruction">To‘g‘ri javob arqonni jamoangiz tomoniga tortadi. Har javobdan keyin navbat almashadi.</p>
      <button type="button" className="primary-button" onClick={onDraw}>{pending ? "Savolni davom ettirish" : `${turn + 1}-jamoa uchun savol`}</button>
    </div>
  );
}

export default function GameQuiz({ mode, topic, subjectTitle, user, onEdit, onDelete }) {
  const fullscreen = useFullscreen();
  const [answers, setAnswers] = useState({});
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [duration, setDuration] = useState(2800);
  const [turn, setTurn] = useState(0);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedBackground, setSelectedBackground] = useState(0);
  const timer = useRef(null);
  const total = topic.questions.length;
  const done = Object.keys(answers).length;
  const selected = topic.questions[selectedIndex];
  const pending = Boolean(selected && !Object.hasOwn(answers, selected.id));
  const label = gameModes.find((item) => item.value === mode)?.label;
  const background = subjectBackground(subjectTitle, { wheel: 0, lotto: 1, tug: 2 }[mode]);

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => { void preloadFeedbackAudio(); }, []);

  function draw() {
    if (spinning) return;
    if (pending) { setModalOpen(true); return; }
    const index = pickUnusedQuestion(topic.questions, answers);
    if (index === null) return;
    setSelectedIndex(index);
    setSelectedBackground(done % 3);
    setSelectedTeam(mode === "tug" ? turn : null);
    if (mode === "tug") { setModalOpen(true); return; }
    const milliseconds = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : mode === "wheel" ? 2800 : 2100;
    setDuration(milliseconds);
    const available = remainingQuestions(topic.questions, answers);
    const position = available.findIndex((entry) => entry.index === index);
    setRotation((current) => wheelRotation(current, position, available.length));
    setSpinning(true);
    timer.current = setTimeout(() => { setSpinning(false); setModalOpen(true); }, milliseconds);
  }

  function recordAnswer(record) {
    setAnswers((current) => Object.hasOwn(current, selected.id) ? current : { ...current, [selected.id]: record });
    setDuration(0);
    setRotation(0);
    if (mode === "tug") setTurn((current) => 1 - current);
  }

  function restart() {
    clearTimeout(timer.current);
    setAnswers({}); setSelectedIndex(null); setModalOpen(false); setSpinning(false);
    setRotation(0); setTurn(0); setSelectedTeam(null);
    setSelectedBackground(0);
  }

  if (!total) return <p>Hozircha savollar qo‘shilmagan.</p>;
  const correct = Object.values(answers).filter((record) => record.feedback.correct).length;
  const scores = teamScores(answers);

  return (
    <div className={`game-panel game-${mode} subject-game-panel${fullscreen.expanded ? " is-expanded" : ""}`} data-theme={background.theme} style={background.style}>
      <div className="game-panel-header"><span className="game-label">{label}</span><div className="panel-corner-actions"><span className="question-counter">{done} / {total} bajarildi</span><FullscreenButton fullscreen={fullscreen} label="O‘yin" /></div></div>
      {done === total && !modalOpen ? (
        <div className="game-finished" role="status">
          <span className="game-trophy" aria-hidden="true">★</span>
          <h2>O‘yin yakunlandi!</h2>
          {mode === "tug" ? <><h3>{scores[0] === scores[1] ? "Do‘stlik g‘alaba qozondi!" : `${scores[0] > scores[1] ? 1 : 2}-jamoa g‘olib!`}</h3><p>1-jamoa: {scores[0]} ball · 2-jamoa: {scores[1]} ball</p></>
            : <p>{total} ta savoldan {correct} ta to‘g‘ri javob — {Math.round(correct / total * 100)}%</p>}
          <button type="button" className="primary-button" onClick={restart}>Qayta o‘ynash</button>
        </div>
      ) : <>
        <p className="game-instruction">{mode === "wheel" ? "Do‘ppili do‘stimiz bilan barabanni aylantiring!" : mode === "lotto" ? "Do‘ppili do‘stimiz bilan omadli raqamni toping!" : "Ikki jamoa — bitta quvnoq bellashuv!"}</p>
        {mode === "wheel" && <Wheel questions={topic.questions} answers={answers} rotation={rotation} spinning={spinning} duration={duration} onDraw={draw} pending={pending} />}
        {mode === "lotto" && <Lotto questions={topic.questions} answers={answers} spinning={spinning} selectedIndex={selectedIndex} onDraw={draw} pending={pending} />}
        {mode === "tug" && <TugBoard answers={answers} total={total} turn={turn} onDraw={draw} pending={pending} />}
        <p className="draw-status" role="status">{spinning ? "Raqam tanlanmoqda..." : pending ? `${selectedIndex + 1}-savol tanlandi` : done ? `${total - done} ta savol qoldi. Yana aylantiring!` : "Birinchi savolni tanlang"}</p>
        <p className="game-footnote">Har bir raqam mavzudagi bitta savolga teng. Javob berilgan savol qayta tushmaydi.</p>
      </>}
      {modalOpen && selected && <GameQuestionModal key={selected.id} question={selected} number={selectedIndex + 1}
        backgroundVariant={selectedBackground}
        subjectTitle={subjectTitle} topicId={topic.id} team={selectedTeam} record={answers[selected.id]} user={user}
        onAnswered={recordAnswer} onClose={() => setModalOpen(false)}
        onContinue={() => { setModalOpen(false); draw(); }} onEdit={onEdit} onDelete={onDelete} />}
    </div>
  );
}
