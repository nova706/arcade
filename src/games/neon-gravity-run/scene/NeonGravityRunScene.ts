import Phaser from "phaser";
import { GameData } from "../data/GameData";
import { GoalEntity } from "../entities/GoalEntity";
import { HudEntity } from "../entities/HudEntity";
import { LavaEntity } from "../entities/LavaEntity";
import { PlatformEntity } from "../entities/PlatformEntity";
import { PlayerEntity } from "../entities/PlayerEntity";
import { PLAYER_COLORS } from "../input";
import type { PlayerCommand } from "../types";
import { GoalSystem } from "../systems/GoalSystem";
import { HazardSystem } from "../systems/HazardSystem";
import { InputSystem } from "../systems/InputSystem";
import { PlatformSystem } from "../systems/PlatformSystem";
import type { InputManager } from "../../../engine";

export class NeonGravityRunScene extends Phaser.Scene {
  readonly players: PlayerEntity[] = [];
  private readonly inputSystem: InputSystem;
  private platformSystem!: PlatformSystem;
  private hazardSystem!: HazardSystem;
  private goalSystem!: GoalSystem;
  private platforms: PlatformEntity[] = [];
  private topLava!: LavaEntity;
  private bottomLava!: LavaEntity;
  private goal!: GoalEntity;
  private hud!: HudEntity;
  private started = false;
  private gameOver = false;

  constructor(input: InputManager) {
    super({ key: "NeonGravityRunScene" });
    this.inputSystem = new InputSystem(input);
  }

  create(): void {
    this.inputSystem.start();
    this.platformSystem = new PlatformSystem(this);
    this.drawBackground();
    this.topLava = new LavaEntity(this, GameData.WIDTH / 2, GameData.LAVA_HEIGHT / 2, GameData.WIDTH, GameData.LAVA_HEIGHT, true);
    this.bottomLava = new LavaEntity(this, GameData.WIDTH / 2, GameData.HEIGHT - GameData.LAVA_HEIGHT / 2, GameData.WIDTH, GameData.LAVA_HEIGHT, false);
    this.platforms = GameData.PLATFORMS.map((platform) => new PlatformEntity(this, platform));
    this.goal = new GoalEntity(this);
    this.hud = new HudEntity(this);
    this.hazardSystem = new HazardSystem(this, this.topLava, this.bottomLava);
    this.goalSystem = new GoalSystem(this, this.goal);
    this.physics.world.setBounds(0, 0, GameData.WIDTH, GameData.HEIGHT);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.onShutdown, this);
  }

  startRun(playerCount: number): void {
    const setup = new GameData(playerCount);
    this.clearRun();
    this.started = true;
    this.gameOver = false;
    for (let index = 0; index < setup.players; index += 1) {
      const spawnX = 64 + index * 36;
      const spawnY = 592;
      this.players.push(new PlayerEntity(this, index, spawnX, spawnY, PLAYER_COLORS[index]));
    }
    this.platformSystem.connect(this.players, this.platforms);
    this.hud.update(this.players);
  }

  update(_time: number, deltaMilliseconds: number): void {
    if (!this.started || this.gameOver) return;
    const delta = Math.min(deltaMilliseconds / 1000, 0.05);
    const controllers = this.inputSystem.pollControllers();
    this.players.forEach((player, index) => {
      if (!player.alive) return;
      const landing = player.consumeLandingState();
      this.goalSystem.checkLanding(player, landing);
      if (this.gameOver) return;
      const command: PlayerCommand = this.inputSystem.readCommand(index, controllers[index]);
      this.platformSystem.updatePlayer(player, command, landing, delta);
    });
    this.hazardSystem.update(this.time.now, this.players);
    this.hud.update(this.players);
  }

  clearKeyState(): void {
    this.inputSystem.clearKeys();
  }

  lavaHit(player: PlayerEntity): void {
    if (this.gameOver || !player.alive) return;
    player.loseLife();
    this.events.emit("life-lost", { player: player.playerIndex, lives: player.lives });
    if (this.players.every((candidate) => !candidate.alive)) this.finish(null);
  }

  playerWon(player: PlayerEntity): void {
    if (this.gameOver || !player.alive) return;
    this.gameOver = true;
    player.freezeForWin();
    this.events.emit("player-won", { winner: player.playerIndex });
    this.tweens.add({
      targets: [player, player.graphic],
      scaleX: 0,
      scaleY: 0,
      duration: 650,
      ease: "Back.In",
      onComplete: () => this.events.emit("game-over", { winner: player.playerIndex }),
    });
  }

  private finish(winner: number | null): void {
    if (this.gameOver) return;
    this.gameOver = true;
    this.events.emit("game-over", { winner });
  }

  private clearRun(): void {
    this.platformSystem?.disconnect();
    this.players.forEach((player) => {
      this.tweens.killTweensOf(player);
      player.destroy();
    });
    this.players.length = 0;
  }

  private onShutdown(): void {
    this.inputSystem.destroy();
    this.platformSystem.disconnect();
    this.clearRun();
    this.platforms.forEach((platform) => platform.destroy());
    this.platforms = [];
    this.topLava.destroy();
    this.bottomLava.destroy();
    this.goal.destroy();
    this.hud.destroy();
  }

  private drawBackground(): void {
    const background = this.add.graphics().setDepth(-10);
    background.fillGradientStyle(0x12162d, 0x12162d, 0x070916, 0x070916, 1);
    background.fillRect(0, 0, GameData.WIDTH, GameData.HEIGHT);
    background.lineStyle(1, 0x52678f, 0.12);
    for (let x = 20; x < GameData.WIDTH; x += 42) background.lineBetween(x, 0, x, GameData.HEIGHT);
    for (let y = 20; y < GameData.HEIGHT; y += 42) background.lineBetween(0, y, GameData.WIDTH, y);
    background.lineStyle(2, 0x55f6ff, 0.45);
    background.strokeRect(10, 10, GameData.WIDTH - 20, GameData.HEIGHT - 20);
    this.add.text(GameData.WIDTH / 2, 22, "NEON GRAVITY RUN", {
      color: "#9ba9c7",
      fontFamily: "Consolas, monospace",
      fontSize: "12px",
      letterSpacing: 4,
    }).setOrigin(0.5).setDepth(8);
  }
}
