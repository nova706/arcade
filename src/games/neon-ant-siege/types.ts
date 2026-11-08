export type Difficulty = "easy" | "normal" | "hard";
export type Weapon = "sword" | "axe" | "shield";

export interface GameSetup {
  difficulty: Difficulty;
  players: number;
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Player {
  id: number;
  x: number;
  y: number;
  velocityY: number;
  health: number;
  facing: -1 | 1;
  grounded: boolean;
  invulnerability: number;
  attackCooldown: number;
  attackTime: number;
  walkTime: number;
  weapon: Weapon;
  color: string;
  active: boolean;
}

export interface Ant {
  id: number;
  x: number;
  y: number;
  velocityY: number;
  health: number;
  maxHealth: number;
  speed: number;
  damage: number;
  boss: boolean;
  attackCooldown: number;
  facing: -1 | 1;
  walkTime: number;
}

export interface ShieldProjectile {
  x: number;
  y: number;
  velocityX: number;
  owner: number;
  returning: boolean;
  hitAnts: Set<number>;
}

export interface GameState {
  setup: GameSetup;
  width: number;
  height: number;
  wave: number;
  players: Player[];
  ants: Ant[];
  platforms: Platform[];
  projectiles: ShieldProjectile[];
  spawnRemaining: number;
  spawnTimer: number;
  wavePause: number;
  gameOver: boolean;
  nextAntId: number;
}
