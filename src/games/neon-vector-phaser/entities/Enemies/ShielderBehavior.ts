import Phaser from "phaser";
import type { IEnemyBehavior } from "../../interfaces/IEnemyBehavior";
import { EnemyEntity } from "../EnemyEntity";
import { PlayerEntity } from "../PlayerEntity";

const SHIELD_RADIUS = 190;
const MAX_SHIELDED_ENEMIES = 3;
const SHIELD_COLOR = 0x55f6ff;

export class ShielderBehavior implements IEnemyBehavior {
    private shieldedEnemies: EnemyEntity[] = [];
    private graphics: Phaser.GameObjects.Graphics | null = null;

    executeMovement(enemy: EnemyEntity, target: PlayerEntity, distance: number, angle: number): PlayerEntity | null {
        const eligibleEnemies = enemy.scene.enemies
            .filter((candidate) => candidate !== enemy
                && candidate.type !== "shielder"
                && candidate.alive)
            .sort((a, b) => Phaser.Math.Distance.Between(enemy.x, enemy.y, a.x, a.y)
                - Phaser.Math.Distance.Between(enemy.x, enemy.y, b.x, b.y));

        this.shieldedEnemies = eligibleEnemies
            .filter((candidate) => Phaser.Math.Distance.Between(enemy.x, enemy.y, candidate.x, candidate.y) <= SHIELD_RADIUS)
            .slice(0, MAX_SHIELDED_ENEMIES);

        const movementGroup = this.shieldedEnemies.length > 0
            ? this.shieldedEnemies
            : eligibleEnemies.slice(0, 1);
        if (movementGroup.length === 0) {
            enemy.body.setVelocity(Math.cos(angle) * enemy.speed, Math.sin(angle) * enemy.speed);
            if (distance <= enemy.radius + 14 && enemy.attackCooldown <= 0) {
                enemy.attackCooldown = 1.5;
                return target;
            }
            return null;
        }

        const centerX = movementGroup.reduce((sum, candidate) => sum + candidate.x, 0) / movementGroup.length;
        const centerY = movementGroup.reduce((sum, candidate) => sum + candidate.y, 0) / movementGroup.length;
        const dx = centerX - enemy.x;
        const dy = centerY - enemy.y;
        const distanceToCenter = Math.hypot(dx, dy);
        if (distanceToCenter <= 12) {
            enemy.body.setVelocity(0, 0);
        } else {
            enemy.body.setVelocity(dx / distanceToCenter * enemy.speed, dy / distanceToCenter * enemy.speed);
        }
        return null;
    }

    isShielding(target: EnemyEntity): boolean {
        return this.shieldedEnemies.includes(target);
    }

    draw(enemy: EnemyEntity): void {
        if (!this.graphics) {
            this.graphics = enemy.scene.add.graphics().setDepth(2);
        }

        this.graphics.clear();

        for (const target of this.shieldedEnemies) {
            if (!target.alive) continue;

            this.graphics.lineStyle(7, SHIELD_COLOR, 0.12);
            this.graphics.lineBetween(enemy.x, enemy.y, target.x, target.y);
            this.graphics.lineStyle(2, SHIELD_COLOR, 0.85);
            this.graphics.lineBetween(enemy.x, enemy.y, target.x, target.y);
            this.graphics.lineStyle(2, SHIELD_COLOR, 0.95);
            this.graphics.strokeCircle(target.x, target.y, target.radius + 8);
            this.graphics.fillStyle(SHIELD_COLOR, 0.75);
            this.graphics.fillCircle(target.x, target.y, 3);
        }
    }

    destroy(): void {
        this.graphics?.destroy();
        this.graphics = null;
        this.shieldedEnemies = [];
    }
}
