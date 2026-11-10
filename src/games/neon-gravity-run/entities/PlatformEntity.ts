import Phaser from "phaser";
import type { PlatformData } from "../data/GameData";
import { BaseEntity } from "./BaseEntity";

export class PlatformEntity extends BaseEntity {
  readonly goalPad: boolean;

  constructor(scene: Phaser.Scene, data: PlatformData) {
    super(scene, data.x, data.y, data.width, data.height, 0x141d37);
    this.goalPad = data.goalPad ?? false;
    this.setStrokeStyle(2, this.goalPad ? 0xffc857 : 0x55f6ff, 0.95);
    scene.physics.add.existing(this, true);
    const body = this.body;
    if (!(body instanceof Phaser.Physics.Arcade.StaticBody)) {
      throw new Error("Neon Gravity Run platform is missing its static Arcade Physics body.");
    }
    body.updateFromGameObject();
  }
}
