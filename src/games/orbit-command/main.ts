import "./style.css";
import { InputManager, PlayerManager } from "../../engine";
import { Game, defaultSetup, normalizeSetup } from "./Game";
import { Renderer } from "./Renderer";
import { LocalStorageService } from "./LocalStorageService";
import type { MatchSetup } from "./types";

export function mountOrbitCommand(host: HTMLElement, onExit: () => void, input: InputManager): void {
host.innerHTML = `
  <div id="orbit-command">
    <header class="topbar">
      <a class="brand" href="#" aria-label="Orbit Command home">
        <span class="brand-mark">O</span>
        <span>ORBIT <b>COMMAND</b></span>
      </a>
      <div class="topbar-right">
        <span class="live-indicator"><i></i> LOCAL MATCH</span>
        <button id="menu-button" class="quiet-button" type="button">ARCADE</button>
      </div>
    </header>
    <main>
      <section class="game-shell" aria-label="Game board">
        <canvas id="game-canvas" aria-label="Orbit Command game board"></canvas>
        <div id="toast" class="toast" role="status" aria-live="polite"></div>
      </section>
      <section class="footer-help" aria-label="Controls">
        <span><kbd>CLICK</kbd> FRIENDLY TOWER, THEN ADJACENT TARGET TO ATTACK OR REINFORCE</span>
        <span><kbd>SELECT AGAIN</kbd> SOURCE + TARGET TO STOP ROUTE</span>
        <span><kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> UPGRADE SELECTED FRIENDLY TOWER</span>
        <span class="gamepad-hint">PAD <kbd>A</kbd> ORDER / START <kbd>B</kbd> BACK <kbd>X</kbd> ATK / MODE <kbd>Y</kbd> DEF / FORMAT <kbd>LB</kbd> INC / PLAYERS</span>
      </section>
    </main>
  </div>
`;

const canvas = host.querySelector<HTMLCanvasElement>("#game-canvas");
const toastElement = host.querySelector<HTMLDivElement>("#toast");
const menuButton = host.querySelector<HTMLButtonElement>("#menu-button");
if (!canvas || !toastElement || !menuButton) throw new Error("Orbit Command page is missing required UI elements.");

const lifecycle = new AbortController();
let running = true;
let paused = false;
let animationFrame = 0;
const game = new Game();
const renderer = new Renderer();
const gamepads = input;
const players = new PlayerManager();
const storage = new LocalStorageService();
let context = renderer.resize(canvas);

let screen: "menu" | "game" = "menu";
let setup: MatchSetup = defaultSetup();
let bestScore = 0;
let savedMatches = 0;
let storageAvailable = true;
let toastTimer = 0;
let lastFrame = performance.now();
let resultSaved = false;
const selectedSources = new Map<number, number>();
const upgradeTargets = new Map<number, number>();
const cursors = new Map<number, number>();
const moveTimers = new Map<number, number>();

try {
  const saved = storage.load();
  setup = saved.settings;
  bestScore = saved.bestScore;
  savedMatches = saved.matches;
} catch (error) {
  storageAvailable = false;
  console.error("Could not load local game settings.", error);
  showToast("LOCAL STORAGE UNAVAILABLE — SETTINGS WON'T BE SAVED");
}

function resizeCanvas(): void {
  context = renderer.resize(canvas!);
}

function showToast(message: string): void {
  toastElement!.textContent = message;
  toastElement!.classList.add("visible");
  toastTimer = 2.5;
}

function saveSettings(): void {
  if (!storageAvailable) return;
  try {
    storage.save({
      version: 1,
      settings: { ...setup },
      bestScore,
      matches: savedMatches,
    });
  } catch (error) {
    storageAvailable = false;
    console.error("Could not save local game data.", error);
    showToast("LOCAL STORAGE UNAVAILABLE — PROGRESS WON'T BE SAVED");
  }
}

function beginMatch(): void {
  setup = normalizeSetup(setup.mode, setup.style, setup.humanPlayers);
  players.configureLocalPlayers(setup.humanPlayers);
  game.start(setup);
  screen = "game";
  resultSaved = false;
  selectedSources.clear();
  upgradeTargets.clear();
  cursors.clear();
  moveTimers.clear();
  for (let player = 0; player < setup.humanPlayers; player += 1) {
    const owned = game.state!.towers.find((tower) => tower.owner === player);
    cursors.set(player, owned?.id ?? 0);
    if (owned) upgradeTargets.set(player, owned.id);
  }
  saveSettings();
}

function returnToMenu(): void {
  if (game.state?.finished) recordResult();
  screen = "menu";
  setup = game.state?.setup ?? setup;
  game.stop();
  selectedSources.clear();
  upgradeTargets.clear();
}

function recordResult(): void {
  if (resultSaved || !game.state || game.state.winner === null) return;
  resultSaved = true;
  const playerTeam = game.state.factions[0].team;
  const towers = game.state.towers.filter((tower) => tower.owner !== null && game.state!.factions[tower.owner].team === playerTeam).length;
  const score = towers * 100 + (game.state.setup.mode === "survival" ? game.state.wave * 250 + Math.floor(game.state.elapsed) : Math.floor(game.state.elapsed));
  savedMatches += 1;
  if (game.state.winner === playerTeam) bestScore = Math.max(bestScore, score);
  saveSettings();
}

function selectTower(player: number, towerId: number): void {
  const state = game.state;
  if (!state || state.finished) return;
  cursors.set(player, towerId);
  const factionId = game.getHumanFaction(player);
  const tower = state.towers[towerId];
  const sourceId = selectedSources.get(player);
  if (sourceId === undefined) {
    if (tower.owner !== null && state.factions[tower.owner].team === state.factions[factionId].team) {
      upgradeTargets.set(player, towerId);
      selectedSources.set(player, towerId);
      if (tower.units > 0) {
        showToast(`TOWER ${String(towerId + 1).padStart(2, "0")} SELECTED — CHOOSE AN ADJACENT TOWER`);
      } else {
        showToast(`TOWER ${String(towerId + 1).padStart(2, "0")} HAS NO UNITS — CHOOSE A TARGET OR CANCEL ITS ROUTE`);
      }
    }
    return;
  }
  if (towerId === sourceId) {
    selectedSources.delete(player);
    return;
  }
  const result = game.toggleRouteOrder(factionId, sourceId, towerId);
  if (result !== "invalid") selectedSources.delete(player);
  const destination = state.towers[towerId];
  const isFriendly = destination.owner !== null && state.factions[destination.owner].team === state.factions[factionId].team;
  if (result === "started") showToast(`${isFriendly ? "REINFORCING" : "CONTINUOUS ATTACK ON"} TOWER ${String(towerId + 1).padStart(2, "0")}`);
  else if (result === "stopped") showToast("ROUTE ORDER STOPPED");
  else if (!game.state!.towers[sourceId].neighbors.includes(towerId)) showToast("ATTACK ORDERS CAN TARGET ADJACENT TOWERS ONLY");
  else showToast("ROUTE ORDER COULD NOT BE SET");
}

function activateUpgrade(player: number, type: "attack" | "defense" | "income"): void {
  if (!game.state) return;
  const factionId = game.getHumanFaction(player);
  const towerId = upgradeTargets.get(player) ?? cursors.get(player);
  if (towerId === undefined) {
    showToast("SELECT A FRIENDLY TOWER BEFORE UPGRADING");
    return;
  }
  const tower = game.state.towers[towerId];
  if (tower.owner === null || game.state.factions[tower.owner].team !== game.state.factions[factionId].team) {
    showToast("UPGRADES REQUIRE A FRIENDLY TOWER");
    return;
  }
  upgradeTargets.set(player, towerId);
  if (game.upgrade(factionId, towerId, type)) showToast(`TOWER ${towerId + 1} ${type.toUpperCase()} UPGRADED`);
  else showToast("NOT ENOUGH POINTS OR UPGRADE IS MAXED");
}

function menuClick(x: number, y: number): void {
  const hits = renderer.getMenuHits();
  if (!hits) return;
  hits.mode.forEach((point, index) => {
    if (Math.hypot(point.x - x, point.y - y) < 150) setup.mode = index === 0 ? "conquest" : "survival";
  });
  hits.style.forEach((point, index) => {
    if (Math.abs(point.x - x) < 95 && Math.abs(point.y - y) < 24) setup.style = index === 0 ? "teams" : "free-for-all";
  });
  hits.players.forEach((point, index) => {
    if (Math.abs(point.x - x) < 21 && Math.abs(point.y - y) < 21) setup.humanPlayers = index + 1;
  });
  const start = hits.start;
  if (x >= start.x && x <= start.x + start.width && y >= start.y && y <= start.y + start.height) beginMatch();
}

canvas.addEventListener("pointerdown", (event) => {
  const bounds = canvas!.getBoundingClientRect();
  const x = event.clientX - bounds.left;
  const y = event.clientY - bounds.top;
  if (screen === "menu") {
    menuClick(x, y);
    return;
  }
  if (game.state?.finished) {
    returnToMenu();
    return;
  }
  const upgrade = renderer.getUpgradeAt(x, y);
  if (upgrade) {
    activateUpgrade(0, upgrade);
    return;
  }
  const towerId = renderer.getTowerAt(x, y);
  if (towerId !== null) selectTower(0, towerId);
}, { signal: lifecycle.signal });

function handleKeyboard(): void {
  const pressed = (key: string) => input.consumeKeyPress(key);
  if (screen === "menu") {
    if (pressed("Enter") || pressed(" ")) beginMatch();
    if (pressed("ArrowLeft") || pressed("m") || pressed("M")) setup.mode = setup.mode === "conquest" ? "survival" : "conquest";
    if (pressed("f") || pressed("F")) setup.style = setup.style === "teams" ? "free-for-all" : "teams";
    if (pressed("+") || pressed("=")) setup.humanPlayers = Math.min(4, setup.humanPlayers + 1);
    if (pressed("-")) setup.humanPlayers = Math.max(1, setup.humanPlayers - 1);
    return;
  }
  if (game.state?.finished) {
    if (pressed("Enter") || pressed("Escape")) returnToMenu();
    return;
  }
  if (pressed("Escape")) {
    if (selectedSources.has(0)) selectedSources.delete(0);
    else returnToMenu();
  }
  if (pressed("1")) activateUpgrade(0, "attack");
  if (pressed("2")) activateUpgrade(0, "defense");
  if (pressed("3")) activateUpgrade(0, "income");
  const left = pressed("ArrowLeft");
  const right = pressed("ArrowRight");
  const up = pressed("ArrowUp");
  const down = pressed("ArrowDown");
  if (left || right || up || down) moveCursor(0, left ? -1 : right ? 1 : 0, up ? -1 : down ? 1 : 0);
  if (pressed("Enter")) {
    const cursor = cursors.get(0) ?? 0;
    selectTower(0, cursor);
  }
}

menuButton.addEventListener("click", exitToArcade, { signal: lifecycle.signal });

function exitToArcade(): void {
  if (!running) return;
  running = false;
  cancelAnimationFrame(animationFrame);
  lifecycle.abort();
  game.stop();
  onExit();
}

function moveCursor(player: number, dx: number, dy: number): void {
  const state = game.state;
  if (!state) return;
  const faction = game.getHumanFaction(player);
  const currentId = cursors.get(player) ?? state.towers.find((tower) => tower.owner === faction)?.id ?? 0;
  const current = state.towers[currentId];
  if (!current.neighbors.length) return;
  let best = current.neighbors[0];
  let bestScore = -Infinity;
  for (const neighborId of current.neighbors) {
    const neighbor = state.towers[neighborId];
    const vx = neighbor.x - current.x;
    const vy = neighbor.y - current.y;
    const length = Math.hypot(vx, vy);
    const score = (vx * dx + vy * dy) / length;
    if (score > bestScore) {
      best = neighborId;
      bestScore = score;
    }
  }
  if (bestScore > 0) {
    cursors.set(player, best);
    const tower = state.towers[best];
    if (tower.owner !== null && state.factions[tower.owner].team === state.factions[faction].team) {
      upgradeTargets.set(player, best);
    }
  }
}

function handleGamepads(delta: number): void {
  const frames = gamepads.poll();
  frames.forEach((frame, player) => {
    if (screen === "game" && !players.isLocalPlayerActive(player)) return;
    if (screen === "menu" && player >= setup.humanPlayers) return;
    if (screen === "menu") {
      if (frame.primary) setup.mode = setup.mode === "conquest" ? "survival" : "conquest";
      if (frame.secondary) setup.style = setup.style === "teams" ? "free-for-all" : "teams";
      if (frame.tertiary) setup.humanPlayers = setup.humanPlayers % 4 + 1;
      if (frame.confirm) beginMatch();
      return;
    }
    if (game.state?.finished) {
      if (frame.confirm || frame.cancel) returnToMenu();
      return;
    }
    const time = Math.max(0, (moveTimers.get(player) ?? 0) - delta);
    moveTimers.set(player, time);
    if (time === 0 && (Math.abs(frame.x) > 0.55 || Math.abs(frame.y) > 0.55)) {
      moveCursor(player, frame.x, frame.y);
      moveTimers.set(player, 0.22);
    }
    if (frame.cancel) selectedSources.delete(player);
    if (frame.primary) activateUpgrade(player, "attack");
    if (frame.secondary) activateUpgrade(player, "defense");
    if (frame.tertiary) activateUpgrade(player, "income");
    if (frame.confirm) selectTower(player, cursors.get(player) ?? 0);
  });
}

function drawResultOverlay(): void {
  if (!game.state?.finished) return;
  recordResult();
  const width = canvas!.clientWidth;
  const height = canvas!.clientHeight;
  const state = game.state;
  const teamWon = state.winner === state.factions[0].team;
  context!.fillStyle = "#050b12c9";
  context!.fillRect(0, 0, width, height);
  context!.textAlign = "center";
  context!.font = "700 30px 'Space Grotesk', sans-serif";
  context!.fillStyle = teamWon ? "#45e0d0" : "#ff6577";
  context!.fillText(teamWon ? "VICTORY" : "DEFEAT", width / 2, height / 2 - 30);
  context!.font = "13px 'DM Mono', monospace";
  context!.fillStyle = "#d4dfeb";
  context!.fillText(state.message, width / 2, height / 2 + 3);
  context!.font = "10px 'DM Mono', monospace";
  context!.fillStyle = "#8392a6";
  context!.fillText("PRESS ENTER / A OR CLICK TO RETURN TO SETUP", width / 2, height / 2 + 34);
}

function frame(now: number): void {
  if (!running) return;
  const delta = Math.min((now - lastFrame) / 1000, 0.1);
  lastFrame = now;
  if (!paused) {
    handleKeyboard();
    toastTimer = Math.max(0, toastTimer - delta);
    if (toastTimer === 0) toastElement!.classList.remove("visible");
    handleGamepads(delta);
  }

  const bounds = canvas!.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  if (canvas!.width !== Math.round(bounds.width * ratio) || canvas!.height !== Math.round(bounds.height * ratio)) resizeCanvas();
  context!.setTransform(ratio, 0, 0, ratio, 0, 0);
  if (screen === "menu") renderer.renderMenu(context!, bounds.width, bounds.height, setup, bestScore);
  else {
    if (!paused) game.update(delta);
    renderer.renderGame(context!, bounds.width, bounds.height, game, 0, selectedSources.get(0) ?? null, cursors, upgradeTargets.get(0) ?? null);
    drawResultOverlay();
  }
  animationFrame = requestAnimationFrame(frame);
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas, { signal: lifecycle.signal });
window.addEventListener("arcade:pause", (event) => {
  if (!(event instanceof CustomEvent) || typeof event.detail !== "boolean") return;
  paused = event.detail;
  lastFrame = performance.now();
}, { signal: lifecycle.signal });
animationFrame = requestAnimationFrame(frame);
}
