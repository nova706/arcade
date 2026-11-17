import Phaser from "phaser";

export class ObjectiveTimerBar extends Phaser.GameObjects.Container {
    
    private graphics: Phaser.GameObjects.Graphics;
    private label: Phaser.GameObjects.Text;
    public readonly barWidth = 360;
    public readonly barHeight = 10;

    constructor(scene: Phaser.Scene) {
        super(scene, 0, 0);

        this.label = scene.add.text(this.barWidth * 0.5, -18, "", {
            color: "#eaf2ff",
            fontFamily: "monospace",
            fontSize: "12px",
            stroke: "#080916",
            strokeThickness: 3,
        }).setOrigin(0.5, 0);

        this.graphics = scene.add.graphics();
        this.add([this.graphics, this.label]);
    }

    public render(objectiveName: string | null, timer: number, ratio: number): void {
        this.setVisible(objectiveName !== null);
        this.graphics.clear();

        if (!objectiveName) return;

        const fillColor = ratio <= 0.25 ? 0xff2a6d : 0x05d9e8;
        const fillWidth = this.barWidth * Phaser.Math.Clamp(ratio, 0, 1);

        // Label above bar
        this.label.setText(`${objectiveName.toUpperCase()}  ·  ${Math.ceil(timer)}s`);
        this.label.setColor(ratio <= 0.25 ? "#ff2a6d" : "#eaf2ff");

        // Dark background track
        this.graphics.fillStyle(0x0b0e17, 0.85);
        this.graphics.fillRect(0, 0, this.barWidth, this.barHeight);

        // Draining fill
        if (fillWidth > 0) {
            this.graphics.fillStyle(fillColor, 1);
            this.graphics.fillRect(0, 0, fillWidth, this.barHeight);
        }

        // Crisp neon border
        this.graphics.lineStyle(1.5, fillColor, 0.9);
        this.graphics.strokeRect(0, 0, this.barWidth, this.barHeight);
    }
}
