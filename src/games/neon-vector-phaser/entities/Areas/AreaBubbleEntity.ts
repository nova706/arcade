import Phaser from "phaser";
import type { NeonVectorScene } from "../../scene/NeonVectorScene";
import { AreaEntity } from "./AreaEntity";
import { AREA_REGISTRY } from "../../data/AreaData";

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
        
        this.scene.players.forEach((player) => {
            if (!player.alive || Phaser.Math.Distance.Between(player.x, player.y, this.x, this.y) > this.areaData.radius) return;
            player.heal(3 * delta);
            player.overshield = Math.min(42, player.overshield + 5 * delta);
        });

        this.scene.enemies.forEach((enemy) => {
            const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.x, this.y);
            if (distance >= this.areaData.radius + enemy.radius) return;
            const angle = Phaser.Math.Angle.Between(this.x, this.y, enemy.x, enemy.y);
            enemy.body.setVelocity(Math.cos(angle) * enemy.speed * 1.8, Math.sin(angle) * enemy.speed * 1.8);
        });
    }
}
