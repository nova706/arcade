import { SettingsStore, type InputManager } from "../engine";
import type { GameEntry } from "./registry";

export class Dashboard {
  private selectedIndex = 0;
  private animationFrame = 0;
  private running = false;
  private disposeGameMenu: (() => void) | null = null;
  private readonly settings = new SettingsStore();

  constructor(
    private readonly root: HTMLElement,
    private readonly games: readonly GameEntry[],
    private readonly input: InputManager,
  ) {
    if (games.length === 0) throw new Error("The arcade dashboard requires at least one registered game.");
  }

  show(): void {
    this.input.clearKeyPresses();
    this.running = true;
    this.root.innerHTML = `
      <main class="arcade">
        <header class="arcade-header">
          <a class="arcade-brand" href="#" aria-label="Arcade home"><span class="arcade-brand-mark">A</span> PLAYROOM</a>
          <span class="arcade-hint">LOCAL ARCADE <i></i></span>
        </header>
        <section class="arcade-intro" aria-labelledby="arcade-title">
          <p class="arcade-eyebrow">YOUR GAME LIBRARY</p>
          <h1 id="arcade-title">Choose your next world.</h1>
          <p class="arcade-lede">A home for small, browser-based games. Select a cabinet to play.</p>
        </section>
        <section class="game-library" aria-label="Available games">
          ${this.games.map((game, index) => `
            <article class="game-card${index === this.selectedIndex ? " selected" : ""}" data-game-index="${index}" style="--game-accent:${game.accent}">
              <div class="game-card-art" aria-hidden="true"><span>${game.title.split(" ").map((word) => word[0]).join("")}</span></div>
              <div class="game-card-copy">
                <p class="arcade-eyebrow">${game.subtitle}</p>
                <h2>${game.title}</h2>
                <p>${game.description}</p>
                <span class="game-controls">${game.controls}</span>
                <button class="launch-game" type="button" data-launch-index="${index}">PLAY GAME <span aria-hidden="true">→</span></button>
              </div>
            </article>
          `).join("")}
        </section>
        <p class="arcade-footer"><kbd>←</kbd> <kbd>→</kbd> SELECT <kbd>ENTER</kbd> OR GAMEPAD <kbd>A</kbd> PLAY</p>
        <div class="arcade-error" role="alert" hidden></div>
      </main>
    `;
    this.root.querySelectorAll<HTMLButtonElement>("[data-launch-index]").forEach((button) => {
      button.addEventListener("click", () => void this.launch(Number(button.dataset.launchIndex)));
    });
    this.refreshSelection();
    this.pollInput();
  }

  dispose(): void {
    this.running = false;
    cancelAnimationFrame(this.animationFrame);
    this.disposeGameMenu?.();
    this.disposeGameMenu = null;
  }

  private pollInput = (): void => {
    if (!this.running) return;
    const [first] = this.input.poll();
    if (this.input.consumeKeyPress("ArrowLeft")) {
      this.selectedIndex = (this.selectedIndex - 1 + this.games.length) % this.games.length;
      this.refreshSelection();
    }
    if (this.input.consumeKeyPress("ArrowRight")) {
      this.selectedIndex = (this.selectedIndex + 1) % this.games.length;
      this.refreshSelection();
    }
    if (this.input.consumeKeyPress("Enter") || this.input.consumeKeyPress(" ")) {
      void this.launch(this.selectedIndex);
    }
    if (first?.confirm) void this.launch(this.selectedIndex);
    this.animationFrame = requestAnimationFrame(this.pollInput);
  };

  private refreshSelection(): void {
    this.root.querySelectorAll<HTMLElement>(".game-card").forEach((card, index) => {
      card.classList.toggle("selected", index === this.selectedIndex);
      card.setAttribute("aria-current", index === this.selectedIndex ? "true" : "false");
    });
  }

