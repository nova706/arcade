import type { AbilityData } from "../../data/AbilityData";
import type { IAttacker } from "../../interfaces/IAttacker";
import { AreaFactory } from "../../systems/AreaFactory";
import type { TraitData } from "../../types";
import { AbilityBase } from "./AbilityBase";

export class AbilityBarrier extends AbilityBase {

    protected executeAbility(attacker: IAttacker, stats: AbilityData): TraitData | undefined {
        AreaFactory.spawn(attacker.scene, "barrier", attacker.playerIndex || 0, attacker.x, attacker.y);
        return;
    }

}
