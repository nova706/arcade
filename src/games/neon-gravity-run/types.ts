export interface PlayerCommand {
  moveX: number;
  jump: boolean;
}

export interface LandingState {
  grounded: boolean;
  goalPad: boolean;
  afterJump: boolean;
}

export interface PlayerSetup {
  players: number;
}
