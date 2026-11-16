import Phaser from "phaser";
import { WeaponBase } from "./WeaponBase";
import type { IAttacker } from "../../interfaces/IAttacker";

export class WeaponBeam extends WeaponBase {
    
    protected executeFire(attacker: IAttacker, multiplier: number): void {
        const dx = Math.cos(attacker.attackAngle);
        const dy = Math.sin(attacker.attackAngle);
        const range = this.stats.range;
        const finalDamage = this.stats.damage * multiplier;

        const hit = attacker.scene.getEnemies().filter((enemy) => enemy.alive)
            .map((enemy) => ({
                enemy,
                along: (enemy.x - attacker.x) * dx + (enemy.y - attacker.y) * dy,
                across: Math.abs((enemy.x - attacker.x) * dy - (enemy.y - attacker.y) * dx),
            }))
            .filter(({ along, across }) => along > 0 && along < range && across < 18)
            .sort((a, b) => a.along - b.along)
            .map(({ enemy }) => enemy);

        hit.forEach((enemy) => {
            enemy.takeDamage(finalDamage, attacker, this.stats.knockback);
        });

        attacker.scene.effectsManager.addProjectile(attacker.x, attacker.y, dx, dy, range, attacker.color, 0.12);
    }
}
