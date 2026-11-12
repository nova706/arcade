import Phaser from "phaser";
import { GameData, type PlatformModifier } from "../data/GameData";
import type { LandingState, PlayerCommand } from "../types";
import { BaseEntity } from "./BaseEntity";

export class PlayerEntity extends BaseEntity {
  declare body: Phaser.Physics.Arcade.Body;

  readonly playerIndex: number;
  readonly spawnX: number;
  readonly spawnY: number;
  readonly color: number;
  readonly graphic: Phaser.GameObjects.Graphics;
  lives = GameData.STARTING_LIVES;
  alive = true;
  gravityDirection = 1;
  invulnerability = 0;
  private airBoost = 0;
  private bounceCooldown = 0;
  private jumpBufferTime = 0;
  private grounded = true;
  private groundedTime = 0.1;
  private jumpedSinceLanding = false;

  constructor(scene: Phaser.Scene, playerIndex: number, x: number, y: number, color: number) {
    super(scene, x, y, GameData.PLAYER_WIDTH, GameData.PLAYER_HEIGHT, color, 0);
    this.playerIndex = playerIndex;
    this.spawnX = x;
    this.spawnY = y;
    this.color = color;
    scene.physics.add.existing(this);
    this.body.setSize(GameData.PLAYER_WIDTH, GameData.PLAYER_HEIGHT);
    this.body.setCollideWorldBounds(false);
    this.body.setAllowGravity(true);
    this.body.setGravityY(GameData.GRAVITY);
    this.body.setMaxVelocity(500, 1400);
    this.body.setBounce(0);
    this.graphic = scene.add.graphics();
    this.setDepth(4);
    this.draw();
  }

  update(command: PlayerCommand, landing: LandingState, delta: number): void {
    if (!this.alive || !this.body.enable) return;
    this.grounded = false;
    this.invulnerability = Math.max(0, this.invulnerability - delta);
    this.airBoost = Math.max(0, this.airBoost - delta);
    this.bounceCooldown = Math.max(0, this.bounceCooldown - delta);
    this.jumpBufferTime = Math.max(0, this.jumpBufferTime - delta);
    if (command.jump) this.jumpBufferTime = 0.15;
    this.groundedTime = Math.max(0, this.groundedTime - delta);
    const speedMultiplier = this.airBoost > 0 ? GameData.BOUNCE_AIR_SPEED_MULTIPLIER : 1;
    this.body.setVelocityX(command.moveX * GameData.PLAYER_SPEED * speedMultiplier);
    if (this.jumpBufferTime > 0 && landing.grounded) {
      this.gravityDirection *= -1;
      this.body.setGravityY(this.gravityDirection * GameData.GRAVITY);
      this.body.setVelocityY(this.gravityDirection * GameData.JUMP_SPEED);
      this.jumpedSinceLanding = true;
      this.grounded = false;
      this.groundedTime = 0;
      this.jumpBufferTime = 0;
    }
    this.draw();
  }

  setGrounded(modifier: PlatformModifier | undefined): void {
    if (!this.alive) return;
    this.grounded = true;
    this.groundedTime = 0.1;
    if (modifier !== "bounce" || !this.jumpedSinceLanding || this.bounceCooldown > 0) return;
    this.gravityDirection *= -1;
    this.body.setGravityY(this.gravityDirection * GameData.GRAVITY);
    this.body.setVelocityY(this.gravityDirection * GameData.BOUNCE_SPEED);
    this.airBoost = GameData.BOUNCE_BOOST_SECONDS;
    this.bounceCooldown = 0.35;
    this.grounded = false;
    this.groundedTime = 0;
    this.jumpedSinceLanding = true;
    this.jumpedSinceLanding = false;
  }

  consumeLandingState(): LandingState {
    const landing = { grounded: this.grounded || this.groundedTime > 0 };
    this.grounded = false;
    return landing;
  }

  loseLife(): void {
    if (!this.alive || this.invulnerability > 0) return;
    this.lives -= 1;
    if (this.lives <= 0) {
      this.lives = 0;
      this.alive = false;
      this.body.setVelocity(0, 0);
      this.body.enable = false;
      this.setVisible(false);
      this.graphic.setVisible(false);
      return;
    }
    this.respawn();
  }

  respawn(): void {
    this.gravityDirection = 1;
    this.airBoost = 0;
    this.bounceCooldown = 0;
    this.jumpBufferTime = 0;
    this.jumpedSinceLanding = false;
    this.grounded = false;
    this.groundedTime = 0;
    this.setPosition(this.spawnX, this.spawnY);
    this.body.reset(this.spawnX, this.spawnY);
    this.body.setVelocity(0, 0);
    this.body.setGravityY(GameData.GRAVITY);
    this.invulnerability = 1.2;
    this.setVisible(true);
    this.graphic.setVisible(true);
    this.draw();
  }

  freezeForWin(): void {
    this.body.setVelocity(0, 0);
    this.body.enable = false;
  }

  override destroy(fromScene?: boolean): void {
    this.graphic.destroy();
    super.destroy(fromScene);
  }

  private draw(): void {
    this.graphic.clear();
    this.graphic.setPosition(this.x, this.y);
    this.graphic.setScale(1, this.gravityDirection < 0 ? -1 : 1);
    this.graphic.setAlpha(this.invulnerability > 0 && Math.floor(this.invulnerability * 12) % 2 === 0 ? 0.4 : 1);
    this.graphic.lineStyle(3, this.color, 1);
    this.graphic.strokeCircle(0, -13, 5);
    this.graphic.lineBetween(0, -8, 0, 7);
    this.graphic.lineBetween(-8, -3, 8, -3);
    this.graphic.lineBetween(0, 7, -7, 17);
    this.graphic.lineBetween(0, 7, 7, 17);
  }
}
