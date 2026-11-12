export type PlatformModifier = "bounce";

export interface PlatformData {
  x: number;
  y: number;
  width: number;
  height: number;
  modifier?: PlatformModifier;
  route?: boolean;
}

export interface LevelData {
  number: number;
  name: string;
  platforms: readonly PlatformData[];
  route: readonly PlatformData[];
  jumpHeight: number;
}

const LEVEL_STEPS = [130, 136, 142, 148, 154] as const;
const LEVEL_WIDTHS = [116, 108, 100, 92, 84] as const;
const ROUTE_HEIGHTS = [470, 620, 470, 620, 470, 620] as const;
const LEVEL_NAMES = ["First Shift", "Hot Switch", "Crossfire", "Thin Ice", "Overdrive"] as const;
const PLAYER_WIDTH = 22;
const PLAYER_HEIGHT = 38;
const PLAYER_SPEED = 245;
const JUMP_SPEED = 600;
const GRAVITY = 820;
const GOAL_X = 1190;
const GOAL_Y = 366;
const GOAL_RADIUS = 44;
const GOAL_OPENING_HALF_ANGLE = Math.PI / 8;

function createLevel(number: number): LevelData {
  const index = number - 1;
  const step = LEVEL_STEPS[index];
  const width = LEVEL_WIDTHS[index];
  const routeHeights = number <= 3 ? [...ROUTE_HEIGHTS, 470, 620] : ROUTE_HEIGHTS;
  const route: PlatformData[] = [
    { x: 138, y: 620, width: 220, height: 8, route: true },
    ...routeHeights.map((y, routeIndex) => ({
      x: routeIndex === 7 ? GOAL_X - 12 : 138 + step * (routeIndex + 1),
      y,
      width,
      height: 8,
      route: true,
      ...(number > 1 && routeIndex === number - 2 ? { modifier: "bounce" as const } : {}),
    })),
  ];

  const decoys: PlatformData[] = route.slice(1, -1).map((platform) => ({
    x: platform.x - Math.floor(step / 2),
    y: platform.y === 620 ? 350 - Math.min(index * 16, 48) : 570 + Math.min(index * 10, 30),
    width: Math.max(58, width - 18),
    height: 8,
  }));

  const platforms = [...route, ...decoys];
  validateRoute(route, number <= 3);
  return {
    number,
    name: LEVEL_NAMES[index],
    platforms,
    route,
    jumpHeight: JUMP_SPEED ** 2 / (2 * GRAVITY),
  };
}

function validateRoute(route: readonly PlatformData[], hasGoalApproachPad: boolean): void {
  for (let index = 1; index < route.length; index += 1) {
    const previous = route[index - 1];
    const next = route[index];
    if (!previous || !next) throw new Error("Neon Gravity Run route contains a missing platform.");
    const horizontalGap = Math.max(0, Math.abs(next.x - previous.x) - (previous.width + next.width) / 2);
    const verticalGap = Math.max(0, Math.abs(next.y - previous.y) - PLAYER_HEIGHT);
    if (verticalGap > JUMP_SPEED ** 2 / (2 * GRAVITY)) {
      throw new RangeError(`Neon Gravity Run Level route is too high between pads ${index} and ${index + 1}.`);
    }
    const horizontalReach = horizontalJumpReach(verticalGap);
    if (horizontalGap > horizontalReach) {
      throw new RangeError(`Neon Gravity Run Level route is too wide between pads ${index} and ${index + 1}.`);
    }
  }

  const finalPad = route[route.length - 1];
  if (!finalPad) throw new Error("Neon Gravity Run route has no goal approach pad.");
  const goalEntryY = GOAL_Y + GOAL_RADIUS - PLAYER_WIDTH / 2;
  const verticalGap = Math.max(0, finalPad.y - PLAYER_HEIGHT / 2 - goalEntryY);
  const horizontalGap = Math.max(
    0,
    GOAL_X - (GOAL_RADIUS - PLAYER_WIDTH / 2) * Math.sin(GOAL_OPENING_HALF_ANGLE)
      - finalPad.x - finalPad.width / 2 - PLAYER_WIDTH / 2,
  );
  if (verticalGap > JUMP_SPEED ** 2 / (2 * GRAVITY)) {
    throw new RangeError("Neon Gravity Run Level route cannot reach the goal opening vertically.");
  }
  if (horizontalGap > horizontalJumpReach(verticalGap)) {
    throw new RangeError("Neon Gravity Run Level route cannot reach the goal opening horizontally.");
  }
  if (hasGoalApproachPad && finalPad.x >= GOAL_X) {
    throw new RangeError("Neon Gravity Run goal approach pad must remain before the goal.");
  }
}

function horizontalJumpReach(verticalGap: number): number {
  const verticalTime = (JUMP_SPEED - Math.sqrt(
    Math.max(0, JUMP_SPEED ** 2 - 2 * GRAVITY * verticalGap),
  )) / GRAVITY;
  return PLAYER_SPEED * verticalTime + PLAYER_WIDTH;
}

export class GameData {
  static readonly WIDTH = 1280;
  static readonly HEIGHT = 720;
  static readonly STARTING_LIVES = 5;
  static readonly PLAYER_WIDTH = PLAYER_WIDTH;
  static readonly PLAYER_HEIGHT = PLAYER_HEIGHT;
  static readonly PLAYER_SPEED = PLAYER_SPEED;
  static readonly JUMP_SPEED = JUMP_SPEED;
  static readonly GRAVITY = GRAVITY;
  static readonly BOUNCE_SPEED = 760;
  static readonly BOUNCE_AIR_SPEED_MULTIPLIER = 1.45;
  static readonly BOUNCE_BOOST_SECONDS = 1.1;
  static readonly LAVA_HEIGHT = 48;
  static readonly GOAL_X = GOAL_X;
  static readonly GOAL_Y = GOAL_Y;
  static readonly GOAL_RADIUS = GOAL_RADIUS;
  static readonly GOAL_LAVA_THICKNESS = 7;
  static readonly GOAL_OPENING_ANGLE = Math.PI / 2;
  static readonly GOAL_OPENING_HALF_ANGLE = GOAL_OPENING_HALF_ANGLE;
  static readonly LEVELS: readonly LevelData[] = [
    createLevel(1),
    createLevel(2),
    createLevel(3),
    createLevel(4),
    createLevel(5),
  ];

  readonly players: number;
  readonly level: LevelData;

  constructor(players: number, levelNumber = 1) {
    if (!Number.isInteger(players) || players < 1 || players > 4) {
      throw new RangeError("Neon Gravity Run requires between one and four players.");
    }
    const level = GameData.LEVELS[levelNumber - 1];
    if (!level) throw new RangeError("Neon Gravity Run has five levels.");
    this.players = players;
    this.level = level;
  }
}
