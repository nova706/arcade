import Phaser from "phaser";
import { GameData } from "../data/GameData";
import { BaseEntity } from "./BaseEntity";

export class GoalEntity extends BaseEntity {
  private readonly ring: Phaser.GameObjects.Graphics;
  private readonly goalRadius = GameData.GOAL_RADIUS;
  private readonly gapAngle = GameData.GOAL_OPENING_ANGLE;

  constructor(scene: Phaser.Scene) {
    super(scene, GameData.GOAL_X, GameData.GOAL_Y, GameData.GOAL_RADIUS * 2, GameData.GOAL_RADIUS * 2, 0xffffff, 0);
    this.setDepth(3);
    this.ring = scene.add.graphics().setDepth(3);
    this.update(0);
  }

  update(time: number): void {
    const openingStart = this.gapAngle - GameData.GOAL_OPENING_HALF_ANGLE;
    const openingEnd = this.gapAngle + GameData.GOAL_OPENING_HALF_ANGLE;
    const arcStart = openingEnd;
    const arcEnd = openingStart + Math.PI * 2;
    const flow = (time / 700) % (Math.PI * 2);

    this.ring.clear();
    this.ring.setPosition(GameData.GOAL_X, GameData.GOAL_Y);
    this.ring.lineStyle(12, 0xff426b, 0.1);
    this.ring.beginPath();
    this.ring.arc(0, 0, this.goalRadius, arcStart, arcEnd, false);
    this.ring.strokePath();
    this.ring.lineStyle(6, 0xff426b, 0.95);
    this.ring.beginPath();
    this.ring.arc(0, 0, this.goalRadius, arcStart, arcEnd, false);
    this.ring.strokePath();
    this.ring.lineStyle(2, 0xffbd4a, 0.85);
    this.ring.beginPath();
    this.ring.arc(0, 0, this.goalRadius - 6, arcStart, arcEnd, false);
    this.ring.strokePath();

    for (let index = 0; index < 14; index += 1) {
      const angle = (index / 14) * Math.PI * 2 + flow;
      if (this.isInGap(angle, 0)) continue;
      const innerX = Math.cos(angle) * (this.goalRadius - 11);
      const innerY = Math.sin(angle) * (this.goalRadius - 11);
      const outerX = Math.cos(angle) * (this.goalRadius - 8);
      const outerY = Math.sin(angle) * (this.goalRadius - 8);
      this.ring.lineStyle(2, index % 2 === 0 ? 0xffbd4a : 0xff426b, 0.9);
      this.ring.lineBetween(innerX, innerY, outerX, outerY);
    }

    this.ring.fillStyle(0xffbd4a, 0.7);
    this.ring.fillCircle(0, 0, 3);
    this.ring.lineStyle(1, 0xff426b, 0.3);
    this.ring.strokeCircle(0, 0, this.goalRadius + 9);
  }

  enteredThroughGap(x: number, y: number): boolean {
    const dx = x - GameData.GOAL_X;
    const dy = y - GameData.GOAL_Y;
    const distance = Math.hypot(dx, dy);
    return distance <= this.goalRadius - GameData.PLAYER_WIDTH / 2
      && this.isInGap(Math.atan2(dy, dx), 0);
  }

  touchesLava(x: number, y: number): boolean {
    const dx = x - GameData.GOAL_X;
    const dy = y - GameData.GOAL_Y;
    const distance = Math.hypot(dx, dy);
    const bodyRadius = GameData.PLAYER_WIDTH / 2;
    const lavaReach = bodyRadius + GameData.GOAL_LAVA_THICKNESS / 2;
    const inLavaBand = Math.abs(distance - this.goalRadius) <= lavaReach;
    const angleAllowance = Math.asin(Math.min(1, bodyRadius / Math.max(distance, 1)));
    return inLavaBand && !this.isInGap(Math.atan2(dy, dx), angleAllowance);
  }

  override destroy(fromScene?: boolean): void {
    this.ring.destroy();
    super.destroy(fromScene);
  }

  private isInGap(angle: number, allowance: number): boolean {
    const angleDifference = Math.atan2(
      Math.sin(angle - this.gapAngle),
      Math.cos(angle - this.gapAngle),
    );
    return Math.abs(angleDifference) <= GameData.GOAL_OPENING_HALF_ANGLE + allowance;
  }
}
