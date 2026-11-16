export type AbilityType = "mine" | "teleport" | "invisibility" | "barrier" | "shockwave";

export type AbilityData = {
    cooldown: number,
    damage?: number,
    knockback?: number,
    range?: number,
    duration?: number,
}

export const ABILITY_REGISTRY: Record<AbilityType, AbilityData> = {
    barrier: {
        cooldown: 7,
    },
    invisibility: {
        cooldown: 8,
        duration: 3.2
    },
    mine: {
        cooldown: 5,
        damage: 110,
        knockback: 100,
    },
    teleport: {
        cooldown: 4,
        duration: 0.32
    },
    shockwave: {
        cooldown: 4,
        damage: 60,
        knockback: 600,
        range: 200
    }
}
