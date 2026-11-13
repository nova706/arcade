import Phaser from "phaser";
import { type InputManager } from "../../../engine";
import { PLAYER_COLORS } from "../data/Loadouts";
import { AreaEntity } from "../entities/Areas/AreaEntity";
import { EnemyEntity } from "../entities/Enemies/EnemyEntity";
import { PlayerEntity } from "../entities/PlayerEntity";
import { type EnemyType, type PlayerLoadout } from "../types";
import { ObjectiveManager } from "../systems/ObjectiveManager";
import { WaveManager } from "../systems/WaveManager";
import { Hud } from "../entities/Hud";
import { InputSystem } from "../systems/InputManager";
import type { IAttacker } from "../interfaces/IAttacker";
import { EnemyFactory } from "../systems/EnemyFactory";
import { EffectsManager } from "../systems/EffectsManager";

export class NeonVectorScene extends Phaser.Scene {
    private playerGroup!: Phaser.GameObjects.Group;
    private enemyGroup!: Phaser.GameObjects.Group;
    private areaGroup!: Phaser.GameObjects.Group;

    private background!: Phaser.GameObjects.Graphics;
    private hud!: Hud;
    private started = false;
    private gameOver = false;

    private readonly pendingExplosions: Array<{ x: number; y: number; damage: number; radius: number; source: EnemyEntity }> = [];
    private processingExplosions = false;

    public effectsManager!: EffectsManager;
    public objectiveManager!: ObjectiveManager;
    public waveManager!: WaveManager;
    public inputSystem: InputSystem;

    public getPlayers(): PlayerEntity[] { return this.playerGroup.getChildren() as PlayerEntity[]; }
    public getEnemies(): EnemyEntity[] { return this.enemyGroup.getChildren() as EnemyEntity[]; }
    public getAreas(): AreaEntity[] { return this.areaGroup.getChildren() as AreaEntity[]; }

    constructor(input: InputManager) {
        super({ key: "NeonVectorPhaserScene" });
        this.inputSystem = new InputSystem(input, this);
    }

    get isRunActive(): boolean {
        return this.started && !this.gameOver;
    }

    create(): void {
        document.addEventListener("keydown", this.inputSystem.onKeyDown);
        document.addEventListener("keyup", this.inputSystem.onKeyUp);
        window.addEventListener("blur", this.inputSystem.clearKeys);

        const { width, height } = this.scale;
        this.background = this.add.graphics().setDepth(-10);
        this.drawBackground(width, height);

        this.hud = new Hud(this);
        this.add.existing(this.hud);

        this.physics.world.setBounds(0, 0, width, height);
        this.physics.world.on("worldstep", this.fixedUpdate, this);
        this.inputSystem.start();
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.onShutdown, this);

        this.playerGroup = this.add.group();
        this.enemyGroup = this.add.group();
        this.areaGroup = this.add.group();

        this.effectsManager = new EffectsManager(this);
        this.objectiveManager = new ObjectiveManager(this);
        this.waveManager = new WaveManager(this, this.objectiveManager);

