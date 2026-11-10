import type { NeonVectorScene } from "../scene/NeonVectorScene";
import { ENEMY_TYPES } from "../types";
import type { ObjectiveManager } from "./ObjectiveManager";

export class WaveManager {
    public wave: number = 0;
    private spawnRemaining = 0;
    private spawnTimer = 0;
    private breakTimer = 0;

    constructor(
        private readonly scene: NeonVectorScene,
        private readonly objectiveManager: ObjectiveManager
    ) {}

    public start(): void {
        this.beginWave();
    }

    public stop(): void {
        this.wave = 0;
        this.spawnRemaining = 0;
        this.spawnTimer = 0;
        this.breakTimer = 0;
    }

    public updateWaves(delta: number): void {
        if (this.spawnRemaining > 0) {
            this.spawnTimer -= delta;
            if (this.spawnTimer <= 0) {
                let enemyType = this.wave % 4 === 0 && Math.random() < 0.18
                    ? "tank"
                    : ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)];
                this.scene.spawnEnemy(enemyType);
                this.spawnRemaining -= 1;
                this.spawnTimer = 0.55;
            }
            return;
        }
        if (this.scene.enemies.length === 0) {
            this.breakTimer += delta;
            if (this.breakTimer >= 2.2) {
                this.breakTimer = 0;
                this.beginWave();
            }
        }
    }

    private beginWave(): void {
        this.wave += 1;
        this.spawnRemaining = 3 + Math.floor(this.wave * 1.5);
        this.spawnTimer = 0;
        if (this.wave % 5 === 0) this.objectiveManager.beginObjective(this.wave);
        if (this.wave % 20 === 0) this.scene.spawnEnemy("boss");
        this.scene.events.emit("wave-started", { wave: this.wave });
    }
}
