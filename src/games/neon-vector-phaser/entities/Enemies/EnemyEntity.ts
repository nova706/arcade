import Phaser from "phaser";
import type { EnemyType } from "../../types";
import type { PlayerEntity } from "../PlayerEntity";
import type { NeonVectorScene } from "../../scene/NeonVectorScene";
import { ENEMY_CONFIG } from "../../data/EnemyData";
import type { IAttacker } from "../../interfaces/IAttacker";
import { StatComponent } from "../../systems/stats/StatComponent";
import { WaveModifier } from "../../systems/stats/Buffs";

export class EnemyEntity extends Phaser.GameObjects.Container implements IAttacker {
    declare body: Phaser.Physics.Arcade.Body;

    readonly id: string = Phaser.Math.RND.uuid();

    readonly graphic: Phaser.GameObjects.Graphics;
    readonly scene: NeonVectorScene;
    readonly radius: number;

    readonly stats: StatComponent;

    currentHealth: number;
    damageAmount: number = 0;
    attackCooldown = 0;
    alive = true;

    private knockbackTime = 0;

    public attackAngle = 0;
    public color: number;

    constructor(scene: NeonVectorScene, x: number, y: number, readonly type: EnemyType, wave: number) {
        super(scene, x, y);
        this.scene = scene;

        const config = ENEMY_CONFIG[type];
        this.radius = config.radius;
        this.color = config.color;
        this.damageAmount = config.damage;

        this.stats = new StatComponent({
            maxHealth: config.health,
            healthRegen: 0,
            healthRegenDelay: 0,
            maxOvershield: 0,
            damageTakenMultiplier: this.type === "tank" || this.type === "boss" ? 0.72 : 1,
            moveSpeed: config.speed,
            damageMultiplier: 1.0,
            attackRateMultiplier: 1.0,
            superCooldownMultiplier: 0,
            abilityCooldownMultiplier: 0
        });
        this.currentHealth = this.stats.getStat("maxHealth");
        this.stats.applyEffect(WaveModifier(wave));

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

        this.stats.update(delta, this);

        this.attackCooldown = Math.max(0, this.attackCooldown - delta * this.stats.getStat("attackRateMultiplier"));
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
            .filter((player) => player.alive && !player.stats.hasTag("invisible"))
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
        var damageAmount = this.damageAmount * this.stats.getStat('damageMultiplier');
        if (attackedPlayer) attackedPlayer.takeDamage(damageAmount, this);
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

        if (this.stats.hasTag('invulnerable')) {
            // Optional: spawn a floating "IMMUNE" or shield spark effect here
            return;
        }

        source?.stats.removeEffect("invisibility");

        const finalDamage = amount * this.stats.getStat('damageTakenMultiplier');
        if (finalDamage <= 0) return;

        this.currentHealth = Math.max(0, this.currentHealth - finalDamage);

        const angle = source ? Phaser.Math.Angle.Between(source.x, source.y, this.x, this.y) : 0;
        this.applyKnockback(angle, knockback);
        this.scene.effectsManager.emitParticles(this.x, this.y, this.color, 4);
        
        if (this.currentHealth <= 0) this.handleDeath();
    }

    handleDeath(): void {
        if (!this.alive) return;
        this.alive = false;
        this.onDeath();

        this.scene.events.emit("enemy-died", this);

        if (this.type === "splitter") {
            for (let i = 0; i < 2; i += 1) {
                const child = this.scene.spawnEnemyAt("chaser", this.x + (i ? 18 : -18), this.y);
                child.currentHealth = Math.ceil(child.currentHealth * 0.55);
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
            graphics.strokeRect(-this.radius, -this.radius - 9, this.radius * 2 * this.currentHealth / this.stats.getStat('maxHealth'), 3);
        }
    }
}
