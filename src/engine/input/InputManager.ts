import type { PlayerInput } from "./types";

const EMPTY_INPUT: PlayerInput = {
  x: 0,
  y: 0,
  confirm: false,
  cancel: false,
  primary: false,
  secondary: false,
  tertiary: false,
  start: false,
};

function pressedEdge(current: ReadonlyArray<GamepadButton>, previous: boolean[], index: number): boolean {
  const down = current[index]?.pressed ?? false;
  const edge = down && !previous[index];
  previous[index] = down;
  return edge;
}

/** Provides one normalized input frame per connected gamepad and keyboard edge helpers. */
export class InputManager {
  private previousButtons: boolean[][] = [];
  private readonly downKeys = new Set<string>();
  private readonly pressedKeys = new Set<string>();

  constructor() {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("blur", this.clearKeys);
  }

  poll(): PlayerInput[] {
    const pads = navigator.getGamepads();
    return Array.from({ length: 4 }, (_, index) => {
      const pad = pads[index];
      if (!pad || !pad.connected) return { ...EMPTY_INPUT };
      const previous = this.previousButtons[index] ?? (this.previousButtons[index] = []);
      const axis = (value: number) => Math.abs(value) < 0.2 ? 0 : value;
      return {
        x: axis(pad.axes[0] ?? 0),
        y: axis(pad.axes[1] ?? 0),
        confirm: pressedEdge(pad.buttons, previous, 0),
        cancel: pressedEdge(pad.buttons, previous, 1),
        primary: pressedEdge(pad.buttons, previous, 2),
        secondary: pressedEdge(pad.buttons, previous, 3),
        tertiary: pressedEdge(pad.buttons, previous, 4),
        start: pressedEdge(pad.buttons, previous, 9),
      };
    });
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
