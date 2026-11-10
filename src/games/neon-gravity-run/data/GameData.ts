export interface PlatformData {
  x: number;
  y: number;
  width: number;
  height: number;
  goalPad?: boolean;
}

export class GameData {
  static readonly WIDTH = 1280;
  static readonly HEIGHT = 720;
  static readonly STARTING_LIVES = 5;
  static readonly PLAYER_WIDTH = 22;
  static readonly PLAYER_HEIGHT = 38;
  static readonly PLAYER_SPEED = 245;
  static readonly JUMP_SPEED = 450;
  static readonly GRAVITY = 1050;
  static readonly LAVA_HEIGHT = 48;
  static readonly GOAL_X = 1190;
  static readonly GOAL_Y = 366;
  static readonly GOAL_RADIUS = 40;
  static readonly GOAL_OPENING_ANGLE = Math.PI / 2;
  static readonly GOAL_OPENING_HALF_ANGLE = Math.PI / 8;
  static readonly GOAL_LANDING_PAD: PlatformData = {
    x: GameData.GOAL_X,
    y: GameData.GOAL_Y + 4,
    width: 12,
    height: 6,
    goalPad: true,
  };
  static readonly PLATFORMS: readonly PlatformData[] = [
    { x: 138, y: 622, width: 226, height: 18 },
    { x: 286, y: 96, width: 210, height: 18 },
    { x: 474, y: 350, width: 158, height: 18 },
    { x: 646, y: 620, width: 186, height: 18 },
    { x: 806, y: 96, width: 180, height: 18 },
    { x: 957, y: 350, width: 162, height: 18 },
    { x: 1090, y: 620, width: 164, height: 18 },
    { x: 1060, y: 96, width: 180, height: 18 },
    GameData.GOAL_LANDING_PAD,
  ];

  readonly players: number;

  constructor(players: number) {
    if (!Number.isInteger(players) || players < 1 || players > 4) {
      throw new RangeError("Neon Gravity Run requires between one and four players.");
    }
    this.players = players;
  }
}
