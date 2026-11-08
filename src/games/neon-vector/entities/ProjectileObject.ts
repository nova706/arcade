import { GameObject } from "../../../engine";
import type { ProjectileState } from "../types";

export class ProjectileObject extends GameObject implements ProjectileState {
  readonly hitIds = new Set<string>();

  constructor(
    id: string,
    readonly kind: ProjectileState["kind"],
    readonly owner: number,
    public x: number,
    public y: number,
    readonly originX: number,
    readonly originY: number,
    public directionX: number,
    public directionY: number,
    public speed: number,
    public damage: number,
    public lifetime: number,
    public chainsRemaining: number,
  ) {
    super(id);
  }
}
