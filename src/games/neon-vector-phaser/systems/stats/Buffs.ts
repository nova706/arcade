import type { IAttacker } from "../../interfaces/IAttacker";
import type { StatusEffect } from "./Stats";

export const SuperBubbleBuff: StatusEffect = {
    id: 'super_bubble',
    duration: 0.15,
    traits: ['invulnerable', 'suppress_attack'],
    modifiers: [
        { stat: 'healthRegen', op: 'percentMult', value: 1.50 },
    ],
};

export const DamageTotem: StatusEffect = {
    id: 'super_totem',
    duration: 0.15,
    modifiers: [
        { stat: 'healthRegen', op: 'percentMult', value: 1.50 },
        { stat: 'healthRegenDelay', op: 'flat', value: 0 },
        { stat: 'damageMultiplier', op: 'percentAdd', value: 0.25 },
        { stat: 'damageTakenMultiplier', op: 'percentAdd', value: -0.25 },
        { stat: 'abilityCooldownMultiplier', op: 'percentMult', value: 1.50 },
    ],
};

export const Invisibility = (duration: number): StatusEffect => {
    return {
        id: 'invisibility',
        duration: duration,
        traits: ['invisible']
    }
}

export const Shielded = (shieldedBy: IAttacker): StatusEffect => {
    return {
        id: 'shielded',
        duration: 0.15,
        traits: ['invulnerable'],
        source: shieldedBy
    };
}

export const WaveModifier = (wave: number): StatusEffect => {
    const scale = 1 + (wave - 1) * 0.055;

    return {
        id: 'wave_modifier',
        duration: Infinity,
        modifiers: [
            { stat: 'maxHealth', op: 'percentMult', value: scale },
            { stat: 'damageMultiplier', op: 'percentMult', value: Math.min(1 + scale * 0.12, 2.8)},
            { stat: 'moveSpeed', op: 'percentMult', value: Math.min(1 + (wave - 1) * 0.018, 1.65)}
        ]
    };
}

export const HitIFrame: StatusEffect = {
    id: 'hit_iframes',
    duration: 0.42,
    traits: ['invulnerable']
};
