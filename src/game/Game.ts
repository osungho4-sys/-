import { getAIBehavior, getAIMovement, getPassTarget } from './ai';
import { FIELD, constrainPlayer, normalize, resolvePlayerCollisions } from './physics';
import type { Ball, Difficulty, InputState, Player, PlayerArchetype, Score, TeamId, Vec2 } from './types';

const MATCH_DURATION = 120;

export class Game {
  ctx: CanvasRenderingContext2D;
  players: Player[] = [];
  teamA: Player[] = [];
  teamB: Player[] = [];
  human!: Player;
  ball: Ball;
  score: Score = { A: 0, B: 0 };
  timeLeft = MATCH_DURATION;
  over = false;
  winnerText = '';
  kickoffCountdown = 3;
  celebration = 0;
  difficulty: Difficulty;

  constructor(canvas: HTMLCanvasElement, selected: PlayerArchetype, difficulty: Difficulty) {
    canvas.width = FIELD.width;
    canvas.height = FIELD.height;
    this.ctx = canvas.getContext('2d')!;
    this.difficulty = difficulty;
    this.players = this.createTeams(selected);
    this.teamA = this.players.filter((p) => p.team === 'A');
    this.teamB = this.players.filter((p) => p.team === 'B');
    this.human = this.teamA[0];
    this.ball = { pos: { x: FIELD.width / 2, y: FIELD.height / 2 }, vel: { x: 0, y: 0 }, radius: 8, ownerId: null };
  }

  update(dt: number, input: InputState) {
    if (this.over) return;
    if (this.kickoffCountdown > 0) {
      this.kickoffCountdown = Math.max(0, this.kickoffCountdown - dt);
      return;
    }
    if (this.celebration > 0) {
      this.celebration = Math.max(0, this.celebration - dt);
      return;
    }

    this.timeLeft = Math.max(0, this.timeLeft - dt);
    this.movePlayer(this.human, input.moveX, input.moveY, input.sprint);

    for (let i = 1; i < this.teamA.length; i += 1) {
      const p = this.teamA[i];
      const dir = getAIMovement(p, this.ball, this.teamA);
      this.movePlayer(p, dir.x, dir.y, false);
    }
    for (let i = 0; i < this.teamB.length; i += 1) {
      const p = this.teamB[i];
      const dir = getAIMovement(p, this.ball, this.teamB);
      this.movePlayer(p, dir.x, dir.y, false);
    }

    resolvePlayerCollisions(this.players);
    this.handlePossession(input);

    if (!this.ball.ownerId) {
      this.ball.pos.x += this.ball.vel.x * dt * 60;
      this.ball.pos.y += this.ball.vel.y * dt * 60;
      const damping = Math.pow(0.985, dt * 60);
      this.ball.vel.x *= damping;
      this.ball.vel.y *= damping;
    }

    this.checkWallAndGoal();

    if (this.timeLeft <= 0) {
      this.over = true;
      this.winnerText = this.score.A === this.score.B ? 'Draw' : this.score.A > this.score.B ? 'Blue Wins!' : 'Red Wins!';
    }
  }

