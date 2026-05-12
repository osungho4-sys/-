import type { Ball, Player, Vec2 } from './types';

export const FIELD = {
  width: 1000,
  height: 620,
  margin: 26,
  goalWidth: 160,
  goalDepth: 18,
};

export const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export const length = (v: Vec2) => Math.hypot(v.x, v.y);

export const normalize = (v: Vec2): Vec2 => {
  const len = length(v);
  if (len < 0.0001) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
};

export const add = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });
export const scale = (v: Vec2, s: number): Vec2 => ({ x: v.x * s, y: v.y * s });

export const updateBall = (ball: Ball, dt: number) => {
  ball.pos.x += ball.vel.x * dt;
  ball.pos.y += ball.vel.y * dt;

  // Ball friction for natural deceleration.
  const friction = 0.985;
  ball.vel.x *= friction;
  ball.vel.y *= friction;
  if (Math.abs(ball.vel.x) < 0.8) ball.vel.x = 0;
  if (Math.abs(ball.vel.y) < 0.8) ball.vel.y = 0;

  const top = FIELD.margin;
  const bottom = FIELD.height - FIELD.margin;
  const left = FIELD.margin;
  const right = FIELD.width - FIELD.margin;

  if (ball.pos.y - ball.radius < top) {
    ball.pos.y = top + ball.radius;
    ball.vel.y *= -0.7;
  }
  if (ball.pos.y + ball.radius > bottom) {
    ball.pos.y = bottom - ball.radius;
    ball.vel.y *= -0.7;
  }

  // Keep ball inside field horizontally unless it is inside the goal mouth.
  const goalYMin = FIELD.height / 2 - FIELD.goalWidth / 2;
  const goalYMax = FIELD.height / 2 + FIELD.goalWidth / 2;
  const inGoalMouth = ball.pos.y > goalYMin && ball.pos.y < goalYMax;

  if (!inGoalMouth) {
    if (ball.pos.x - ball.radius < left) {
      ball.pos.x = left + ball.radius;
      ball.vel.x *= -0.7;
    }
    if (ball.pos.x + ball.radius > right) {
      ball.pos.x = right - ball.radius;
      ball.vel.x *= -0.7;
    }
  }
};

export const resolvePlayerCollisions = (players: Player[]) => {
  for (let i = 0; i < players.length; i += 1) {
    for (let j = i + 1; j < players.length; j += 1) {
      const a = players[i];
      const b = players[j];
      const delta = sub(b.pos, a.pos);
      const dist = length(delta);
      const minDist = a.radius + b.radius;
      if (dist > 0 && dist < minDist) {
        const overlap = minDist - dist;
        const dir = scale(delta, 1 / dist);
        a.pos = add(a.pos, scale(dir, -overlap * 0.5));
        b.pos = add(b.pos, scale(dir, overlap * 0.5));
      }
    }
  }
};

export const constrainPlayer = (p: Player) => {
  p.pos.x = clamp(p.pos.x, FIELD.margin + p.radius, FIELD.width - FIELD.margin - p.radius);
  p.pos.y = clamp(p.pos.y, FIELD.margin + p.radius, FIELD.height - FIELD.margin - p.radius);
};
