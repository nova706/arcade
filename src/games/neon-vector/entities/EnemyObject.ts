import { PhysicsWorld } from "../../../engine";
import type { EnemyState, EnemyType, GameObjectOptions } from "../types";
import { PhysicsObject } from "./PhysicsObject";

export const ENEMY_CONFIG: Record<EnemyType, { health: number; damage: number; speed: number; radius: number; color: string }> = {
  chaser: { health: 65, damage: 15, speed: 86, radius: 13, color: "#ff456b" },
  charger: { health: 115, damage: 26, speed: 70, radius: 16, color: "#ff9d45" },
  ranger: { health: 80, damage: 12, speed: 58, radius: 14, color: "#bd72ff" },
  splitter: { health: 55, damage: 11, speed: 77, radius: 15, color: "#ff5bca" },
  tank: { health: 260, damage: 30, speed: 36, radius: 23, color: "#ff653c" },
  flanker: { health: 92, damage: 18, speed: 116, radius: 12, color: "#f7e85a" },
  boss: { health: 2600, damage: 48, speed: 48, radius: 38, color: "#ff274f" },
};

export class EnemyObject extends PhysicsObject implements EnemyState {
  readonly maxHealth: number;
  health: number;
  readonly damage: number;
  readonly speed: number;
  attackCooldown = 0;
  telegraph = 0;
  slowedDefense = 0;
  alive = true;

  constructor(
    id: string,
    readonly type: EnemyType,
    physics: PhysicsWorld,
    options: GameObjectOptions,
    waveScale: number,
  ) {
    const config = ENEMY_CONFIG[type];
    const body = physics.createCircle(options.x, options.y, options.radius || config.radius, {
      frictionAir: 0.22,
      restitution: type === "tank" || type === "boss" ? 0.15 : 0.72,
      label: `enemy-${type}`,
    });
    super(id, physics, body);
    this.maxHealth = config.health * waveScale;
    this.health = this.maxHealth;
    this.damage = config.damage * Math.min(1 + waveScale * 0.12, 2.8);
    this.speed = config.speed * Math.min(1 + waveScale * 0.018, 1.65);
  }

  takeDamage(amount: number, defensePierce = 0): number {
    if (!this.alive) return 0;
    const armor = this.type === "tank" || this.type === "boss" ? 0.72 : 1;
    const defensePenalty = this.slowedDefense > 0 ? 1.35 : 1;
    const actual = amount * (armor + (1 - armor) * defensePierce) * defensePenalty;
    this.health = Math.max(0, this.health - actual);
    if (this.health <= 0) {
      this.alive = false;
      this.active = false;
    }
    return actual;
  }
}
