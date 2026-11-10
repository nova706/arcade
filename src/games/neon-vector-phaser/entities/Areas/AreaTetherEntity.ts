import Phaser from "phaser";
import type { NeonVectorScene } from "../../scene/NeonVectorScene";
import { AreaEntity } from "./AreaEntity";
import { AREA_REGISTRY } from "../../data/AreaData";

export class AreaTetherEntity extends AreaEntity {

    constructor(
        scene: NeonVectorScene,
        x: number,
        y: number,
        readonly owner: number,
        readonly orientation = 0,
    ) {
        super(scene, x, y, "tether", owner, AREA_REGISTRY.tether, orientation);
    }

    override onUpdateEffect(delta: number): void {
        this.scene.enemies.forEach((enemy) => {
            const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.x, this.y);
            if (distance > this.areaData.radius) return;
            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.x, this.y);
            enemy.body.setVelocity(enemy.body.velocity.x + Math.cos(angle) * 72, enemy.body.velocity.y + Math.sin(angle) * 72);
        });
    }
}
