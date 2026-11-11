import type { AbilityData } from "../../data/AbilityData";
import type { IAttacker } from "../../interfaces/IAttacker";
import type { TraitData } from "../../types";
import { AbilityBase } from "./AbilityBase";

export class AbilityInvisibility extends AbilityBase {

    protected executeAbility(attacker: IAttacker, stats: AbilityData): TraitData | undefined {
        return {
            invisibilityTime: stats.duration || 0
        };
    }
    
}
