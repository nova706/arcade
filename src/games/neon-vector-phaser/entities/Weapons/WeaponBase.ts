import { WEAPON_STATS, type WeaponStats } from "../../data/Loadouts";
import type { IAttacker } from "../../interfaces/IAttacker";
import type { PlayerLoadout } from "../../types";

export abstract class WeaponBase {
    public cooldownTimer = 0;
    public chargeTimer = 0;
    public readonly stats: WeaponStats;

    constructor(protected readonly weaponKey: PlayerLoadout["weapon"]) {
        this.stats = WEAPON_STATS[this.weaponKey];
    }

    // Some weapons (like 'orbit') need a continuous frame update tick
    public update(delta: number, attacker: IAttacker): void { }

    // Some weapons (like 'orbit') need a continuous frame draw tick
    public draw(attacker: IAttacker, graphics: Phaser.GameObjects.Graphics): void {}

    public tryFire(delta: number, attacker: IAttacker): void {
        if (this.cooldownTimer > 0) return;

        // If charging, do not fire
        if (this.stats.chargeTime && this.chargeTimer < this.stats.chargeTime) {
            this.chargeTimer += delta;
            return;
        }

        this.cooldownTimer = this.stats.cooldown;
        this.chargeTimer = 0;
        
        // Break stealth automatically on trigger pull
        attacker.stats.removeEffect("invisibility");

        // Calculate damage amplification factor
        const damageMultiplier = attacker.stats.getStat("damageMultiplier") || 1;

        // Execute the unique firing code written in the subclass
        this.executeFire(attacker, damageMultiplier);
    }

    public stopFire(attacker: IAttacker): void {
        this.chargeTimer = 0;
    }

    protected abstract executeFire(attacker: IAttacker, damageMultiplier: number): void;
}
