import Phaser from "phaser";
import type { NeonVectorScene } from "../../scene/NeonVectorScene";
import { AreaEntity } from "./AreaEntity";
import { AREA_REGISTRY } from "../../data/AreaData";

export class AreaCaptureEntity extends AreaEntity {

    constructor(
        scene: NeonVectorScene,
        x: number,
        y: number,
        readonly owner: number,
        readonly orientation = 0,
    ) {
        super(scene, x, y, "capture", owner, AREA_REGISTRY.capture, orientation);
    }

    override onUpdateEffect(delta: number): void {
        if (!this.activated && this.scene.players.some((player) => player.alive && Phaser.Math.Distance.Between(player.x, player.y, this.x, this.y) < this.areaData.radius)) {
            this.progress = Math.min(1, this.progress + delta / 8);
            if (this.progress >= 1) this.scene.objectiveManager.completeObjective();
        }
    }
}
