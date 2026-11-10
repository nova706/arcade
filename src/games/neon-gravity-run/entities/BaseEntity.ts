import Phaser from "phaser";

export abstract class BaseEntity extends Phaser.GameObjects.Rectangle {
  protected constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    color: number,
    alpha = 1,
  ) {
    super(scene, x, y, width, height, color, alpha);
    scene.add.existing(this);
  }
}
