export type SuperType = "bubble" | "totem" | "tether" | "nova";

export type SuperData = {
    cooldown: number,
    duration?: number,
}

export const SUPER_REGISTRY: Record<SuperType, SuperData> = {
    bubble: {
        cooldown: 7,
        duration: 60
    },
    totem: {
        cooldown: 12,
        duration: 60
    },
    tether: {
        cooldown: 12,
        duration: 60,
    },
    nova: {
        cooldown: 14,
    }
}
