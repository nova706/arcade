import Phaser from "phaser";
import type { NeonVectorScene } from "../../scene/NeonVectorScene";
import { AreaEntity } from "./AreaEntity";
import { AREA_REGISTRY } from "../../data/AreaData";
import { ABILITY_REGISTRY } from "../../data/AbilityData";

export class AreaMineEntity extends AreaEntity {

    constructor(
        scene: NeonVectorScene,
        x: number,
        y: number,
        readonly owner: number,
    ) {
        super(scene, x, y, "mine", owner, AREA_REGISTRY.mine);
    }

    override onUpdateEffect(delta: number): void {
        const damage = ABILITY_REGISTRY.mine.strength || 1;
        if (this.scene.enemies.some((enemy) => enemy.alive && Phaser.Math.Distance.Between(enemy.x, enemy.y, this.x, this.y) < 70)) {
            this.scene.damageEnemiesNear(this.x, this.y, 120, damage, 300, this.scene.players[this.owner]);
            this.remaining = 0;
        }
    }
}
