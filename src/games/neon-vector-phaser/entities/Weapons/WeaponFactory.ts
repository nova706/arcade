import type { WeaponType } from "../../data/Loadouts";
import type { WeaponBase } from "./WeaponBase";
import { WeaponBeam } from "./WeaponBeam";
import { WeaponBurst } from "./WeaponBurst";
import { WeaponChain } from "./WeaponChain";
import { WeaponOrbit } from "./WeaponOrbit";

type Constructor = new (
    kind: WeaponType) => WeaponBase

const REGISTRY: Record<WeaponType, Constructor> = {
    beam: WeaponBeam,
    orbit: WeaponOrbit,
    chain: WeaponChain,
    burst: WeaponBurst
};

export const WeaponFactory = {
    create(type: WeaponType): WeaponBase {
        const EntityClass = REGISTRY[type];
        if (!EntityClass) throw new Error(`Weapon type ${type} not found`);
        return new EntityClass(type);
    }
}
