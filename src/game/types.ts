export type TeamId = 'A' | 'B';
export type Difficulty = 'easy' | 'normal' | 'hard';

export type Vec2 = { x: number; y: number };

export type PlayerStats = {
  speed: number;
  shotPower: number;
  passAccuracy: number;
};

export type PlayerArchetype = {
  id: string;
  name: string;
  number: number;
  stats: PlayerStats;
};

export type Player = {
  id: string;
  team: TeamId;
  number: number;
  pos: Vec2;
  vel: Vec2;
  radius: number;
  maxSpeed: number;
  hasBall: boolean;
  isHuman: boolean;
  aiRole: 'defender' | 'mid' | 'forward';
  homePos: Vec2;
  stats: PlayerStats;
};

export type Ball = { pos: Vec2; vel: Vec2; radius: number; ownerId: string | null };
export type Score = { A: number; B: number };

export type InputState = { moveX: number; moveY: number; sprint: boolean; pass: boolean; shoot: boolean };
export type MobileInputState = { joystick: Vec2; sprint: boolean; pass: boolean; shoot: boolean };
