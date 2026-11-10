import Phaser from "phaser";
import { type InputManager } from "../../../engine";
import { PLAYER_COLORS } from "../data/Loadouts";
import { AreaEntity } from "../entities/Areas/AreaEntity";
import { ENEMY_CONFIG, EnemyEntity } from "../entities/EnemyEntity";
import { DirectionalBurstEntity, ExpandingRingEntity, ParticleEntity, ProjectileEntity } from "../entities/ProjectileEntity";
import { PlayerEntity } from "../entities/PlayerEntity";
import { ENEMY_TYPES, type EnemyType, type PlayerLoadout } from "../types";
import { ObjectiveManager } from "../systems/ObjectiveManager";
import { WaveManager } from "../systems/WaveManager";
import { Hud } from "../entities/Hud";
import { InputSystem } from "../systems/InputManager";
import type { IAttacker } from "../interfaces/IAttacker";

export class NeonVectorScene extends Phaser.Scene {
    public readonly players: PlayerEntity[] = [];
    public readonly enemies: EnemyEntity[] = [];
    public readonly areas: AreaEntity[] = [];

    private readonly projectiles: ProjectileEntity[] = [];
    private readonly weaponEffects: Array<DirectionalBurstEntity | ExpandingRingEntity> = [];
    private readonly particles: ParticleEntity[] = [];
    private background!: Phaser.GameObjects.Graphics;
    private hud!: Hud;
    private started = false;
    private gameOver = false;
    private objectiveEnemy: EnemyEntity | null = null;

    public readonly objectiveManager: ObjectiveManager = new ObjectiveManager(this);
    public readonly waveManager: WaveManager = new WaveManager(this, this.objectiveManager);
    public readonly inputSystem: InputSystem;

    constructor(input: InputManager) {
        super({ key: "NeonVectorPhaserScene" });
        this.inputSystem = new InputSystem(input, this);
    }

    private updateWeaponEffects(delta: number): void {
        for (const effect of [...this.weaponEffects]) {
            if (effect.update(delta)) {
                this.weaponEffects.splice(this.weaponEffects.indexOf(effect), 1);
                effect.destroy();
            }
        }
    }

    public addWeaponEffect(effect: DirectionalBurstEntity | ExpandingRingEntity): void {
        this.weaponEffects.push(effect);
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
    }

    startRun(loadouts: PlayerLoadout[]): void {
        this.clearRun();
        if (loadouts.length < 1 || loadouts.length > 4) {
            throw new RangeError("Neon Vector requires between one and four player loadouts.");
        }
        this.started = true;
        this.gameOver = false;
        const { width, height } = this.scale;
        loadouts.forEach((loadout, index) => {
            const angle = -Math.PI / 2 + Math.PI * 2 * index / loadouts.length;
            this.players.push(new PlayerEntity(
                this,
                { index, color: PLAYER_COLORS[index], loadout: { ...loadout } },
                width / 2 + Math.cos(angle) * 55,
                height / 2 + Math.sin(angle) * 55,
                { ...loadout },
            ));
        });
        this.waveManager.start();
    }

    update(_time: number, deltaMilliseconds: number): void {
        if (!this.started || this.gameOver) return;
        const delta = Math.min(deltaMilliseconds / 1000, 0.05);
        const gamepads = this.inputSystem.pollGamepads();

        this.players.forEach((player, index) => {
            if (!player.alive) return;
            const command = this.inputSystem.readCommand(index, gamepads[index], player);
            player.setCommand(command);
            player.update(delta);
        });

        this.enemies.forEach((enemy) => enemy.update(delta));
        this.areas.forEach((area) => area.update(delta));

        this.updateProjectiles(delta);
        this.updateWeaponEffects(delta);
        this.updateParticles(delta);
        this.waveManager.updateWaves(delta);
        this.hud.update();
    }

    clearKeyState(): void {
        this.inputSystem.clearKeyState();
    }

    private fixedUpdate(): void {
        if (!this.started || this.gameOver) return;
        this.players.forEach((player) => player.fixedUpdate());
        this.enemies.forEach((enemy) => {
            const attacked = enemy.fixedUpdate(this.players);
            if (attacked) this.damagePlayer(attacked, enemy.damageAmount);
        });
    }

    private updateProjectiles(delta: number): void {
        for (const projectile of [...this.projectiles]) {
            if (projectile.update(delta)) {
                this.projectiles.splice(this.projectiles.indexOf(projectile), 1);
                projectile.destroy();
            }
        }
    }

    private updateParticles(delta: number): void {
        for (const particle of [...this.particles]) {
            if (particle.update(delta)) {
                this.particles.splice(this.particles.indexOf(particle), 1);
                particle.destroy();
            }
        }
    }

