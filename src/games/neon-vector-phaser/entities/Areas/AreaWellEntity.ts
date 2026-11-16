import Phaser from "phaser";
import type { NeonVectorScene } from "../../scene/NeonVectorScene";
import { AreaEntity } from "./AreaEntity";
import { AREA_REGISTRY } from "../../data/AreaData";
import { DamageTotem } from "../../systems/stats/Buffs";

export class AreaWellEntity extends AreaEntity {

    constructor(
        scene: NeonVectorScene,
        x: number,
        y: number,
        readonly owner: number,
    ) {
        super(scene, x, y, "totem", owner, AREA_REGISTRY.totem);
    }

    override onUpdateEffect(delta: number): void {
        this.scene.getPlayers().forEach((player) => {
            if (!player.alive || Phaser.Math.Distance.Between(player.x, player.y, this.x, this.y) > this.areaData.radius) return;

            player.stats.applyEffect(DamageTotem);
        });
    }
}
