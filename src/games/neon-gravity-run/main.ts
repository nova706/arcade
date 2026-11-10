import Phaser from "phaser";
import "./style.css";
import type { InputManager, NamespacedSettingsStore } from "../../engine";
import { GameData } from "./data/GameData";
import { NeonGravityRunScene } from "./scene/NeonGravityRunScene";

interface SavedPreferences {
  players: number;
}

function isPlayerCount(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 4;
}

export async function mountNeonGravityRun(
  host: HTMLElement,
  onExit: () => void,
  input: InputManager,
  settings: NamespacedSettingsStore,
): Promise<void> {
  host.innerHTML = `
    <main class="ngr">
      <div class="ngr-stage"></div>
      <section class="ngr-overlay" aria-live="polite"></section>
      <div class="ngr-win-toast" role="status" aria-live="assertive"></div>
      <footer class="ngr-controls">P1 <kbd>A</kbd><kbd>D</kbd> MOVE <kbd>W</kbd> JUMP · P2 <kbd>←</kbd><kbd>→</kbd> <kbd>↑</kbd> · P3 <kbd>J</kbd><kbd>L</kbd> <kbd>I</kbd> · P4 <kbd>NUM 4</kbd><kbd>NUM 6</kbd> <kbd>NUM 8</kbd> · PAD <kbd>LS / D-PAD</kbd><kbd>A JUMP</kbd></footer>
    </main>
  `;
  const root = host.querySelector<HTMLElement>(".ngr");
  const stage = host.querySelector<HTMLElement>(".ngr-stage");
  const overlay = host.querySelector<HTMLElement>(".ngr-overlay");
  const winToast = host.querySelector<HTMLElement>(".ngr-win-toast");
  if (!root || !stage || !overlay || !winToast) throw new Error("Neon Gravity Run is missing required UI elements.");

  const scene = new NeonGravityRunScene(input);
  const phaser = new Phaser.Game({
    type: Phaser.AUTO,
    parent: stage,
    backgroundColor: "#070916",
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GameData.WIDTH,
      height: GameData.HEIGHT,
    },
    physics: {
      default: "arcade",
      arcade: { gravity: { x: 0, y: 0 }, fixedStep: true, fps: 60, debug: false },
    },
    scene: [scene],
    input: { gamepad: false },
    render: { antialias: true, pixelArt: false },
  });
  const lifecycle = new AbortController();
  let players = 1;
  let closed = false;

  try {
    const saved = settings.load<unknown>("preferences");
    if (typeof saved === "object" && saved !== null && isPlayerCount((saved as Partial<SavedPreferences>).players)) {
      players = (saved as SavedPreferences).players;
    }
  } catch (error) {
    console.error("Could not load Neon Gravity Run preferences.", error);
  }

  function showSetup(): void {
    overlay!.innerHTML = `
      <section class="ngr-card" aria-labelledby="ngr-title">
        <p class="ngr-kicker">LOCAL PARKOUR · 1–4 PLAYERS</p>
        <h1 id="ngr-title">NEON <span>GRAVITY RUN</span></h1>
        <p class="ngr-copy">Jump to invert your gravity. Run the platforms, dodge the lava, and land in the goal.</p>
        <label class="ngr-player-count">LOCAL PLAYERS
          <select data-players>${[1, 2, 3, 4].map((count) => `<option value="${count}"${players === count ? " selected" : ""}>${count} PLAYER${count === 1 ? "" : "S"}</option>`).join("")}</select>
        </label>
        <p class="ngr-copy ngr-small">Keyboard: P1 A/D + W · P2 ←/→ + ↑ · P3 J/L + I · P4 numpad 4/6 + 8<br>Gamepad: left stick or D-pad to move, A to jump. Press A to join an unassigned controller.</p>
        <button type="button" class="ngr-primary" data-action="start">START RUN <span>→</span></button>
      </section>
    `;
  }

  function showResult(winner: number | null): void {
    winToast!.classList.remove("visible");
    overlay!.innerHTML = `
      <section class="ngr-card ngr-result" aria-labelledby="ngr-result-title">
        <p class="ngr-kicker">${winner === null ? "SIGNAL LOST" : "GOAL REACHED"}</p>
        <h2 id="ngr-result-title">${winner === null ? "ALL RUNNERS OUT" : players === 1 ? "LEVEL COMPLETE" : `PLAYER ${winner + 1} WINS`}</h2>
        <p class="ngr-copy">${winner === null ? "The lava claimed every life." : "You found the opening and made it through."}</p>
        <button type="button" class="ngr-primary" data-action="restart">RUN IT BACK <span>→</span></button>
        <button type="button" class="ngr-secondary" data-action="exit">RETURN TO ARCADE</button>
      </section>
    `;
  }

  function startRun(): void {
    overlay!.replaceChildren();
    input.clearKeyPresses();
    scene.startRun(players);
    try {
      settings.save("preferences", { players });
    } catch (error) {
      console.error("Could not save Neon Gravity Run preferences.", error);
    }
  }

  function exit(): void {
    if (closed) return;
    closed = true;
    lifecycle.abort();
    phaser.destroy(true);
    onExit();
  }

  overlay.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement) || !target.hasAttribute("data-players")) return;
    const count = Number(target.value);
    if (!isPlayerCount(count)) return;
    players = count;
  }, { signal: lifecycle.signal });

  overlay.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const action = target.closest<HTMLElement>("[data-action]")?.dataset.action;
    if (action === "start" || action === "restart") startRun();
    else if (action === "exit") exit();
  }, { signal: lifecycle.signal });

  window.addEventListener("arcade:pause", (event) => {
    if (!(event instanceof CustomEvent) || typeof event.detail !== "boolean" || closed) return;
    scene.clearKeyState();
    if (event.detail) phaser.scene.pause("NeonGravityRunScene");
    else phaser.scene.resume("NeonGravityRunScene");
  }, { signal: lifecycle.signal });

  await new Promise<void>((resolve) => {
    phaser.events.once(Phaser.Core.Events.READY, () => {
      scene.events.on("player-won", ({ winner }: { winner: number }) => {
        winToast!.textContent = players === 1 ? "GOAL REACHED · LEVEL COMPLETE" : `PLAYER ${winner + 1} WINS`;
        winToast!.classList.add("visible");
      });
      scene.events.on("game-over", ({ winner }: { winner: number | null }) => showResult(winner));
      resolve();
    });
  });
  showSetup();
  root.dataset.engine = "Phaser 4";
}
