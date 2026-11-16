import type { AbilityData } from "../../data/AbilityData";
import type { IAttacker } from "../../interfaces/IAttacker";
import { Invisibility } from "../../systems/stats/Buffs";
import { AbilityBase } from "./AbilityBase";

export class AbilityInvisibility extends AbilityBase {

    protected executeAbility(attacker: IAttacker, stats: AbilityData): void {
        if (stats.duration) {
            attacker.stats.applyEffect(Invisibility(stats.duration));
        }
    }
    
}
