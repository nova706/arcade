import Phaser from "phaser";
import { EnemyEntity } from "./EnemyEntity";
import { PlayerEntity } from "../PlayerEntity";

const EXPLOSION_RADIUS = 150;
const CHARGE_DISTANCE = 170;
const FUSE_DURATION = 1.5;
const CHARGE_SPEED = 0.72;

export class EnemyExploder extends EnemyEntity {

    private chargeRemaining: number | null = null;

    protected override executeMovement(target: PlayerEntity, distance: number, angle: number): null {
        if (this.chargeRemaining === null && distance <= CHARGE_DISTANCE) {
            this.chargeRemaining = FUSE_DURATION;
        } else if (this.chargeRemaining !== null && distance > CHARGE_DISTANCE && this.chargeRemaining > FUSE_DURATION * 0.5) {
            this.chargeRemaining = null;
        }

        const speed = this.stats.getStat('moveSpeed') * (this.chargeRemaining === null ? 1 : CHARGE_SPEED);
        this.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        return null;
    }

    override update(delta: number): void {
        super.update(delta);

        if (this.chargeRemaining === null) return;

        this.chargeRemaining = Math.max(0, this.chargeRemaining - delta);
        if (this.chargeRemaining === 0) {
            this.handleDeath();
        }
    }

    protected override onDeath(): void {
        const damage = this.damageAmount * this.stats.getStat('damageMultiplier');
        this.scene.explodeAt(this.x, this.y, damage, EXPLOSION_RADIUS, this);
    }

    protected override draw(): void {
        super.draw();

        this.graphic.lineStyle(3, this.color, 0.5);
        this.graphic.strokeCircle(0, 0, EXPLOSION_RADIUS);

        if (this.chargeRemaining === null) {
            return;
        }

        const progress = 1 - this.chargeRemaining / FUSE_DURATION;
        const pulse = 0.5 + Math.sin(progress * Math.PI * 12) * 0.15;

        this.graphic.fillStyle(this.color, 0.12 + progress * 0.15);
        this.graphic.fillCircle(0, 0, this.radius + 5 + progress * 5);

        this.graphic.lineStyle(2, 0xffffff, pulse * 0.8);
        this.graphic.strokeCircle(0, 0, this.radius + 8);
    }
}
