import Phaser from "phaser";
import type { AbilityData } from "../../data/AbilityData";
import type { IAttacker } from "../../interfaces/IAttacker";
import type { TraitData } from "../../types";
import { AbilityBase } from "./AbilityBase";

export class AbilityTeleport extends AbilityBase {

    protected executeAbility(attacker: IAttacker, stats: AbilityData): TraitData | undefined {
        
        let dx = Math.cos(attacker.attackAngle);
        let dy = Math.sin(attacker.attackAngle);
        const length = Math.max(1, Math.hypot(dx, dy));

        return {
            invulnerableTime: stats.duration || 0,
            teleport: {
                x: Phaser.Math.Clamp(attacker.x + dx / length * 145, 25, attacker.scene.scale.width - 25),
                y: Phaser.Math.Clamp(attacker.y + dy / length * 145, 25, attacker.scene.scale.height - 25)
            }
        };
    }
    
}
