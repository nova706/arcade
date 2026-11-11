import type { WeaponBase } from "../entities/Weapons/WeaponBase";
import { WeaponBeam } from "../entities/Weapons/WeaponBeam";
import { WeaponChain } from "../entities/Weapons/WeaponChain";
import { WeaponOrbit } from "../entities/Weapons/WeaponOrbit";
import type { WeaponType } from "../types";

export const WeaponFactory = {
    create(weaponType: WeaponType): WeaponBase {
        switch (weaponType) {
            case "beam":      return new WeaponBeam("beam");
            case "orbit": return new WeaponOrbit("orbit");
            case "chain":     return new WeaponChain("chain");
            default:          throw new Error(`Weapon type ${weaponType} not found`);
        }
    }
}
