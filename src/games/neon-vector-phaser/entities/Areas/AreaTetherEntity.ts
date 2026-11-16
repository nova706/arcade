import Phaser from "phaser";
import type { NeonVectorScene } from "../../scene/NeonVectorScene";
import { AreaEntity } from "./AreaEntity";
import { AREA_REGISTRY } from "../../data/AreaData";
import type { EnemyEntity } from "../Enemies/EnemyEntity";
import type { IAttacker } from "../../interfaces/IAttacker";
import { Tethered } from "../../systems/stats/Debuffs";

export class AreaTetherEntity extends AreaEntity {

    constructor(
        scene: NeonVectorScene,
        x: number,
        y: number,
        readonly owner: number,
    ) {
        super(scene, x, y, "tether", owner, AREA_REGISTRY.tether);
    }

    override onUpdateEffect(delta: number): void {
        const tetheredEnemies: EnemyEntity[] = [];

        this.scene.getEnemies().forEach((enemy) => {
            const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.x, this.y);
            if (distance > this.areaData.radius) return;

            tetheredEnemies.push(enemy);

            // Pull inward
            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.x, this.y);
            enemy.body.setVelocity(enemy.body.velocity.x + Math.cos(angle) * 72, enemy.body.velocity.y + Math.sin(angle) * 72);

            // Apply Weaken + Share 50% of damage to other enemies in this tether
            enemy.stats.applyEffect(Tethered((hitEnemy, amount) => {
                tetheredEnemies.forEach((enemy) => {
                    enemy.takeDamage(amount * 0.5);
                });
            }));
        });
    }
}
