import { useEffect, useMemo, useRef } from "react";
import { remainingQuestions } from "../lib/gameModes";
import { stepLotto } from "../lib/lottoPhysics";

export default function LottoBalls({ questions, answers, spinning, colors }) {
  const container = useRef(null);
  const particles = useRef(new Map());
  const available = useMemo(() => remainingQuestions(questions, answers), [questions, answers]);
  // Ko‘p savol bo‘lsa ham barcha sharlar doira ichiga sig‘adi.
  const radius = Math.min(0.15, 0.64 / Math.sqrt(Math.max(1, available.length)));

  useEffect(() => {
    const element = container.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const balls = available.map(({ question, index }, position) => {
      const previous = particles.current.get(question.id);
      const angle = position * 2.399963;
      const spread = Math.sqrt((position + 0.5) / available.length) * (1 - radius * 2);
      return previous || {
        id: question.id, seed: index * 2.399963,
        x: Math.cos(angle) * spread, y: Math.sin(angle) * spread,
        vx: 0, vy: 0,
      };
    });
    particles.current = new Map(balls.map((ball) => [ball.id, ball]));
    const nodes = new Map([...element.children].map((node) => [node.dataset.questionId, node]));
    let size = element.clientWidth / 2;
    let frame;
    let last;
    let elapsed = 0;

    function paint() {
      for (const ball of balls) {
        const node = nodes.get(String(ball.id));
        if (node) node.style.transform = `translate(-50%, -50%) translate(${ball.x * size}px, ${ball.y * size}px)`;
      }
    }

    const observer = new ResizeObserver(() => { size = element.clientWidth / 2; paint(); });
    observer.observe(element);

    function animate(now) {
      const delta = last === undefined ? 1 / 60 : Math.min((now - last) / 1000, 1 / 30);
      last = now;
      elapsed += delta;
      const steps = Math.ceil(delta * 120);
      for (let i = 0; i < steps; i++) stepLotto(balls, radius, delta / steps, spinning, now / 1000);
      paint();
      // Aylantirish tugagach sharlar asta pastga yig‘iladi, so‘ng animatsiya to‘xtaydi.
      if (spinning || elapsed < 4) frame = requestAnimationFrame(animate);
    }

    function start() {
      cancelAnimationFrame(frame);
      last = undefined;
      elapsed = 0;
      if (reducedMotion.matches) {
        for (let i = 0; i < 360; i++) stepLotto(balls, radius, 1 / 120, false, 0);
        paint();
      } else {
        if (spinning) balls.forEach((ball) => {
          ball.vx += Math.cos(ball.seed) * 1.8;
          ball.vy = -1.8 - Math.sin(ball.seed) * 0.6;
        });
        frame = requestAnimationFrame(animate);
      }
    }

    paint();
    start();
    reducedMotion.addEventListener("change", start);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      reducedMotion.removeEventListener("change", start);
    };
  }, [available, spinning, radius]);

  return <div ref={container} className="lotto-balls" aria-hidden="true">
    {available.map(({ question, index }) => <span key={question.id} data-question-id={question.id} className="lotto-ball"
      style={{ backgroundColor: colors[index % colors.length], "--ball-size": `${radius * 100}%`, fontSize: available.length > 25 ? "11px" : "16px" }}>
      {index + 1}
    </span>)}
  </div>;
}
