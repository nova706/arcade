import type { IAttacker } from "../../interfaces/IAttacker";

export type StatType = 
    // Survivability (Capacities & Rates)
    | 'maxHealth'          // Base: 100 (Buffed by perks/upgrades)
    | 'healthRegen'        // Base: 10 HP/sec
    | 'healthRegenDelay'
    | 'maxOvershield'      // Base: 50 (Cap for overshields)
    | 'damageTakenMultiplier' // Base: 1.0 (0.7 = 30% DR, 1.3 = 30% Weakened)

    // Movement
    | 'moveSpeed'          // Base: 225

    // Offense (Multipliers applied to whatever weapon is equipped)
    | 'damageMultiplier'     // Base: 1.0 (1.25 = +25% Empowered)
    | 'attackRateMultiplier' // Base: 1.0 (1.2 = +20% faster firing)

    // Abilities & Super Cooldown
    | 'superCooldownMultiplier'    // Base: 1.0 (2.0 = cooldown ticks twice as fast)
    | 'abilityCooldownMultiplier'  // Base: 1.0 (2.0 = cooldown ticks twice as fast)

export type ModifierOp = 'flat' | 'percentAdd' | 'percentMult';

export interface StatModifier {
    stat: StatType;
    value: number;
    op: ModifierOp;
}

export type StatusEffectTrait =
    | "suppress_attack"
    | "invulnerable"
    | "invisible"

export type StatusEffectId =
    | "super_bubble"
    | "super_tether"
    | "super_totem"
    | "hit_iframes"
    | "invisibility"
    | "slow"
    | "shielded"
    | "wave_modifier"

export interface StatusEffect {
    id: StatusEffectId;       // e.g., 'damage_totem', 'tether_weaken', 'blink_invuln'
    duration: number;         // Remaining time in seconds (Infinity for passive/aura)
    source?: IAttacker;
    modifiers?: StatModifier[];
    traits?: StatusEffectTrait[];

    // Optional hooks for complex mechanics (like sharing or DoTs)
    onTick?: (target: IAttacker, delta: number) => void;
    onTakeDamage?: (target: IAttacker, amount: number, source?: IAttacker) => void;
}
