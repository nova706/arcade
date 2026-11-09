import { ControllerInput } from "../../engine";

export const KEYBOARD_INPUTS = [
  { up: "w", down: "s", left: "a", right: "d", fire: "f", minor: "g", super: "q" },
  { up: "ArrowUp", down: "ArrowDown", left: "ArrowLeft", right: "ArrowRight", fire: "Enter", minor: "Shift", super: "/" },
  { up: "i", down: "k", left: "j", right: "l", fire: "u", minor: "o", super: "p" },
  { up: "Numpad8", down: "Numpad5", left: "Numpad4", right: "Numpad6", fire: "Numpad0", minor: "Numpad1", super: "Numpad2" },
] as const;

export const CONTROLLER_INPUTS = {
  moveX: ControllerInput.LeftStickX,
  moveY: ControllerInput.LeftStickY,
  aimX: ControllerInput.RightStickX,
  aimY: ControllerInput.RightStickY,
  fire: ControllerInput.RightTrigger,
  minor: ControllerInput.LeftTrigger,
  super: ControllerInput.RightBumper,
} as const;
