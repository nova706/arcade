import type { IAttacker } from "../../interfaces/IAttacker";
import type { StatusEffectTrait, StatType, StatusEffect, StatusEffectId } from "./Stats";

export class StatComponent {
    private baseStats: Record<StatType, number>;
    private activeEffects: Map<StatusEffectId, StatusEffect> = new Map();
    private cachedStats: Partial<Record<StatType, number>> = {};
    private isDirty = true;

    constructor(baseStats: Record<StatType, number>) {
        this.baseStats = { ...baseStats };
    }

    public applyEffect(effect: StatusEffect): void {
        // Key by sourceId + id if you want different sources to stack, or just effect.id to refresh
        this.activeEffects.set(effect.id, { ...effect });
        this.isDirty = true;
    }

    public removeEffect(key: StatusEffectId): void {
        if (this.activeEffects.delete(key)) {
            this.isDirty = true;
        }
    }

    public hasTag(tag: StatusEffectTrait): boolean {
        for (const effect of this.activeEffects.values()) {
            if (effect.traits?.includes(tag as any)) return true;
        }
        return false;
    }

    public update(delta: number, owner: IAttacker): void {
        for (const [key, effect] of this.activeEffects.entries()) {
            effect.onTick?.(owner, delta);
            
            effect.duration -= delta;
            if (effect.duration <= 0) {
                this.activeEffects.delete(key);
                this.isDirty = true;
            }
        }
    }

    public getStat(stat: StatType): number {
        if (this.isDirty) this.recalculate();
        return this.cachedStats[stat] ?? this.baseStats[stat] ?? 0;
    }

    // Standard RPG math: (Base + Flat) * (1 + Sum of PercentAdd) * Product of PercentMult
    private recalculate(): void {
        this.cachedStats = {};
        const statsToCompute = new Set<StatType>([
            ...(Object.keys(this.baseStats) as StatType[]),
            ...Array.from(this.activeEffects.values()).flatMap(e => e.modifiers?.map(m => m.stat) ?? [])
        ]);

        for (const stat of statsToCompute) {
            const base = this.baseStats[stat] ?? (stat === 'damageMultiplier' || stat === 'damageTakenMultiplier' ? 1 : 0);
            let flat = 0;
            let percentAdd = 0;
            let percentMult = 1;

            for (const effect of this.activeEffects.values()) {
                for (const mod of effect.modifiers ?? []) {
                    if (mod.stat !== stat) continue;
                    if (mod.op === 'flat') flat += mod.value;
                    if (mod.op === 'percentAdd') percentAdd += mod.value;
                    if (mod.op === 'percentMult') percentMult *= mod.value;
                }
            }

            this.cachedStats[stat] = (base + flat) * (1 + percentAdd) * percentMult;
        }
        this.isDirty = false;
    }
}
