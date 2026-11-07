import { SettingsStore } from "../../engine";
import type { GameMode, MatchStyle } from "./types";

const STORAGE_KEY = "orbit-command-v1";

export interface SavedData {
  version: 1;
  settings: {
    mode: GameMode;
    style: MatchStyle;
    humanPlayers: number;
  };
  bestScore: number;
  matches: number;
}

const DEFAULT_DATA: SavedData = {
  version: 1,
  settings: { mode: "conquest", style: "teams", humanPlayers: 1 },
  bestScore: 0,
  matches: 0,
};

export class LocalStorageService {
  private readonly settings = new SettingsStore();

  load(): SavedData {
    const value = this.settings.load<unknown>(STORAGE_KEY);
    if (value === null) return structuredClone(DEFAULT_DATA);
    if (!this.isSavedData(value)) return structuredClone(DEFAULT_DATA);
    return value;
  }

  save(data: SavedData): void {
    this.settings.save(STORAGE_KEY, data);
  }

  private isSavedData(value: unknown): value is SavedData {
    if (typeof value !== "object" || value === null) return false;
    const data = value as Partial<SavedData>;
    return data.version === 1
      && typeof data.bestScore === "number"
      && Number.isFinite(data.bestScore)
      && typeof data.matches === "number"
      && Number.isFinite(data.matches)
      && typeof data.settings === "object"
      && data.settings !== null
      && ["conquest", "survival"].includes((data.settings as SavedData["settings"]).mode)
      && ["teams", "free-for-all"].includes((data.settings as SavedData["settings"]).style)
      && Number.isInteger((data.settings as SavedData["settings"]).humanPlayers)
      && (data.settings as SavedData["settings"]).humanPlayers >= 1
      && (data.settings as SavedData["settings"]).humanPlayers <= 4;
  }
}
