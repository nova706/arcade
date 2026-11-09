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
