import type { AreaKind } from "../data/AreaData";
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

export const AreaFactory = {
    spawn(
        scene: NeonVectorScene,
        kind: AreaKind,
        owner: number,
        x: number,
        y: number,
    ): AreaEntity | undefined {

        let area: AreaEntity;
        switch (kind) {
            case "barrier":
                area = new AreaBarrierEntity(scene, x, y, owner);
                break;
            case "blackhole":
                area = new AreaBlackholeEntity(scene, x, y, owner);
                break;
            case "bubble":
                area = new AreaBubbleEntity(scene, x, y, owner);
                break;
            case "capture":
                area = new AreaCaptureEntity(scene, x, y, owner);
                break;
            case "checkpoint":
                area = new AreaCheckpointEntity(scene, x, y, owner);
                break;
            case "mine":
                area = new AreaMineEntity(scene, x, y, owner);
                break;
            case "tether":
                area = new AreaTetherEntity(scene, x, y, owner);
                break;
            case "totem":
                area = new AreaWellEntity(scene, x, y, owner);
                break;
            default:
                return undefined;
        }

        area.setDepth(-1);
        scene.areas.push(area);
        return area;
    }
}
