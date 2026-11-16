import Phaser from "phaser";

export class BeamEntity extends Phaser.GameObjects.Container {
    readonly graphic: Phaser.GameObjects.Graphics;
    private age = 0;

    constructor(
        scene: Phaser.Scene,
        private readonly startX: number,
        private readonly startY: number,
        private readonly endX: number,
        private readonly endY: number,
        private readonly startA: number,
        private readonly endA: number,
        private readonly color: number,
        private readonly lifetime: number,
    ) {
        super(scene, 0, 0);
        this.graphic = scene.add.graphics();
        this.add(this.graphic);
        scene.add.existing(this);
        this.draw();
    }

    update(delta: number): boolean {
        this.age += delta;

        const t = Math.min(1, Math.max(0, this.age / this.lifetime));
        this.alpha = this.startA + (this.endA - this.startA) * t;

        return this.age >= this.lifetime;
    }

    private draw(): void {
        this.graphic.lineStyle(4, this.color, 0.95);
        this.graphic.lineBetween(this.startX, this.startY, this.endX, this.endY);
    }
}
