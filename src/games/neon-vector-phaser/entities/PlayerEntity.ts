import Phaser from "phaser";
import type { PlayerCommand, PlayerData, PlayerLoadout } from "../types";
import type { NeonVectorScene } from "../scene/NeonVectorScene";
import type { IAttacker } from "../interfaces/IAttacker";
import type { WeaponBase } from "./Weapons/WeaponBase";
import { WeaponFactory } from "./Weapons/WeaponFactory";
import type { AbilityBase } from "./Abilities/AbilityBase";
import { AbilityFactory } from "./Abilities/AbilityFactory";
import { StatComponent } from "../systems/stats/StatComponent";
import type { SuperBase } from "./Supers/SuperBase";
import { SuperFactory } from "./Supers/SuperFactory";
import { HitIFrame } from "../systems/stats/Buffs";

export class PlayerEntity extends Phaser.GameObjects.Container implements IAttacker {
    private static readonly MAX_SPEED = 300;

    readonly id: string = Phaser.Math.RND.uuid();

    declare body: Phaser.Physics.Arcade.Body;

    readonly graphic: Phaser.GameObjects.Graphics;
    readonly scene: NeonVectorScene;
    readonly stats: StatComponent;

    // POOLS
    public currentHealth: number = 0;
    public currentOvershield: number = 0;
    public superCooldown: number = 0;
    public minorCooldown: number = 0;

    attackAngle = -Math.PI / 2;
    alive = true;
    color: number;
    playerIndex: number;
    loadout: PlayerLoadout;
    command: PlayerCommand = { moveX: 0, moveY: 0, aimX: 0, aimY: -1, fire: false, useMinor: false, useSuper: false };

    private currentWeapon: WeaponBase;
    private currentAbility: AbilityBase;
    private currentSuper: SuperBase;
    private healthRegenDelay = 0;

    get abilityChargePercent(): number {
        return this.currentAbility.chargePercent;
    }

    get superChargePercent(): number {
        return this.currentSuper.chargePercent;
    }

    constructor(
        scene: NeonVectorScene,
        readonly playerData: PlayerData,
        x: number,
        y: number,
        loadout: PlayerLoadout,
    ) {
        super(scene, x, y);

        this.loadout = { ...loadout };
        this.color = playerData.color;
        this.playerIndex = playerData.index;

        this.currentWeapon = WeaponFactory.create(this.loadout.weapon);
        this.currentAbility = AbilityFactory.create(this.loadout.minor);
        this.currentSuper = SuperFactory.create(this.loadout.super);

        this.stats = new StatComponent({
            maxHealth: 220,
            healthRegen: 30,
            healthRegenDelay: 3,
            maxOvershield: 50,
            damageTakenMultiplier: 1,
            moveSpeed: 250,
            damageMultiplier: 1.0,
            attackRateMultiplier: 1.0,
            superCooldownMultiplier: 1.0,
            abilityCooldownMultiplier: 1.0
        });
        this.currentHealth = this.stats.getStat("maxHealth");

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
        this.body.setMaxVelocity(PlayerEntity.MAX_SPEED, PlayerEntity.MAX_SPEED);
    }

    setCommand(command: PlayerCommand): void {
        this.command = command;
        if (Math.hypot(command.aimX, command.aimY) > 0.18) {
            this.attackAngle = Math.atan2(command.aimY, command.aimX);
        } else if (Math.hypot(command.moveX, command.moveY) > 0.18) {
            this.attackAngle = Math.atan2(command.moveY, command.moveX);
        }
    }

    applyLoadout(loadout: PlayerLoadout): void {
        if (loadout.weapon !== this.loadout.weapon) {
            this.currentWeapon = WeaponFactory.create(loadout.weapon);
        }
        if (loadout.minor !== this.loadout.minor) {
            this.currentAbility = AbilityFactory.create(loadout.minor);
            this.minorCooldown = this.currentAbility.resetCharge();
        }
        if (loadout.super !== this.loadout.super) {
            this.currentSuper = SuperFactory.create(loadout.super);
            this.superCooldown = this.currentSuper.resetCharge();
        }
        this.loadout = { ...loadout };
        this.playerData.loadout = this.loadout;
    }

