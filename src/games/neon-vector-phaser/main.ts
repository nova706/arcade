import Phaser from "phaser";
import "./style.css";
import { DEFAULT_LOADOUTS, MINORS, SUPERS, WEAPONS, WEAPON_STATS } from "./data/Loadouts";
import { NeonVectorScene } from "./scene/NeonVectorScene";
import type { GameMenuContext, InputManager, NamespacedSettingsStore, PauseMenuControls } from "../../engine";
import type { PlayerLoadout } from "./types";

const LABELS: Record<string, string> = {
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

interface SavedSetup {
  players: PlayerLoadout[];
}

function isLoadout(value: unknown): value is PlayerLoadout {
  if (typeof value !== "object" || value === null) return false;
  const loadout = value as Partial<PlayerLoadout>;
  return WEAPONS.includes(loadout.weapon as typeof WEAPONS[number])
    && SUPERS.includes(loadout.super as typeof SUPERS[number])
    && MINORS.includes(loadout.minor as typeof MINORS[number]);
}

function weaponSummary(weapon: PlayerLoadout["weapon"]): string {
  const stats = WEAPON_STATS[weapon];
  const burst = stats.burstDamage
    ? ` · BURST ${stats.burstDamage} DMG / ${stats.burstKnockback} KB`
    : "";
    return `${stats.damage} DMG · ${stats.cooldown}s CD · ${stats.range} RANGE · ${stats.knockback} KB${burst}`;
}

function loadoutMarkup(loadout: PlayerLoadout, index: number): string {
  return `
    <section class="nv4-loadout" style="--player-color:${["#55f6ff", "#ff58d4", "#c5ff57", "#ffc857"][index]}">
      <h2>PLAYER ${index + 1}</h2>
      <label>WEAPON<select data-index="${index}" data-kind="weapon">${WEAPONS.map((value) => `<option value="${value}"${loadout.weapon === value ? " selected" : ""}>${LABELS[value]}</option>`).join("")}</select></label>
      <p class="nv4-weapon-stats" data-weapon-stats="${index}">${weaponSummary(loadout.weapon)}</p>
      <label>SUPER<select data-index="${index}" data-kind="super">${SUPERS.map((value) => `<option value="${value}"${loadout.super === value ? " selected" : ""}>${LABELS[value]}</option>`).join("")}</select></label>
      <label>MINOR<select data-index="${index}" data-kind="minor">${MINORS.map((value) => `<option value="${value}"${loadout.minor === value ? " selected" : ""}>${LABELS[value]}</option>`).join("")}</select></label>
    </section>`;
}

export async function mountNeonVectorPhaser(
  host: HTMLElement,
  onExit: () => void,
  input: InputManager,
  settings: NamespacedSettingsStore,
  gameMenu?: GameMenuContext,
): Promise<void> {
  host.innerHTML = `
    <main class="nv4">
      <div class="nv4-stage"></div>
      <section class="nv4-overlay" aria-live="polite"></section>
      <div class="nv4-toast" role="status" aria-live="polite"></div>
      <footer class="nv4-controls">MOVE <kbd>WASD</kbd> · FIRE <kbd>F</kbd> · MINOR <kbd>G</kbd> · SUPER <kbd>Q</kbd> · PAD <kbd>LS MOVE</kbd><kbd>RS AIM</kbd><kbd>RT FIRE</kbd><kbd>LT MINOR</kbd><kbd>RB SUPER</kbd></footer>
    </main>
  `;
  const root = host.querySelector<HTMLElement>(".nv4");
  const stage = host.querySelector<HTMLElement>(".nv4-stage");
  const overlay = host.querySelector<HTMLElement>(".nv4-overlay");
  const toast = host.querySelector<HTMLElement>(".nv4-toast");
  if (!root || !stage || !overlay || !toast) throw new Error("Neon Vector Phaser is missing required UI elements.");

  let setup: SavedSetup = { players: [{ ...DEFAULT_LOADOUTS[0] }] };
  let message = "";
  try {
    const saved = settings.load<unknown>("loadouts");
    if (typeof saved === "object" && saved !== null && Array.isArray((saved as Partial<SavedSetup>).players)) {
      const loadouts = (saved as SavedSetup).players;
      if (loadouts.length >= 1 && loadouts.length <= 4 && loadouts.every(isLoadout)) {
        setup = { players: loadouts.map((loadout) => ({ ...loadout })) };
      }
    }
  } catch (error) {
    console.error("Could not load Neon Vector Phaser loadouts.", error);
    message = "Could not load saved loadouts.";
  }

  const scene = new NeonVectorScene(input);
  let unregisterPauseAction: (() => void) | undefined;
  let pauseMenuControls: PauseMenuControls | undefined;
  let editingRunLoadout = false;
  const phaser = new Phaser.Game({
    type: Phaser.AUTO,
    parent: stage,
    backgroundColor: "#070916",
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 1280,
      height: 720,
    },
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: 0 },
        fixedStep: true,
        fps: 60,
        debug: false,
      },
    },
    scene: [scene],
    input: { gamepad: false },
    render: { antialias: true, pixelArt: false },
  });
  const lifecycle = new AbortController();
  let closed = false;
  let toastTimer = 0;
  let toastFrame = 0;

  function showSetup(): void {
    editingRunLoadout = false;
    overlay!.innerHTML = `
      <section class="nv4-card" aria-labelledby="nv4-title">
        <p class="nv4-kicker">LOCAL CO-OP · GEOMETRIC SWARM SURVIVAL</p>
        <h1 id="nv4-title">NEON <span>VECTOR</span></h1>
        <p class="nv4-intro">Choose your crew and build a loadout. Survive the swarm. Adapt every five waves.</p>
        <label class="nv4-player-count">TEAM SIZE
          <select data-players>${[1, 2, 3, 4].map((count) => `<option value="${count}"${setup.players.length === count ? " selected" : ""}>${count} PLAYER${count === 1 ? "" : "S"}</option>`).join("")}</select>
        </label>
        <div class="nv4-loadouts">${setup.players.map((loadout, index) => loadoutMarkup(loadout, index)).join("")}</div>
        <p class="nv4-message" role="status">${message}</p>
        <button type="button" class="nv4-primary" data-action="start">ENTER THE ARENA <span>→</span></button>
      </section>
    `;
  }

  function saveSetup(): void {
    try {
      settings.save("loadouts", setup);
      message = "";
    } catch (error) {
      console.error("Could not save Neon Vector Phaser loadouts.", error);
      message = "Loadouts could not be saved in this browser.";
    }
  }

  function showPausedLoadoutScreen(): void {
    editingRunLoadout = true;
    setup.players = scene.players.map((player) => ({ ...player.loadout }));
    overlay!.innerHTML = `
      <section class="nv4-card" aria-labelledby="nv4-pause-loadout-title">
      <p class="nv4-kicker">LOADOUT CHANGE · GAME PAUSED</p>
      <h2 id="nv4-pause-loadout-title">ADAPT YOUR CREW</h2>
      <label class="nv4-player-count">TEAM SIZE
        <select data-players>${[1, 2, 3, 4].map((count) => `<option value="${count}"${setup.players.length === count ? " selected" : ""}>${count} PLAYER${count === 1 ? "" : "S"}</option>`).join("")}</select>
      </label>
      <div class="nv4-loadouts">${setup.players.map((loadout, index) => loadoutMarkup(loadout, index)).join("")}</div>
      <p class="nv4-message" role="status">${message}</p>
      <button type="button" class="nv4-primary" data-action="return-to-pause">BACK TO PAUSE MENU</button>
      </section>
    `;
  }

  function refreshLoadoutCards(): void {
    const cards = overlay!.querySelector<HTMLElement>(".nv4-loadouts");
    if (cards) cards.innerHTML = setup.players.map((loadout, index) => loadoutMarkup(loadout, index)).join("");
  }

  function updateRunningLoadouts(): void {
    scene.setPlayerLoadouts(setup.players.map((loadout) => ({ ...loadout })));
  }

  function showGameOver(wave: number): void {
    overlay!.innerHTML = `
      <section class="nv4-card nv4-result" aria-labelledby="nv4-over-title">
        <p class="nv4-kicker">SIGNAL LOST</p>
        <h2 id="nv4-over-title">RUN ENDED</h2>
        <p class="nv4-intro">Your crew reached wave ${wave}.</p>
        <button type="button" class="nv4-primary" data-action="restart">RUN IT BACK <span>→</span></button>
        <button type="button" class="nv4-secondary" data-action="exit">RETURN TO ARCADE</button>
      </section>
    `;
  }

  function beginRun(): void {
    editingRunLoadout = false;
    overlay!.replaceChildren();
    input.clearKeyPresses();
    scene.startRun(setup.players.map((loadout) => ({ ...loadout })));
    saveSetup();
  }

  function exit(): void {
    if (closed) return;
    closed = true;
    lifecycle.abort();
    unregisterPauseAction?.();
    cancelAnimationFrame(toastFrame);
    phaser.destroy(true);
    onExit();
  }

  function showToast(text: string): void {
    toast!.textContent = text;
    toast!.classList.add("visible");
    toastTimer = 1.8;
  }

  overlay.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;
    if (target.hasAttribute("data-players")) {
      const count = Number(target.value);
      if (!Number.isInteger(count) || count < 1 || count > 4) return;
      setup.players = Array.from({ length: count }, (_, index) =>
        setup.players[index] ?? { ...DEFAULT_LOADOUTS[index] });
      if (editingRunLoadout) {
        updateRunningLoadouts();
        refreshLoadoutCards();
      }
      saveSetup();
      if (!editingRunLoadout) showSetup();
      return;
    }
    const index = Number(target.dataset.index);
    const kind = target.dataset.kind;
    const value = target.value;
    const loadout = setup.players[index];
    if (!loadout) return;
    if (kind === "weapon" && WEAPONS.includes(value as typeof WEAPONS[number])) loadout.weapon = value as PlayerLoadout["weapon"];
    else if (kind === "super" && SUPERS.includes(value as typeof SUPERS[number])) loadout.super = value as PlayerLoadout["super"];
    else if (kind === "minor" && MINORS.includes(value as typeof MINORS[number])) loadout.minor = value as PlayerLoadout["minor"];
    else return;
    if (kind === "weapon") {
      const summary = overlay!.querySelector<HTMLElement>(`[data-weapon-stats="${index}"]`);
      if (summary) summary.textContent = weaponSummary(loadout.weapon);
    }
    if (editingRunLoadout) updateRunningLoadouts();
    saveSetup();
  }, { signal: lifecycle.signal });

  overlay.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const action = target.closest<HTMLElement>("[data-action]")?.dataset.action;
    if (action === "start" || action === "restart") beginRun();
    else if (action === "exit") exit();
    else if (action === "return-to-pause") {
      editingRunLoadout = false;
      overlay!.replaceChildren();
      pauseMenuControls?.openPauseMenu();
    }
  }, { signal: lifecycle.signal });

  window.addEventListener("arcade:pause", (event) => {
    if (!(event instanceof CustomEvent) || typeof event.detail !== "boolean" || closed) return;
    scene.clearKeyState();
    if (event.detail) phaser.scene.pause("NeonVectorPhaserScene");
    else phaser.scene.resume("NeonVectorPhaserScene");
  }, { signal: lifecycle.signal });
  window.addEventListener("arcade:pause-menu", (event) => {
    if (!(event instanceof CustomEvent) || event.detail !== true || !editingRunLoadout) return;
    editingRunLoadout = false;
    overlay!.replaceChildren();
  }, { signal: lifecycle.signal });
  unregisterPauseAction = gameMenu?.registerPauseMenuAction("CHANGE LOADOUT", (controls) => {
    if (!scene.isRunActive) return;
    pauseMenuControls = controls;
    showPausedLoadoutScreen();
    controls.closePauseMenu();
  });

  function updateToast(): void {
    if (closed) return;
    if (toastTimer > 0) {
      toastTimer = Math.max(0, toastTimer - 1 / 60);
      if (!toastTimer) toast!.classList.remove("visible");
    }
    toastFrame = requestAnimationFrame(updateToast);
  }

  showSetup();
  updateToast();
  await new Promise<void>((resolve) => {
    phaser.events.once(Phaser.Core.Events.READY, () => {
      scene.events.on("wave-started", ({ wave }: { wave: number }) => showToast(`WAVE ${String(wave).padStart(2, "0")} INCOMING`));
      scene.events.on("objective-started", ({ objective }: { objective: string }) => showToast(`OBJECTIVE: ${objective.toUpperCase()}`));
      scene.events.on("objective-completed", () => showToast("OBJECTIVE COMPLETE"));
      scene.events.on("game-over", ({ wave }: { wave: number }) => showGameOver(wave));
      resolve();
    });
  });
  root.dataset.engine = "Phaser 4";
}
