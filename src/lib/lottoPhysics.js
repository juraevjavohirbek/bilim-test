// Koordinatalar doira radiusiga nisbatan hisoblanadi; y pastga qarab o‘sadi.
function contain(ball, radius, bounce) {
  const distance = Math.hypot(ball.x, ball.y);
  const limit = 1 - radius;
  if (distance <= limit) return;
  const nx = ball.x / distance;
  const ny = ball.y / distance;
  ball.x = nx * limit;
  ball.y = ny * limit;
  const outward = ball.vx * nx + ball.vy * ny;
  if (outward > 0) {
    ball.vx -= (1 + bounce) * outward * nx;
    ball.vy -= (1 + bounce) * outward * ny;
  }
}

export function stepLotto(balls, radius, dt, mixing, time) {
  const bounce = mixing ? 0.82 : 0.35;
  for (const ball of balls) {
    ball.vy += 3.2 * dt;
    if (mixing) {
      // Har bir sharga alohida turtki: pastdagi kurak sharlarni tepaga otadi.
      ball.vx += (Math.sin(time * 7 + ball.seed) * 6 - ball.y * 4) * dt;
      if (ball.y > 0.38 && ball.vy > 0) {
        ball.vy = -2.1 - (Math.sin(ball.seed + time * 3) + 1) * 0.65;
        ball.vx += Math.cos(ball.seed + time * 4) * 1.3;
      }
    }
    const drag = Math.exp(-(mixing ? 0.3 : 1.8) * dt);
    ball.vx *= drag;
    ball.vy *= drag;
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    contain(ball, radius, bounce);
  }

  // Sharlar bir-biridan qaytadi, ustma-ust yig‘ilib qolmaydi.
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i < balls.length; i++) {
      for (let j = i + 1; j < balls.length; j++) {
        const a = balls[i], b = balls[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const distance = Math.hypot(dx, dy);
        if (distance >= radius * 2) continue;
        const nx = distance > 0.0001 ? dx / distance : 1;
        const ny = distance > 0.0001 ? dy / distance : 0;
        const overlap = (radius * 2 - distance) / 2;
        a.x -= nx * overlap; a.y -= ny * overlap;
        b.x += nx * overlap; b.y += ny * overlap;
        const speed = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
        if (speed < 0) {
          const impulse = -(1 + bounce) * speed / 2;
          a.vx -= impulse * nx; a.vy -= impulse * ny;
          b.vx += impulse * nx; b.vy += impulse * ny;
        }
      }
    }
    for (const ball of balls) contain(ball, radius, bounce);
  }
}
