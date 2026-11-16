import Phaser from "phaser";

export class ParticleEntity extends Phaser.GameObjects.Arc {
    private age = 0;
    private readonly velocityX: number;
    private readonly velocityY: number;

    constructor(scene: Phaser.Scene, x: number, y: number, color: number, speed: number, angle: number, private readonly lifetime: number) {
        super(scene, x, y, Phaser.Math.Between(2, 4), 0, 360, false, color, 1);
        this.velocityX = Math.cos(angle) * speed;
        this.velocityY = Math.sin(angle) * speed;
        scene.add.existing(this);
    }

    update(delta: number): boolean {
        this.age += delta;
        this.x += this.velocityX * delta;
        this.y += this.velocityY * delta;
        this.alpha = Math.max(0, 1 - this.age / this.lifetime);
        return this.age >= this.lifetime;
    }
}
