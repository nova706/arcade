import "./style.css";
import { NeonVectorGame } from "./Game";
import { NeonVectorRenderer } from "./Renderer";
import type { InputManager, NamespacedSettingsStore, PlayerInput } from "../../engine";
import { PLAYER_COLORS, type GameSetup, type MinorType, type PlayerLoadout, type SuperType, type WeaponType } from "./types";

interface SavedSetup {
  players: PlayerLoadout[];
}

const WEAPONS: WeaponType[] = ["shockwave", "orbit", "beam", "chain"];
const SUPERS: SuperType[] = ["bubble", "totem", "tether", "nova"];
const MINORS: MinorType[] = ["mine", "teleport", "invisibility", "barrier"];
const LABELS: Record<WeaponType | SuperType | MinorType, string> = {
  shockwave: "Shockwave",
  orbit: "Orbit blade",
  beam: "Prism beam",
  chain: "Chain shock",
  bubble: "Defense bubble",
  totem: "Damage totem",
  tether: "Void tether",
  nova: "Supernova",
  mine: "Pulse mine",
  teleport: "Blink",
  invisibility: "Ghost phase",
  barrier: "Repel barrier",
};
const PLAYER_KEYS = [
  { up: "w", down: "s", left: "a", right: "d", fire: "f", minor: "g", super: "q" },
  { up: "ArrowUp", down: "ArrowDown", left: "ArrowLeft", right: "ArrowRight", fire: "Enter", minor: "Shift", super: "/" },
  { up: "i", down: "k", left: "j", right: "l", fire: "u", minor: "o", super: "p" },
  { up: "Numpad8", down: "Numpad5", left: "Numpad4", right: "Numpad6", fire: "Numpad0", minor: "Numpad1", super: "Numpad2" },
] as const;

function isLoadout(value: unknown): value is PlayerLoadout {
  if (typeof value !== "object" || value === null) return false;
  const loadout = value as Partial<PlayerLoadout>;
  return WEAPONS.includes(loadout.weapon as WeaponType)
    && SUPERS.includes(loadout.super as SuperType)
    && MINORS.includes(loadout.minor as MinorType);
}

