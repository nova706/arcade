import type { PlayerLoadout } from "../types";
import type { AbilityType } from "./AbilityData";
import type { SuperType } from "./SuperData";

export const PLAYER_COLORS = [0x55f6ff, 0xff58d4, 0xc5ff57, 0xffc857];

export type WeaponType = "orbit" | "beam" | "chain" | "burst";

export const WEAPONS: WeaponType[] = ["orbit", "beam", "chain", "burst"];
export const SUPERS: SuperType[] = ["bubble", "totem", "tether", "nova"];
export const MINORS: AbilityType[] = ["mine", "teleport", "invisibility", "barrier", "shockwave"];

export interface WeaponStats {
    damage: number;
    cooldown: number;
    range: number;
    knockback: number;
    description: string;
    burstDamage?: number;
    burstCooldown?: number;
    burstRange?: number;
    burstKnockback?: number;
    chargeTime?: number;
    chainCount?: number;
    chainRange?: number;
    chainFalloff?: number;
}

export const WEAPON_STATS: Record<PlayerLoadout["weapon"], WeaponStats> = {
    orbit: {
        damage: 34,
        cooldown: 0.78,
        range: 100,
        knockback: 185,
        description: "Continuous melee · fire for a heavy outward strike",
        burstDamage: 100,
        burstCooldown: 1.05,
        burstRange: 116,
        burstKnockback: 720,
    },
    beam: {
        damage: 94,
        cooldown: 0.52,
        range: 920,
        knockback: 40,
        description: "High damage · long directional reach",
    },
    chain: {
        damage: 130,
        cooldown: .6,
        range: 320,
        knockback: 75,
        description: "Charged beam · chains through nearby enemies",
        chargeTime: 0.5,
        chainCount: 4,
        chainRange: 220,
        chainFalloff: 0.5
    },
    burst: {
        damage: 110,
        cooldown: 0.68,
        range: 200,
        knockback: 75,
        description: "Front burst"
    },
};

export const DEFAULT_LOADOUTS: PlayerLoadout[] = [
    { weapon: "beam", super: "bubble", minor: "teleport" },
    { weapon: "beam", super: "totem", minor: "mine" },
    { weapon: "orbit", super: "tether", minor: "invisibility" },
    { weapon: "chain", super: "nova", minor: "barrier" },
];
