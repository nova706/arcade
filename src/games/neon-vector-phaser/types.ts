import type { AbilityType } from "./data/AbilityData";
import type { WeaponType } from "./data/Loadouts";
import type { SuperType } from "./data/SuperData";

export type EnemyType = "chaser" | "exploder" | "ranger" | "splitter" | "tank" | "flanker" | "shielder" | "boss";
export type ObjectiveType = "capture" | "checkpoints" | "tank";

export interface PlayerLoadout {
    weapon: WeaponType;
    super: SuperType;
    minor: AbilityType;
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

export const ENEMY_TYPES: EnemyType[] = ["chaser", "exploder", "ranger", "splitter", "tank", "flanker", "shielder"];
