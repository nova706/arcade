import { SUPER_REGISTRY, type SuperData, type SuperType } from "../../data/SuperData";
import type { IAttacker } from "../../interfaces/IAttacker";

export abstract class SuperBase {
    public cooldown = 0;

    constructor(protected readonly superType: SuperType) { }

    public update(attacker: IAttacker, delta: number): number {

        const cooldownMultiplier = attacker.stats.getStat('superCooldownMultiplier');
        this.cooldown = Math.max(0, this.cooldown - delta * cooldownMultiplier);

        return this.cooldown;
    }

    public get chargePercent(): number {
        const duration = SUPER_REGISTRY[this.superType].cooldown;
        return duration === 0 ? 100 : Math.round((1 - this.cooldown / duration) * 100);
    }

    public resetCharge(): number {
        this.cooldown = SUPER_REGISTRY[this.superType].cooldown;
        return this.cooldown;
    }

    public useSuper(attacker: IAttacker): void {
        if (this.cooldown > 0) return;

        const stats = SUPER_REGISTRY[this.superType];
        this.cooldown = stats.cooldown;

        this.executeSuper(attacker, stats);

        attacker.scene.events.emit("super-used", { player: attacker.playerIndex, super: this.superType });
    }

    protected abstract executeSuper(attacker: IAttacker, stats: SuperData): void;
}
