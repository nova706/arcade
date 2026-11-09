import { ControllerInput } from "../../engine";

export const KEYBOARD_INPUTS = {
  confirm: ["Enter", " "],
  cancel: ["Escape"],
  navigateLeft: ["ArrowLeft"],
  navigateRight: ["ArrowRight"],
  navigateUp: ["ArrowUp"],
  navigateDown: ["ArrowDown"],
  attack: ["1"],
  defense: ["2"],
  income: ["3"],
  toggleMode: ["ArrowLeft", "m", "M"],
  toggleStyle: ["f", "F"],
  increasePlayers: ["+", "="],
  decreasePlayers: ["-"],
} as const;

export const CONTROLLER_INPUTS = {
  moveX: ControllerInput.LeftStickX,
  moveY: ControllerInput.LeftStickY,
  confirm: ControllerInput.ButtonA,
  cancel: ControllerInput.ButtonB,
  attack: ControllerInput.ButtonX,
  defense: ControllerInput.ButtonY,
  income: ControllerInput.LeftBumper,
  start: ControllerInput.Start,
} as const;
