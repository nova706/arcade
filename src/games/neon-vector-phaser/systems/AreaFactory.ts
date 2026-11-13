import type { AreaType } from "../data/AreaData";
import { AreaBarrierEntity } from "../entities/Areas/AreaBarrierEntity";
import { AreaBlackholeEntity } from "../entities/Areas/AreaBlackholeEntity";
import { AreaBubbleEntity } from "../entities/Areas/AreaBubbleEntity";
import { AreaCaptureEntity } from "../entities/Areas/AreaCaptureEntity";
import { AreaCheckpointEntity } from "../entities/Areas/AreaCheckpointEntity";
import type { AreaEntity } from "../entities/Areas/AreaEntity";
import { AreaMineEntity } from "../entities/Areas/AreaMineEntity";
import { AreaTetherEntity } from "../entities/Areas/AreaTetherEntity";
import { AreaWellEntity } from "../entities/Areas/AreaWellEntity";
import type { NeonVectorScene } from "../scene/NeonVectorScene";

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
