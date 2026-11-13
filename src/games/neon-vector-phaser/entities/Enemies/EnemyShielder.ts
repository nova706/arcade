import Phaser from "phaser";
import { EnemyEntity } from "./EnemyEntity";
import { PlayerEntity } from "../PlayerEntity";

const SHIELD_RADIUS = 190;
const MAX_SHIELDED_ENEMIES = 3;
const SHIELD_COLOR = 0x55f6ff;

export class EnemyShielder extends EnemyEntity {

    private shieldedEnemies: EnemyEntity[] = [];

    protected override executeMovement(target: PlayerEntity, distance: number, angle: number): PlayerEntity | null {
        const eligibleEnemies = this.scene.enemies
            .filter((candidate) => candidate !== this
                && candidate.type !== "shielder"
                && candidate.alive)
            .sort((a, b) => Phaser.Math.Distance.Between(this.x, this.y, a.x, a.y)
                - Phaser.Math.Distance.Between(this.x, this.y, b.x, b.y));

        this.shieldedEnemies = eligibleEnemies
            .filter((candidate) => Phaser.Math.Distance.Between(this.x, this.y, candidate.x, candidate.y) <= SHIELD_RADIUS)
            .slice(0, MAX_SHIELDED_ENEMIES);

        const movementGroup = this.shieldedEnemies.length > 0
            ? this.shieldedEnemies
            : eligibleEnemies.slice(0, 1);
        if (movementGroup.length === 0) {
            this.body.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
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
            this.body.setVelocity(dx / distanceToCenter * this.speed, dy / distanceToCenter * this.speed);
        }
        return null;
    }

    override isShielding(target: EnemyEntity): boolean {
        return this.shieldedEnemies.includes(target);
    }

    protected override draw(): void {
        super.draw();

        for (const target of this.shieldedEnemies) {
            if (!target.alive) continue;

            const targetX = target.x - this.x;
            const targetY = target.y - this.y;
            this.graphic.lineStyle(7, SHIELD_COLOR, 0.12);
            this.graphic.lineBetween(0, 0, targetX, targetY);
            this.graphic.lineStyle(2, SHIELD_COLOR, 0.85);
            this.graphic.lineBetween(0, 0, targetX, targetY);
            this.graphic.lineStyle(2, SHIELD_COLOR, 0.95);
            this.graphic.strokeCircle(targetX, targetY, target.radius + 8);
            this.graphic.fillStyle(SHIELD_COLOR, 0.75);
            this.graphic.fillCircle(targetX, targetY, 3);
        }
    }

    override destroy(): void {
        this.shieldedEnemies = [];
        super.destroy();
    }
}
