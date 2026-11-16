import Phaser from "phaser";
import { WeaponBase } from "./WeaponBase";
import type { IAttacker } from "../../interfaces/IAttacker";
import { BeamEntity } from "../Effects/BeamEntity";

export class WeaponChain extends WeaponBase {

    protected executeFire(attacker: IAttacker, multiplier: number): void {
        const dx = Math.cos(attacker.attackAngle);
        const dy = Math.sin(attacker.attackAngle);
        const finalDamage = this.stats.damage * multiplier;

        const possibleTargets = attacker.scene.getEnemies().filter((enemy) => enemy.alive && !enemy.stats.hasTag("invulnerable"));

        const hit = possibleTargets
            .map((enemy) => ({
                enemy,
                along: (enemy.x - attacker.x) * dx + (enemy.y - attacker.y) * dy,
                across: Math.abs((enemy.x - attacker.x) * dy - (enemy.y - attacker.y) * dx),
            }))
            .filter(({ along, across }) => along > 0 && along < this.stats.range && across < 18)
            .sort((a, b) => a.along - b.along)
            .map(({ enemy }) => enemy)[0];

        const end = hit ? { x: hit.x, y: hit.y } : { x: attacker.x + dx * this.stats.range, y: attacker.y + dy * this.stats.range };

        let beam = new BeamEntity(attacker.scene, attacker.x, attacker.y, end.x, end.y, 1, 0, attacker.color, 0.5);
        attacker.scene.effectsManager.addWeaponEffect(beam);

        if (!hit) return;

        let chained = [hit.id];
        let previous = hit;
        let chainRange = this.stats.chainRange || 100;
        let falloff = this.stats.chainFalloff || 0.5;
        const chainCount = this.stats.chainCount || 2;

        hit.takeDamage(finalDamage, attacker, this.stats.knockback);

        for (let count = 0; count < chainCount; count += 1) {

            const next = possibleTargets.find((enemy) => !chained.includes(enemy.id)
                && Phaser.Math.Distance.Between(previous.x, previous.y, enemy.x, enemy.y) < chainRange);

            if (!next) break;

            beam = new BeamEntity(attacker.scene, previous.x, previous.y, next.x, next.y, 1, 0, attacker.color, 0.5);
            attacker.scene.effectsManager.addWeaponEffect(beam);

            let multiplier = Math.pow(falloff, count + 1);
            next.takeDamage(finalDamage * multiplier, attacker, this.stats.knockback * multiplier);

            chained.push(next.id);
            previous = next;
        }
    }

    public draw(attacker: IAttacker, graphics: Phaser.GameObjects.Graphics) {
        if (this.stats.chargeTime && this.chargeTimer > 0 && this.chargeTimer < this.stats.chargeTime) {
            const dx = Math.cos(attacker.attackAngle);
            const dy = Math.sin(attacker.attackAngle);
            const end = { x: dx * this.stats.range, y: dy * this.stats.range };

            const t = Phaser.Math.Clamp(this.chargeTimer / this.stats.chargeTime, 0, 1);

            // Lerp alpha between start and end
            let alpha = Phaser.Math.Linear(0, 0.7, t);

            graphics.lineStyle(1, attacker.color, alpha);
            graphics.lineBetween(0, 0, end.x, end.y);
        }
    }
}
