import "./style.css";
import { Game } from "./Game";
import { getControllerValue, isControllerDown, isControllerPressed, type InputManager, type NamespacedSettingsStore, type PlayerInput } from "../../engine";
import { CONTROLLER_INPUTS, KEYBOARD_INPUTS } from "./input";
import type { Difficulty, GameSetup, GameState, Player } from "./types";

interface SavedPreferences {
  difficulty: Difficulty;
  players: number;
}

function isDifficulty(value: unknown): value is Difficulty {
  return value === "easy" || value === "normal" || value === "hard";
}

export function mountNeonAntSiege(
  host: HTMLElement,
  onExit: () => void,
  input: InputManager,
  settings: NamespacedSettingsStore,
): void {
  host.innerHTML = `
    <div class="ant-siege">
      <canvas class="ant-siege-canvas" aria-label="Neon Ant Siege survival arena"></canvas>
      <div class="ant-siege-topline">
        <span class="ant-siege-brand">NEON <b>ANT SIEGE</b></span>
      </div>
      <div class="ant-siege-overlay" aria-live="polite"></div>
      <p class="ant-siege-controls">MOVE <kbd>←</kbd><kbd>→</kbd> JUMP <kbd>↑</kbd> ATTACK <kbd>SPACE</kbd> · GAMEPAD <kbd>LEFT STICK</kbd><kbd>A</kbd><kbd>X</kbd> · MENU <kbd>START</kbd>/<kbd>ESC</kbd></p>
    </div>
  `;
  const shell = host.querySelector<HTMLElement>(".ant-siege");
  const canvas = host.querySelector<HTMLCanvasElement>("canvas");
  const overlayElement = host.querySelector<HTMLElement>(".ant-siege-overlay");
  if (!shell || !canvas || !overlayElement) throw new Error("Neon Ant Siege is missing required game elements.");
  const overlay: HTMLElement = overlayElement;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D rendering is not supported by this browser.");

  const game = new Game();
  const lifecycle = new AbortController();
  let animationFrame = 0;
  let running = true;
  let started = false;
  let paused = false;
  let gameOverShown = false;
  let lastFrame = performance.now();
  let setup: GameSetup = { difficulty: "normal", players: 1 };
  let preferenceError = "";
  try {
    const saved = settings.load<unknown>("preferences");
    if (typeof saved === "object" && saved !== null) {
      const prefs = saved as Partial<SavedPreferences>;
      if (isDifficulty(prefs.difficulty)) setup.difficulty = prefs.difficulty;
      if (typeof prefs.players === "number" && Number.isInteger(prefs.players) && prefs.players >= 1 && prefs.players <= 4) setup.players = prefs.players;
    }
  } catch (error) {
    console.error("Could not load Neon Ant Siege settings.", error);
    preferenceError = "Settings could not be loaded. The game will use defaults.";
  }

  function savePreferences(): void {
    try {
      settings.save("preferences", setup);
      preferenceError = "";
    } catch (error) {
      console.error("Could not save Neon Ant Siege settings.", error);
      preferenceError = "Settings could not be saved in this browser.";
    }
  }

  function showSetup(): void {
    overlay.innerHTML = `
      <section class="ant-siege-card" aria-labelledby="ant-siege-title">
        <p class="ant-siege-kicker">LOCAL CO-OP · SURVIVE THE SWARM</p>
        <h1 id="ant-siege-title">Neon Ant Siege</h1>
        <p class="ant-siege-copy">A geometric neon arena. A relentless red swarm. Keep your team alive.</p>
        <label class="ant-siege-field">DIFFICULTY
          <select data-setting="difficulty">
            <option value="easy"${setup.difficulty === "easy" ? " selected" : ""}>Easy</option>
            <option value="normal"${setup.difficulty === "normal" ? " selected" : ""}>Normal</option>
            <option value="hard"${setup.difficulty === "hard" ? " selected" : ""}>Hard</option>
          </select>
        </label>
        <div class="ant-siege-field"><span>LOCAL PLAYERS</span>
          <div class="ant-siege-players">${[1, 2, 3, 4].map((count) => `<button type="button" data-players="${count}" class="${setup.players === count ? "selected" : ""}" aria-pressed="${setup.players === count}">${count}</button>`).join("")}</div>
        </div>
        <p class="ant-siege-preferences" role="status">${preferenceError}</p>
        <button type="button" class="ant-siege-primary" data-action="start">START SURVIVAL <span>→</span></button>
        <p class="ant-siege-hint">SWORD · AXE · RETURNING SHIELD <span>— NO GUNS, JUST GUTS</span></p>
      </section>
    `;
  }

  function showGameOver(): void {
    overlay.innerHTML = `
      <section class="ant-siege-card ant-siege-small-card" aria-labelledby="game-over-title">
        <p class="ant-siege-kicker">THE SWARM TOOK THE ARENA</p>
        <h2 id="game-over-title">Run over</h2>
        <p class="ant-siege-copy">Your team reached wave ${game.state?.wave ?? 1}.</p>
        <button type="button" class="ant-siege-primary" data-action="restart">TRY AGAIN</button>
        <button type="button" class="ant-siege-secondary" data-action="arcade">QUIT TO ARCADE</button>
      </section>
    `;
  }

  function startGame(): void {
    const bounds = canvas!.getBoundingClientRect();
    game.start(setup, bounds.width, bounds.height);
    shell!.classList.add("in-game");
    started = true;
    paused = false;
    gameOverShown = false;
    input.clearKeyPresses();
    overlay.replaceChildren();
    lastFrame = performance.now();
  }

  function exitToArcade(): void {
    if (!running) return;
    running = false;
    cancelAnimationFrame(animationFrame);
    lifecycle.abort();
    game.stop();
    onExit();
  }

  overlay.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const action = target.closest<HTMLElement>("[data-action]")?.dataset.action;
    if (action === "start") startGame();
    else if (action === "restart") startGame();
    else if (action === "arcade") exitToArcade();
  }, { signal: lifecycle.signal });
  overlay.addEventListener("change", (event) => {
    const target = event.target;
    if (target instanceof HTMLSelectElement && target.dataset.setting === "difficulty" && isDifficulty(target.value)) {
      setup.difficulty = target.value;
      savePreferences();
      showSetup();
    }
  }, { signal: lifecycle.signal });
  overlay.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const count = Number(target.closest<HTMLElement>("[data-players]")?.dataset.players);
    if (Number.isInteger(count) && count >= 1 && count <= 4 && !started) {
      setup.players = count;
      savePreferences();
      showSetup();
    }
  }, { signal: lifecycle.signal });

  function resize(): void {
    const bounds = canvas!.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(bounds.width * ratio));
    const height = Math.max(1, Math.round(bounds.height * ratio));
    if (canvas!.width === width && canvas!.height === height) return;
    const oldWidth = canvas!.clientWidth;
    const oldHeight = canvas!.clientHeight;
    canvas!.width = width;
    canvas!.height = height;
    context!.setTransform(ratio, 0, 0, ratio, 0, 0);
    if (game.state && oldWidth > 0 && oldHeight > 0) game.resize(bounds.width, bounds.height);
  }

  function playerInput(playerId: number, controller: PlayerInput | undefined): void {
    const keys = KEYBOARD_INPUTS[playerId];
    if (!keys) return;
    const direction = getControllerValue(controller, CONTROLLER_INPUTS.moveX)
      + (input.isKeyDown(keys.right) ? 1 : 0)
      - (input.isKeyDown(keys.left) ? 1 : 0);
    game.movePlayer(playerId, direction);
    if (isControllerPressed(controller, CONTROLLER_INPUTS.jump) || input.consumeKeyPress(keys.jump)) game.jump(playerId);
    if (isControllerDown(controller, CONTROLLER_INPUTS.attack) || input.isKeyDown(keys.attack)) game.attack(playerId);
  }

  window.addEventListener("arcade:pause", (event) => {
    if (!(event instanceof CustomEvent) || typeof event.detail !== "boolean") return;
    if (!started || game.state?.gameOver) return;
    paused = event.detail;
    input.clearKeyPresses();
    lastFrame = performance.now();
  }, { signal: lifecycle.signal });

  function frame(now: number): void {
    if (!running) return;
    resize();
    const delta = Math.min((now - lastFrame) / 1000, 0.05);
    lastFrame = now;
    const gamepads = input.poll();
    if (started && !paused && !game.state?.gameOver) {
      game.state?.players.forEach((player, index) => {
        if (player.active) playerInput(index, gamepads[index]);
      });
      game.update(delta);
    }

    if (game.state?.gameOver && !paused && !gameOverShown) {
      gameOverShown = true;
      showGameOver();
    }
    render(context!, canvas!.clientWidth, canvas!.clientHeight, game.state);
    animationFrame = requestAnimationFrame(frame);
  }

  function render(ctx: CanvasRenderingContext2D, width: number, height: number, state: GameState | null): void {
    drawBackground(ctx, width, height);
    if (!state) return;
    drawStage(ctx, width, height, state.platforms);
    state.projectiles.forEach((projectile) => drawShield(ctx, projectile.x, projectile.y));
    state.ants.forEach((ant) => drawAnt(ctx, ant));
    state.players.forEach((player) => drawPlayer(ctx, player));
    drawHud(ctx, width, height, state.wave, state.players);
    if (state.wavePause > 0 && state.ants.length === 0 && state.spawnRemaining === 0) {
      ctx.textAlign = "center";
      ctx.font = "700 20px 'DM Mono', monospace";
      ctx.fillStyle = "#d8fcff";
      ctx.shadowColor = "#55f6ff";
      ctx.shadowBlur = 20;
      ctx.fillText(`WAVE ${state.wave + 1} INCOMING`, width / 2, height * 0.42);
      ctx.shadowBlur = 0;
    }
  }

  function drawBackground(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#0b1021");
    gradient.addColorStop(0.55, "#11112a");
    gradient.addColorStop(1, "#071522");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "#88aaff0c";
    ctx.lineWidth = 1;
    const spacing = 44;
    for (let x = 0; x <= width; x += spacing) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y <= height; y += spacing) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }
    ctx.strokeStyle = "#b752ff24";
    ctx.beginPath();
    ctx.moveTo(0, height * 0.76); ctx.lineTo(width * 0.48, height * 0.46); ctx.lineTo(width, height * 0.69);
    ctx.stroke();
  }

  function drawStage(ctx: CanvasRenderingContext2D, width: number, height: number, platforms: GameState["platforms"]): void {
    ctx.save();
    ctx.strokeStyle = "#ff3b4f55";
    ctx.shadowColor = "#ff3b4f";
    ctx.shadowBlur = 12;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(7, 76); ctx.lineTo(7, height - 46);
    ctx.moveTo(width - 7, 76); ctx.lineTo(width - 7, height - 46);
    ctx.stroke();
    ctx.restore();
    platforms.forEach((platform, index) => {
      const color = index % 2 === 0 ? "#55f6ff" : "#b762ff";
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = index === 0 ? 20 : 13;
      ctx.fillStyle = index === 0 ? "#14203a" : "#13182f";
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
      ctx.strokeStyle = color;
      ctx.lineWidth = index === 0 ? 2 : 1.5;
      ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
      ctx.restore();
      ctx.fillStyle = `${color}66`;
      ctx.fillRect(platform.x + 8, platform.y + platform.height, Math.max(0, platform.width - 16), 2);
    });
  }

  function drawPlayer(ctx: CanvasRenderingContext2D, player: Player): void {
    if (!player.active || (player.invulnerability > 0 && Math.floor(player.invulnerability * 16) % 2 === 0)) return;
    const headY = player.y + 10;
    const bodyY = player.y + 24;
    const stride = player.grounded ? Math.sin(player.walkTime * 12) * 5 : 0;
    ctx.save();
    ctx.strokeStyle = player.color;
    ctx.fillStyle = player.color;
    ctx.lineWidth = 3.2;
    ctx.lineCap = "round";
    ctx.shadowColor = player.color;
    ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(player.x, headY, 8, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(player.x, headY + 9); ctx.lineTo(player.x, bodyY + 15); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(player.x, bodyY); ctx.lineTo(player.x - 12, bodyY + 9); ctx.moveTo(player.x, bodyY); ctx.lineTo(player.x + 12, bodyY + 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(player.x, bodyY + 15); ctx.lineTo(player.x - 9 + stride, bodyY + 31); ctx.moveTo(player.x, bodyY + 15); ctx.lineTo(player.x + 9 - stride, bodyY + 31); ctx.stroke();
    ctx.font = "700 10px 'DM Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText(`P${player.id + 1}`, player.x, player.y - 5);
    drawHeldWeapon(ctx, player, bodyY);
    if (player.attackTime > 0) {
      ctx.strokeStyle = player.weapon === "axe" ? "#ffc857" : player.color;
      ctx.lineWidth = player.weapon === "axe" ? 5 : 3;
      ctx.beginPath();
      ctx.moveTo(player.x + player.facing * 12, bodyY + 4);
      ctx.lineTo(player.x + player.facing * (player.weapon === "axe" ? 62 : 50), bodyY - 5);
      ctx.stroke();
      ctx.beginPath(); ctx.arc(player.x + player.facing * 27, bodyY, 27, -0.8, 0.8); ctx.stroke();
    }
    ctx.restore();
  }

  function drawHeldWeapon(ctx: CanvasRenderingContext2D, player: Player, bodyY: number): void {
    ctx.save();
    ctx.translate(player.x + player.facing * 12, bodyY + 6);
    ctx.scale(player.facing, 1);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowBlur = 7;

    if (player.weapon === "sword") {
      ctx.strokeStyle = "#d8fcff";
      ctx.shadowColor = player.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(5, 0); ctx.lineTo(25, -13);
      ctx.moveTo(4, -4); ctx.lineTo(8, 4);
      ctx.stroke();
    } else if (player.weapon === "axe") {
      ctx.strokeStyle = "#ffc857";
      ctx.fillStyle = "#ffc857";
      ctx.shadowColor = "#ffc857";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(17, -12);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(12, -9); ctx.lineTo(18, -19); ctx.lineTo(27, -16);
      ctx.lineTo(23, -8); ctx.closePath();
      ctx.fill();
    } else {
      ctx.strokeStyle = "#55f6ff";
      ctx.fillStyle = "#153149";
      ctx.shadowColor = "#55f6ff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(2, -10); ctx.lineTo(16, -8); ctx.lineTo(19, 1);
      ctx.lineTo(11, 10); ctx.lineTo(3, 5); ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawAnt(ctx: CanvasRenderingContext2D, ant: NonNullable<Game["state"]>["ants"][number]): void {
    const scale = ant.boss ? 1.8 : 1;
    const y = ant.y + (ant.boss ? 31 : 15);
    const radius = ant.boss ? 16 : 9;
    const color = ant.boss ? "#ff254d" : "#ff3b4f";
    const step = Math.sin(ant.walkTime * 8) * 5 * scale;
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineWidth = ant.boss ? 4 : 2.4;
    ctx.strokeStyle = color;
    ctx.fillStyle = "#7f132f";
    ctx.shadowColor = color;
    ctx.shadowBlur = ant.boss ? 24 : 12;
    ctx.beginPath(); ctx.ellipse(ant.x, y, radius * 1.15, radius * 0.75, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(ant.x + ant.facing * radius * 1.35, y - 2, radius * 0.72, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    for (let leg = -1; leg <= 1; leg += 1) {
      const x = ant.x + leg * radius * 0.65;
      ctx.beginPath();
      ctx.moveTo(x, y + 3);
      ctx.lineTo(x + ant.facing * (5 + step), y + 12 * scale);
      ctx.lineTo(x + ant.facing * (11 - step), y + 15 * scale);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y + 1);
      ctx.lineTo(x - ant.facing * 5, y - 8 * scale);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(ant.x + ant.facing * radius, y - 9 * scale);
    ctx.lineTo(ant.x + ant.facing * (radius + 7 * scale), y - 18 * scale);
    ctx.stroke();
    if (ant.boss) {
      ctx.fillStyle = "#ffe4ea";
      ctx.fillRect(ant.x - 26, ant.y - 12, 52, 4);
      ctx.fillStyle = "#ff254d";
      ctx.fillRect(ant.x - 26, ant.y - 12, 52 * Math.max(0, ant.health / ant.maxHealth), 4);
    }
    ctx.restore();
  }

  function drawShield(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(performance.now() / 120);
    ctx.shadowColor = "#55f6ff"; ctx.shadowBlur = 16;
    ctx.fillStyle = "#152e49"; ctx.strokeStyle = "#55f6ff"; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -13); ctx.lineTo(13, -3); ctx.lineTo(9, 10); ctx.lineTo(0, 15); ctx.lineTo(-9, 10); ctx.lineTo(-13, -3); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  function drawHud(ctx: CanvasRenderingContext2D, width: number, height: number, wave: number, players: Player[]): void {
    ctx.textAlign = "center";
    ctx.font = "700 11px 'DM Mono', monospace";
    ctx.fillStyle = "#a9b5d4";
    ctx.fillText("WAVE", width / 2, 26);
    ctx.font = "700 25px 'DM Mono', monospace";
    ctx.fillStyle = "#f4efff";
    ctx.shadowColor = "#b762ff";
    ctx.shadowBlur = 16;
    ctx.fillText(String(wave).padStart(2, "0"), width / 2, 54);
    ctx.shadowBlur = 0;
    players.forEach((player, index) => {
      const right = index % 2 === 1;
      const bottom = index > 1;
      const x = right ? width - 190 : 20;
      const y = bottom ? height - 31 : 22;
      const barWidth = Math.min(170, width * 0.28);
      ctx.textAlign = "left";
      ctx.font = "700 10px 'DM Mono', monospace";
      ctx.fillStyle = player.active ? player.color : "#687086";
      ctx.fillText(`P${index + 1}`, x, y);
      ctx.fillStyle = "#23263b";
      ctx.fillRect(x + 27, y - 9, barWidth - 27, 8);
      ctx.fillStyle = player.health > 30 ? player.color : "#ff3b63";
      ctx.shadowColor = player.color;
      ctx.shadowBlur = 8;
      ctx.fillRect(x + 27, y - 9, (barWidth - 27) * player.health / 100, 8);
      ctx.shadowBlur = 0;
      ctx.font = "9px 'DM Mono', monospace";
      ctx.fillStyle = "#b6bed4";
      ctx.fillText(`${Math.ceil(player.health)} HP`, x + 27, y + 11);
      ctx.textAlign = right ? "right" : "left";
      ctx.fillStyle = "#8b91aa";
      ctx.fillText(player.weapon.toUpperCase(), right ? width - 20 : 20, bottom ? height - 13 : 52);
    });
  }

  showSetup();
  resize();
  window.addEventListener("resize", resize, { signal: lifecycle.signal });
  animationFrame = requestAnimationFrame(frame);
}
