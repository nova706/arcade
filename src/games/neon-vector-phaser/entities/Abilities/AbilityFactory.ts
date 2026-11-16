import type { AbilityType } from "../../data/AbilityData";
import { AbilityBarrier } from "./AbilityBarrier";
import type { AbilityBase } from "./AbilityBase";
import { AbilityInvisibility } from "./AbilityInvisibility";
import { AbilityMine } from "./AbilityMine";
import { AbilityShockwave } from "./AbilityShockwave";
import { AbilityTeleport } from "./AbilityTeleport";

type Constructor = new (
    type: AbilityType) => AbilityBase

const REGISTRY: Record<AbilityType, Constructor> = {
    mine: AbilityMine,
    teleport: AbilityTeleport,
    invisibility: AbilityInvisibility,
    barrier: AbilityBarrier,
    shockwave: AbilityShockwave
};

export const AbilityFactory = {
    create(type: AbilityType): AbilityBase {
        const EntityClass = REGISTRY[type];
        if (!EntityClass) throw new Error(`Area type ${type} not found`);
        return new EntityClass(type);
    }
}