        this.events.on("player-died", this.onPlayerDied, this);
    }

    startRun(loadouts: PlayerLoadout[]): void {
        this.clearRun();
        if (loadouts.length < 1 || loadouts.length > 4) {
            throw new RangeError("Neon Vector requires between one and four player loadouts.");
        }
        this.started = true;
        this.gameOver = false;
        loadouts.forEach((loadout, index) => this.spawnPlayer(loadout, index, loadouts.length));
        this.waveManager.start();
    }

    setPlayerLoadouts(loadouts: PlayerLoadout[]): void {
        if (!this.isRunActive) return;
        if (loadouts.length < 1 || loadouts.length > 4) {
            throw new RangeError("Neon Vector requires between one and four player loadouts.");
        }

        const currentPlayers = this.getPlayers();
        loadouts.forEach((loadout, index) => {
            const player = currentPlayers[index];
            if (player) {
                player.applyLoadout(loadout);
            } else {
                this.spawnPlayer(loadout, index, loadouts.length);
            }
        });

        while (this.getPlayers().length > loadouts.length) {
            const extraPlayer = this.getPlayers().pop();
            extraPlayer?.destroy();
        }
    }

    update(_time: number, deltaMilliseconds: number): void {
        if (!this.started || this.gameOver) return;
        const delta = Math.min(deltaMilliseconds / 1000, 0.05);
        const gamepads = this.inputSystem.pollGamepads();

        this.getPlayers().forEach((player, index) => {
            if (!player.alive) return;
            const command = this.inputSystem.readCommand(index, gamepads[index], player);
            player.setCommand(command);
            player.update(delta);
        });

        this.getEnemies().forEach((enemy) => enemy.update(delta));
        this.getAreas().forEach((area) => area.update(delta));

        this.effectsManager.update(delta);
        this.waveManager.updateWaves(delta);
        this.hud.update();
    }

    clearKeyState(): void {
        this.inputSystem.clearKeyState();
    }

    private fixedUpdate(): void {
        if (!this.started || this.gameOver) return;
        const activePlayers = this.getPlayers();
        activePlayers.forEach((player) => player.fixedUpdate());
        this.getEnemies().forEach((enemy) => enemy.fixedUpdate(activePlayers));
    }

    private spawnPlayer(loadout: PlayerLoadout, index: number, playerCount: number): PlayerEntity {
        const { width, height } = this.scale;
        const angle = -Math.PI / 2 + Math.PI * 2 * index / playerCount;
        const copy = { ...loadout };
        const player = new PlayerEntity(
            this,
            { index, color: PLAYER_COLORS[index], loadout: copy },
            width / 2 + Math.cos(angle) * 55,
            height / 2 + Math.sin(angle) * 55,
            copy,
        );
        this.playerGroup.add(player);
        return player;
    }

    public spawnEnemy(type: EnemyType): EnemyEntity {
        const { width, height } = this.scale;
        const margin = 64;
        const side = Phaser.Math.Between(0, 3);
        const x = side === 0 ? margin : side === 1 ? width - margin : Phaser.Math.Between(margin, width - margin);
        const y = side === 2 ? margin : side === 3 ? height - margin : Phaser.Math.Between(margin, height - margin);

        return this.spawnEnemyAt(type, x, y);
    }

    public spawnEnemyAt(type: EnemyType, x: number, y: number): EnemyEntity {
        const enemy = EnemyFactory.create(this, x, y, type, this.waveManager.wave);
        this.enemyGroup.add(enemy);
        return enemy;
    }

    public spawnArea(area: AreaEntity) {
        area.setDepth(-1);
        this.areaGroup.add(area);
    }

    public explodeAt(x: number, y: number, damage: number, radius: number, source: EnemyEntity): void {
        this.pendingExplosions.push({ x, y, damage, radius, source });
        if (this.processingExplosions) return;

        this.processingExplosions = true;
        try {
            while (this.pendingExplosions.length > 0) {
                const explosion = this.pendingExplosions.shift()!;
                this.effectsManager.addExpandingRing(explosion.x, explosion.y, explosion.radius, explosion.source.color, 0.38);
                this.effectsManager.emitParticles(explosion.x, explosion.y, explosion.source.color, 24);

                for (const player of this.getPlayers()) {
                    if (player.alive && Phaser.Math.Distance.Between(explosion.x, explosion.y, player.x, player.y) <= explosion.radius) {
                        player.takeDamage(explosion.damage, source);
                    }
                }

                for (const target of this.getEnemies()) {
                    if (Phaser.Math.Distance.Between(explosion.x, explosion.y, target.x, target.y) <= explosion.radius) {
                        target.takeDamage(explosion.damage, explosion.source, 180);
                    }
                }
            }
        } finally {
            this.processingExplosions = false;
        }
    }

    public damageEnemiesNear(x: number, y: number, radius: number, damage: number, knockback: number, source?: IAttacker): void {
        this.getEnemies().forEach((enemy) => {
            const distance = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
            if (distance > radius) return;
            const amount = damage * (1 - distance / radius * 0.45);
            enemy.takeDamage(amount, source, knockback);
        });
    }

    private onPlayerDied(player: PlayerEntity): void {
        if (this.getPlayers().every((candidate) => !candidate.alive)) {
            this.gameOver = true;
            this.events.emit("game-over", { wave: this.waveManager.wave });
        }
    }

    private drawBackground(width: number, height: number): void {
        this.background.clear();
        this.background.fillGradientStyle(0x13162d, 0x13162d, 0x070916, 0x070916, 1);
        this.background.fillRect(0, 0, width, height);
        this.background.lineStyle(1, 0x52678f, 0.12);
        for (let x = 20; x < width; x += 42) this.background.lineBetween(x, 0, x, height);
        for (let y = 20; y < height; y += 42) this.background.lineBetween(0, y, width, y);
        this.background.lineStyle(2, 0x55f6ff, 0.55);
        this.background.strokeRect(10, 10, width - 20, height - 20);
    }

    private clearRun(): void {
        this.playerGroup.clear(true, true);
        this.enemyGroup.clear(true, true);
        this.areaGroup.clear(true, true);
        this.effectsManager.destroy();
        this.objectiveManager.stop();
        this.waveManager.stop();
        this.started = false;
        this.gameOver = false;
    }

    private onShutdown(): void {
        document.removeEventListener("keydown", this.inputSystem.onKeyDown);
        document.removeEventListener("keyup", this.inputSystem.onKeyUp);
        window.removeEventListener("blur", this.inputSystem.clearKeys);
        this.physics.world.off("worldstep", this.fixedUpdate, this);
        this.clearRun();
    }
}
