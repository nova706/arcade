import type { AbilityData } from "../../data/AbilityData";
import type { IAttacker } from "../../interfaces/IAttacker";
import { AbilityBase } from "./AbilityBase";

export class AbilityShockwave extends AbilityBase {

    protected executeAbility(attacker: IAttacker, stats: AbilityData): void {
        attacker.scene.damageEnemiesNear(attacker.x, attacker.y, stats.range || 0, stats.damage || 0, stats.knockback || 0, attacker);
        attacker.scene.effectsManager.addExpandingRing(attacker.x, attacker.y, stats.range || 0, attacker.color, 0.42);
    }
    
}
