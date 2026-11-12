import Phaser from "phaser";
import type { IEnemyBehavior } from "../../interfaces/IEnemyBehavior";
import { EnemyEntity } from "../EnemyEntity";
import { PlayerEntity } from "../PlayerEntity";

const EXPLOSION_DAMAGE = 110;
const EXPLOSION_RADIUS = 150;
const CHARGE_DISTANCE = 170;
const FUSE_DURATION = 1.5;
const CHARGE_SPEED = 0.72;
const EXPLOSION_COLOR = 0xff653c;

export class ExploderBehavior implements IEnemyBehavior {
    private chargeRemaining: number | null = null;
    private graphics: Phaser.GameObjects.Graphics | null = null;

    executeMovement(enemy: EnemyEntity, target: PlayerEntity, distance: number, angle: number): null {
        if (this.chargeRemaining === null && distance <= CHARGE_DISTANCE) {
            this.chargeRemaining = FUSE_DURATION;
        } else if (this.chargeRemaining !== null && distance > CHARGE_DISTANCE && this.chargeRemaining > FUSE_DURATION * 0.5) {
            this.chargeRemaining = null;
        }

        const speed = enemy.speed * (this.chargeRemaining === null ? 1 : CHARGE_SPEED);
        enemy.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        return null;
    }

    update(enemy: EnemyEntity, delta: number): void {
        if (this.chargeRemaining === null) return;

        this.chargeRemaining = Math.max(0, this.chargeRemaining - delta);
        if (this.chargeRemaining === 0) {
            enemy.scene.detonateEnemy(enemy);
        }
    }

    draw(enemy: EnemyEntity): void {
        if (!this.graphics) this.graphics = enemy.scene.add.graphics().setDepth(2);

        this.graphics.clear();
        
        this.graphics.lineStyle(3, EXPLOSION_COLOR, 0.5);
        this.graphics.strokeCircle(enemy.x, enemy.y, EXPLOSION_RADIUS);

        if (this.chargeRemaining === null) {
            return;
        }

        const progress = 1 - this.chargeRemaining / FUSE_DURATION;
        const pulse = 0.5 + Math.sin(progress * Math.PI * 12) * 0.15;

        this.graphics.fillStyle(EXPLOSION_COLOR, 0.12 + progress * 0.15);
        this.graphics.fillCircle(enemy.x, enemy.y, enemy.radius + 5 + progress * 5);

        this.graphics.lineStyle(2, 0xffffff, pulse * 0.8);
        this.graphics.strokeCircle(enemy.x, enemy.y, enemy.radius + 8);
    }

    onDeath(enemy: EnemyEntity): void {
        enemy.scene.explodeAt(enemy.x, enemy.y, EXPLOSION_DAMAGE, EXPLOSION_RADIUS, enemy);
    }

    destroy(): void {
        this.graphics?.destroy();
        this.graphics = null;
    }
}
