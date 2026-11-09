import Phaser from "phaser";
import type { PlayerCommand, PlayerData, PlayerLoadout } from "../types";

export class PlayerEntity extends Phaser.GameObjects.Container {
  declare body: Phaser.Physics.Arcade.Body;

  readonly graphic: Phaser.GameObjects.Graphics;
  readonly maxHealth = 220;
  health = this.maxHealth;
  overshield = 0;
  superCharge = 0;
  minorCooldown = 0;
  weaponCooldown = 0;
  orbitBurstCooldown = 0;
  attackAngle = -Math.PI / 2;
  invisibleTime = 0;
  invulnerableTime = 0;
  attackBoost = 0;
  orbitBurstTime = 0;
  alive = true;
  command: PlayerCommand = { moveX: 0, moveY: 0, aimX: 0, aimY: -1, fire: false, useMinor: false, useSuper: false };

  constructor(
    scene: Phaser.Scene,
    readonly playerData: PlayerData,
    x: number,
    y: number,
    readonly loadout: PlayerLoadout,
  ) {
    super(scene, x, y);
    this.graphic = scene.add.graphics();
    this.add(this.graphic);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setCircle(14);
    this.body.setCollideWorldBounds(true);
    this.body.setBounce(0.25);
    this.body.setDamping(true);
    this.body.setDrag(240);
    this.body.setMaxVelocity(250, 250);
    this.draw();
  }

  setCommand(command: PlayerCommand): void {
    this.command = command;
    if (Math.hypot(command.aimX, command.aimY) > 0.18) {
      this.attackAngle = Math.atan2(command.aimY, command.aimX);
    } else if (Math.hypot(command.moveX, command.moveY) > 0.18) {
      this.attackAngle = Math.atan2(command.moveY, command.moveX);
    }
  }

  update(delta: number): void {
    this.weaponCooldown = Math.max(0, this.weaponCooldown - delta);
    this.orbitBurstCooldown = Math.max(0, this.orbitBurstCooldown - delta);
    this.minorCooldown = Math.max(0, this.minorCooldown - delta);
    this.superCharge = Math.min(100, this.superCharge + 100 / 34 * delta);
    this.invisibleTime = Math.max(0, this.invisibleTime - delta);
    this.invulnerableTime = Math.max(0, this.invulnerableTime - delta);
    this.attackBoost = Math.max(0, this.attackBoost - delta);
    this.orbitBurstTime = Math.max(0, this.orbitBurstTime - delta);
    this.draw();
  }

  fixedUpdate(): void {
    if (!this.alive || !this.body) return;
    const length = Math.hypot(this.command.moveX, this.command.moveY);
    const scale = length > 1 ? 1 / length : 1;
    this.body.setVelocity(this.command.moveX * scale * 225, this.command.moveY * scale * 225);
  }

  damage(amount: number): number {
    if (!this.alive || this.invulnerableTime > 0) return 0;
    const shieldDamage = Math.min(this.overshield, amount);
    this.overshield -= shieldDamage;
    this.health = Math.max(0, this.health - (amount - shieldDamage));
    this.invulnerableTime = 0.42;
    if (this.health === 0) {
      this.alive = false;
      this.command = { ...this.command, moveX: 0, moveY: 0, fire: false };
      this.body.setVelocity(0, 0);
    }
    return amount;
  }

  heal(amount: number): void {
    if (this.alive) this.health = Math.min(this.maxHealth, this.health + amount);
  }

  override destroy(fromScene?: boolean): void {
    this.graphic.destroy();
    super.destroy(fromScene);
  }

  private draw(): void {
    const graphics = this.graphic;
    graphics.clear();
    graphics.setAlpha(this.invisibleTime > 0 ? 0.06 : 1);
    graphics.lineStyle(2, this.playerData.color, 0.9);
    graphics.strokeCircle(0, 0, 14);
    graphics.fillStyle(this.playerData.color, 0.85);
    graphics.fillCircle(0, 0, 5);
    graphics.lineStyle(2, this.playerData.color, 0.75);
    graphics.lineBetween(-10, -5, -17, -12);
    graphics.lineBetween(10, -5, 17, -12);
    graphics.lineBetween(-10, 7, -15, 15);
    graphics.lineBetween(10, 7, 15, 15);

    const aimX = Math.cos(this.attackAngle);
    const aimY = Math.sin(this.attackAngle);
    if (this.loadout.weapon === "orbit") {
      const angle = this.scene.time.now * 0.006 + this.playerData.index;
      const bladeDistance = this.orbitBurstTime > 0 ? 66 : 44;
      const bladeX = Math.cos(angle) * bladeDistance;
      const bladeY = Math.sin(angle) * bladeDistance;
      graphics.lineStyle(4, this.playerData.color, 0.95);
      graphics.lineBetween(bladeX - 7, bladeY - 7, bladeX + 7, bladeY + 7);
      graphics.lineBetween(bladeX - 7, bladeY + 7, bladeX + 7, bladeY - 7);
    } else {
      graphics.lineStyle(3, 0xe7fbff, 0.9);
      graphics.lineBetween(aimX * 9, aimY * 9, aimX * 25, aimY * 25);
    }
  }
}
