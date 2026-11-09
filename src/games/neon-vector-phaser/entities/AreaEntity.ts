import Phaser from "phaser";
import type { SuperType } from "../types";

export type AreaKind = SuperType | "mine" | "barrier" | "capture" | "blackhole" | "checkpoint";

const AREA_COLORS: Record<AreaKind, number> = {
  bubble: 0x55f6ff,
  totem: 0xc5ff57,
  tether: 0xbd72ff,
  nova: 0xfff3a1,
  mine: 0xff9d45,
  barrier: 0x55f6ff,
  capture: 0xffc857,
  blackhole: 0xb762ff,
  checkpoint: 0x55f6ff,
};

export class AreaEntity extends Phaser.GameObjects.Container {
  readonly graphic: Phaser.GameObjects.Graphics;
  progress = 0;
  activated = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    readonly kind: AreaKind,
    readonly owner: number,
    readonly radius: number,
    public remaining: number,
    readonly strength = 1,
    readonly targetIndex = 0,
    readonly orientation = 0,
  ) {
    super(scene, x, y);
    this.graphic = scene.add.graphics();
    this.add(this.graphic);
    scene.add.existing(this);
    this.draw();
  }

  update(delta: number): void {
    this.remaining -= delta;
    this.draw();
  }

  private draw(): void {
    const color = AREA_COLORS[this.kind];
    this.graphic.clear();
    if (this.kind === "barrier") {
      this.graphic.lineStyle(12, color, 0.16);
      this.graphic.lineBetween(-this.radius, 0, this.radius, 0);
      this.graphic.lineStyle(4, color, 0.95);
      this.graphic.lineBetween(-this.radius, 0, this.radius, 0);
      this.graphic.lineStyle(1, 0xffffff, 0.8);
      this.graphic.lineBetween(-this.radius + 6, 0, this.radius - 6, 0);
      this.setRotation(this.orientation);
      return;
    }
    this.graphic.lineStyle(2, color, 0.8);
    this.graphic.fillStyle(color, this.kind === "bubble" ? 0.08 : 0.04);
    this.graphic.fillCircle(0, 0, this.radius);
    this.graphic.strokeCircle(0, 0, this.radius);
    if (this.kind === "checkpoint" || this.kind === "capture") {
      this.graphic.lineStyle(4, color, 0.95);
      this.graphic.beginPath();
      this.graphic.arc(0, 0, this.radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * this.progress);
      this.graphic.strokePath();
    }
  }
}
