import type { AbilityData } from "../../data/AbilityData";
import type { IAttacker } from "../../interfaces/IAttacker";
import type { TraitData } from "../../types";
import { AbilityBase } from "./AbilityBase";

export class AbilityShockwave extends AbilityBase {

    range: number = 156;

    protected executeAbility(attacker: IAttacker, stats: AbilityData): TraitData | undefined {
        attacker.scene.damageEnemiesNear(attacker.x, attacker.y, this.range, 0, stats.strength || 0, attacker);
        attacker.scene.addExpandingRing(attacker.x, attacker.y, this.range, attacker.color, 0.42);
        return;
    }
    
}
