import type { AreaType } from "../../data/AreaData";
import { AreaBarrierEntity } from "../Areas/AreaBarrierEntity";
import { AreaBlackholeEntity } from "../Areas/AreaBlackholeEntity";
import { AreaBubbleEntity } from "../Areas/AreaBubbleEntity";
import { AreaCaptureEntity } from "../Areas/AreaCaptureEntity";
import { AreaCheckpointEntity } from "../Areas/AreaCheckpointEntity";
import type { AreaEntity } from "../Areas/AreaEntity";
import { AreaMineEntity } from "../Areas/AreaMineEntity";
import { AreaTetherEntity } from "../Areas/AreaTetherEntity";
import { AreaWellEntity } from "../Areas/AreaWellEntity";
import type { NeonVectorScene } from "../../scene/NeonVectorScene";

type Constructor = new (
    scene: NeonVectorScene,
    x: number,
    y: number,
    owner: number) => AreaEntity

const REGISTRY: Record<AreaType, Constructor> = {
    barrier: AreaBarrierEntity,
    blackhole: AreaBlackholeEntity,
    bubble: AreaBubbleEntity,
    capture: AreaCaptureEntity,
    checkpoint: AreaCheckpointEntity,
    mine: AreaMineEntity,
    tether: AreaTetherEntity,
    totem: AreaWellEntity
};

export const AreaFactory = {
    spawn(
        scene: NeonVectorScene,
        type: AreaType,
        owner: number,
        x: number,
        y: number,
    ): AreaEntity | undefined {
        const EntityClass = REGISTRY[type];
        if (!EntityClass) throw new Error(`Area type ${type} not found`);
        const area = new EntityClass(scene, x, y, owner);

        scene.spawnArea(area);
        return area;
    }
}
