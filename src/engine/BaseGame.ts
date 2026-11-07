/** Shared lifecycle for games hosted by the arcade. */
export abstract class BaseGame<State, Setup> {
  state: State | null = null;

  abstract start(setup: Setup): void;
  abstract update(deltaSeconds: number): void;

  stop(): void {
    this.state = null;
  }
}
