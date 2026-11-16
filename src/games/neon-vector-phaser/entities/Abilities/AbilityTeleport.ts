import Phaser from "phaser";
import type { AbilityData } from "../../data/AbilityData";
import type { IAttacker } from "../../interfaces/IAttacker";
import { AbilityBase } from "./AbilityBase";
import { HitIFrame } from "../../systems/stats/Buffs";

export class AbilityTeleport extends AbilityBase {

    protected executeAbility(attacker: IAttacker, stats: AbilityData): void {
        
        let dx = Math.cos(attacker.attackAngle);
        let dy = Math.sin(attacker.attackAngle);
        const length = Math.max(1, Math.hypot(dx, dy));

        attacker.setPosition(
            Phaser.Math.Clamp(attacker.x + dx / length * 145, 25, attacker.scene.scale.width - 25),
            Phaser.Math.Clamp(attacker.y + dy / length * 145, 25, attacker.scene.scale.height - 25)
        );

        attacker.stats.applyEffect(HitIFrame);
    }
    
}
