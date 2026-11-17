import Phaser from "phaser";
import type { EnemyEntity } from "../entities/Enemies/EnemyEntity";
import type { NeonVectorScene } from "../scene/NeonVectorScene";
import type { ObjectiveType } from "../types";
import { AreaFactory } from "../entities/Areas/AreaFactory";

export class ObjectiveManager {
    private scene: NeonVectorScene;
    objective: string | null = null;
    objectiveTimer: number = 0;
    objectiveMaxTime: number = 30;
    checkpointIndex: number = 0;
    objectiveEnemy: EnemyEntity | null = null;

    constructor(scene: NeonVectorScene) {
        this.scene = scene;
        this.scene.events.on("enemy-died", this.onEnemyDied, this);
    }

    public getProgressRatio(): number {
        if (!this.objective || this.objectiveMaxTime <= 0) return 0;
        return Phaser.Math.Clamp(this.objectiveTimer / this.objectiveMaxTime, 0, 1);
    }

    public update(delta: number) {
        if (this.objective) {
            this.objectiveTimer = Math.max(0, this.objectiveTimer - delta);

            if (this.objectiveTimer <= 0) {
                this.failObjective();
            }
        }
    }

    public beginObjective(objectiveType: ObjectiveType): void {
        this.objective = objectiveType;
        this.objectiveTimer = this.objectiveMaxTime;
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

    public onEnemyDied(enemy: EnemyEntity): void {
        if (enemy === this.objectiveEnemy) this.completeObjective();
    }

    public placeCheckpoint(): void {
        const x = Phaser.Math.Between(100, Math.max(101, this.scene.scale.width - 100));
        const y = Phaser.Math.Between(120, Math.max(121, this.scene.scale.height - 120));
        AreaFactory.spawn(this.scene, "checkpoint", -1, x, y);
    }

    public completeObjective(): void {
        this.clearObjective();
        this.scene.events.emit("objective-completed", {});
    }

    private failObjective() {
        this.clearObjective();
        this.scene.events.emit("objective-failed", {});
        AreaFactory.spawn(this.scene, "blackhole", -1, this.scene.scale.width / 2, this.scene.scale.height / 2);
    }

    private clearObjective() {
        this.objective = null;
        this.objectiveTimer = 0;
        this.checkpointIndex = 0;
        this.objectiveEnemy = null;
        this.scene.getAreas().filter((area) => area.kind === "capture" || area.kind === "checkpoint")
            .forEach((area) => area.destroy());
    }

    public stop(): void {
        this.clearObjective();
        this.scene.events.off("enemy-died", this.onEnemyDied, this);
    }
}
