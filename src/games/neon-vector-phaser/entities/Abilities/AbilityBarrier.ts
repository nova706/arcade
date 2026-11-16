import type { AbilityData } from "../../data/AbilityData";
import type { IAttacker } from "../../interfaces/IAttacker";
import { AreaFactory } from "../Areas/AreaFactory";
import { AbilityBase } from "./AbilityBase";

export class AbilityBarrier extends AbilityBase {

    protected executeAbility(attacker: IAttacker, stats: AbilityData): void {
        AreaFactory.spawn(attacker.scene, "barrier", attacker.playerIndex || 0, attacker.x, attacker.y);
    }

}
