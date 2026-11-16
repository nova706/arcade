import Phaser from "phaser";

export class DirectionalBurstEntity extends Phaser.GameObjects.Container {
    readonly graphic: Phaser.GameObjects.Graphics;
    private age = 0;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        private readonly burstAngle: number,
        private readonly range: number,
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
        const spread = 0.6;
        const start = this.burstAngle - spread / 2;
        const end = this.burstAngle + spread / 2;
        this.graphic.clear();
        this.graphic.fillStyle(this.color, 0.18 * (1 - progress));
        this.graphic.beginPath();
        this.graphic.moveTo(0, 0);
        this.graphic.arc(0, 0, this.range * progress, start, end);
        this.graphic.closePath();
        this.graphic.fillPath();
        this.graphic.lineStyle(3, this.color, 1 - progress);
        this.graphic.lineBetween(0, 0, Math.cos(start) * this.range * progress, Math.sin(start) * this.range * progress);
        this.graphic.lineBetween(0, 0, Math.cos(end) * this.range * progress, Math.sin(end) * this.range * progress);
        this.graphic.beginPath();
        this.graphic.arc(0, 0, this.range * progress, start, end);
        this.graphic.strokePath();
    }
}
