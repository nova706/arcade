import Phaser from "phaser";
import { GameData } from "../data/GameData";
import { BaseEntity } from "./BaseEntity";

export class GoalEntity extends BaseEntity {
  private readonly ring: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    super(scene, GameData.GOAL_X, GameData.GOAL_Y, GameData.GOAL_RADIUS * 2, GameData.GOAL_RADIUS * 2, 0xffffff, 0);
    this.setDepth(3);
    this.ring = scene.add.graphics().setDepth(3);
    this.draw();
  }

  containsOpening(x: number, y: number): boolean {
    const dx = x - GameData.GOAL_X;
    const dy = y - GameData.GOAL_Y;
    const distance = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    const angleDifference = Math.atan2(
      Math.sin(angle - GameData.GOAL_OPENING_ANGLE),
      Math.cos(angle - GameData.GOAL_OPENING_ANGLE),
    );
    return distance <= GameData.GOAL_RADIUS - GameData.PLAYER_WIDTH / 2
      && Math.abs(angleDifference) <= GameData.GOAL_OPENING_HALF_ANGLE;
  }

  override destroy(fromScene?: boolean): void {
    this.ring.destroy();
    super.destroy(fromScene);
  }

  private draw(): void {
    const radius = GameData.GOAL_RADIUS;
    const openingStart = GameData.GOAL_OPENING_ANGLE - GameData.GOAL_OPENING_HALF_ANGLE;
    const openingEnd = GameData.GOAL_OPENING_ANGLE + GameData.GOAL_OPENING_HALF_ANGLE;
    this.ring.clear();
    this.ring.setPosition(GameData.GOAL_X, GameData.GOAL_Y);
    this.ring.lineStyle(5, 0xffc857, 0.95);
    this.ring.beginPath();
    this.ring.arc(0, 0, radius, openingEnd, openingStart + Math.PI * 2, false);
    this.ring.strokePath();
    this.ring.lineStyle(1, 0xffc857, 0.28);
    this.ring.strokeCircle(0, 0, radius + 8);
    this.ring.fillStyle(0xffc857, 0.7);
    this.ring.fillCircle(0, 0, 3);
  }
}
