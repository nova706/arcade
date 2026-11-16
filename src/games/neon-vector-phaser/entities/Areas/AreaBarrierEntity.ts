import Phaser from "phaser";
import type { NeonVectorScene } from "../../scene/NeonVectorScene";
import { AreaEntity } from "./AreaEntity";
import { AREA_REGISTRY } from "../../data/AreaData";
import { Slowed } from "../../systems/stats/Debuffs";

export class AreaBarrierEntity extends AreaEntity {

    constructor(
        scene: NeonVectorScene,
        x: number,
        y: number,
        readonly owner: number,
    ) {
        super(scene, x, y, "barrier", owner, AREA_REGISTRY.barrier);
    }

    override onUpdateEffect(delta: number): void {
        this.scene.getEnemies().forEach((enemy) => {
            const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.x, this.y);
            if (distance > this.areaData.radius) return;

            enemy.stats.applyEffect(Slowed);
        });
    }
}
