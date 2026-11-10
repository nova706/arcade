import Phaser from "phaser";
import { type AreaData, type AreaKind } from "../../data/AreaData";
import type { NeonVectorScene } from "../../scene/NeonVectorScene";

export abstract class AreaEntity extends Phaser.GameObjects.Container {
    readonly graphic: Phaser.GameObjects.Graphics;
    remaining = 0;
    progress = 0;
    activated = false;
    scene: NeonVectorScene;

    constructor(
        scene: NeonVectorScene,
        x: number,
        y: number,
        readonly kind: AreaKind,
        readonly owner: number,
        readonly areaData: AreaData,
    ) {
        super(scene, x, y);
        this.remaining = areaData.duration;
        this.scene = scene;
        this.graphic = scene.add.graphics();
        this.add(this.graphic);
        scene.add.existing(this);
        this.draw();
    }

    update(delta: number): void {
        this.remaining -= delta;

        // Execute specific class behavioral code
        this.onUpdateEffect(delta);

        this.draw();

        if (this.remaining <= 0) {
            this.scene.removeArea(this);
        }
    }

    // Children override this to specify unique behaviors (replaces large if/else branch)
    protected abstract onUpdateEffect(delta: number): void;

    protected draw(): void {
        const color = this.areaData.color;
        this.graphic.clear();

        this.graphic.lineStyle(2, color, 0.8);
        this.graphic.fillStyle(color, this.kind === "bubble" ? 0.08 : 0.04);
        this.graphic.fillCircle(0, 0, this.areaData.radius);
        this.graphic.strokeCircle(0, 0, this.areaData.radius);

        if (this.kind === "checkpoint" || this.kind === "capture") {
            this.graphic.lineStyle(4, color, 0.95);
            this.graphic.beginPath();
            this.graphic.arc(0, 0, this.areaData.radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * this.progress);
            this.graphic.strokePath();
        }
    }
}
