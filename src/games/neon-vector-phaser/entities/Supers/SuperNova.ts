import type { SuperData } from "../../data/SuperData";
import type { IAttacker } from "../../interfaces/IAttacker";
import { SuperBase } from "./SuperBase";

export class SuperNova extends SuperBase {

    radius:number = 270;
    damage: number = 360;
    knockback: number = 460;
    color: number = 0xfff3a1;

    protected executeSuper(attacker: IAttacker, stats: SuperData): void {
        attacker.scene.damageEnemiesNear(attacker.x, attacker.y, this.radius, this.damage, this.knockback, attacker);
        attacker.scene.effectsManager.addExpandingRing(attacker.x, attacker.y, this.radius, this.color, 0.38);
        attacker.scene.effectsManager.emitParticles(attacker.x, attacker.y, this.color, 20);
    }

}
