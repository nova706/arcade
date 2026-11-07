/** Minimal lifecycle base for game-owned entities and optional reusable behaviors. */
export abstract class GameObject {
  active = true;
  private destroyed = false;

  protected constructor(readonly id: string) {}

  get isDestroyed(): boolean {
    return this.destroyed;
  }

  update(_deltaSeconds: number): void {}

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.active = false;
    this.onDestroy();
  }

  protected onDestroy(): void {}
}
