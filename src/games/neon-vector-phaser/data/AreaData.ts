import type { SuperType } from "../types";

export type AreaKind = SuperType | "mine" | "barrier" | "capture" | "blackhole" | "checkpoint";

export type AreaData = {
    radius: number,
    duration: number,
    strength?: number,
    color: number
}

export const AREA_REGISTRY: Record<AreaKind, AreaData> = {
    barrier: {
        radius: 52,
        duration: 7,
        strength: 1,
        color: 0x55f6ff
    },
    blackhole: {
        radius: 126,
        duration: 8,
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
        radius: 28,
        duration: 16,
        strength: 95,
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
    },
    nova: {
        radius: 126,
        duration: 8,
        color: 0xfff3a1
    }
}