  draw() {
    const c = this.ctx;
    c.clearRect(0, 0, FIELD.width, FIELD.height);
    c.fillStyle = '#228b22';
    c.fillRect(0, 0, FIELD.width, FIELD.height);
    c.strokeStyle = '#fff';
    c.strokeRect(FIELD.margin, FIELD.margin, FIELD.width - FIELD.margin * 2, FIELD.height - FIELD.margin * 2);
    c.beginPath();
    c.moveTo(FIELD.width / 2, FIELD.margin);
    c.lineTo(FIELD.width / 2, FIELD.height - FIELD.margin);
    c.stroke();

    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = '12px sans-serif';

    for (let i = 0; i < this.players.length; i += 1) {
      const p = this.players[i];
      c.fillStyle = p.team === 'A' ? '#2f7bff' : '#e34747';
      c.beginPath();
      c.arc(p.pos.x, p.pos.y, p.radius, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#fff';
      c.fillText(String(p.number), p.pos.x, p.pos.y);
    }

    c.fillStyle = '#fff';
    c.beginPath();
    c.arc(this.ball.pos.x, this.ball.pos.y, this.ball.radius, 0, Math.PI * 2);
    c.fill();

    const owner = this.getOwner();
    if (owner) {
      c.fillStyle = '#ffef5e';
      c.beginPath();
      c.moveTo(owner.pos.x, owner.pos.y - 24);
      c.lineTo(owner.pos.x - 8, owner.pos.y - 36);
      c.lineTo(owner.pos.x + 8, owner.pos.y - 36);
      c.closePath();
      c.fill();
    }

    c.fillStyle = 'rgba(0,0,0,0.5)';
    c.fillRect(FIELD.width - 200, 12, 188, 110);
    c.strokeStyle = '#fff';
    c.strokeRect(FIELD.width - 200, 12, 188, 110);
    for (let i = 0; i < this.players.length; i += 1) {
      const p = this.players[i];
      c.fillStyle = p.team === 'A' ? '#59a1ff' : '#ff7b7b';
      c.beginPath();
      c.arc(FIELD.width - 194 + (p.pos.x / FIELD.width) * 176, 18 + (p.pos.y / FIELD.height) * 98, 3, 0, Math.PI * 2);
      c.fill();
    }
    c.fillStyle = '#fff';
    c.beginPath();
    c.arc(FIELD.width - 194 + (this.ball.pos.x / FIELD.width) * 176, 18 + (this.ball.pos.y / FIELD.height) * 98, 2, 0, Math.PI * 2);
    c.fill();

    if (this.kickoffCountdown > 0) {
      c.fillStyle = 'rgba(0,0,0,0.4)';
      c.fillRect(0, 0, FIELD.width, FIELD.height);
      c.fillStyle = '#fff';
      c.font = 'bold 90px sans-serif';
      c.fillText(String(Math.ceil(this.kickoffCountdown)), FIELD.width / 2, FIELD.height / 2);
    }
    if (this.celebration > 0) {
      c.fillStyle = 'rgba(255,215,0,0.2)';
      c.fillRect(0, 0, FIELD.width, FIELD.height);
      c.fillStyle = '#fff';
      c.font = 'bold 56px sans-serif';
      c.fillText('GOAL!!!', FIELD.width / 2, FIELD.height / 2);
    }
  }

  private movePlayer(p: Player, dx: number, dy: number, sprint: boolean) {
    const d = normalize({ x: dx, y: dy });
    const s = p.maxSpeed * (sprint ? 1.35 : 1);
    p.pos.x += d.x * s;
    p.pos.y += d.y * s;
    constrainPlayer(p);
  }

  private handlePossession(input: InputState) {
    const owner = this.getOwner();
    if (!owner) {
      for (let i = 0; i < this.players.length; i += 1) {
        const p = this.players[i];
        if (Math.hypot(p.pos.x - this.ball.pos.x, p.pos.y - this.ball.pos.y) < p.radius + this.ball.radius + 4) {
          this.ball.ownerId = p.id;
          break;
        }
      }
      return;
    }

    this.ball.pos.x = owner.pos.x + owner.radius + 4;
    this.ball.pos.y = owner.pos.y;

    const ai = getAIBehavior(this.difficulty);
    const wantsShoot = owner.isHuman ? input.shoot : Math.hypot((owner.team === 'A' ? FIELD.width : 0) - owner.pos.x, FIELD.height / 2 - owner.pos.y) < ai.shootDistance;
    const wantsPass = owner.isHuman ? input.pass : Math.random() < ai.passChance;

    if (wantsShoot) {
      this.kick(owner, normalize({ x: (owner.team === 'A' ? FIELD.width : 0) - owner.pos.x, y: FIELD.height / 2 - owner.pos.y }), owner.stats.shotPower);
      return;
    }
    if (wantsPass) {
      const teammates = owner.team === 'A' ? this.teamA : this.teamB;
      const t = getPassTarget(owner, teammates);
      if (t) {
        const spread = (1 - owner.stats.passAccuracy) * 0.35;
        const dir = normalize({ x: t.pos.x - owner.pos.x + (Math.random() - 0.5) * spread * 100, y: t.pos.y - owner.pos.y + (Math.random() - 0.5) * spread * 100 });
        this.kick(owner, dir, 7.5);
      }
    }
  }

  private getOwner() {
    const ownerId = this.ball.ownerId;
    if (!ownerId) return null;
    for (let i = 0; i < this.players.length; i += 1) if (this.players[i].id === ownerId) return this.players[i];
    return null;
  }

  private kick(owner: Player, dir: Vec2, power: number) {
    this.ball.ownerId = null;
    this.ball.vel = { x: dir.x * power, y: dir.y * power };
    this.ball.pos = { x: owner.pos.x + dir.x * (owner.radius + 8), y: owner.pos.y + dir.y * (owner.radius + 8) };
  }

  private checkWallAndGoal() {
    const gt = FIELD.height / 2 - FIELD.goalWidth / 2;
    const gb = FIELD.height / 2 + FIELD.goalWidth / 2;
    if (this.ball.pos.y < FIELD.margin + this.ball.radius || this.ball.pos.y > FIELD.height - FIELD.margin - this.ball.radius) this.ball.vel.y *= -0.8;
    const inMouth = this.ball.pos.y >= gt && this.ball.pos.y <= gb;
    if (inMouth && this.ball.pos.x < FIELD.margin - 3) return this.goal('A');
    if (inMouth && this.ball.pos.x > FIELD.width - FIELD.margin + 3) return this.goal('B');
    if (this.ball.pos.x < FIELD.margin + this.ball.radius || this.ball.pos.x > FIELD.width - FIELD.margin - this.ball.radius) this.ball.vel.x *= -0.8;
  }

  private goal(team: TeamId) {
    this.score[team] += 1;
    this.ball.ownerId = null;
    this.ball.pos = { x: FIELD.width / 2, y: FIELD.height / 2 };
    this.ball.vel = { x: 0, y: 0 };
    for (let i = 0; i < this.players.length; i += 1) this.players[i].pos = { ...this.players[i].homePos };
    this.celebration = 1.4;
  }

  private createTeams(selected: PlayerArchetype): Player[] {
    const statsByDifficulty = this.difficulty === 'hard' ? 0.95 : this.difficulty === 'easy' ? 1.05 : 1;
    const mk = (team: TeamId, x: number, human = false): Player[] => [
      { id: `${team}-0`, team, number: human ? selected.number : 9, pos: { x, y: FIELD.height / 2 }, vel: { x: 0, y: 0 }, radius: 16, maxSpeed: selected.stats.speed * statsByDifficulty, hasBall: false, isHuman: human, aiRole: 'mid', homePos: { x, y: FIELD.height / 2 }, stats: selected.stats },
      ...[120, 250, 380, 510].map((y, i) => ({ id: `${team}-${i + 1}`, team, number: i + 2, pos: { x: x + (team === 'A' ? -60 : 60), y }, vel: { x: 0, y: 0 }, radius: 16, maxSpeed: (1.8 + Math.random() * 0.4) * statsByDifficulty, hasBall: false, isHuman: false, aiRole: i < 2 ? ('defender' as const) : ('forward' as const), homePos: { x: x + (team === 'A' ? -60 : 60), y }, stats: { speed: 2, shotPower: 9, passAccuracy: 0.75 } })),
    ];
    return [...mk('A', 320, true), ...mk('B', 680, false)];
  }
}
