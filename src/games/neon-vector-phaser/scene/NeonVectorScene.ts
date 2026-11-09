import Phaser from "phaser";
import { getControllerValue, isControllerDown, isControllerPressed, type InputManager, type PlayerInput } from "../../../engine";
import { PLAYER_COLORS, WEAPON_STATS } from "../data/Loadouts";
import { CONTROLLER_INPUTS, KEYBOARD_INPUTS } from "../input";
import { AreaEntity, type AreaKind } from "../entities/AreaEntity";
import { ENEMY_CONFIG, EnemyEntity } from "../entities/EnemyEntity";
import { DirectionalBurstEntity, ExpandingRingEntity, ParticleEntity, ProjectileEntity } from "../entities/ProjectileEntity";
import { PlayerEntity } from "../entities/PlayerEntity";
import type { EnemyType, ObjectiveType, PlayerCommand, PlayerLoadout } from "../types";

const ENEMY_TYPES: EnemyType[] = ["chaser", "charger", "ranger", "splitter", "tank", "flanker"];
const PREVENT_DEFAULT_KEYS = new Set([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);

export class NeonVectorScene extends Phaser.Scene {
  private readonly players: PlayerEntity[] = [];
  private readonly enemies: EnemyEntity[] = [];
  private readonly areas: AreaEntity[] = [];
  private readonly projectiles: ProjectileEntity[] = [];
  private readonly weaponEffects: Array<DirectionalBurstEntity | ExpandingRingEntity> = [];
  private readonly particles: ParticleEntity[] = [];
  private background!: Phaser.GameObjects.Graphics;
  private hud!: Phaser.GameObjects.Text;
  private started = false;
  private gameOver = false;
  private wave = 0;
  private spawnRemaining = 0;
  private spawnTimer = 0;
  private breakTimer = 0;
  private elapsed = 0;
  private objective: ObjectiveType | null = null;
  private objectiveTimer = 0;
  private checkpointIndex = 0;
  private objectiveEnemy: EnemyEntity | null = null;
  private readonly gamepads: InputManager;
  private readonly downKeys = new Set<string>();
  private readonly pressedKeys = new Set<string>();
  private mouseDown = false;
  private mouseX = 0;
  private mouseY = 0;

  constructor(input: InputManager) {
    super({ key: "NeonVectorPhaserScene" });
    this.gamepads = input;
  }

  private updateWeaponEffects(delta: number): void {
    for (const effect of [...this.weaponEffects]) {
      if (effect.update(delta)) {
        this.weaponEffects.splice(this.weaponEffects.indexOf(effect), 1);
        effect.destroy();
      }
    }
  }

  create(): void {
    document.addEventListener("keydown", this.onKeyDown);
    document.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.clearKeys);
    const { width, height } = this.scale;
    this.background = this.add.graphics().setDepth(-10);
    this.drawBackground(width, height);
    this.hud = this.add.text(18, 14, "", {
      color: "#eaf2ff",
      fontFamily: "monospace",
      fontSize: "13px",
      stroke: "#080916",
      strokeThickness: 3,
    }).setDepth(50);
    this.physics.world.setBounds(0, 0, width, height);
    this.physics.world.on("worldstep", this.fixedUpdate, this);
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      this.mouseX = pointer.worldX;
      this.mouseY = pointer.worldY;
    });
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) this.mouseDown = true;
    });
    this.input.on("pointerup", () => { this.mouseDown = false; });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.onShutdown, this);
  }

  startRun(loadouts: PlayerLoadout[]): void {
    this.clearRun();
    if (loadouts.length < 1 || loadouts.length > 4) {
      throw new RangeError("Neon Vector requires between one and four player loadouts.");
    }
    this.started = true;
    this.gameOver = false;
    this.elapsed = 0;
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
    this.beginWave();
  }

  update(_time: number, deltaMilliseconds: number): void {
    if (!this.started || this.gameOver) return;
    const delta = Math.min(deltaMilliseconds / 1000, 0.05);
    this.elapsed += delta;
    const gamepads = this.gamepads.poll();

    this.players.forEach((player, index) => {
      if (!player.alive) return;
      const command = this.readCommand(index, gamepads[index], player);
      player.setCommand(command);
      player.update(delta);
      if (command.useSuper) this.useSuper(player);
      if (command.useMinor) this.useMinor(player);
      if (command.fire && !this.playerInBubble(player)) this.fireWeapon(player);
      if (player.loadout.weapon === "orbit" && !this.playerInBubble(player)) this.updateOrbitWeapon(player, delta);
    });

    this.enemies.forEach((enemy) => enemy.update(delta));
    this.updateAreas(delta);
    this.updateProjectiles(delta);
    this.updateWeaponEffects(delta);
    this.updateParticles(delta);
    this.updateWaves(delta);
    this.updateHud();
  }

  private readCommand(index: number, controller: PlayerInput | undefined, player: PlayerEntity): PlayerCommand {
    const keys = KEYBOARD_INPUTS[index];
    if (!keys) return this.emptyCommand();
    const moveX = Number(this.downKeys.has(keys.right)) - Number(this.downKeys.has(keys.left))
      + getControllerValue(controller, CONTROLLER_INPUTS.moveX);
    const moveY = Number(this.downKeys.has(keys.down)) - Number(this.downKeys.has(keys.up))
      + getControllerValue(controller, CONTROLLER_INPUTS.moveY);
    const pointerAim = index === 0 && this.mouseDown;
    const rightX = getControllerValue(controller, CONTROLLER_INPUTS.aimX);
    const rightY = getControllerValue(controller, CONTROLLER_INPUTS.aimY);
    const stickAim = Math.abs(rightX) + Math.abs(rightY) > 0.2;
    return {
      moveX,
      moveY,
      aimX: pointerAim ? this.mouseX - player.x : stickAim ? rightX : moveX,
      aimY: pointerAim ? this.mouseY - player.y : stickAim ? rightY : moveY,
      fire: this.downKeys.has(keys.fire) || isControllerDown(controller, CONTROLLER_INPUTS.fire) || pointerAim,
      useMinor: this.consumeKeyPress(keys.minor) || isControllerPressed(controller, CONTROLLER_INPUTS.minor),
      useSuper: this.consumeKeyPress(keys.super) || isControllerPressed(controller, CONTROLLER_INPUTS.super),
    };
  }

  private consumeKeyPress(key: string): boolean {
    if (!this.pressedKeys.has(key)) return false;
    this.pressedKeys.delete(key);
    return true;
  }

  clearKeyState(): void {
    this.clearKeys();
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (PREVENT_DEFAULT_KEYS.has(event.key)) event.preventDefault();
    const key = this.keyName(event);
    if (!this.downKeys.has(key)) this.pressedKeys.add(key);
    this.downKeys.add(key);
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    this.downKeys.delete(this.keyName(event));
  };

  private readonly clearKeys = (): void => {
    this.downKeys.clear();
    this.pressedKeys.clear();
  };

  private keyName(event: KeyboardEvent): string {
    if (event.code.startsWith("Numpad")) return event.code;
    return event.key.length === 1 ? event.key.toLowerCase() : event.key;
  }

  private emptyCommand(): PlayerCommand {
    return { moveX: 0, moveY: 0, aimX: 0, aimY: -1, fire: false, useMinor: false, useSuper: false };
  }

  private fixedUpdate(): void {
    if (!this.started || this.gameOver) return;
    this.players.forEach((player) => player.fixedUpdate());
    this.enemies.forEach((enemy) => {
      const attacked = enemy.fixedUpdate(this.players);
      if (attacked) this.damagePlayer(attacked, enemy.damageAmount);
    });
    this.enemies.forEach((enemy) => this.applyBarrierRepulsion(enemy));
  }

  private applyBarrierRepulsion(enemy: EnemyEntity): void {
    for (const barrier of this.areas) {
      if (barrier.kind !== "barrier") continue;
      const dx = enemy.x - barrier.x;
      const dy = enemy.y - barrier.y;
      const cos = Math.cos(barrier.orientation);
      const sin = Math.sin(barrier.orientation);
      const along = dx * cos + dy * sin;
      const across = -dx * sin + dy * cos;
      if (Math.abs(along) > barrier.radius + enemy.radius || Math.abs(across) > 16 + enemy.radius) continue;
      const side = across === 0 ? 1 : Math.sign(across);
      const force = Math.max(260, enemy.speed * 2.8);
      enemy.body.setVelocity(-sin * side * force, cos * side * force);
      break;
    }
  }

  private fireWeapon(player: PlayerEntity): void {
    const stats = WEAPON_STATS[player.loadout.weapon];
    if (player.loadout.weapon === "orbit") {
      if (player.orbitBurstCooldown > 0) return;
      player.orbitBurstCooldown = stats.burstCooldown ?? 1;
      player.orbitBurstTime = 0.3;
      player.invisibleTime = 0;
      this.damageEnemiesNear(
        player.x,
        player.y,
        stats.burstRange ?? 110,
        (stats.burstDamage ?? stats.damage) * (player.attackBoost > 0 ? 1.35 : 1),
        stats.burstKnockback ?? stats.knockback,
        player,
      );
      this.addExpandingRing(player.x, player.y, stats.burstRange ?? 110, player.playerData.color, 0.28);
      this.emitParticles(player.x, player.y, player.playerData.color, 18);
      return;
    }
    if (player.weaponCooldown > 0) return;
    player.invisibleTime = 0;
    player.weaponCooldown = stats.cooldown;
    const multiplier = player.attackBoost > 0 ? 1.35 : 1;
    if (player.loadout.weapon === "shockwave") {
      this.damageEnemiesNear(player.x, player.y, stats.range, stats.damage * multiplier, stats.knockback, player);
      this.addExpandingRing(player.x, player.y, stats.range, player.playerData.color, 0.42);
      this.emitParticles(player.x, player.y, player.playerData.color, 12);
    } else if (player.loadout.weapon === "beam") {
      this.fireBeam(player, stats.range, stats.damage * multiplier);
    } else {
      this.fireChainBurst(player, stats.range, stats.damage * multiplier, stats.chainCount ?? 4, stats.chainRange ?? 150);
    }
  }

  private updateOrbitWeapon(player: PlayerEntity, delta: number): void {
    const stats = WEAPON_STATS.orbit;
    if (player.weaponCooldown > 0) return;
    player.weaponCooldown = stats.cooldown;
    const angle = this.elapsed * 6 + player.playerData.index;
    const x = player.x + Math.cos(angle) * stats.range;
    const y = player.y + Math.sin(angle) * stats.range;
    const enemy = this.enemies.find((candidate) => candidate.alive
      && Phaser.Math.Distance.Between(candidate.x, candidate.y, x, y) < candidate.radius + 18);
    if (enemy) {
      player.invisibleTime = 0;
      this.damageEnemy(enemy, stats.damage * delta * 60, player, stats.knockback);
    }
  }

  private playerInBubble(player: PlayerEntity): boolean {
    return this.areas.some((area) => area.kind === "bubble"
      && Phaser.Math.Distance.Between(player.x, player.y, area.x, area.y) < area.radius);
  }

  private fireBeam(player: PlayerEntity, range: number, damage: number): void {
    const dx = Math.cos(player.attackAngle);
    const dy = Math.sin(player.attackAngle);
    const hit = this.enemies.filter((enemy) => enemy.alive)
      .map((enemy) => ({
        enemy,
        along: (enemy.x - player.x) * dx + (enemy.y - player.y) * dy,
        across: Math.abs((enemy.x - player.x) * dy - (enemy.y - player.y) * dx),
      }))
      .filter(({ along, across }) => along > 0 && along < range && across < 18)
      .sort((a, b) => a.along - b.along);
    hit.forEach(({ enemy }) => this.damageEnemy(enemy, damage, player, WEAPON_STATS.beam.knockback));
    this.addProjectile(player.x, player.y, dx, dy, range, player.playerData.color, 0.12);
  }

  private fireChainBurst(player: PlayerEntity, range: number, damage: number, chainCount: number, chainRange: number): void {
    const dx = Math.cos(player.attackAngle);
    const dy = Math.sin(player.attackAngle);
    const first = this.enemies.filter((enemy) => enemy.alive)
      .map((enemy) => ({
        enemy,
        along: (enemy.x - player.x) * dx + (enemy.y - player.y) * dy,
        across: Math.abs((enemy.x - player.x) * dy - (enemy.y - player.y) * dx),
      }))
      .filter(({ enemy, along, across }) => along > 0 && along < range && across < along * 0.34 + enemy.radius)
      .sort((a, b) => a.along - b.along)[0]?.enemy;
    this.weaponEffects.push(new DirectionalBurstEntity(
      this,
      player.x,
      player.y,
      player.attackAngle,
      range,
      player.playerData.color,
      0.2,
    ));
    if (!first) return;
    let previous = first;
    this.damageEnemy(first, damage, player, WEAPON_STATS.chain.knockback);
    for (let count = 0; count < chainCount; count += 1) {
      const next = this.enemies.filter((enemy) => enemy.alive && enemy !== previous
        && Phaser.Math.Distance.Between(previous.x, previous.y, enemy.x, enemy.y) < chainRange)
        .sort((a, b) => Phaser.Math.Distance.Between(previous.x, previous.y, a.x, a.y)
          - Phaser.Math.Distance.Between(previous.x, previous.y, b.x, b.y))[0];
      if (!next) break;
      this.addProjectile(previous.x, previous.y, next.x - previous.x, next.y - previous.y,
        Phaser.Math.Distance.Between(previous.x, previous.y, next.x, next.y), player.playerData.color, 0.18);
      this.damageEnemy(next, damage * Math.pow(0.78, count + 1), player, WEAPON_STATS.chain.knockback);
      previous = next;
    }
  }

  private useSuper(player: PlayerEntity): void {
    if (player.superCharge < 100) return;
    player.superCharge = 0;
    const x = player.x;
    const y = player.y;
    if (player.loadout.super === "bubble") {
      this.addArea("bubble", player.playerData.index, x, y, 126, 8);
    } else if (player.loadout.super === "totem") {
      this.addArea("totem", player.playerData.index, x, y, 152, 12);
    } else if (player.loadout.super === "tether") {
      this.addArea("tether", player.playerData.index, x, y, 205, 5);
    } else {
      this.burst(player, 270, 360, 460, 0xfff3a1);
    }
    this.events.emit("super-used", { player: player.playerData.index, ability: player.loadout.super });
  }

  private useMinor(player: PlayerEntity): void {
    if (player.minorCooldown > 0) return;
    const x = player.x;
    const y = player.y;
    if (player.loadout.minor === "mine") {
      player.minorCooldown = 5;
      this.addArea("mine", player.playerData.index, x, y, 28, 16, 95);
    } else if (player.loadout.minor === "teleport") {
      player.minorCooldown = 4;
      let dx = player.command.moveX;
      let dy = player.command.moveY;
      if (Math.hypot(dx, dy) < 0.1) {
        dx = Math.cos(player.attackAngle);
        dy = Math.sin(player.attackAngle);
      }
      const length = Math.max(1, Math.hypot(dx, dy));
      player.setPosition(
        Phaser.Math.Clamp(x + dx / length * 145, 25, this.scale.width - 25),
        Phaser.Math.Clamp(y + dy / length * 145, 25, this.scale.height - 25),
      );
      player.invulnerableTime = 0.32;
    } else if (player.loadout.minor === "invisibility") {
      player.minorCooldown = 8;
      player.invisibleTime = 3.2;
    } else {
      player.minorCooldown = 7;
      this.addArea(
        "barrier",
        player.playerData.index,
        x + Math.cos(player.attackAngle) * 60,
        y + Math.sin(player.attackAngle) * 60,
        52,
        7,
        1,
        player.attackAngle + Math.PI / 2,
      );
    }
    this.events.emit("minor-used", { player: player.playerData.index, ability: player.loadout.minor });
  }

  private updateAreas(delta: number): void {
    for (const area of [...this.areas]) {
      area.update(delta);
      if (area.kind === "capture" && !area.activated) {
        if (this.players.some((player) => player.alive && Phaser.Math.Distance.Between(player.x, player.y, area.x, area.y) < area.radius)) {
          area.progress = Math.min(1, area.progress + delta / 8);
          if (area.progress >= 1) this.completeObjective();
        }
      } else if (area.kind === "checkpoint" && !area.activated) {
        const player = this.players.find((candidate) => candidate.alive
          && Phaser.Math.Distance.Between(candidate.x, candidate.y, area.x, area.y) < area.radius);
        if (player) {
          area.activated = true;
          this.checkpointIndex += 1;
          area.setAlpha(0.25);
          if (this.checkpointIndex >= 3) this.completeObjective();
          else this.placeCheckpoint();
        }
      } else if (area.kind === "mine" && this.enemies.some((enemy) => enemy.alive
        && Phaser.Math.Distance.Between(enemy.x, enemy.y, area.x, area.y) < 70)) {
        this.damageEnemiesNear(area.x, area.y, 120, area.strength, 300, this.players[area.owner]);
        area.remaining = 0;
      } else if (area.kind === "tether") {
        this.enemies.forEach((enemy) => {
          const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, area.x, area.y);
          if (distance > area.radius) return;
          const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, area.x, area.y);
          enemy.body.setVelocity(enemy.body.velocity.x + Math.cos(angle) * 72, enemy.body.velocity.y + Math.sin(angle) * 72);
        });
      } else if (area.kind === "blackhole") {
        this.players.forEach((player) => {
          if (!player.alive) return;
          const distance = Phaser.Math.Distance.Between(player.x, player.y, area.x, area.y);
          if (distance < 430) {
            const angle = Phaser.Math.Angle.Between(player.x, player.y, area.x, area.y);
            player.body.setVelocity(player.body.velocity.x + Math.cos(angle) * 50, player.body.velocity.y + Math.sin(angle) * 50);
          }
          if (distance < 58) this.damagePlayer(player, 8 * delta);
        });
      } else if (area.kind === "bubble" || area.kind === "totem") {
        this.players.forEach((player) => {
          if (!player.alive || Phaser.Math.Distance.Between(player.x, player.y, area.x, area.y) > area.radius) return;
          player.heal((area.kind === "totem" ? 8 : 3) * delta);
          if (area.kind === "bubble") player.overshield = Math.min(42, player.overshield + 5 * delta);
          if (area.kind === "totem") player.attackBoost = 0.15;
        });
      }
      if (area.kind === "bubble") {
        this.enemies.forEach((enemy) => {
          const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, area.x, area.y);
          if (distance >= area.radius + enemy.radius) return;
          const angle = Phaser.Math.Angle.Between(area.x, area.y, enemy.x, enemy.y);
          enemy.body.setVelocity(Math.cos(angle) * enemy.speed * 1.8, Math.sin(angle) * enemy.speed * 1.8);
        });
      }
      if (area.remaining <= 0) this.removeArea(area);
    }
    if (this.objective && this.objectiveTimer > 0) {
      this.objectiveTimer -= delta;
      if (this.objectiveTimer <= 0) {
        this.objectiveTimer = 0;
        if (this.objective === "capture") {
          const capture = this.areas.find((area) => area.kind === "capture");
          if (capture) {
            const { x, y } = capture;
            this.removeArea(capture);
            this.addArea("blackhole", -1, x, y, 150, 60);
          }
        }
      }
      if (this.objectiveTimer <= 0) {
        this.objectiveTimer = 0;
        this.players.forEach((player) => this.damagePlayer(player, 8 * delta));
      }
    } else if (this.objective && this.objectiveTimer === 0) {
      this.players.forEach((player) => this.damagePlayer(player, 8 * delta));
    }
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

  private updateWaves(delta: number): void {
    if (this.spawnRemaining > 0) {
      this.spawnTimer -= delta;
      if (this.spawnTimer <= 0) {
        this.spawnEnemy();
        this.spawnRemaining -= 1;
        this.spawnTimer = 0.55;
      }
      return;
    }
    if (this.enemies.length === 0) {
      this.breakTimer += delta;
      if (this.breakTimer >= 2.2) {
        this.breakTimer = 0;
        this.beginWave();
      }
    }
  }

  private beginWave(): void {
    this.wave += 1;
    this.spawnRemaining = 3 + Math.floor(this.wave * 1.5);
    this.spawnTimer = 0;
    if (this.wave % 5 === 0) this.beginObjective();
    if (this.wave % 20 === 0) this.spawnEnemy("boss");
    this.events.emit("wave-started", { wave: this.wave });
  }

  private beginObjective(): void {
    const kinds: ObjectiveType[] = ["capture", "checkpoints", "tank"];
    this.objective = kinds[(this.wave / 5 - 1) % kinds.length];
    this.objectiveTimer = 30;
    this.checkpointIndex = 0;
    this.events.emit("objective-started", { objective: this.objective });
    if (this.objective === "capture") {
      this.addArea("capture", -1, this.scale.width / 2, this.scale.height / 2, 78, 35);
    } else if (this.objective === "checkpoints") {
      this.placeCheckpoint();
    } else {
      this.objectiveEnemy = this.spawnEnemy("tank");
    }
  }

  private placeCheckpoint(): void {
    const x = Phaser.Math.Between(100, Math.max(101, this.scale.width - 100));
    const y = Phaser.Math.Between(120, Math.max(121, this.scale.height - 120));
    this.addArea("checkpoint", -1, x, y, 48, this.objectiveTimer);
  }

  private completeObjective(): void {
    this.objective = null;
    this.objectiveTimer = 0;
    this.objectiveEnemy = null;
    this.areas.filter((area) => area.kind === "capture" || area.kind === "checkpoint")
      .forEach((area) => this.removeArea(area));
    this.events.emit("objective-completed", {});
  }

  private spawnEnemy(type?: EnemyType): EnemyEntity {
    const enemyType = type ?? (this.wave % 4 === 0 && Math.random() < 0.18
      ? "tank"
      : ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)]);
    const { width, height } = this.scale;
    const margin = 64;
    const side = Phaser.Math.Between(0, 3);
    const x = side === 0 ? margin : side === 1 ? width - margin : Phaser.Math.Between(margin, width - margin);
    const y = side === 2 ? margin : side === 3 ? height - margin : Phaser.Math.Between(margin, height - margin);
    const enemy = new EnemyEntity(this, x, y, enemyType, this.wave);
    this.enemies.push(enemy);
    return enemy;
  }

  private damagePlayer(player: PlayerEntity, damage: number): void {
    if (!player.alive || player.invisibleTime > 0) return;
    if (this.areas.some((area) => area.kind === "bubble"
      && Phaser.Math.Distance.Between(area.x, area.y, player.x, player.y) < area.radius)) return;
    const actual = player.damage(damage);
    if (actual > 0) this.emitParticles(player.x, player.y, 0xff426b, 8);
    if (this.players.every((candidate) => !candidate.alive)) {
      this.gameOver = true;
      this.events.emit("game-over", { wave: this.wave });
    }
  }

  private damageEnemy(enemy: EnemyEntity, amount: number, source?: PlayerEntity, knockback = 100): void {
    if (!enemy.alive) return;
    if (source) source.invisibleTime = 0;
    const buff = source && this.areas.some((area) => area.kind === "totem" && area.owner === source.playerData.index
      && Phaser.Math.Distance.Between(source.x, source.y, area.x, area.y) < area.radius) ? 1.3 : 1;
    const defeated = enemy.takeDamage(amount * buff);
    const angle = source ? Phaser.Math.Angle.Between(source.x, source.y, enemy.x, enemy.y) : 0;
    enemy.body.setVelocity(enemy.body.velocity.x + Math.cos(angle) * knockback, enemy.body.velocity.y + Math.sin(angle) * knockback);
    this.emitParticles(enemy.x, enemy.y, ENEMY_CONFIG[enemy.type].color, 4);
    if (!defeated) return;
    const { x, y, type } = enemy;
    this.enemies.splice(this.enemies.indexOf(enemy), 1);
    enemy.destroy();
    if (enemy === this.objectiveEnemy) this.completeObjective();
    if (type === "splitter") {
      for (let i = 0; i < 2; i += 1) {
        const child = new EnemyEntity(this, x + (i ? 18 : -18), y, "chaser", this.wave);
        child.health = Math.ceil(child.health * 0.55);
        this.enemies.push(child);
      }
    }
  }

  private damageEnemiesNear(x: number, y: number, radius: number, damage: number, knockback: number, source?: PlayerEntity): void {
    this.enemies.forEach((enemy) => {
      const distance = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
      if (distance > radius) return;
      const amount = damage * (1 - distance / radius * 0.45);
      this.damageEnemy(enemy, amount, source, knockback);
    });
  }

  private burst(source: PlayerEntity, radius: number, damage: number, knockback: number, color: number): void {
    this.damageEnemiesNear(source.x, source.y, radius, damage, knockback, source);
    this.addExpandingRing(source.x, source.y, radius, color, 0.38);
    this.emitParticles(source.x, source.y, color, 20);
  }

  private addArea(
    kind: AreaKind,
    owner: number,
    x: number,
    y: number,
    radius: number,
    duration: number,
    strength = 1,
    angle = 0,
  ): AreaEntity {
    const area = new AreaEntity(this, x, y, kind, owner, radius, duration, strength, 0, angle);
    area.setDepth(-1);
    this.areas.push(area);
    return area;
  }

  private addExpandingRing(x: number, y: number, radius: number, color: number, lifetime: number): void {
    this.weaponEffects.push(new ExpandingRingEntity(this, x, y, radius, color, lifetime));
  }

  private removeArea(area: AreaEntity): void {
    const index = this.areas.indexOf(area);
    if (index >= 0) this.areas.splice(index, 1);
    area.destroy();
  }

  private addProjectile(x: number, y: number, directionX: number, directionY: number, distance: number, color: number, lifetime: number): void {
    const length = Math.max(0.001, Math.hypot(directionX, directionY));
    const projectile = new ProjectileEntity(this, x, y, directionX / length, directionY / length, distance, color, lifetime);
    this.projectiles.push(projectile);
  }

  private emitParticles(x: number, y: number, color: number, count: number): void {
    for (let i = 0; i < count; i += 1) {
      this.particles.push(new ParticleEntity(this, x, y, color, Phaser.Math.Between(30, 180), Math.random() * Math.PI * 2, 0.34));
    }
  }

  private updateHud(): void {
    const playerStatus = this.players.map((player) =>
      `P${player.playerData.index + 1} ${Math.ceil(player.health)}HP +${Math.ceil(player.overshield)}  SUPER ${Math.floor(player.superCharge)}%`).join("\n");
    const objective = this.objective ? `\n${this.objective.toUpperCase()} ${Math.ceil(this.objectiveTimer)}s` : "";
    this.hud.setText(`WAVE ${String(this.wave).padStart(2, "0")}  ·  ENEMIES ${this.enemies.length}${objective}\n${playerStatus}`);
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
    this.wave = 0;
    this.objective = null;
    this.objectiveTimer = 0;
    this.checkpointIndex = 0;
    this.spawnRemaining = 0;
    this.spawnTimer = 0;
    this.breakTimer = 0;
    this.objectiveEnemy = null;
    this.gameOver = false;
  }

  private onShutdown(): void {
    document.removeEventListener("keydown", this.onKeyDown);
    document.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.clearKeys);
    this.physics.world.off("worldstep", this.fixedUpdate, this);
    this.clearRun();
  }
}
