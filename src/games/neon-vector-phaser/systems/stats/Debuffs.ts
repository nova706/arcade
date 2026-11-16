import type { IAttacker } from "../../interfaces/IAttacker";
import type { StatusEffect } from "./Stats";

export const Tethered = (onTakeDamage: (hitEnemy: IAttacker, amount: number) => void): StatusEffect => {
    return {
        id: 'super_tether',
        duration: 0.15,
        modifiers: [
            { stat: 'damageTakenMultiplier', op: 'percentAdd', value: 0.30 }, // Enemies take +30% damage
            { stat: 'moveSpeed', op: 'percentMult', value: 0.50 }   // 50% slow
        ],
        onTakeDamage
    };
}

export const Slowed: StatusEffect = {
    id: 'slow',
    duration: 0.15,
    modifiers: [
        { stat: 'damageTakenMultiplier', op: 'percentAdd', value: 0.10 },
        { stat: 'moveSpeed', op: 'percentMult', value: 0.50 }
    ],
}
