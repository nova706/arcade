import Phaser from "phaser";

export class ExpandingRingEntity extends Phaser.GameObjects.Container {
    readonly graphic: Phaser.GameObjects.Graphics;
    private age = 0;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        private readonly radius: number,
        private readonly color: number,
        private readonly lifetime: number,
    ) {
        super(scene, x, y);
        this.graphic = scene.add.graphics();
        this.add(this.graphic);
        scene.add.existing(this);
        this.draw();
    }

    update(delta: number): boolean {
        this.age += delta;
        this.draw();
        return this.age >= this.lifetime;
    }

    private draw(): void {
        const progress = Math.min(1, this.age / this.lifetime);
        this.graphic.clear();
        this.graphic.lineStyle(3, this.color, 1 - progress);
        this.graphic.strokeCircle(0, 0, this.radius * progress);
        this.graphic.lineStyle(1, 0xffffff, (1 - progress) * 0.75);
        this.graphic.strokeCircle(0, 0, this.radius * progress * 0.86);
    }
}
