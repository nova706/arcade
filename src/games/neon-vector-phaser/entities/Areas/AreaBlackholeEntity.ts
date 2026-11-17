import Phaser from "phaser";
import type { NeonVectorScene } from "../../scene/NeonVectorScene";
import { AreaEntity } from "./AreaEntity";
import { AREA_REGISTRY } from "../../data/AreaData";
import { Slowed } from "../../systems/stats/Debuffs";

export class AreaBlackholeEntity extends AreaEntity {

    private pullStrength: number = 300;
    private pullStrengthFalloff: number = 50;
    private damage: number = 400;

    constructor(
        scene: NeonVectorScene,
        x: number,
        y: number,
        readonly owner: number,
    ) {
        super(scene, x, y, "blackhole", owner, AREA_REGISTRY.blackhole);
    }

    override onUpdateEffect(delta: number): void {
        this.scene.getPlayers().forEach((player) => {
            if (!player.alive) return;
            const distance = Phaser.Math.Distance.Between(player.x, player.y, this.x, this.y);

            if (distance > 5) {
                const currentPull = this.pullStrength / (1 + (distance / this.pullStrengthFalloff));

                // Pull players in
                const angle = Phaser.Math.Angle.Between(player.x, player.y, this.x, this.y);
                player.body.setVelocity(player.body.velocity.x + Math.cos(angle) * currentPull, player.body.velocity.y + Math.sin(angle) * currentPull);
            }

            if (distance < this.areaData.radius) {
                player.stats.applyEffect(Slowed);
            }
        });
    }

    override destroy() {
        this.scene.explodeAt(this.x, this.y, this.areaData.radius, this.damage, this.areaData.color);
        super.destroy();
    }
}
