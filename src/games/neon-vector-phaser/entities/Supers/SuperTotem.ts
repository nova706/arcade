import type { SuperData } from "../../data/SuperData";
import type { IAttacker } from "../../interfaces/IAttacker";
import { AreaFactory } from "../Areas/AreaFactory";
import { SuperBase } from "./SuperBase";

export class SuperTotem extends SuperBase {

    protected executeSuper(attacker: IAttacker, stats: SuperData): void {
        AreaFactory.spawn(attacker.scene, "totem", attacker.playerIndex || 0, attacker.x, attacker.y);
    }

}
