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

export interface PlayerData {
  index: number;
  color: number;
  loadout: PlayerLoadout;
}

export interface PlayerCommand {
  moveX: number;
  moveY: number;
  aimX: number;
  aimY: number;
  fire: boolean;
  useMinor: boolean;
  useSuper: boolean;
}

export interface GameData {
  players: PlayerLoadout[];
}

export interface EnemyConfig {
  health: number;
  damage: number;
  speed: number;
  radius: number;
  color: number;
}
