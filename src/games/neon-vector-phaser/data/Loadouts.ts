import type { PlayerLoadout } from "../types";

export const PLAYER_COLORS = [0x55f6ff, 0xff58d4, 0xc5ff57, 0xffc857];

export const WEAPONS = ["shockwave", "orbit", "beam", "chain"] as const;
export const SUPERS = ["bubble", "totem", "tether", "nova"] as const;
export const MINORS = ["mine", "teleport", "invisibility", "barrier"] as const;

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
    chainCount?: number;
    chainRange?: number;
}

export const WEAPON_STATS: Record<PlayerLoadout["weapon"], WeaponStats> = {
    shockwave: {
        damage: 22,
        cooldown: 0.9,
        range: 156,
        knockback: 1650,
        description: "Low damage · huge outward knockback",
    },
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
        damage: 48,
        cooldown: 0.68,
        range: 320,
        knockback: 75,
        description: "Front burst · chains through nearby enemies",
        chainCount: 4,
        chainRange: 155,
    },
};

export const DEFAULT_LOADOUTS: PlayerLoadout[] = [
    { weapon: "beam", super: "bubble", minor: "teleport" },
    { weapon: "shockwave", super: "totem", minor: "mine" },
    { weapon: "orbit", super: "tether", minor: "invisibility" },
    { weapon: "chain", super: "nova", minor: "barrier" },
];