  private async launch(index: number): Promise<void> {
    const game = this.games[index];
    if (!game || !this.running) return;
    this.running = false;
    this.input.clearKeyPresses();
    cancelAnimationFrame(this.animationFrame);
    const host = document.createElement("div");
    host.id = "game-host";
    this.root.replaceChildren(host);
    try {
      let menuCleanup: (() => void) | null = null;
      const exitToArcade = (): void => {
        menuCleanup?.();
        menuCleanup = null;
        this.disposeGameMenu = null;
        this.show();
      };
      await game.mount(host, exitToArcade, this.input, this.settings.namespace(game.id));
      if (host.isConnected) {
        menuCleanup = this.attachGameMenu(host, exitToArcade);
        this.disposeGameMenu = menuCleanup;
      }
    } catch (error) {
      console.error(`Could not launch ${game.title}.`, error);
      this.show();
      const notice = this.root.querySelector<HTMLElement>(".arcade-error");
      if (notice) {
        notice.hidden = false;
        notice.textContent = `Unable to launch ${game.title}. See the browser console for details.`;
      }
    }
  }

  private attachGameMenu(host: HTMLElement, onExit: () => void): () => void {
    host.classList.add("arcade-game-host");
    const controls = document.createElement("div");
    controls.className = "arcade-universal-controls";
    controls.innerHTML = `
      <section class="arcade-universal-dialog" role="dialog" aria-modal="true" aria-labelledby="arcade-universal-title" hidden>
        <p>PLAYROOM ARCADE</p>
        <h2 id="arcade-universal-title">Game menu</h2>
        <button type="button" data-action="resume">RESUME</button>
        <button type="button" data-action="exit">QUIT TO ARCADE</button>
      </section>
    `;
    host.append(controls);
    const dialog = controls.querySelector<HTMLElement>(".arcade-universal-dialog");
    const resume = controls.querySelector<HTMLButtonElement>("[data-action='resume']");
    const exit = controls.querySelector<HTMLButtonElement>("[data-action='exit']");
    if (!dialog || !resume || !exit) throw new Error("Arcade game menu is missing required controls.");

    let open = false;
    let animationFrame = 0;
    let previouslyFocused: HTMLElement | null = null;
    const previousStartButtons: boolean[] = [];
    const setOpen = (nextOpen: boolean): void => {
      if (open === nextOpen) return;
      open = nextOpen;
      dialog.hidden = !open;
      controls.classList.toggle("is-open", open);
      window.dispatchEvent(new CustomEvent("arcade:pause", { detail: open }));
      if (open) {
        previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        resume.focus();
      } else if (previouslyFocused?.isConnected) {
        previouslyFocused.focus();
        previouslyFocused = null;
      }
    };
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      setOpen(!open);
    };
    const handleControlsClick = (event: MouseEvent): void => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.closest("[data-action='resume']")) setOpen(false);
      else if (target.closest("[data-action='exit']")) onExit();
    };
    const pollGamepadStart = (): void => {
      const pads = navigator.getGamepads();
      let startPressed = false;
      for (let index = 0; index < pads.length; index += 1) {
        const pad = pads[index];
        const pressed = Boolean(pad?.connected && pad.buttons[9]?.pressed);
        if (pressed && !previousStartButtons[index]) startPressed = true;
        previousStartButtons[index] = pressed;
      }
      if (startPressed) setOpen(!open);
      animationFrame = requestAnimationFrame(pollGamepadStart);
    };
    const handleFrameLoad = (): void => {
      const frame = host.querySelector<HTMLIFrameElement>("iframe");
      frame?.contentWindow?.addEventListener("keydown", handleKeyDown, true);
    };

    window.addEventListener("keydown", handleKeyDown, true);
    const frame = host.querySelector<HTMLIFrameElement>("iframe");
    frame?.addEventListener("load", handleFrameLoad);
    frame?.contentWindow?.addEventListener("keydown", handleKeyDown, true);
    controls.addEventListener("click", handleControlsClick);
    animationFrame = requestAnimationFrame(pollGamepadStart);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("keydown", handleKeyDown, true);
      frame?.removeEventListener("load", handleFrameLoad);
      frame?.contentWindow?.removeEventListener("keydown", handleKeyDown, true);
      controls.removeEventListener("click", handleControlsClick);
      if (open) window.dispatchEvent(new CustomEvent("arcade:pause", { detail: false }));
      controls.remove();
      host.classList.remove("arcade-game-host");
    };
  }
}
