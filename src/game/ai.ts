import type { Ball, Difficulty, Player, TeamId, Vec2 } from './types';
import { FIELD, length, normalize, sub } from './physics';

const dist = (a: Vec2, b: Vec2) => length(sub(a, b));
const getGoalTarget = (team: TeamId): Vec2 => (team === 'A' ? { x: FIELD.width - FIELD.margin, y: FIELD.height / 2 } : { x: FIELD.margin, y: FIELD.height / 2 });

export const getAIMovement = (player: Player, ball: Ball, teammates: Player[]): Vec2 => {
  if (ball.ownerId === player.id) return normalize(sub(getGoalTarget(player.team), player.pos));
  const nearest = teammates.reduce((b, p) => (dist(p.pos, ball.pos) < dist(b.pos, ball.pos) ? p : b), teammates[0]);
  if (!ball.ownerId || nearest.id === player.id || dist(player.pos, ball.pos) < 160) return normalize(sub(ball.pos, player.pos));
  return normalize(sub(player.homePos, player.pos));
};

export const getAIBehavior = (difficulty: Difficulty) => ({
  shootDistance: difficulty === 'hard' ? 260 : difficulty === 'normal' ? 220 : 180,
  passChance: difficulty === 'hard' ? 0.35 : difficulty === 'normal' ? 0.5 : 0.65,
});

export const getPassTarget = (player: Player, teammates: Player[]): Player | null => {
  const options = teammates.filter((p) => p.id !== player.id);
  return options[0] ?? null;
};
