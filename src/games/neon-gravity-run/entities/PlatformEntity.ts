import Phaser from "phaser";
import type { PlatformData, PlatformModifier } from "../data/GameData";
import { BaseEntity } from "./BaseEntity";

export class PlatformEntity extends BaseEntity {
  readonly modifier: PlatformModifier | undefined;
  readonly route: boolean;
  private readonly badge: Phaser.GameObjects.Text | undefined;

  constructor(scene: Phaser.Scene, data: PlatformData) {
    super(scene, data.x, data.y, data.width, data.height, data.modifier === "bounce" ? 0x3c2144 : 0x141d37);
    this.modifier = data.modifier;
    this.route = data.route ?? false;
    this.setStrokeStyle(2, this.modifier === "bounce" ? 0xff58d4 : 0x55f6ff, 0.95);
    scene.physics.add.existing(this, true);
    const body = this.body;
    if (!(body instanceof Phaser.Physics.Arcade.StaticBody)) {
      throw new Error("Neon Gravity Run platform is missing its static Arcade Physics body.");
    }
    body.updateFromGameObject();
    this.badge = this.modifier === "bounce"
      ? scene.add.text(data.x, data.y - 12, "BOOST", {
        color: "#ff9ae6",
        fontFamily: "Consolas, monospace",
        fontSize: "8px",
        fontStyle: "bold",
      }).setOrigin(0.5).setDepth(3)
      : undefined;
  }

  override destroy(fromScene?: boolean): void {
    this.badge?.destroy();
    super.destroy(fromScene);
  }
}
