import Phaser from "phaser";
import { EnemyEntity } from "./EnemyEntity";
import { PlayerEntity } from "../PlayerEntity";
import { Shielded } from "../../systems/stats/Buffs";

const SHIELD_RADIUS = 190;
const MAX_SHIELDED_ENEMIES = 3;

export class EnemyShielder extends EnemyEntity {

    private shieldedEnemies: EnemyEntity[] = [];

    protected override executeMovement(target: PlayerEntity, distance: number, angle: number): PlayerEntity | null {
        const eligibleEnemies = this.scene.getEnemies()
            .filter((candidate) => candidate !== this
                && candidate.type !== "shielder"
                && candidate.alive)
            .sort((a, b) => Phaser.Math.Distance.Between(this.x, this.y, a.x, a.y)
                - Phaser.Math.Distance.Between(this.x, this.y, b.x, b.y));

        this.shieldedEnemies = eligibleEnemies
            .filter((candidate) => Phaser.Math.Distance.Between(this.x, this.y, candidate.x, candidate.y) <= SHIELD_RADIUS)
            .slice(0, MAX_SHIELDED_ENEMIES);

        this.shieldedEnemies.forEach((enemy) => {
            enemy.stats.applyEffect(Shielded(this));
        });

        const speed = this.stats.getStat('moveSpeed');

        const movementGroup = this.shieldedEnemies.length > 0
            ? this.shieldedEnemies
            : eligibleEnemies.slice(0, 1);
        if (movementGroup.length === 0) {
            this.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
            if (distance <= this.radius + 14 && this.attackCooldown <= 0) {
                this.attackCooldown = 1.5;
                return target;
            }
            return null;
        }

        const centerX = movementGroup.reduce((sum, candidate) => sum + candidate.x, 0) / movementGroup.length;
        const centerY = movementGroup.reduce((sum, candidate) => sum + candidate.y, 0) / movementGroup.length;
        const dx = centerX - this.x;
        const dy = centerY - this.y;
        const distanceToCenter = Math.hypot(dx, dy);
        if (distanceToCenter <= 12) {
            this.body.setVelocity(0, 0);
        } else {
            this.body.setVelocity(dx / distanceToCenter * speed, dy / distanceToCenter * speed);
        }
        return null;
    }

    protected override draw(): void {
        super.draw();

        for (const target of this.shieldedEnemies) {
            if (!target.alive) continue;

            const targetX = target.x - this.x;
            const targetY = target.y - this.y;
            this.graphic.lineStyle(7, this.color, 0.12);
            this.graphic.lineBetween(0, 0, targetX, targetY);
            this.graphic.lineStyle(2, this.color, 0.85);
            this.graphic.lineBetween(0, 0, targetX, targetY);
            this.graphic.lineStyle(2, this.color, 0.95);
            this.graphic.strokeCircle(targetX, targetY, target.radius + 8);
            this.graphic.fillStyle(this.color, 0.75);
            this.graphic.fillCircle(targetX, targetY, 3);
        }
    }

    override destroy(): void {
        this.shieldedEnemies = [];
        super.destroy();
    }
}
