import Phaser from "phaser";
import type { EnemyType } from "../../types";
import type { PlayerEntity } from "../PlayerEntity";
import type { NeonVectorScene } from "../../scene/NeonVectorScene";
import { ENEMY_CONFIG } from "../../data/EnemyData";
import type { IAttacker } from "../../interfaces/IAttacker";
import type { WeaponBase } from "../Weapons/WeaponBase";

export class EnemyEntity extends Phaser.GameObjects.Container implements IAttacker {
    declare body: Phaser.Physics.Arcade.Body;

    readonly graphic: Phaser.GameObjects.Graphics;
    readonly maxHealth: number;
    readonly scene: NeonVectorScene;
    health: number;
    readonly damageAmount: number;
    readonly speed: number;
    readonly radius: number;

    attackCooldown = 0;
    alive = true;

    private knockbackTime = 0;

    // Satisfy IAttacker attributes
    public attackAngle = 0;
    public attackBoost = 0;
    public invisibleTime = 0;
    public color: number;
    public currentWeapon: WeaponBase | null = null; // Optional: equip weapons directly to enemies!

    constructor(scene: NeonVectorScene, x: number, y: number, readonly type: EnemyType, wave: number) {
        super(scene, x, y);
        this.scene = scene;

        const config = ENEMY_CONFIG[type];
        this.radius = config.radius;
        this.color = config.color;

        const scale = 1 + (wave - 1) * 0.055;
        this.maxHealth = config.health * scale;
        this.health = this.maxHealth;
        this.damageAmount = config.damage * Math.min(1 + scale * 0.12, 2.8);
        this.speed = config.speed * Math.min(1 + (wave - 1) * 0.018, 1.65);

        this.graphic = scene.add.graphics();
        this.add(this.graphic);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.body.setCircle(this.radius);
        this.body.setCollideWorldBounds(true);
        this.body.setBounce(type === "boss" || type === "tank" ? 0.15 : 0.55);
        this.body.setDamping(true);
        this.body.setDrag(90);
        this.body.setMaxVelocity(360, 360);
    }

    update(delta: number): void {
        this.attackCooldown = Math.max(0, this.attackCooldown - delta);

        if (this.currentWeapon && this.currentWeapon.cooldownTimer > 0) {
            this.currentWeapon.cooldownTimer -= delta;
        }

        if (!this.alive) return;
        this.draw();
    }

    fixedUpdate(players: PlayerEntity[]) {
        if (!this.alive) return null;

        if (this.knockbackTime > 0) {
            this.knockbackTime = Math.max(0, this.knockbackTime - 1 / 60);
            if (this.knockbackTime === 0) this.body.setDamping(true);
            return null;
        }

        // Find nearest visible target player
        const target = players
            .filter((player) => player.alive && player.invisibleTime <= 0)
            .sort((a, b) => Phaser.Math.Distance.Between(this.x, this.y, a.x, a.y) - Phaser.Math.Distance.Between(this.x, this.y, b.x, b.y))[0];

        if (!target) {
            this.body.setVelocity(0, 0);
            return null;
        }

        // Keep attacker direction math updated dynamically
        this.attackAngle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
        const distance = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);

        // Delegate execution pattern down to strategies
        let attackedPlayer = this.executeMovement(target, distance, this.attackAngle);

        // TODO: If in range and there is a visible target, execute attack logic
        if (attackedPlayer) attackedPlayer.takeDamage(this.damageAmount, this);
    }

    protected executeMovement(target: PlayerEntity, distance: number, angle: number): PlayerEntity | null {
        return null;
    }

    applyKnockback(angle: number, force: number): void {
        if (force <= 0) return;
        this.knockbackTime = Math.max(this.knockbackTime, 0.22);
        this.body.setDamping(false);
        this.body.setVelocity(
            this.body.velocity.x + Math.cos(angle) * force,
            this.body.velocity.y + Math.sin(angle) * force,
        );
    }

    takeDamage(amount: number, source?: IAttacker, knockback = 100): void {
        if (!this.alive) return;

        if (this.isShielded()) return;

        // TODO: Move this to the other side... if dealt damage, no longer invisible
        if (source) source.invisibleTime = 0;

        // TODO: Better handling of stacks of modifiers
        const buff = source && this.scene.getAreas().some((area) => area.kind === "totem" && area.owner === source.playerIndex
            && Phaser.Math.Distance.Between(source.x, source.y, area.x, area.y) < area.areaData.radius) ? 1.3 : 1;

        const armor = this.type === "tank" || this.type === "boss" ? 0.72 : 1;
        this.health = Math.max(0, this.health - amount * armor * buff);

        const angle = source ? Phaser.Math.Angle.Between(source.x, source.y, this.x, this.y) : 0;
        this.applyKnockback(angle, knockback);
        this.scene.effectsManager.emitParticles(this.x, this.y, this.color, 4);
        
        if (this.health <= 0) this.handleDeath();
    }

    isShielding(target: EnemyEntity): boolean {
        return false;
    }

    isShielded(): boolean {
        // TODO: Optimize
        return this.scene.getEnemies().some((candidate) => candidate.alive && candidate.isShielding(this));
    }

    handleDeath(): void {
        if (!this.alive) return;
        this.alive = false;
        this.onDeath();

        this.scene.events.emit("enemy-died", this);

        if (this.type === "splitter") {
            for (let i = 0; i < 2; i += 1) {
                const child = this.scene.spawnEnemyAt("chaser", this.x + (i ? 18 : -18), this.y);
                child.health = Math.ceil(child.health * 0.55);
            }
        }

        this.destroy();
    }

    protected onDeath(): void {}

    override destroy(fromScene?: boolean): void {
        this.graphic.destroy();
        super.destroy(fromScene);
    }

    protected draw(): void {
        const graphics = this.graphic;
        graphics.clear();
        graphics.lineStyle(this.type === "boss" ? 4 : 2.5, this.color, 1);
        graphics.fillStyle(this.color, 0.16);
        graphics.fillCircle(0, 0, this.radius);
        graphics.strokeCircle(0, 0, this.radius);

        graphics.beginPath();
        graphics.moveTo(-this.radius, 0);
        graphics.lineTo(0, -this.radius * 0.7);
        graphics.lineTo(this.radius, 0);
        graphics.lineTo(0, this.radius * 0.7);
        graphics.closePath();
        graphics.strokePath();

        if (this.type === "boss" || this.type === "tank") {
            graphics.lineStyle(3, 0xffffff, 0.95);
            graphics.strokeRect(-this.radius, -this.radius - 9, this.radius * 2 * this.health / this.maxHealth, 3);
        }
    }
}
