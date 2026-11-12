export interface PlayerCommand {
  moveX: number;
  jump: boolean;
}

export interface LandingState {
  grounded: boolean;
}

export interface PlayerSetup {
  players: number;
}
