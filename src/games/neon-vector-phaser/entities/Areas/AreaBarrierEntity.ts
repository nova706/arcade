import Phaser from "phaser";
import type { NeonVectorScene } from "../../scene/NeonVectorScene";
import { AreaEntity } from "./AreaEntity";
import { AREA_REGISTRY } from "../../data/AreaData";

export class AreaBarrierEntity extends AreaEntity {

    constructor(
        scene: NeonVectorScene,
        x: number,
        y: number,
        readonly owner: number,
        readonly orientation = 0,
    ) {
        super(scene, x, y, "barrier", owner, AREA_REGISTRY.barrier, orientation);
    }

    override onUpdateEffect(delta: number): void {
        
    }

    protected override draw(): void {
        const color = this.areaData.color;
        this.graphic.clear();

        this.graphic.lineStyle(12, color, 0.16);
        this.graphic.lineBetween(-this.areaData.radius, 0, this.areaData.radius, 0);
        this.graphic.lineStyle(4, color, 0.95);
        this.graphic.lineBetween(-this.areaData.radius, 0, this.areaData.radius, 0);
        this.graphic.lineStyle(1, 0xffffff, 0.8);
        this.graphic.lineBetween(-this.areaData.radius + 6, 0, this.areaData.radius - 6, 0);
        this.setRotation(this.orientation);
    }
}
