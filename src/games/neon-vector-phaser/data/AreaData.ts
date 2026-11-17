export type AreaType = "bubble" | "totem" | "tether" | "mine" | "barrier" | "capture" | "blackhole" | "checkpoint";

export type AreaData = {
    radius: number,
    duration: number,
    color: number
}

export const AREA_REGISTRY: Record<AreaType, AreaData> = {
    barrier: {
        radius: 52,
        duration: 7,
        color: 0x55f6ff
    },
    blackhole: {
        radius: 200,
        duration: 20,
        color: 0xb762ff
    },
    bubble: {
        radius: 126,
        duration: 8,
        color: 0x55f6ff
    },
    capture: {
        radius: 78,
        duration: 35,
        color: 0xffc857
    },
    checkpoint: {
        radius: 48,
        duration: 30,
        color: 0x55f6ff
    },
    mine: {
        radius: 30,
        duration: Infinity,
        color: 0xff9d45
    },
    tether: {
        radius: 205,
        duration: 5,
        color: 0xbd72ff
    },
    totem: {
        radius: 152,
        duration: 12,
        color: 0xc5ff57
    }
}
