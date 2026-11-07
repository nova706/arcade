export type GameMode = "conquest" | "survival";
export type MatchStyle = "teams" | "free-for-all";

export interface MatchSetup {
  mode: GameMode;
  style: MatchStyle;
  humanPlayers: number;
}

export interface Faction {
  id: number;
  team: number;
  name: string;
  color: string;
  isHuman: boolean;
  points: number;
}

export interface Tower {
  id: number;
  x: number;
  y: number;
  neighbors: number[];
  owner: number | null;
  units: number;
  production: number;
  attackLevel: number;
  defenseLevel: number;
  incomeLevel: number;
}

export interface March {
  id: number;
  owner: number;
  source: number;
  destination: number;
  units: number;
  attackPower: number;
  progress: number;
}

export interface RouteOrder {
  owner: number;
  source: number;
  destination: number;
  progress: number;
}

export interface MatchState {
  setup: MatchSetup;
  factions: Faction[];
  towers: Tower[];
  marches: March[];
  routeOrders: RouteOrder[];
  elapsed: number;
  wave: number;
  waveTimer: number;
  finished: boolean;
  winner: number | null;
  message: string;
}
