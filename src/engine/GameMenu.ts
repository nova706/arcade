export interface PauseMenuControls {
  closePauseMenu(): void;
  openPauseMenu(): void;
}

export interface GameMenuContext {
  registerPauseMenuAction(label: string, onSelect: (controls: PauseMenuControls) => void): () => void;
}

interface PauseMenuAction {
  button: HTMLButtonElement;
  onSelect: (controls: PauseMenuControls) => void;
}

export class GameMenuActions implements GameMenuContext {
  private container: HTMLElement | null = null;
  private controls: PauseMenuControls | null = null;
  private readonly actions = new Set<PauseMenuAction>();

  registerPauseMenuAction(label: string, onSelect: (controls: PauseMenuControls) => void): () => void {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    const action = { button, onSelect };
    this.actions.add(action);
    this.container?.append(button);
    button.addEventListener("click", () => this.controls && action.onSelect(this.controls));
    return () => {
      this.actions.delete(action);
      button.remove();
    };
  }

  attach(container: HTMLElement, controls: PauseMenuControls): void {
    this.container = container;
    this.controls = controls;
    this.actions.forEach(({ button }) => container.append(button));
  }

  detach(): void {
    this.container = null;
    this.controls = null;
  }
}
