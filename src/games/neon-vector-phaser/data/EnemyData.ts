import type { EnemyConfig, EnemyType } from "../types";

export const ENEMY_CONFIG: Record<EnemyType, EnemyConfig> = {
    chaser: {
        health: 65,
        damage: 15,
        speed: 86,
        radius: 13,
        color: 0xff456b
    },
    exploder: {
        health: 95,
        damage: 0,
        speed: 68,
        radius: 16,
        color: 0xff653c
    },
    ranger: {
        health: 80,
        damage: 12,
        speed: 58,
        radius: 14,
        color: 0xbd72ff
    },
    splitter: {
        health: 55,
        damage: 11,
        speed: 77,
        radius: 15,
        color: 0xff5bca
    },
    tank: {
        health: 260,
        damage: 30,
        speed: 36,
        radius: 23,
        color: 0xff653c
    },
    flanker: {
        health: 92,
        damage: 18,
        speed: 116,
        radius: 12,
        color: 0xf7e85a
    },
    shielder: {
        health: 150,
        damage: 6,
        speed: 52,
        radius: 17,
        color: 0x55f6ff
    },
    boss: {
        health: 2600,
        damage: 48,
        speed: 48,
        radius: 38,
        color: 0xff274f
    },
};
