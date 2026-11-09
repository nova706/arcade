export enum ControllerInput {
  LeftStickX = "leftStickX",
  LeftStickY = "leftStickY",
  RightStickX = "rightStickX",
  RightStickY = "rightStickY",
  ButtonA = "buttonA",
  ButtonB = "buttonB",
  ButtonX = "buttonX",
  ButtonY = "buttonY",
  LeftBumper = "leftBumper",
  RightBumper = "rightBumper",
  LeftTrigger = "leftTrigger",
  RightTrigger = "rightTrigger",
  Start = "start",
}

export interface PlayerInput {
  x: number;
  y: number;
  confirm: boolean;
  cancel: boolean;
  primary: boolean;
  secondary: boolean;
  tertiary: boolean;
  start: boolean;
  axes: readonly number[];
  buttons: readonly number[];
  buttonsDown: readonly boolean[];
  buttonPressed: readonly boolean[];
}

export interface GamepadStatus {
  gamepadIndex: number;
  id: string;
  mapping: string;
  axes: number[];
  pressedButtons: number[];
  buttonCount: number;
}

export interface PlayerGamepadStatus extends GamepadStatus {
  playerIndex: number;
}

const CONTROLLER_AXES: Partial<Record<ControllerInput, number>> = {
  [ControllerInput.LeftStickX]: 0,
  [ControllerInput.LeftStickY]: 1,
  [ControllerInput.RightStickX]: 2,
  [ControllerInput.RightStickY]: 3,
};

const CONTROLLER_BUTTONS: Partial<Record<ControllerInput, number>> = {
  [ControllerInput.ButtonA]: 0,
  [ControllerInput.ButtonB]: 1,
  [ControllerInput.ButtonX]: 2,
  [ControllerInput.ButtonY]: 3,
  [ControllerInput.LeftBumper]: 4,
  [ControllerInput.RightBumper]: 5,
  [ControllerInput.LeftTrigger]: 6,
  [ControllerInput.RightTrigger]: 7,
  [ControllerInput.Start]: 9,
};

export function getControllerValue(input: PlayerInput | undefined, control: ControllerInput): number {
  if (!input) return 0;
  const axisIndex = CONTROLLER_AXES[control];
  if (axisIndex !== undefined) return input.axes[axisIndex] ?? 0;
  const buttonIndex = CONTROLLER_BUTTONS[control];
  return buttonIndex === undefined ? 0 : input.buttons[buttonIndex] ?? 0;
}

export function isControllerDown(input: PlayerInput | undefined, control: ControllerInput, threshold = 0.5): boolean {
  return getControllerValue(input, control) >= threshold;
}

export function isControllerPressed(input: PlayerInput | undefined, control: ControllerInput): boolean {
  if (!input) return false;
  const buttonIndex = CONTROLLER_BUTTONS[control];
  return buttonIndex === undefined ? false : input.buttonPressed[buttonIndex] ?? false;
}
