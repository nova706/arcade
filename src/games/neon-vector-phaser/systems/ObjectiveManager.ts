import Phaser from "phaser";
import type { EnemyEntity } from "../entities/EnemyEntity";
import type { NeonVectorScene } from "../scene/NeonVectorScene";
import type { ObjectiveType } from "../types";
import { AreaFactory } from "./AreaFactory";

export class ObjectiveManager {
    private scene: NeonVectorScene;
    objective: string | null = null;
    objectiveTimer: number = 0;
    checkpointIndex: number = 0;
    objectiveEnemy: EnemyEntity | null = null;

    constructor(scene: NeonVectorScene) {
        this.scene = scene;
    }

    public beginObjective(wave: number): void {
        const kinds: ObjectiveType[] = ["capture", "checkpoints", "tank"];
        this.objective = kinds[(wave / 5 - 1) % kinds.length];
        this.objectiveTimer = 30;
        this.checkpointIndex = 0;
        this.scene.events.emit("objective-started", { objective: this.objective });

        if (this.objective === "capture") {
            AreaFactory.spawn(this.scene, "capture", -1, this.scene.scale.width / 2, this.scene.scale.height / 2);
        } else if (this.objective === "checkpoints") {
            this.placeCheckpoint();
        } else {
            this.objectiveEnemy = this.scene.spawnEnemy("tank");
        }
    }

    public placeCheckpoint(): void {
        const x = Phaser.Math.Between(100, Math.max(101, this.scene.scale.width - 100));
        const y = Phaser.Math.Between(120, Math.max(121, this.scene.scale.height - 120));
        AreaFactory.spawn(this.scene, "checkpoint", -1, x, y);
    }

    public completeObjective(): void {
        this.objective = null;
        this.objectiveTimer = 0;
        this.objectiveEnemy = null;
        this.scene.areas.filter((area) => area.kind === "capture" || area.kind === "checkpoint")
            .forEach((area) => this.scene.removeArea(area));
        this.scene.events.emit("objective-completed", {});
    }

    public stop(): void {
        this.checkpointIndex = 0;
        this.objective = null;
        this.objectiveTimer = 0;
    }
}
