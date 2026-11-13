import type { AbilityType } from "../data/AbilityData";
import { AbilityBarrier } from "../entities/Abilities/AbilityBarrier";
import type { AbilityBase } from "../entities/Abilities/AbilityBase";
import { AbilityInvisibility } from "../entities/Abilities/AbilityInvisibility";
import { AbilityMine } from "../entities/Abilities/AbilityMine";
import { AbilityShockwave } from "../entities/Abilities/AbilityShockwave";
import { AbilityTeleport } from "../entities/Abilities/AbilityTeleport";

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
