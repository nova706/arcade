import type { AbilityKind } from "../data/AbilityData";
import { AbilityBarrier } from "../entities/Abilities/AbilityBarrier";
import type { AbilityBase } from "../entities/Abilities/AbilityBase";
import { AbilityInvisibility } from "../entities/Abilities/AbilityInvisibility";
import { AbilityMine } from "../entities/Abilities/AbilityMine";
import { AbilityShockwave } from "../entities/Abilities/AbilityShockwave";
import { AbilityTeleport } from "../entities/Abilities/AbilityTeleport";

export const AbilityFactory = {
    create(abilityKind: AbilityKind): AbilityBase {
        switch (abilityKind) {
            case "mine":      return new AbilityMine("mine");
            case "teleport":  return new AbilityTeleport("teleport");
            case "invisibility": return new AbilityInvisibility("invisibility");
            case "barrier":   return new AbilityBarrier("barrier");
            case "shockwave": return new AbilityShockwave("shockwave");
            default:          throw new Error(`Ability kind ${abilityKind} not found`);
        }
    }
}
