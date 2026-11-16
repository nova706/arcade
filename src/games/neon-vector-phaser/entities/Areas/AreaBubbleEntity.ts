import Phaser from "phaser";
import type { NeonVectorScene } from "../../scene/NeonVectorScene";
import { AreaEntity } from "./AreaEntity";
import { AREA_REGISTRY } from "../../data/AreaData";
import { SuperBubbleBuff } from "../../systems/stats/Buffs";

export class AreaBubbleEntity extends AreaEntity {

    constructor(
        scene: NeonVectorScene,
        x: number,
        y: number,
        readonly owner: number,
    ) {
        super(scene, x, y, "bubble", owner, AREA_REGISTRY.bubble);
    }

    override onUpdateEffect(delta: number): void {

        // Players cannot be hurt, get overshield and recharge health
        this.scene.getPlayers().forEach((player) => {
            if (!player.alive || Phaser.Math.Distance.Between(player.x, player.y, this.x, this.y) >= this.areaData.radius) return;

            player.stats.applyEffect(SuperBubbleBuff);

            // TODO: Overshield?
        });

        // Enemies cannot get in
        this.scene.getEnemies().forEach((enemy) => {
            const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.x, this.y);
            if (distance >= this.areaData.radius + enemy.radius) return;
            const angle = Phaser.Math.Angle.Between(this.x, this.y, enemy.x, enemy.y);
            const speed = enemy.stats.getStat("moveSpeed");
            enemy.body.setVelocity(Math.cos(angle) * speed * 1.8, Math.sin(angle) * speed * 1.8);
        });
    }
}
