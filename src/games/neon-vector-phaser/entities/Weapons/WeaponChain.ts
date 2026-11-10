import Phaser from "phaser";
import { WeaponBase } from "./WeaponBase";
import type { IAttacker } from "../../interfaces/IAttacker";
import type { WeaponStats } from "../../data/Loadouts";
import { DirectionalBurstEntity } from "../ProjectileEntity";

export class WeaponChain extends WeaponBase {

    protected executeFire(attacker: IAttacker, stats: WeaponStats, multiplier: number): void {
        const dx = Math.cos(attacker.attackAngle);
        const dy = Math.sin(attacker.attackAngle);
        const finalDamage = stats.damage * multiplier;

        const first = attacker.scene.enemies.filter((enemy) => enemy.alive)
            .map((enemy) => ({
                enemy,
                along: (enemy.x - attacker.x) * dx + (enemy.y - attacker.y) * dy,
                across: Math.abs((enemy.x - attacker.x) * dy - (enemy.y - attacker.y) * dx),
            }))
            .filter(({ enemy, along, across }) => along > 0 && along < stats.range && across < along * 0.34 + enemy.radius)
            .sort((a, b) => a.along - b.along)[0]?.enemy;
        attacker.scene.addWeaponEffect(new DirectionalBurstEntity(
            attacker.scene,
            attacker.x,
            attacker.y,
            attacker.attackAngle,
            stats.range,
            attacker.color,
            0.2,
        ));
        if (!first) return;
        let previous = first;
        const chainCount = stats.chainCount ?? 2;
        attacker.scene.damageEnemy(first, finalDamage, attacker, stats.knockback);
        for (let count = 0; count < chainCount; count += 1) {
            const next = attacker.scene.enemies.filter((enemy) => enemy.alive && enemy !== previous
                && Phaser.Math.Distance.Between(previous.x, previous.y, enemy.x, enemy.y) < chainCount)
                .sort((a, b) => Phaser.Math.Distance.Between(previous.x, previous.y, a.x, a.y)
                    - Phaser.Math.Distance.Between(previous.x, previous.y, b.x, b.y))[0];
            if (!next) break;
            attacker.scene.addProjectile(previous.x, previous.y, next.x - previous.x, next.y - previous.y,
                Phaser.Math.Distance.Between(previous.x, previous.y, next.x, next.y), attacker.color, 0.18);
            attacker.scene.damageEnemy(next, finalDamage * Math.pow(0.78, count + 1), attacker, stats.knockback);
            previous = next;
        }
    }
}
