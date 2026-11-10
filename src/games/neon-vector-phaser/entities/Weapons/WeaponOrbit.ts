import Phaser from "phaser";
import { WeaponBase } from "./WeaponBase";
import type { IAttacker } from "../../interfaces/IAttacker";
import { WEAPON_STATS, type WeaponStats } from "../../data/Loadouts";

export class WeaponOrbit extends WeaponBase {

    private elapsedTime = 0;
    private x = 0;
    private y = 0;

    public override update(delta: number, attacker: IAttacker, damageMultiplier: number): void {
        this.elapsedTime += delta;

        const stats = WEAPON_STATS[this.weaponKey];

        // Orbit math using dynamic index offset or default layout properties
        const angle = this.elapsedTime * 6 + (attacker.playerIndex || 0);
        this.x = attacker.x + Math.cos(angle) * stats.range;
        this.y = attacker.y + Math.sin(angle) * stats.range;

        const enemy = attacker.scene.enemies.find((candidate) => candidate.alive
            && Phaser.Math.Distance.Between(candidate.x, candidate.y, this.x, this.y) < candidate.radius + 18);

        if (enemy) {
            attacker.invisibleTime = 0;
            attacker.scene.damageEnemy(enemy, stats.damage * delta * 60 * damageMultiplier, attacker, stats.knockback);
        }
    }

    public override draw(attacker: IAttacker, graphics: Phaser.GameObjects.Graphics): void {
        // Graphics are drawn relative to the attacker, so we offset the orbit position accordingly
        const x = this.x - attacker.x;
        const y = this.y - attacker.y;
        
        graphics.lineStyle(4, attacker.color, 0.95);
        graphics.lineBetween(x - 7, y - 7, x + 7, y + 7);
        graphics.lineBetween(x - 7, y + 7, x + 7, y - 7);
    }

    // Active trigger pull performs the custom secondary explosion burst expansion
    protected executeFire(attacker: IAttacker, stats: WeaponStats, multiplier: number): void {
        const range = stats.burstRange ?? 110;
        const damage = (stats.burstDamage ?? stats.damage) * multiplier;
        const knockback = stats.burstKnockback ?? stats.knockback;

        attacker.scene.damageEnemiesNear(this.x, this.y, range, damage, knockback, attacker);
        attacker.scene.addExpandingRing(this.x, this.y, range, attacker.color, 0.28);
        attacker.scene.emitParticles(this.x, this.y, attacker.color, 18);
    }
}
