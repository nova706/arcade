import Phaser from "phaser";
import type { NeonVectorScene } from "../scene/NeonVectorScene";

export class Hud extends Phaser.GameObjects.Container {
    private waveText: Phaser.GameObjects.Text;
    public readonly scene: NeonVectorScene;

    constructor(scene: NeonVectorScene) {
        super(scene, 0, 0);
        this.scene = scene;

        this.waveText = scene.add.text(18, 14, "", {
            color: "#eaf2ff",
            fontFamily: "monospace",
            fontSize: "13px",
            stroke: "#080916",
            strokeThickness: 3,
        }).setDepth(50);

        this.add([this.waveText]);
    }

    public update(): void {
        const playerStatus = this.scene.getPlayers().map((player) =>
            `P${player.playerData.index + 1} ${Math.ceil(player.currentHealth)}HP +${Math.ceil(player.currentOvershield)}  MINOR ${player.abilityChargePercent}%  SUPER ${player.superChargePercent}%`).join("\n");
        const objective = this.scene.objectiveManager.objective ? `\n${this.scene.objectiveManager.objective.toUpperCase()} ${Math.ceil(this.scene.objectiveManager.objectiveTimer)}s` : "";
        this.waveText.setText(`WAVE ${String(this.scene.waveManager.wave).padStart(2, "0")}  ·  ENEMIES ${this.scene.getEnemies().length}${objective}\n${playerStatus}`);
    }
}