    public spawnEnemy(type?: EnemyType): EnemyEntity {
        const enemyType = type ?? (this.waveManager.wave % 4 === 0 && Math.random() < 0.18
            ? "tank"
            : ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)]);
        const { width, height } = this.scale;
        const margin = 64;
        const side = Phaser.Math.Between(0, 3);
        const x = side === 0 ? margin : side === 1 ? width - margin : Phaser.Math.Between(margin, width - margin);
        const y = side === 2 ? margin : side === 3 ? height - margin : Phaser.Math.Between(margin, height - margin);
        const enemy = new EnemyEntity(this, x, y, enemyType, this.waveManager.wave);
        this.enemies.push(enemy);
        return enemy;
    }

    public damagePlayer(player: PlayerEntity, damage: number): void {
        if (!player.alive || player.invisibleTime > 0) return;
        if (this.areas.some((area) => area.kind === "bubble"
            && Phaser.Math.Distance.Between(area.x, area.y, player.x, player.y) < area.areaData.radius)) return;
        const actual = player.damage(damage);
        if (actual > 0) this.emitParticles(player.x, player.y, 0xff426b, 8);
        if (this.players.every((candidate) => !candidate.alive)) {
            this.gameOver = true;
            this.events.emit("game-over", { wave: this.waveManager.wave });
        }
    }

    public damageEnemy(enemy: EnemyEntity, amount: number, source?: IAttacker, knockback = 100): void {
        if (!enemy.alive) return;
        if (source) source.invisibleTime = 0;
        const buff = source && this.areas.some((area) => area.kind === "totem" && area.owner === source.playerIndex
            && Phaser.Math.Distance.Between(source.x, source.y, area.x, area.y) < area.areaData.radius) ? 1.3 : 1;
        const defeated = enemy.takeDamage(amount * buff);
        const angle = source ? Phaser.Math.Angle.Between(source.x, source.y, enemy.x, enemy.y) : 0;
        enemy.body.setVelocity(enemy.body.velocity.x + Math.cos(angle) * knockback, enemy.body.velocity.y + Math.sin(angle) * knockback);
        this.emitParticles(enemy.x, enemy.y, ENEMY_CONFIG[enemy.type].color, 4);
        if (!defeated) return;
        const { x, y, type } = enemy;
        this.enemies.splice(this.enemies.indexOf(enemy), 1);
        enemy.destroy();
        if (enemy === this.objectiveEnemy) this.objectiveManager.completeObjective();
        if (type === "splitter") {
            for (let i = 0; i < 2; i += 1) {
                const child = new EnemyEntity(this, x + (i ? 18 : -18), y, "chaser", this.waveManager.wave);
                child.health = Math.ceil(child.health * 0.55);
                this.enemies.push(child);
            }
        }
    }

    public damageEnemiesNear(x: number, y: number, radius: number, damage: number, knockback: number, source?: IAttacker): void {
        this.enemies.forEach((enemy) => {
            const distance = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
            if (distance > radius) return;
            const amount = damage * (1 - distance / radius * 0.45);
            this.damageEnemy(enemy, amount, source, knockback);
        });
    }

    public addExpandingRing(x: number, y: number, radius: number, color: number, lifetime: number): void {
        this.weaponEffects.push(new ExpandingRingEntity(this, x, y, radius, color, lifetime));
    }

    public removeArea(area: AreaEntity): void {
        const index = this.areas.indexOf(area);
        if (index >= 0) this.areas.splice(index, 1);
        area.destroy();
    }

    public addProjectile(x: number, y: number, directionX: number, directionY: number, distance: number, color: number, lifetime: number): void {
        const length = Math.max(0.001, Math.hypot(directionX, directionY));
        const projectile = new ProjectileEntity(this, x, y, directionX / length, directionY / length, distance, color, lifetime);
        this.projectiles.push(projectile);
    }

    public emitParticles(x: number, y: number, color: number, count: number): void {
        for (let i = 0; i < count; i += 1) {
            this.particles.push(new ParticleEntity(this, x, y, color, Phaser.Math.Between(30, 180), Math.random() * Math.PI * 2, 0.34));
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
        this.players.forEach((actor) => actor.destroy());
        this.enemies.forEach((actor) => actor.destroy());
        this.areas.forEach((actor) => actor.destroy());
        this.projectiles.forEach((actor) => actor.destroy());
        this.weaponEffects.forEach((actor) => actor.destroy());
        this.particles.forEach((actor) => actor.destroy());
        this.players.length = 0;
        this.enemies.length = 0;
        this.areas.length = 0;
        this.projectiles.length = 0;
        this.weaponEffects.length = 0;
        this.particles.length = 0;
        this.started = false;
        this.objectiveManager.stop();
        this.waveManager.stop();
        this.objectiveEnemy = null;
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
