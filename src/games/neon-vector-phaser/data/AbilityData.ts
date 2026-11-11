export type AbilityKind = "mine" | "teleport" | "invisibility" | "barrier" | "shockwave";

export type AbilityData = {
    cooldown: number,
    strength?: number,
    duration?: number,
}

export const ABILITY_REGISTRY: Record<AbilityKind, AbilityData> = {
    barrier: {
        cooldown: 7,
    },
    invisibility: {
        cooldown: 8,
        duration: 3.2
    },
    mine: {
        cooldown: 5,
        strength: 95,
    },
    teleport: {
        cooldown: 4,
        duration: 0.32
    },
    shockwave: {
        cooldown: 4,
        strength: 500,
    }
}
