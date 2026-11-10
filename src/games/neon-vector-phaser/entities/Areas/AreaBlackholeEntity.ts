import Phaser from "phaser";
import type { NeonVectorScene } from "../../scene/NeonVectorScene";
import { AreaEntity } from "./AreaEntity";
import { AREA_REGISTRY } from "../../data/AreaData";

export class AreaBlackholeEntity extends AreaEntity {

    constructor(
        scene: NeonVectorScene,
        x: number,
        y: number,
        readonly owner: number,
    ) {
        super(scene, x, y, "blackhole", owner, AREA_REGISTRY.blackhole);
    }

    override onUpdateEffect(delta: number): void {
        this.scene.players.forEach((player) => {
            if (!player.alive) return;
            const distance = Phaser.Math.Distance.Between(player.x, player.y, this.x, this.y);
            if (distance < 430) {
                const angle = Phaser.Math.Angle.Between(player.x, player.y, this.x, this.y);
                player.body.setVelocity(player.body.velocity.x + Math.cos(angle) * 50, player.body.velocity.y + Math.sin(angle) * 50);
            }
            if (distance < 58) this.scene.damagePlayer(player, 8 * delta);
        });
    }
}
