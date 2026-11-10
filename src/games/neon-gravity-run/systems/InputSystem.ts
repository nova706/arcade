import { ControllerInput, getControllerValue, isControllerPressed, type InputManager, type PlayerInput } from "../../../engine";
import { KEYBOARD_INPUTS } from "../input";
import type { PlayerCommand } from "../types";

const PREVENT_DEFAULT_CODES = new Set([
  "KeyW", "KeyA", "KeyD", "ArrowUp", "ArrowLeft", "ArrowRight",
  "KeyI", "KeyJ", "KeyL", "Numpad4", "Numpad6", "Numpad8",
]);

export class InputSystem {
  private readonly downKeys = new Set<string>();
  private readonly pressedKeys = new Set<string>();

  constructor(private readonly input: InputManager) {}

  start(): void {
    document.addEventListener("keydown", this.onKeyDown);
    document.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.clearKeys);
  }

  pollControllers(): PlayerInput[] {
    return this.input.poll();
  }

  readCommand(index: number, controller: PlayerInput | undefined): PlayerCommand {
    const keys = KEYBOARD_INPUTS[index];
    if (!keys) return { moveX: 0, jump: false };
    const keyboardMove = Number(this.downKeys.has(keys.right)) - Number(this.downKeys.has(keys.left));
    const dpadMove = Number(controller?.buttonsDown[15] ?? false) - Number(controller?.buttonsDown[14] ?? false);
    const moveX = Math.max(-1, Math.min(1,
      keyboardMove + getControllerValue(controller, ControllerInput.LeftStickX) + dpadMove,
    ));
    const jump = this.consumeKeyPress(keys.jump)
      || isControllerPressed(controller, ControllerInput.ButtonA);
    return { moveX, jump };
  }

  clearKeys(): void {
    this.downKeys.clear();
    this.pressedKeys.clear();
  }

  destroy(): void {
    document.removeEventListener("keydown", this.onKeyDown);
    document.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.clearKeys);
    this.clearKeys();
  }

  private consumeKeyPress(code: string): boolean {
    if (!this.pressedKeys.has(code)) return false;
    this.pressedKeys.delete(code);
    return true;
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (PREVENT_DEFAULT_CODES.has(event.code)) event.preventDefault();
    if (!this.downKeys.has(event.code)) this.pressedKeys.add(event.code);
    this.downKeys.add(event.code);
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    this.downKeys.delete(event.code);
  };
}
