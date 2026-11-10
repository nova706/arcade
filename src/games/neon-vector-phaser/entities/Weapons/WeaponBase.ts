import { WEAPON_STATS, type WeaponStats } from "../../data/Loadouts";
import type { IAttacker } from "../../interfaces/IAttacker";
import type { PlayerLoadout } from "../../types";

export abstract class WeaponBase {
    public cooldownTimer = 0;

    constructor(protected readonly weaponKey: PlayerLoadout["weapon"]) {}

    // Some weapons (like 'orbit') need a continuous frame update tick
    public update(delta: number, attacker: IAttacker, damageMultiplier: number): void {}

    // Some weapons (like 'orbit') need a continuous frame draw tick
    public draw(attacker: IAttacker, graphics: Phaser.GameObjects.Graphics): void {}

    public tryFire(attacker: IAttacker): void {
        if (this.cooldownTimer > 0) return;

        const stats = WEAPON_STATS[this.weaponKey];
        this.cooldownTimer = stats.cooldown;
        
        // Break stealth automatically on trigger pull
        attacker.invisibleTime = 0; 

        // Calculate damage amplification factor
        const damageMultiplier = attacker.attackBoost > 0 ? 1.35 : 1;

        // Execute the unique firing code written in the subclass
        this.executeFire(attacker, stats, damageMultiplier);
    }

    protected abstract executeFire(attacker: IAttacker, stats: WeaponStats, damageMultiplier: number): void;
}
