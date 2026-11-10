import Phaser from "phaser";
import type { NeonVectorScene } from "../../scene/NeonVectorScene";
import { AreaEntity } from "./AreaEntity";
import { AREA_REGISTRY } from "../../data/AreaData";

export class AreaWellEntity extends AreaEntity {

    constructor(
        scene: NeonVectorScene,
        x: number,
        y: number,
        readonly owner: number,
        readonly orientation = 0,
    ) {
        super(scene, x, y, "totem", owner, AREA_REGISTRY.totem, orientation);
    }

    override onUpdateEffect(delta: number): void {
        this.scene.players.forEach((player) => {
            if (!player.alive || Phaser.Math.Distance.Between(player.x, player.y, this.x, this.y) > this.areaData.radius) return;
            player.heal(8 * delta);
            if (this.kind === "totem") player.attackBoost = 0.15;
        });
    }
}
