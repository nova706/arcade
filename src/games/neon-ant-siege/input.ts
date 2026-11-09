import { ControllerInput } from "../../engine";

export const KEYBOARD_INPUTS = [
  { left: "ArrowLeft", right: "ArrowRight", jump: "ArrowUp", attack: " " },
  { left: "a", right: "d", jump: "w", attack: "f" },
  { left: "j", right: "l", jump: "i", attack: "u" },
  { left: "Numpad4", right: "Numpad6", jump: "Numpad8", attack: "Numpad0" },
] as const;

export const CONTROLLER_INPUTS = {
  moveX: ControllerInput.LeftStickX,
  jump: ControllerInput.ButtonA,
  attack: ControllerInput.ButtonX,
} as const;
