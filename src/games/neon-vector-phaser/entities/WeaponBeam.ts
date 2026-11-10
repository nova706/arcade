import Phaser from "phaser";
import { WeaponBase } from "./Weapons/WeaponBase";
import type { IAttacker } from "../interfaces/IAttacker";
import type { WeaponStats } from "../data/Loadouts";

export class WeaponBeam extends WeaponBase {
    
    protected executeFire(attacker: IAttacker, stats: WeaponStats, multiplier: number): void {
        const dx = Math.cos(attacker.attackAngle);
        const dy = Math.sin(attacker.attackAngle);
        const range = stats.range;
        const finalDamage = stats.damage * multiplier;

        const hit = attacker.scene.enemies.filter((enemy) => enemy.alive)
            .map((enemy) => ({
                enemy,
                along: (enemy.x - attacker.x) * dx + (enemy.y - attacker.y) * dy,
                across: Math.abs((enemy.x - attacker.x) * dy - (enemy.y - attacker.y) * dx),
            }))
            .filter(({ along, across }) => along > 0 && along < range && across < 18)
            .sort((a, b) => a.along - b.along);

        hit.forEach(({ enemy }) => {
            attacker.scene.damageEnemy(enemy, finalDamage, attacker, stats.knockback);
        });

        attacker.scene.addProjectile(attacker.x, attacker.y, dx, dy, range, attacker.color, 0.12);
    }
}