    update(delta: number): void {

        this.stats.update(delta, this);

        this.minorCooldown = this.currentAbility.update(this, delta);
        this.superCooldown = this.currentSuper.update(this, delta);

        const maxHealth = this.stats.getStat("maxHealth");
        if (this.healthRegenDelay > 0) {
            this.healthRegenDelay = Math.max(0, this.healthRegenDelay - delta);
        } else if (this.currentHealth < maxHealth) {
            const regenRate = this.stats.getStat('healthRegen');
            this.currentHealth = Math.min(maxHealth, this.currentHealth + regenRate * delta);
        }

        if (this.command.useSuper) this.currentSuper.useSuper(this);
        if (this.command.useMinor) this.currentAbility.useAbility(this);

        // Decrease weapon timers safely
        if (this.currentWeapon.cooldownTimer > 0) {
            this.currentWeapon.cooldownTimer -= delta;
        }

        const canFire = !this.stats.hasTag('suppress_attack');
        if (this.command.fire) {
            if (canFire) {
                this.currentWeapon.tryFire(delta, this);
            }
        } else {
            this.currentWeapon.stopFire(this);
        }

        this.currentWeapon.update(delta, this);
        this.draw();
    }

    fixedUpdate(): void {
        if (!this.alive || !this.body) return;
        const length = Math.hypot(this.command.moveX, this.command.moveY);
        const scale = length > 1 ? 1 / length : 1;

        // Move speed now dynamically scales with slows, haste buffs, etc.
        const speed = this.stats.getStat('moveSpeed');
        this.body.setVelocity(this.command.moveX * scale * speed, this.command.moveY * scale * speed);
    }

    takeDamage(amount: number, source?: IAttacker): void {
        if (!this.alive) return;

        if (this.stats.hasTag('invulnerable')) {
            // Optional: spawn a floating "IMMUNE" or shield spark effect here
            return;
        }

        const finalDamage = amount * this.stats.getStat('damageTakenMultiplier');
        if (finalDamage <= 0) return;

        this.healthRegenDelay = this.stats.getStat('healthRegenDelay');

        const shieldDamage = Math.min(this.currentOvershield, finalDamage);
        this.currentOvershield -= shieldDamage;
        this.currentHealth = Math.max(0, this.currentHealth - (finalDamage - shieldDamage));

        this.scene.effectsManager.emitParticles(this.x, this.y, 0xff426b, 8);

        if (this.currentHealth <= 0) this.handleDeath();
    }

    handleDeath(): void {
        if (!this.alive) return;
        this.alive = false;

        this.command = { ...this.command, moveX: 0, moveY: 0, fire: false };
        this.body.setVelocity(0, 0);

        this.scene.events.emit("player-died", this);

        this.destroy();
    }

    override destroy(fromScene?: boolean): void {
        this.graphic.destroy();
        // TODO: This removed the player from the index which made the first controller control the next player... controllers need to stay sticky to players even after death
        //super.destroy(fromScene);
    }

    private draw(): void {
        const graphics = this.graphic;
        const alpha = this.stats.hasTag("invisible") ? 0.1 : 1;

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

        if (this.superCooldown <= 0) {
            graphics.fillStyle(this.playerData.color, 0.5);
            graphics.fillCircle(0, 0, 18);
        }

        const aimX = Math.cos(this.attackAngle);
        const aimY = Math.sin(this.attackAngle);
        graphics.lineStyle(3, 0xe7fbff, 0.9);
        graphics.lineBetween(aimX * 9, aimY * 9, aimX * 25, aimY * 25);

        this.currentWeapon.draw(this, graphics);

        // Draw health bar
        const maxHealth = this.stats.getStat("maxHealth");
        const healthColor = this.currentHealth < maxHealth * 0.25 ? 0xff1744 : this.playerData.color;
        this.graphic.lineStyle(4, healthColor, 0.95);
        this.graphic.beginPath();
        this.graphic.arc(0, 0, 16, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * this.currentHealth / maxHealth);
        this.graphic.strokePath();
    }
}