export function mountNeonVector(
  host: HTMLElement,
  onExit: () => void,
  input: InputManager,
  settings: NamespacedSettingsStore,
): void {
  host.innerHTML = `
    <main class="neon-vector">
      <canvas class="nv-canvas" aria-label="Neon Vector co-op survival arena"></canvas>
      <div class="nv-toast" role="status" aria-live="polite"></div>
      <section class="nv-overlay" aria-live="polite"></section>
      <footer class="nv-controls">MOVE <kbd>WASD</kbd> · AIM <kbd>MOVE</kbd>/<kbd>MOUSE</kbd> · FIRE <kbd>F</kbd> · MINOR <kbd>G</kbd> · SUPER <kbd>Q</kbd> · GAMEPAD <kbd>STICK</kbd><kbd>X</kbd><kbd>Y</kbd><kbd>LB</kbd></footer>
    </main>
  `;
  const root = host.querySelector<HTMLElement>(".neon-vector");
  const canvas = host.querySelector<HTMLCanvasElement>(".nv-canvas");
  const overlay = host.querySelector<HTMLElement>(".nv-overlay");
  const toast = host.querySelector<HTMLElement>(".nv-toast");
  if (!root || !canvas || !overlay || !toast) throw new Error("Neon Vector is missing required game elements.");
  const overlayElement: HTMLElement = overlay;
  const toastElement: HTMLElement = toast;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D rendering is not supported by this browser.");

  const game = new NeonVectorGame();
  const renderer = new NeonVectorRenderer();
  const lifecycle = new AbortController();
  let running = true;
  let started = false;
  let paused = false;
  let frameHandle = 0;
  let lastFrame = performance.now();
  let setup: SavedSetup = {
    players: [{ weapon: "beam", super: "bubble", minor: "teleport" }],
  };
  let mouseHeld = false;
  let mouseX = 0;
  let mouseY = 0;
  let toastTimer = 0;
  let message = "";
  let subscriptions: Array<() => void> = [];

  try {
    const saved = settings.load<unknown>("loadouts");
    if (typeof saved === "object" && saved !== null && Array.isArray((saved as Partial<SavedSetup>).players)) {
      const loadouts = (saved as SavedSetup).players;
      if (loadouts.length >= 1 && loadouts.length <= 4 && loadouts.every(isLoadout)) {
        setup = { players: loadouts.map((loadout) => ({ ...loadout })) };
      }
    }
  } catch (error) {
    console.error("Could not load Neon Vector loadouts.", error);
    message = "Could not load saved loadouts.";
  }

  function showSetup(): void {
    overlayElement.innerHTML = `
      <section class="nv-card nv-setup" aria-labelledby="nv-title">
        <p class="nv-kicker">LOCAL CO-OP · GEOMETRIC SWARM SURVIVAL</p>
        <h1 id="nv-title">NEON <span>VECTOR</span></h1>
        <p class="nv-intro">Choose your crew and build a loadout. Survive the swarm. Adapt every five waves.</p>
        <label class="nv-player-count">TEAM SIZE
          <select data-players>
            ${[1, 2, 3, 4].map((count) => `<option value="${count}"${setup.players.length === count ? " selected" : ""}>${count} PLAYER${count === 1 ? "" : "S"}</option>`).join("")}
          </select>
        </label>
        <div class="nv-loadouts">
          ${setup.players.map((loadout, index) => `
            <section class="nv-loadout" style="--player-color:${PLAYER_COLORS[index]}">
              <h2><i></i> PLAYER ${index + 1}</h2>
              <label>WEAPON<select data-index="${index}" data-kind="weapon">${WEAPONS.map((value) => `<option value="${value}"${loadout.weapon === value ? " selected" : ""}>${LABELS[value]}</option>`).join("")}</select></label>
              <label>SUPER<select data-index="${index}" data-kind="super">${SUPERS.map((value) => `<option value="${value}"${loadout.super === value ? " selected" : ""}>${LABELS[value]}</option>`).join("")}</select></label>
              <label>MINOR<select data-index="${index}" data-kind="minor">${MINORS.map((value) => `<option value="${value}"${loadout.minor === value ? " selected" : ""}>${LABELS[value]}</option>`).join("")}</select></label>
            </section>
          `).join("")}
        </div>
        <p class="nv-setup-message" role="status">${message}</p>
        <button type="button" class="nv-primary" data-action="start">ENTER THE ARENA <span>→</span></button>
        <p class="nv-help">MOVE <kbd>WASD</kbd> · FIRE <kbd>F</kbd> · MINOR <kbd>G</kbd> · SUPER <kbd>Q</kbd></p>
      </section>
    `;
  }

  function showGameOver(): void {
    overlayElement.innerHTML = `
      <section class="nv-card nv-result" aria-labelledby="nv-over-title">
        <p class="nv-kicker">SIGNAL LOST</p>
        <h2 id="nv-over-title">RUN ENDED</h2>
        <p class="nv-intro">Your crew reached wave ${game.state?.wave.wave ?? 1}.</p>
        <button type="button" class="nv-primary" data-action="restart">RUN IT BACK <span>→</span></button>
        <button type="button" class="nv-secondary" data-action="exit">RETURN TO ARCADE</button>
      </section>
    `;
  }

  function saveSetup(): void {
    try {
      settings.save("loadouts", setup);
      message = "";
    } catch (error) {
      console.error("Could not save Neon Vector loadouts.", error);
      message = "Loadouts could not be saved in this browser.";
    }
  }

  function attachGameEvents(): void {
    subscriptions.forEach((unsubscribe) => unsubscribe());
    subscriptions = [
      game.events.on("wave-started", ({ wave }) => showToast(`WAVE ${String(wave).padStart(2, "0")} INCOMING`)),
      game.events.on("objective-started", ({ objective }) => showToast(`OBJECTIVE: ${objective.toUpperCase()}`)),
      game.events.on("objective-completed", () => showToast("OBJECTIVE COMPLETE")),
      game.events.on("player-damaged", ({ player }) => showToast(`PLAYER ${player.index + 1} HIT`)),
      game.events.on("game-over", () => showGameOver()),
    ];
  }

  function beginRun(): void {
    const bounds = canvas!.getBoundingClientRect();
    const gameSetup: GameSetup = {
      players: setup.players.map((loadout) => ({ ...loadout })),
      width: bounds.width,
      height: bounds.height,
    };
    game.start(gameSetup);
    attachGameEvents();
    started = true;
    paused = false;
    overlayElement.replaceChildren();
    saveSetup();
    input.clearKeyPresses();
    lastFrame = performance.now();
  }

  function exitToArcade(): void {
    if (!running) return;
    running = false;
    cancelAnimationFrame(frameHandle);
    lifecycle.abort();
    subscriptions.forEach((unsubscribe) => unsubscribe());
    game.stop();
    onExit();
  }

  function showToast(text: string): void {
    toastElement.textContent = text;
    toastElement.classList.add("visible");
    toastTimer = 1.8;
  }

  overlayElement.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;
    if (target.hasAttribute("data-players")) {
      const count = Number(target.value);
      if (!Number.isInteger(count) || count < 1 || count > 4) return;
      setup.players = Array.from({ length: count }, (_, index) =>
        setup.players[index] ?? { weapon: WEAPONS[index], super: SUPERS[index], minor: MINORS[index] });
      saveSetup();
      showSetup();
      return;
    }
    const index = Number(target.dataset.index);
    const kind = target.dataset.kind;
    const value = target.value;
    const loadout = setup.players[index];
    if (!loadout) return;
    if (kind === "weapon" && WEAPONS.includes(value as WeaponType)) loadout.weapon = value as WeaponType;
    else if (kind === "super" && SUPERS.includes(value as SuperType)) loadout.super = value as SuperType;
    else if (kind === "minor" && MINORS.includes(value as MinorType)) loadout.minor = value as MinorType;
    else return;
    saveSetup();
    saveSetup();
  }, { signal: lifecycle.signal });

  overlayElement.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const action = target.closest<HTMLElement>("[data-action]")?.dataset.action;
    if (action === "start" || action === "restart") beginRun();
    if (action === "exit") exitToArcade();
  }, { signal: lifecycle.signal });

  canvas.addEventListener("pointermove", (event) => {
    const bounds = canvas!.getBoundingClientRect();
    mouseX = event.clientX - bounds.left;
    mouseY = event.clientY - bounds.top;
  }, { signal: lifecycle.signal });
  canvas.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    mouseHeld = true;
    canvas!.setPointerCapture(event.pointerId);
  }, { signal: lifecycle.signal });
  canvas.addEventListener("pointerup", () => { mouseHeld = false; }, { signal: lifecycle.signal });
  canvas.addEventListener("pointercancel", () => { mouseHeld = false; }, { signal: lifecycle.signal });
  window.addEventListener("blur", () => { mouseHeld = false; }, { signal: lifecycle.signal });
  window.addEventListener("arcade:pause", (event) => {
    if (!(event instanceof CustomEvent) || typeof event.detail !== "boolean" || !started || game.state?.gameOver) return;
    paused = event.detail;
    input.clearKeyPresses();
    lastFrame = performance.now();
  }, { signal: lifecycle.signal });

  function resize(): void {
    const bounds = canvas!.getBoundingClientRect();
    const width = Math.max(1, Math.round(bounds.width * Math.min(window.devicePixelRatio || 1, 2)));
    const height = Math.max(1, Math.round(bounds.height * Math.min(window.devicePixelRatio || 1, 2)));
    if (canvas!.width === width && canvas!.height === height) return;
    const previousWidth = canvas!.clientWidth;
    const previousHeight = canvas!.clientHeight;
    renderer.resize(canvas!);
    if (game.state && previousWidth > 0 && previousHeight > 0) game.resize(bounds.width, bounds.height);
  }

  function buildCommand(index: number, controller: PlayerInput | undefined): {
    moveX: number;
    moveY: number;
    aimX: number;
    aimY: number;
    fire: boolean;
    useMinor: boolean;
    useSuper: boolean;
  } {
    const keys = PLAYER_KEYS[index];
    if (!keys) return { moveX: 0, moveY: 0, aimX: 0, aimY: 0, fire: false, useMinor: false, useSuper: false };
    const moveX = (input.isKeyDown(keys.right) ? 1 : 0) - (input.isKeyDown(keys.left) ? 1 : 0) + (controller?.x ?? 0);
    const moveY = (input.isKeyDown(keys.down) ? 1 : 0) - (input.isKeyDown(keys.up) ? 1 : 0) + (controller?.y ?? 0);
    const player = game.state?.players[index];
    const mouseAim = index === 0 && mouseHeld && player;
    return {
      moveX,
      moveY,
      aimX: mouseAim ? mouseX - player.x : moveX,
      aimY: mouseAim ? mouseY - player.y : moveY,
      fire: input.isKeyDown(keys.fire) || Boolean(controller?.primary) || (index === 0 && mouseHeld),
      useMinor: input.consumeKeyPress(keys.minor) || Boolean(controller?.secondary),
      useSuper: input.consumeKeyPress(keys.super) || Boolean(controller?.tertiary),
    };
  }

  function frame(now: number): void {
    if (!running) return;
    resize();
    const delta = Math.min((now - lastFrame) / 1000, 0.05);
    lastFrame = now;
    if (toastTimer > 0) {
      toastTimer = Math.max(0, toastTimer - delta);
      if (!toastTimer) toastElement.classList.remove("visible");
    }
    const gamepads = input.poll();
    if (started && !paused && !game.state?.gameOver) {
      game.state?.players.forEach((player, index) => {
        if (player.alive) game.command(index, buildCommand(index, gamepads[index]));
      });
      game.update(delta);
    } else if (!started && (gamepads.some((pad) => pad.confirm) || input.consumeKeyPress("Enter"))) {
      beginRun();
    }
    renderer.render(context!, canvas!.clientWidth, canvas!.clientHeight, game.state);
    frameHandle = requestAnimationFrame(frame);
  }

  showSetup();
  resize();
  window.addEventListener("resize", resize, { signal: lifecycle.signal });
  frameHandle = requestAnimationFrame(frame);
}
