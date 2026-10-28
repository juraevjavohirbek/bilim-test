import { useLayoutEffect, useRef, useState } from "react";
import { connectMatch, connectionPath, shuffleMatchingColumns } from "../lib/matching";
import useFullscreen from "../hooks/useFullscreen";
import FullscreenButton from "./FullscreenButton";

export default function MatchingBoard({ activity }) {
  const fullscreen = useFullscreen();
  const { pairs } = activity;
  const board = useRef(null);
  const questions = useRef(new Map());
  const answerCards = useRef(new Map());
  const pointer = useRef(null);
  const skipClick = useRef(null);
  const [columns, setColumns] = useState(() => shuffleMatchingColumns(pairs));
  const { questions: questionOrder, answers } = columns;
  const [matched, setMatched] = useState([]);
  const [selected, setSelected] = useState(null);
  const [drag, setDrag] = useState(null);
  const [anchors, setAnchors] = useState({});
  const [message, setMessage] = useState("Savolni javobiga olib boring yoki ikkalasini ketma-ket bosing.");
  const [warning, setWarning] = useState(false);
  const complete = matched.length === pairs.length;

  useLayoutEffect(() => {
    const element = board.current;
    function measure() {
      const bounds = element.getBoundingClientRect();
      const point = (card, side) => {
        const rect = card.getBoundingClientRect();
        return { x: (side === "right" ? rect.right : rect.left) - bounds.left, y: rect.top + rect.height / 2 - bounds.top };
      };
      setAnchors(Object.fromEntries(pairs.map((pair) => [pair.id, {
        from: point(questions.current.get(pair.id), "right"),
        to: point(answerCards.current.get(pair.id), "left"),
      }])));
    }
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    for (const card of [...questions.current.values(), ...answerCards.current.values()]) observer.observe(card);
    window.addEventListener("resize", measure);
    return () => { observer.disconnect(); window.removeEventListener("resize", measure); };
  }, [pairs, questionOrder, answers]);

  function choose(id) {
    if (matched.includes(id)) return;
    setSelected(id);
    setWarning(false);
    setMessage("Endi unga mos javobni tanlang.");
  }

  function connect(questionId, answerId) {
    if (matched.includes(answerId)) {
      setWarning(true);
      setMessage("Bu javob allaqachon bog‘langan. Boshqa javobni tanlang.");
      return;
    }
    const next = connectMatch(pairs, matched, questionId, answerId);
    if (next === matched) {
      setWarning(true);
      setMessage("Bu juftlik mos kelmadi. Yana urinib ko‘ring!");
      return;
    }
    setMatched(next);
    setSelected(null);
    setWarning(false);
    setMessage(next.length === pairs.length ? "Barakalla! Barcha juftliklarni to‘g‘ri bog‘ladingiz!" : "To‘g‘ri bog‘ladingiz! Keyingi juftlikni toping.");
  }

  function startDrag(event, id) {
    if (event.button !== 0 || matched.includes(id)) return;
    skipClick.current = null;
    choose(id);
    const rect = event.currentTarget.getBoundingClientRect();
    const bounds = board.current.getBoundingClientRect();
    pointer.current = {
      id, pointerId: event.pointerId, x: event.clientX, y: event.clientY, moved: false,
      from: { x: rect.right - bounds.left, y: rect.top + rect.height / 2 - bounds.top },
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event) {
    const current = pointer.current;
    if (!current || current.pointerId !== event.pointerId) return;
    if (Math.hypot(event.clientX - current.x, event.clientY - current.y) > 6) current.moved = true;
    if (!current.moved) return;
    const rect = board.current.getBoundingClientRect();
    setDrag({ from: current.from, to: { x: event.clientX - rect.left, y: event.clientY - rect.top } });
  }

  function endDrag(event) {
    const current = pointer.current;
    if (!current || current.pointerId !== event.pointerId) return;
    pointer.current = null;
    setDrag(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (!current.moved) return;
    skipClick.current = current.id;
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-answer-id]");
    if (target && board.current.contains(target)) connect(current.id, target.dataset.answerId);
  }

  function cancelDrag() { pointer.current = null; setDrag(null); }

  function restart() {
    cancelDrag();
    setMatched([]); setSelected(null); setColumns(shuffleMatchingColumns(pairs)); setWarning(false);
    setMessage("Yangi urinish! Savolni mos javobga bog‘lang.");
  }

  return <div className={`matching-shell${fullscreen.expanded ? " is-expanded" : ""}`}>
    <div className="matching-toolbar">
      <div className="matching-progress" aria-label={`${matched.length} ta juftlik bog‘landi, jami ${pairs.length}`}>
        <span aria-hidden="true">{complete ? "★" : "✦"}</span>
        <strong>{matched.length} / {pairs.length}</strong><span>bog‘landi</span>
      </div>
      <div className="panel-corner-actions">
        <button type="button" className="secondary-button" onClick={restart}>↻ Qayta boshlash</button>
        <FullscreenButton fullscreen={fullscreen} label="Bog‘lash" />
      </div>
    </div>
    <p className={`matching-message${warning ? " is-warning" : ""}`} role="status" aria-live="polite">{message}</p>
    <div className="matching-board" ref={board} onKeyDown={(event) => {
      if (event.key === "Escape") { cancelDrag(); setSelected(null); }
    }}>
      <svg className="matching-ropes" aria-hidden="true">
        {matched.map((id) => anchors[id] && <g key={id}>
          <path className="matching-rope-shadow" d={connectionPath(anchors[id].from, anchors[id].to)} />
          <path className="matching-rope" d={connectionPath(anchors[id].from, anchors[id].to)} />
        </g>)}
        {drag && <path className="matching-rope is-dragging" d={connectionPath(drag.from, drag.to)} />}
      </svg>
      <div className="matching-column">
        <h2><span aria-hidden="true">?</span> Savollar</h2>
        {questionOrder.map((pair, index) => <button key={pair.id} type="button"
          ref={(element) => { if (element) questions.current.set(pair.id, element); else questions.current.delete(pair.id); }}
          className={`matching-card matching-question${selected === pair.id ? " is-selected" : ""}${matched.includes(pair.id) ? " is-matched" : ""}`}
          aria-pressed={selected === pair.id} aria-label={`Savol: ${pair.question}`} disabled={matched.includes(pair.id)}
          onPointerDown={(event) => startDrag(event, pair.id)} onPointerMove={moveDrag} onPointerUp={endDrag}
          onPointerCancel={cancelDrag} onLostPointerCapture={cancelDrag}
          onClick={() => { if (skipClick.current === pair.id) { skipClick.current = null; return; } skipClick.current = null; choose(pair.id); }}>
          <span className="matching-card-number" aria-hidden="true">{matched.includes(pair.id) ? "✓" : index + 1}</span>
          <span>{pair.question}</span><i className="matching-port" aria-hidden="true" />
        </button>)}
      </div>
      <div className="matching-column matching-answer-column">
        <h2><span aria-hidden="true">✓</span> Javoblar</h2>
        {answers.map((pair) => <button key={pair.id} type="button" data-answer-id={pair.id}
          ref={(element) => { if (element) answerCards.current.set(pair.id, element); else answerCards.current.delete(pair.id); }}
          className={`matching-card matching-answer${matched.includes(pair.id) ? " is-matched" : ""}`}
          aria-label={`Javob: ${pair.answer}`} disabled={matched.includes(pair.id)}
          onClick={() => {
            if (selected) connect(selected, pair.id);
            else { setWarning(false); setMessage("Avval chap ustundan savolni tanlang."); }
          }}>
          <i className="matching-port" aria-hidden="true" /><span>{pair.answer}</span>
          {matched.includes(pair.id) && <span className="matching-check" aria-hidden="true">✓</span>}
        </button>)}
      </div>
    </div>
    {complete && <div className="matching-complete" role="status"><span aria-hidden="true">🏆</span><div><h2>Barakalla!</h2><p>Barcha {pairs.length} ta juftlik to‘g‘ri bog‘landi.</p></div></div>}
    <p className="matching-help">Savolni sichqoncha yoki barmoq bilan javobga torting. Klaviaturada Tab va Enter bilan tanlashingiz ham mumkin.</p>
  </div>;
}
