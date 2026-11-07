export interface LocalPlayer {
  id: number;
  inputIndex: number;
  name: string;
}

/** Keeps local player slots stable and maps each slot to its matching gamepad index. */
export class PlayerManager {
  private players: LocalPlayer[] = [];

  configureLocalPlayers(count: number): void {
    if (!Number.isInteger(count) || count < 1 || count > 4) {
      throw new RangeError("Local player count must be between 1 and 4.");
    }
    this.players = Array.from({ length: count }, (_, id) => ({
      id,
      inputIndex: id,
      name: `PLAYER ${id + 1}`,
    }));
  }

  getLocalPlayers(): readonly LocalPlayer[] {
    return this.players;
  }

  isLocalPlayerActive(inputIndex: number): boolean {
    return this.players.some((player) => player.inputIndex === inputIndex);
  }
}
