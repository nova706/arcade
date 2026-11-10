import Phaser from "phaser";
import { BaseEntity } from "./BaseEntity";

export class LavaEntity extends BaseEntity {
  private readonly waves: Phaser.GameObjects.Graphics;
  private readonly lavaWidth: number;
  private readonly lavaHeight: number;
  private readonly top: boolean;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number, top: boolean) {
    super(scene, x, y, width, height, 0x361225);
    this.lavaWidth = width;
    this.lavaHeight = height;
    this.top = top;
    this.setStrokeStyle(1, 0xff426b, 0.85);
    this.setDepth(1);
    this.waves = scene.add.graphics().setDepth(2);
  }

  update(time: number): void {
    this.waves.clear();
    this.waves.setPosition(this.x - this.lavaWidth / 2, this.y - this.lavaHeight / 2);
    for (let x = -24; x < this.lavaWidth + 24; x += 24) {
      const waveY = this.top ? this.lavaHeight - 8 : 8;
      const offset = Math.sin(time / 650 + x * 0.035) * 3;
      this.waves.lineStyle(3, x % 48 === 0 ? 0xff7a45 : 0xff426b, 0.8);
      this.waves.lineBetween(x, waveY + offset, x + 24, waveY - offset);
    }
    this.waves.lineStyle(1, 0xffbd4a, 0.65);
    this.waves.lineBetween(0, this.top ? this.lavaHeight - 2 : 2, this.lavaWidth, this.top ? this.lavaHeight - 2 : 2);
  }

  override destroy(fromScene?: boolean): void {
    this.waves.destroy();
    super.destroy(fromScene);
  }
}
