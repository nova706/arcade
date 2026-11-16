import Phaser from "phaser";

export class ProjectileEntity extends Phaser.GameObjects.Container {
    readonly graphic: Phaser.GameObjects.Graphics;
    private readonly startX: number;
    private readonly startY: number;
    private age = 0;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        private readonly directionX: number,
        private readonly directionY: number,
        private readonly distance: number,
        private readonly color: number,
        private readonly lifetime: number,
    ) {
        super(scene, x, y);
        this.startX = x;
        this.startY = y;
        this.graphic = scene.add.graphics();
        this.add(this.graphic);
        scene.add.existing(this);
        this.draw();
    }

    update(delta: number): boolean {
        this.age += delta;
        this.setPosition(
            this.startX + this.directionX * this.distance * Math.min(1, this.age / this.lifetime),
            this.startY + this.directionY * this.distance * Math.min(1, this.age / this.lifetime),
        );
        this.alpha = Math.max(0, 1 - this.age / this.lifetime);
        return this.age >= this.lifetime;
    }

    private draw(): void {
        this.graphic.lineStyle(4, this.color, 0.95);
        this.graphic.lineBetween(0, 0, this.directionX * this.distance, this.directionY * this.distance);
    }
}
