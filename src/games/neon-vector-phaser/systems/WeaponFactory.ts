import type { WeaponBase } from "../entities/Weapons/WeaponBase";
import { WeaponBeam } from "../entities/Weapons/WeaponBeam";
import { WeaponChain } from "../entities/Weapons/WeaponChain";
import { WeaponOrbit } from "../entities/Weapons/WeaponOrbit";
import type { WeaponType } from "../types";

type Constructor = new (
    kind: WeaponType) => WeaponBase

const REGISTRY: Record<WeaponType, Constructor> = {
    beam: WeaponBeam,
    orbit: WeaponOrbit,
    chain: WeaponChain
};

export const WeaponFactory = {
    create(type: WeaponType): WeaponBase {
        const EntityClass = REGISTRY[type];
        if (!EntityClass) throw new Error(`Weapon type ${type} not found`);
        return new EntityClass(type);
    }
}
