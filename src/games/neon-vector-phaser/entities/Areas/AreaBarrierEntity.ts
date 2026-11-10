import Phaser from "phaser";
import type { NeonVectorScene } from "../../scene/NeonVectorScene";
import { AreaEntity } from "./AreaEntity";
import { AREA_REGISTRY } from "../../data/AreaData";

export class AreaBarrierEntity extends AreaEntity {
    readonly slowPercent = 0.5;

    constructor(
        scene: NeonVectorScene,
        x: number,
        y: number,
        readonly owner: number,
    ) {
        super(scene, x, y, "barrier", owner, AREA_REGISTRY.barrier);
    }

    override onUpdateEffect(delta: number): void {
        this.scene.enemies.forEach((enemy) => {
            const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.x, this.y);
            if (distance > this.areaData.radius) return;
            const velocityScale = 1 - this.slowPercent;
            enemy.body.setVelocity(enemy.body.velocity.x * velocityScale, enemy.body.velocity.y * velocityScale);
        });
    }
}
