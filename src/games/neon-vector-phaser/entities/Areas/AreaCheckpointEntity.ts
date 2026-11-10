import Phaser from "phaser";
import { AREA_REGISTRY, type AreaKind } from "../../data/AreaData";
import type { NeonVectorScene } from "../../scene/NeonVectorScene";
import { AreaEntity } from "./AreaEntity";

export class AreaCheckpointEntity extends AreaEntity {
    readonly graphic: Phaser.GameObjects.Graphics;
    progress = 0;
    activated = false;
    scene: NeonVectorScene;
    kind: AreaKind = "checkpoint";

    constructor(
        scene: NeonVectorScene,
        x: number,
        y: number,
        readonly owner: number,
        readonly orientation = 0,
    ) {
        super(scene, x, y, "checkpoint", owner, AREA_REGISTRY.checkpoint, orientation);
        this.scene = scene;
        this.graphic = scene.add.graphics();
        this.add(this.graphic);
        scene.add.existing(this);
        this.draw();
    }

    override onUpdateEffect(delta: number): void {

        const player = this.scene.players.find((candidate) => candidate.alive
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
