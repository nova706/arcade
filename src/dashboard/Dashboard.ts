import type { InputManager } from "../engine";
import type { GameEntry } from "./registry";

export class Dashboard {
  private selectedIndex = 0;
  private animationFrame = 0;
  private running = false;

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
      await game.mount(host, () => this.show(), this.input);
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
}
