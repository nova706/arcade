import Phaser from "phaser";
import { WeaponBase } from "./WeaponBase";
import type { IAttacker } from "../../interfaces/IAttacker";
import { DirectionalBurstEntity } from "../Effects/DirectionalBurstEntity";

export class WeaponBurst extends WeaponBase {

    protected executeFire(attacker: IAttacker, multiplier: number): void {
        const dx = Math.cos(attacker.attackAngle);
        const dy = Math.sin(attacker.attackAngle);
        const finalDamage = this.stats.damage * multiplier;

        const enemies = attacker.scene.getEnemies().filter((enemy) => enemy.alive)
            .map((enemy) => ({
                enemy,
                along: (enemy.x - attacker.x) * dx + (enemy.y - attacker.y) * dy,
                across: Math.abs((enemy.x - attacker.x) * dy - (enemy.y - attacker.y) * dx),
            }))
            .filter(({ enemy, along, across }) => along > 0 && along < this.stats.range && across < along * 0.34 + enemy.radius)
            .sort((a, b) => a.along - b.along)
            .map((v) => v.enemy);

        attacker.scene.effectsManager.addWeaponEffect(new DirectionalBurstEntity(
            attacker.scene,
            attacker.x,
            attacker.y,
            attacker.attackAngle,
            this.stats.range + 20,
            attacker.color,
            0.2,
        ));

        if (enemies.length === 0) return;

        enemies.forEach((enemy) => {
            enemy.takeDamage(finalDamage, attacker, this.stats.knockback);
        });
    }
}
