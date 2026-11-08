import { GameObject } from "../../../engine";
import type { AreaState } from "../types";

export class AreaObject extends GameObject implements AreaState {
  constructor(
    id: string,
    readonly kind: AreaState["kind"],
    readonly owner: number,
    public x: number,
    public y: number,
    public radius: number,
    public duration: number,
    public strength: number,
    public targetIndex?: number,
    public progress?: number,
    public activated?: boolean,
  ) {
    super(id);
  }
}
