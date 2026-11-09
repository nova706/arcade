import type { GamepadStatus, PlayerGamepadStatus, PlayerInput } from "./types";

const EMPTY_INPUT: PlayerInput = {
  x: 0,
  y: 0,
  confirm: false,
  cancel: false,
  primary: false,
  secondary: false,
  tertiary: false,
  start: false,
  axes: [],
  buttons: [],
  buttonsDown: [],
  buttonPressed: [],
};

/** Provides one normalized input frame per connected gamepad and keyboard edge helpers. */
export class InputManager {
  private previousButtons: boolean[][] = [];
  private readonly gamepadPlayers = new Map<number, number>();
  private gamepadStatuses: Array<PlayerGamepadStatus | null> = Array.from({ length: 4 }, () => null);
  private unassignedGamepads: GamepadStatus[] = [];
  private readonly downKeys = new Set<string>();
  private readonly pressedKeys = new Set<string>();

  constructor() {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("blur", this.clearKeys);
  }

  poll(): PlayerInput[] {
    const pads = typeof navigator.getGamepads === "function" ? navigator.getGamepads() : [];
    const connectedPads = Array.from(pads).filter((pad): pad is Gamepad => Boolean(pad?.connected));
    const connectedIndexes = new Set(connectedPads.map((pad) => pad.index));
    for (const [gamepadIndex, playerIndex] of this.gamepadPlayers) {
      if (connectedIndexes.has(gamepadIndex)) continue;
      this.gamepadPlayers.delete(gamepadIndex);
      this.previousButtons[playerIndex] = [];
    }
    this.gamepadStatuses = Array.from({ length: 4 }, () => null);
    this.unassignedGamepads = [];
    const playerInputs = Array.from({ length: 4 }, () => ({ ...EMPTY_INPUT }));
    for (const pad of connectedPads) {
      const joinPressed = pad.buttons[0]?.pressed ?? false;
      const axis = (value: number) => Math.abs(value) < 0.2 ? 0 : value;
      const status: GamepadStatus = {
        gamepadIndex: pad.index,
        id: pad.id,
        mapping: pad.mapping,
        axes: Array.from(pad.axes, axis),
        pressedButtons: Array.from(pad.buttons)
          .flatMap((button, buttonIndex) => button.pressed ? [buttonIndex] : []),
        buttonCount: pad.buttons.length,
      };
      let playerIndex = this.gamepadPlayers.get(pad.index);
      if (playerIndex === undefined && joinPressed) {
        const occupied = new Set(this.gamepadPlayers.values());
        playerIndex = Array.from({ length: 4 }, (_, index) => index).find((index) => !occupied.has(index));
        if (playerIndex !== undefined) {
          this.gamepadPlayers.set(pad.index, playerIndex);
        }
      }
      if (playerIndex === undefined) {
        this.unassignedGamepads.push(status);
        continue;
      }
      const previous = this.previousButtons[playerIndex] ?? (this.previousButtons[playerIndex] = []);
      const currentButtons = Array.from(pad.buttons, (button) => button.pressed);
      const buttonPressed = currentButtons.map((down, index) => {
        const edge = down && !previous[index];
        previous[index] = down;
        return edge;
      });
      this.gamepadStatuses[playerIndex] = { ...status, playerIndex };
      playerInputs[playerIndex] = {
        x: axis(pad.axes[0] ?? 0),
        y: axis(pad.axes[1] ?? 0),
        confirm: buttonPressed[0] ?? false,
        cancel: buttonPressed[1] ?? false,
        primary: buttonPressed[2] ?? false,
        secondary: buttonPressed[3] ?? false,
        tertiary: buttonPressed[4] ?? false,
        start: buttonPressed[9] ?? false,
        axes: Array.from(pad.axes),
        buttons: Array.from(pad.buttons, (button) => button.value),
        buttonsDown: currentButtons,
        buttonPressed,
      };
    }
    return playerInputs;
  }

  getGamepadStatuses(): Array<PlayerGamepadStatus | null> {
    return this.gamepadStatuses.map((status) => status && {
      ...status,
      axes: [...status.axes],
      pressedButtons: [...status.pressedButtons],
    });
  }

  getUnassignedGamepads(): GamepadStatus[] {
    return this.unassignedGamepads.map((status) => ({
      ...status,
      axes: [...status.axes],
      pressedButtons: [...status.pressedButtons],
    }));
  }

  isKeyDown(key: string): boolean {
    return this.downKeys.has(key);
  }

  consumeKeyPress(key: string): boolean {
    if (!this.pressedKeys.has(key)) return false;
    this.pressedKeys.delete(key);
    return true;
  }

  clearKeyPresses(): void {
    this.pressedKeys.clear();
  }

  dispose(): void {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    window.removeEventListener("blur", this.clearKeys);
    this.clearKeys();
    this.previousButtons = [];
    this.gamepadPlayers.clear();
    this.gamepadStatuses = Array.from({ length: 4 }, () => null);
    this.unassignedGamepads = [];
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)) event.preventDefault();
    if (!this.downKeys.has(event.key)) this.pressedKeys.add(event.key);
    this.downKeys.add(event.key);
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    this.downKeys.delete(event.key);
  };

  private readonly clearKeys = (): void => {
    this.downKeys.clear();
    this.pressedKeys.clear();
  };
}
