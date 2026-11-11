import { ABILITY_REGISTRY, type AbilityData, type AbilityKind } from "../../data/AbilityData";
import type { IAttacker } from "../../interfaces/IAttacker";
import type { TraitData } from "../../types";

export abstract class AbilityBase {
    public cooldown = 0;

    constructor(protected readonly abilityType: AbilityKind) { }

    public update(delta: number): number {
        this.cooldown = Math.max(0, this.cooldown - delta);
        return this.cooldown;
    }

    public useAbility(attacker: IAttacker): TraitData | undefined {
        if (this.cooldown > 0) return;

        const stats = ABILITY_REGISTRY[this.abilityType];
        this.cooldown = stats.cooldown;

        const traitData = this.executeAbility(attacker, stats);

        attacker.scene.events.emit("minor-used", { player: attacker.playerIndex, ability: this.abilityType });

        return traitData;
    }

    protected abstract executeAbility(attacker: IAttacker, stats: AbilityData): TraitData | undefined;
}
