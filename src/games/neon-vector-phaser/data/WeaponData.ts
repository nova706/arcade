export type WeaponType = "shockwave" | "orbit" | "beam" | "chain";
export type WeaponStyle = "shockwave" | "orbit" | "beam";

export interface WeaponStats {
    name: string;
    chargeTime?: number; // ms to charge before firing
    cooldown: number; // ms between shots
    range: number;
    damage: number;
    knockback: number;
    spread?: number;
    chainCount?: number;
    chainRange?: number;
    weaponStyle: string;
}

export const WEAPON_REGISTRY: Record<WeaponType, WeaponStats> = {
    shockwave: {
        name: "Shockwave",
        damage: 22,
        cooldown: 0.9,
        range: 156,
        knockback: 1650,
        weaponStyle: "shockwave"
    },
    orbit: {
        name: "Orbit Blade",
        damage: 34,
        cooldown: 0.2,
        range: 100,
        knockback: 185,
        weaponStyle: "orbit"
    },
    beam: {
        name: "Beam",
        damage: 94,
        cooldown: 0.52,
        range: 920,
        knockback: 40,
        weaponStyle: "beam",
    },
    chain: {
        name: "Fusion",
        damage: 48,
        cooldown: 0.68,
        range: 320,
        knockback: 75,
        chainCount: 4,
        chainRange: 155,
        weaponStyle: "beam",
    },
};
