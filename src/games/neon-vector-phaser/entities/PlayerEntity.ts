import Phaser from "phaser";
import type { PlayerCommand, PlayerData, PlayerLoadout } from "../types";
import type { NeonVectorScene } from "../scene/NeonVectorScene";
import { AreaFactory } from "../systems/AreaFactory";
import type { IAttacker } from "../interfaces/IAttacker";
import type { WeaponBase } from "./Weapons/WeaponBase";
import { WeaponFactory } from "../systems/WeaponFactory";

export class PlayerEntity extends Phaser.GameObjects.Container implements IAttacker {
    declare body: Phaser.Physics.Arcade.Body;

    readonly graphic: Phaser.GameObjects.Graphics;
    readonly maxHealth = 220;
    readonly scene: NeonVectorScene;
    health = this.maxHealth;
    overshield = 0;
    superCharge = 0;
    minorCooldown = 0;
    attackAngle = -Math.PI / 2;
    invisibleTime = 0;
    invulnerableTime = 0;
    attackBoost = 0;
    alive = true;
    color: number;
    playerIndex: number;
    command: PlayerCommand = { moveX: 0, moveY: 0, aimX: 0, aimY: -1, fire: false, useMinor: false, useSuper: false };

    private currentWeapon: WeaponBase;

    constructor(
        scene: NeonVectorScene,
        readonly playerData: PlayerData,
        x: number,
        y: number,
        readonly loadout: PlayerLoadout,
    ) {
        super(scene, x, y);

        this.color = playerData.color;
        this.playerIndex = playerData.index;
        // Dynamically instantiate the selected weapon from pure text layout choices!
        this.currentWeapon = WeaponFactory.create(loadout.weapon);

        this.scene = scene;
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
        this.minorCooldown = Math.max(0, this.minorCooldown - delta);
        this.superCharge = Math.min(100, this.superCharge + 100 / 34 * delta);
        this.invisibleTime = Math.max(0, this.invisibleTime - delta);
        this.invulnerableTime = Math.max(0, this.invulnerableTime - delta);
        this.attackBoost = Math.max(0, this.attackBoost - delta);

        if (this.command.useSuper) this.useSuper();
        if (this.command.useMinor) this.useMinor();

        // Decrease weapon timers safely
        if (this.currentWeapon.cooldownTimer > 0) {
            this.currentWeapon.cooldownTimer -= delta;
        }

        if (this.command.fire && !this.playerInBubble()) this.currentWeapon.tryFire(this);

        // Run passive update passes (like the Orbit spinning collision calculations)
        this.currentWeapon.update(delta, this, this.playerInBubble() ? 0 : 1);

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

    private useSuper(): void {
        if (this.superCharge < 100) return;
        this.superCharge = 0;
        const x = this.x;
        const y = this.y;
        if (this.loadout.super === "bubble") {
            AreaFactory.spawn(this.scene, "bubble", this.playerData.index, x, y);
        } else if (this.loadout.super === "totem") {
            AreaFactory.spawn(this.scene, "totem", this.playerData.index, x, y);
        } else if (this.loadout.super === "tether") {
            AreaFactory.spawn(this.scene, "tether", this.playerData.index, x, y);
        } else {
            this.burst(270, 360, 460, 0xfff3a1);
        }
        this.scene.events.emit("super-used", { player: this.playerData.index, ability: this.loadout.super });
    }

    private useMinor(): void {
        if (this.minorCooldown > 0) return;
        const x = this.x;
        const y = this.y;
        if (this.loadout.minor === "mine") {
            this.minorCooldown = 5;
            AreaFactory.spawn(this.scene, "mine", this.playerData.index, x, y);
        } else if (this.loadout.minor === "teleport") {
            this.minorCooldown = 4;
            let dx = this.command.moveX;
            let dy = this.command.moveY;
            if (Math.hypot(dx, dy) < 0.1) {
                dx = Math.cos(this.attackAngle);
                dy = Math.sin(this.attackAngle);
            }
            const length = Math.max(1, Math.hypot(dx, dy));
            this.setPosition(
                Phaser.Math.Clamp(x + dx / length * 145, 25, this.scene.scale.width - 25),
                Phaser.Math.Clamp(y + dy / length * 145, 25, this.scene.scale.height - 25),
            );
            this.invulnerableTime = 0.32;
        } else if (this.loadout.minor === "invisibility") {
            this.minorCooldown = 8;
            this.invisibleTime = 3.2;
        } else {
            this.minorCooldown = 7;
            AreaFactory.spawn(this.scene, "barrier", this.playerData.index, x, y);
        }
        this.scene.events.emit("minor-used", { player: this.playerData.index, ability: this.loadout.minor });
    }

    private playerInBubble(): boolean {
        return this.scene.areas.some((area) => area.kind === "bubble"
            && Phaser.Math.Distance.Between(this.x, this.y, area.x, area.y) < area.areaData.radius);
    }

    private burst(radius: number, damage: number, knockback: number, color: number): void {
        this.scene.damageEnemiesNear(this.x, this.y, radius, damage, knockback, this);
        this.scene.addExpandingRing(this.x, this.y, radius, color, 0.38);
        this.scene.emitParticles(this.x, this.y, color, 20);
    }

    private draw(): void {
        const graphics = this.graphic;
        const alpha = this.invisibleTime > 0 ? 0.06 : 1;

        graphics.clear();
        graphics.setAlpha(alpha);

        graphics.fillStyle(this.playerData.color, 0.85);
        graphics.fillCircle(0, 0, 5);
        graphics.lineStyle(2, this.playerData.color, 0.75);

        if (this.minorCooldown <= 0) {
            graphics.lineBetween(-10, -5, -17, -12);
            graphics.lineBetween(10, -5, 17, -12);
            graphics.lineBetween(-10, 7, -15, 15);
            graphics.lineBetween(10, 7, 15, 15);
        }

        if (this.superCharge >= 100) {
            graphics.setAlpha(0.1);
            graphics.fillCircle(0, 0, 16);
            graphics.setAlpha(alpha);
        }

        const aimX = Math.cos(this.attackAngle);
        const aimY = Math.sin(this.attackAngle);
        graphics.lineStyle(3, 0xe7fbff, 0.9);
        graphics.lineBetween(aimX * 9, aimY * 9, aimX * 25, aimY * 25);

        this.currentWeapon.draw(this, graphics);

        this.graphic.lineStyle(4, this.playerData.color, 0.95);
        this.graphic.beginPath();
        this.graphic.arc(0, 0, 16, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * this.health / this.maxHealth);
        this.graphic.strokePath();
    }
}
