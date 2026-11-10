import Phaser from "phaser";
import { WeaponBase } from "./WeaponBase";
import type { IAttacker } from "../../interfaces/IAttacker";
import type { WeaponStats } from "../../data/Loadouts";

export class WeaponShockwave extends WeaponBase {
    
    protected executeFire(attacker: IAttacker, stats: WeaponStats, multiplier: number): void {
        attacker.scene.damageEnemiesNear(attacker.x, attacker.y, stats.range, stats.damage * multiplier, stats.knockback, attacker);
        attacker.scene.addExpandingRing(attacker.x, attacker.y, stats.range, attacker.color, 0.42);
        attacker.scene.emitParticles(attacker.x, attacker.y, attacker.color, 12);
    }
}
