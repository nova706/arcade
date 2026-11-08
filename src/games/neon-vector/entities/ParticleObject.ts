import { GameObject } from "../../../engine";
import type { ParticleState } from "../types";

export class ParticleObject extends GameObject implements ParticleState {
  readonly maxLifetime: number;

  constructor(
    id: string,
    public x: number,
    public y: number,
    public color: string,
    lifetime: number,
    public velocityX: number,
    public velocityY: number,
    public size: number,
  ) {
    super(id);
    this.lifetime = lifetime;
    this.maxLifetime = lifetime;
  }

  lifetime: number;
}
