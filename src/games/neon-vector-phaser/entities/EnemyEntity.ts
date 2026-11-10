import Phaser from "phaser";
import type { EnemyConfig, EnemyType } from "../types";
import type { PlayerEntity } from "./PlayerEntity";
import type { NeonVectorScene } from "../scene/NeonVectorScene";

export const ENEMY_CONFIG: Record<EnemyType, EnemyConfig> = {
    chaser: { health: 65, damage: 15, speed: 86, radius: 13, color: 0xff456b },
    charger: { health: 115, damage: 26, speed: 70, radius: 16, color: 0xff9d45 },
    ranger: { health: 80, damage: 12, speed: 58, radius: 14, color: 0xbd72ff },
    splitter: { health: 55, damage: 11, speed: 77, radius: 15, color: 0xff5bca },
    tank: { health: 260, damage: 30, speed: 36, radius: 23, color: 0xff653c },
    flanker: { health: 92, damage: 18, speed: 116, radius: 12, color: 0xf7e85a },
    boss: { health: 2600, damage: 48, speed: 48, radius: 38, color: 0xff274f },
};

export class EnemyEntity extends Phaser.GameObjects.Container {
    declare body: Phaser.Physics.Arcade.Body;

    readonly graphic: Phaser.GameObjects.Graphics;
    readonly maxHealth: number;
    readonly scene: NeonVectorScene;
    health: number;
    readonly damageAmount: number;
    readonly speed: number;
    readonly radius: number;
    attackCooldown = 0;
    telegraph = 0;
    alive = true;

    constructor(scene: NeonVectorScene, x: number, y: number, readonly type: EnemyType, wave: number) {
        super(scene, x, y);
        this.scene = scene;
        const config = ENEMY_CONFIG[type];
        this.radius = config.radius;
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
        this.draw();
    }

    update(delta: number): void {
        this.attackCooldown = Math.max(0, this.attackCooldown - delta);
        this.telegraph = Math.max(0, this.telegraph - delta);
        this.draw();
    }

    fixedUpdate(players: PlayerEntity[]): PlayerEntity | null {
        if (!this.alive) return null;
        const target = players.filter((player) => player.alive && player.invisibleTime <= 0).sort((a, b) =>
            Phaser.Math.Distance.Between(this.x, this.y, a.x, a.y)
            - Phaser.Math.Distance.Between(this.x, this.y, b.x, b.y))[0];
        if (!target) {
            this.body.setVelocity(0, 0);
            return null;
        }

        const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
        const distance = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);
        let speed = this.speed;
        if (this.type === "ranger" && distance < 260) speed *= -0.75;
        if (this.type === "charger") {
            if (distance < 360 && this.telegraph <= 0) this.telegraph = 0.6;
            speed *= this.telegraph > 0.25 ? (this.telegraph < 0.45 ? 2.7 : 0.15) : 1;
        }
        if (this.type === "boss") speed *= 0.8;
        this.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

        if (distance < (this.type === "boss" ? 56 : 30) && this.attackCooldown <= 0) {
            this.attackCooldown = this.type === "boss" ? 1.4 : 0.95;
            return target;
        }
        return null;
    }

    takeDamage(amount: number): boolean {
        if (!this.alive) return false;
        const armor = this.type === "tank" || this.type === "boss" ? 0.72 : 1;
        this.health = Math.max(0, this.health - amount * armor);
        this.alive = this.health > 0;
        return !this.alive;
    }

    override destroy(fromScene?: boolean): void {
        this.graphic.destroy();
        super.destroy(fromScene);
    }

    private draw(): void {
        const graphics = this.graphic;
        const config = ENEMY_CONFIG[this.type];
        graphics.clear();
        graphics.lineStyle(this.type === "boss" ? 4 : 2.5, config.color, 1);
        graphics.fillStyle(config.color, 0.16);
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
