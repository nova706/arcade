import { PhysicsWorld } from "../../../engine";
import type { GameObjectOptions, PlayerLoadout, PlayerState } from "../types";
import { PhysicsObject } from "./PhysicsObject";

export class PlayerObject extends PhysicsObject implements PlayerState {
  readonly maxHealth = 220;
  health = this.maxHealth;
  overshield = 0;
  superCharge = 0;
  minorCooldown = 0;
  weaponCooldown = 0;
  attackAngle = -Math.PI / 2;
  invisible = 0;
  alive = true;
  invulnerable = 0;
  attackBoost = 0;

  constructor(
    id: string,
    readonly index: number,
    readonly color: string,
    readonly loadout: PlayerLoadout,
    physics: PhysicsWorld,
    options: GameObjectOptions,
  ) {
    const body = physics.createCircle(options.x, options.y, options.radius, {
      frictionAir: 0.12,
      restitution: 0.35,
      label: `player-${index + 1}`,
    });
    super(id, physics, body);
  }

  damage(amount: number): number {
    if (!this.alive || this.invulnerable > 0) return 0;
    let remaining = amount;
    const shieldDamage = Math.min(this.overshield, remaining);
    this.overshield -= shieldDamage;
    remaining -= shieldDamage;
    const healthDamage = Math.min(this.health, remaining);
    this.health -= healthDamage;
    this.invulnerable = 0.42;
    if (this.health <= 0) {
      this.health = 0;
      this.alive = false;
      this.active = false;
      this.setVelocity(0, 0);
    }
    return shieldDamage + healthDamage;
  }

  heal(amount: number): void {
    if (!this.alive) return;
    this.health = Math.min(this.maxHealth, this.health + amount);
  }
}
