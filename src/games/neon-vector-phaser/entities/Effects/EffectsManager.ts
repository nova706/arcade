import Phaser from "phaser";
import { DirectionalBurstEntity } from "./DirectionalBurstEntity";
import { ExpandingRingEntity } from "./ExpandingRingEntity";
import { ParticleEntity } from "./ParticleEntity";
import { ProjectileEntity } from "./ProjectileEntity";
import type { BeamEntity } from "./BeamEntity";

export class EffectsManager {
    private projectiles: Phaser.GameObjects.Group;
    private particles: Phaser.GameObjects.Group;
    private weaponEffects: Phaser.GameObjects.Group;

    constructor(private scene: Phaser.Scene) {
        this.projectiles = scene.add.group();
        this.particles = scene.add.group();
        this.weaponEffects = scene.add.group();
    }

    public update(delta: number): void {

        (this.projectiles.getChildren() as ProjectileEntity[]).forEach((proj) => {
            if (proj.update(delta)) {
                proj.destroy();
            }
        });

        (this.particles.getChildren() as ParticleEntity[]).forEach((part) => {
            if (part.update(delta)) {
                part.destroy();
            }
        });

        (this.weaponEffects.getChildren() as Array<DirectionalBurstEntity | ExpandingRingEntity | BeamEntity>).forEach((effect) => {
            if (effect.update(delta)) {
                effect.destroy();
            }
        });
    }

    public addWeaponEffect(effect: DirectionalBurstEntity | ExpandingRingEntity | BeamEntity): void {
        this.weaponEffects.add(effect);
    }

    public addExpandingRing(x: number, y: number, radius: number, color: number, lifetime: number): void {
        this.weaponEffects.add(new ExpandingRingEntity(this.scene, x, y, radius, color, lifetime));
    }

    public addProjectile(x: number, y: number, directionX: number, directionY: number, distance: number, color: number, lifetime: number): void {
        const length = Math.max(0.001, Math.hypot(directionX, directionY));
        const projectile = new ProjectileEntity(this.scene, x, y, directionX / length, directionY / length, distance, color, lifetime);
        this.projectiles.add(projectile);
    }

    public emitParticles(x: number, y: number, color: number, count: number): void {
        for (let i = 0; i < count; i += 1) {
            this.particles.add(new ParticleEntity(this.scene, x, y, color, Phaser.Math.Between(30, 180), Math.random() * Math.PI * 2, 0.34));
        }
    }

    public destroy() {
        this.projectiles.clear(true, true);
        this.particles.clear(true, true);
        this.weaponEffects.clear(true, true);
    }
}
