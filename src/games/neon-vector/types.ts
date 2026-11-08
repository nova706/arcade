import type { PhysicsBody } from "../../engine";
import type { AreaObject } from "./entities/AreaObject";
import type { EnemyObject } from "./entities/EnemyObject";
import type { ParticleObject } from "./entities/ParticleObject";
import type { PlayerObject } from "./entities/PlayerObject";
import type { ProjectileObject } from "./entities/ProjectileObject";

export const PLAYER_COLORS = ["#55f6ff", "#ff58d4", "#c5ff57", "#ffc857"] as const;

export type WeaponType = "shockwave" | "orbit" | "beam" | "chain";
export type SuperType = "bubble" | "totem" | "tether" | "nova";
export type MinorType = "mine" | "teleport" | "invisibility" | "barrier";
export type EnemyType = "chaser" | "charger" | "ranger" | "splitter" | "tank" | "flanker" | "boss";
export type ObjectiveType = "capture" | "checkpoints" | "tank";

export interface PlayerLoadout {
  weapon: WeaponType;
  super: SuperType;
  minor: MinorType;
}

export interface GameSetup {
  players: PlayerLoadout[];
  width: number;
  height: number;
}

export interface GameObjectOptions {
  x: number;
  y: number;
  radius: number;
}

export interface PhysicsEntity {
  body: PhysicsBody;
}

export interface PlayerState {
  index: number;
  color: string;
  loadout: PlayerLoadout;
  health: number;
  maxHealth: number;
  overshield: number;
  superCharge: number;
  minorCooldown: number;
  weaponCooldown: number;
  attackAngle: number;
  invisible: number;
  alive: boolean;
  invulnerable: number;
  attackBoost: number;
}

export interface EnemyState {
  type: EnemyType;
  health: number;
  maxHealth: number;
  damage: number;
  speed: number;
  attackCooldown: number;
  telegraph: number;
  slowedDefense: number;
  alive: boolean;
}

export interface AreaState {
  kind: "bubble" | "totem" | "tether" | "barrier" | "blackhole" | "capture" | "checkpoint" | "mine";
  owner: number;
  radius: number;
  duration: number;
  strength: number;
  targetIndex?: number;
  progress?: number;
  activated?: boolean;
}

export interface ProjectileState {
  kind: "beam" | "chain" | "mine";
  owner: number;
  originX: number;
  originY: number;
  directionX: number;
  directionY: number;
  speed: number;
  damage: number;
  lifetime: number;
  chainsRemaining: number;
  hitIds: Set<string>;
}

export interface ParticleState {
  color: string;
  lifetime: number;
  maxLifetime: number;
  velocityX: number;
  velocityY: number;
  size: number;
}

export interface WaveState {
  wave: number;
  objective: ObjectiveType | null;
  objectiveTime: number;
  objectiveIndex: number;
  objectiveProgress: number;
  remainingToSpawn: number;
  spawnTimer: number;
  breakTime: number;
  bossSpawned: boolean;
}

export interface GameState {
  width: number;
  height: number;
  players: PlayerObject[];
  enemies: EnemyObject[];
  areas: AreaObject[];
  projectiles: ProjectileObject[];
  particles: ParticleObject[];
  wave: WaveState;
  gameOver: boolean;
  elapsed: number;
  nextObjectId: number;
}

export interface GameEventMap {
  "player-damaged": { player: PlayerObject; amount: number };
  "enemy-damaged": { enemy: EnemyObject; amount: number; x: number; y: number; color: string };
  "enemy-defeated": { enemy: EnemyObject; x: number; y: number };
  "wave-started": { wave: number };
  "objective-started": { objective: ObjectiveType };
  "objective-completed": { objective: ObjectiveType };
  "super-used": { player: PlayerObject; ability: SuperType };
  "minor-used": { player: PlayerObject; ability: MinorType };
  "game-over": { wave: number };
}

export type { PhysicsBody };
