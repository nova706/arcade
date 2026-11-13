import Phaser from "phaser";
import { AREA_REGISTRY, type AreaType } from "../../data/AreaData";
import type { NeonVectorScene } from "../../scene/NeonVectorScene";
import { AreaEntity } from "./AreaEntity";

export class AreaCheckpointEntity extends AreaEntity {
    readonly graphic: Phaser.GameObjects.Graphics;
    progress = 0;
    activated = false;
    scene: NeonVectorScene;
    kind: AreaType = "checkpoint";

    constructor(
        scene: NeonVectorScene,
        x: number,
        y: number,
        readonly owner: number,
    ) {
        super(scene, x, y, "checkpoint", owner, AREA_REGISTRY.checkpoint);
        this.scene = scene;
        this.graphic = scene.add.graphics();
        this.add(this.graphic);
        scene.add.existing(this);
        this.draw();
    }

    override onUpdateEffect(delta: number): void {
        if (this.activated) return;

        const player = this.scene.getPlayers().find((candidate) => candidate.alive
            && Phaser.Math.Distance.Between(candidate.x, candidate.y, this.x, this.y) < this.areaData.radius);
        if (player) {
            this.activated = true;
            this.scene.objectiveManager.checkpointIndex += 1;
            this.setAlpha(0.25);
            if (this.scene.objectiveManager.checkpointIndex >= 3) this.scene.objectiveManager.completeObjective();
            else this.scene.objectiveManager.placeCheckpoint();
        }
    }
}
