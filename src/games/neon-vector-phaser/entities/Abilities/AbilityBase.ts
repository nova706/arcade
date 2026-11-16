import { ABILITY_REGISTRY, type AbilityData, type AbilityType } from "../../data/AbilityData";
import type { IAttacker } from "../../interfaces/IAttacker";

export abstract class AbilityBase {
    public cooldown = 0;

    constructor(protected readonly abilityType: AbilityType) { }

    public update(attacker: IAttacker, delta: number): number {

        // Ability Cooldown drains faster if 'abilityCooldownRate' is buffed!
        const cooldownMultiplier = attacker.stats.getStat('abilityCooldownMultiplier');
        this.cooldown = Math.max(0, this.cooldown - delta * cooldownMultiplier);

        return this.cooldown;
    }

    public get chargePercent(): number {
        const duration = ABILITY_REGISTRY[this.abilityType].cooldown;
        return duration === 0 ? 100 : Math.round((1 - this.cooldown / duration) * 100);
    }

    public resetCharge(): number {
        this.cooldown = ABILITY_REGISTRY[this.abilityType].cooldown;
        return this.cooldown;
    }

    public useAbility(attacker: IAttacker): void {
        if (this.cooldown > 0) return;

        console.log("player use ability");

        const stats = ABILITY_REGISTRY[this.abilityType];
        this.cooldown = stats.cooldown;

        this.executeAbility(attacker, stats);

        attacker.scene.events.emit("minor-used", { player: attacker.playerIndex, ability: this.abilityType });
    }

    protected abstract executeAbility(attacker: IAttacker, stats: AbilityData): void;
}
