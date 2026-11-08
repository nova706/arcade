import { BaseGame, PhysicsWorld } from "../../engine";
import { AreaObject } from "./entities/AreaObject";
import { ENEMY_CONFIG, EnemyObject } from "./entities/EnemyObject";
import { ParticleObject } from "./entities/ParticleObject";
import { PlayerObject } from "./entities/PlayerObject";
import { ProjectileObject } from "./entities/ProjectileObject";
import { EventBus, type GameEvents } from "./events/EventBus";
import type { PhysicsBody } from "../../engine";
import type { EnemyType, GameSetup, GameState, ObjectiveType } from "./types";

const SUPER_CHARGE_SECONDS = 34;
const ENEMY_TYPES: EnemyType[] = ["chaser", "charger", "ranger", "splitter", "tank", "flanker"];

export interface PlayerCommand {
  moveX: number;
  moveY: number;
  aimX: number;
  aimY: number;
  fire: boolean;
  useSuper: boolean;
  useMinor: boolean;
}

export class NeonVectorGame extends BaseGame<GameState, GameSetup> {
  readonly events: GameEvents = new EventBus();
  private readonly physics = new PhysicsWorld({ x: 0, y: 0, scale: 0 });
  private arenaBodies: PhysicsBody[] = [];
  private objectiveEnemyId: string | null = null;
  private sequence = 0;

  start(setup: GameSetup): void {
    if (setup.players.length < 1 || setup.players.length > 4) {
      throw new RangeError("Neon Vector requires between one and four player loadouts.");
    }
    if (!Number.isFinite(setup.width) || setup.width <= 0 || !Number.isFinite(setup.height) || setup.height <= 0) {
      throw new RangeError("Neon Vector requires positive finite arena dimensions.");
    }
    this.stop();
    const width = setup.width;
    const height = setup.height;
    this.sequence = 0;
    this.arenaBodies = [];
    this.objectiveEnemyId = null;
    const players = setup.players.map((loadout, index) => {
      const angle = -Math.PI / 2 + Math.PI * 2 * index / setup.players.length;
      return new PlayerObject(
        this.id("player"),
        index,
        ["#55f6ff", "#ff58d4", "#c5ff57", "#ffc857"][index],
        loadout,
        this.physics,
        { x: width / 2 + Math.cos(angle) * 55, y: height / 2 + Math.sin(angle) * 55, radius: 14 },
      );
    });
    this.arenaBodies = [
      this.physics.createRectangle(width / 2, -8, width + 60, 16, { isStatic: true, label: "arena-top" }),
      this.physics.createRectangle(width / 2, height + 8, width + 60, 16, { isStatic: true, label: "arena-bottom" }),
      this.physics.createRectangle(-8, height / 2, 16, height + 60, { isStatic: true, label: "arena-left" }),
      this.physics.createRectangle(width + 8, height / 2, 16, height + 60, { isStatic: true, label: "arena-right" }),
    ];
    this.state = {
      width,
      height,
      players,
      enemies: [],
      areas: [],
      projectiles: [],
      particles: [],
      wave: {
        wave: 0,
        objective: null,
        objectiveTime: 0,
        objectiveIndex: 0,
        objectiveProgress: 0,
        remainingToSpawn: 0,
        spawnTimer: 0,
        breakTime: 0,
        bossSpawned: false,
      },
      gameOver: false,
      elapsed: 0,
      nextObjectId: 1,
    };
    this.beginWave();
  }

  update(deltaSeconds: number): void {
    const state = this.state;
    if (!state || state.gameOver) return;
    const delta = Math.min(Math.max(deltaSeconds, 0), 0.05);
    state.elapsed += delta;
    this.physics.step(delta);
    this.updatePlayers(delta);
    this.updateEnemies(delta);
    this.updateAreas(delta);
    this.updateProjectiles(delta);
    this.updateParticles(delta);
    this.updateWave(delta);
    this.cleanup();
  }

  command(playerIndex: number, command: PlayerCommand): void {
    const state = this.state;
    const player = state?.players[playerIndex];
    if (!state || !player?.alive || state.gameOver) return;
    const moveLength = Math.hypot(command.moveX, command.moveY);
    const moveScale = moveLength > 1 ? 1 / moveLength : 1;
    const inBubble = this.playerInArea(player, "bubble");
    player.setVelocity(
      command.moveX * moveScale * 225,
      command.moveY * moveScale * 225,
    );
    if (Math.hypot(command.aimX, command.aimY) > 0.18) {
      player.attackAngle = Math.atan2(command.aimY, command.aimX);
    } else if (moveLength > 0.15) {
      player.attackAngle = Math.atan2(command.moveY, command.moveX);
    }

    if (command.useSuper) this.useSuper(player);
    if (command.useMinor) this.useMinor(player);
    if (command.fire && !inBubble) this.fireWeapon(player);
    if (inBubble) {
      player.heal(4 / 60);
      player.overshield = Math.min(42, player.overshield + 5 / 60);
    }
  }

  resize(width: number, height: number): void {
    const state = this.state;
    if (!state || width <= 0 || height <= 0) return;
    const scaleX = width / state.width;
    const scaleY = height / state.height;
    state.players.forEach((player) => this.scaleObject(player, scaleX, scaleY));
    state.enemies.forEach((enemy) => this.scaleObject(enemy, scaleX, scaleY));
    this.arenaBodies.forEach((body) => {
      const position = this.physics.getPosition(body);
      this.physics.scale(body, scaleX, scaleY);
      this.physics.setPosition(body, { x: position.x * scaleX, y: position.y * scaleY });
    });
    state.areas.forEach((area) => {
      area.x *= scaleX;
      area.y *= scaleY;
      area.radius *= Math.min(scaleX, scaleY);
    });
    state.projectiles.forEach((projectile) => {
      projectile.x *= scaleX;
      projectile.y *= scaleY;
    });
    state.particles.forEach((particle) => {
      particle.x *= scaleX;
      particle.y *= scaleY;
    });
    state.width = width;
    state.height = height;
  }

  stop(): void {
    this.state?.players.forEach((object) => object.destroy());
    this.state?.enemies.forEach((object) => object.destroy());
    this.physics.clear();
    this.arenaBodies = [];
    this.events.clear();
    this.state = null;
    this.objectiveEnemyId = null;
  }

  private id(prefix: string): string {
    return `${prefix}-${++this.sequence}`;
  }

  private scaleObject(object: PlayerObject | EnemyObject, scaleX: number, scaleY: number): void {
    object.scale(scaleX, scaleY);
    object.setPosition(object.x * scaleX, object.y * scaleY);
  }

  private fireWeapon(player: PlayerObject): void {
    if (player.weaponCooldown > 0 || player.loadout.weapon === "orbit") return;
    const empowered = player.attackBoost > 0 ? 1.35 : 1;
    const x = player.x + Math.cos(player.attackAngle) * 22;
    const y = player.y + Math.sin(player.attackAngle) * 22;
    if (player.loadout.weapon === "shockwave") {
      player.weaponCooldown = 1.15;
      this.burst(player, 94, 92 * empowered, 310, player.color);
    } else if (player.loadout.weapon === "beam") {
      player.weaponCooldown = 0.52;
      this.spawnProjectile("beam", player, x, y, Math.cos(player.attackAngle), Math.sin(player.attackAngle), 920, 94 * empowered, 0.52, 0);
    } else {
      player.weaponCooldown = 0.68;
      this.spawnProjectile("chain", player, x, y, Math.cos(player.attackAngle), Math.sin(player.attackAngle), 470, 43 * empowered, 0.55, 4);
    }
  }

  private useSuper(player: PlayerObject): void {
    if (player.superCharge < 100) return;
    player.superCharge = 0;
    this.events.emit("super-used", { player, ability: player.loadout.super });
    if (player.loadout.super === "bubble") {
      this.addArea("bubble", player.index, player.x, player.y, 126, 8, 1);
    } else if (player.loadout.super === "totem") {
      this.addArea("totem", player.index, player.x, player.y, 152, 12, 1);
    } else if (player.loadout.super === "tether") {
      this.addArea("tether", player.index, player.x, player.y, 205, 5, 1);
    } else {
      this.burst(player, 270, 360, 460, "#fff3a1");
    }
  }

  private useMinor(player: PlayerObject): void {
    if (player.minorCooldown > 0) return;
    const ability = player.loadout.minor;
    if (ability === "mine") {
      player.minorCooldown = 5;
      this.addArea("mine", player.index, player.x, player.y, 28, 16, 95);
    } else if (ability === "teleport") {
      player.minorCooldown = 4;
      const length = Math.hypot(player.velocity.x, player.velocity.y);
      const dx = length > 2 ? player.velocity.x / length : Math.cos(player.attackAngle);
      const dy = length > 2 ? player.velocity.y / length : Math.sin(player.attackAngle);
      player.setPosition(
        Math.max(25, Math.min(this.state!.width - 25, player.x + dx * 145)),
        Math.max(25, Math.min(this.state!.height - 25, player.y + dy * 145)),
      );
      player.invulnerable = Math.max(player.invulnerable, 0.32);
      this.emitParticles(player.x, player.y, player.color, 16);
    } else if (ability === "invisibility") {
      player.minorCooldown = 8;
      player.invisible = 3.2;
    } else {
      player.minorCooldown = 7;
      this.addArea("barrier", player.index, player.x + Math.cos(player.attackAngle) * 60, player.y + Math.sin(player.attackAngle) * 60, 48, 7, 1);
    }
    this.events.emit("minor-used", { player, ability });
  }

  private updatePlayers(delta: number): void {
    const state = this.state!;
    state.players.forEach((player) => {
      if (!player.alive) return;
      player.weaponCooldown = Math.max(0, player.weaponCooldown - delta);
      player.invulnerable = Math.max(0, player.invulnerable - delta);
      player.invisible = Math.max(0, player.invisible - delta);
      player.attackBoost = Math.max(0, player.attackBoost - delta);
      player.minorCooldown = Math.max(0, player.minorCooldown - delta);
      player.superCharge = Math.min(100, player.superCharge + 100 / SUPER_CHARGE_SECONDS * delta);
      const velocity = player.velocity;
      if (Math.hypot(velocity.x, velocity.y) > 5) {
        this.emitParticles(player.x, player.y, `${player.color}88`, 1, 0.12);
      }
      if (player.loadout.weapon === "orbit" && !this.playerInArea(player, "bubble")) {
        player.weaponCooldown -= delta;
        if (player.weaponCooldown <= -0.22) {
          player.weaponCooldown = 0;
          const angle = state.elapsed * 6 + player.index;
          const x = player.x + Math.cos(angle) * 38;
          const y = player.y + Math.sin(angle) * 38;
          this.damageEnemiesNear(x, y, 25, 30, 95, player);
        }
      }
    });
  }

  private updateEnemies(delta: number): void {
    const state = this.state!;
    for (const enemy of state.enemies) {
      if (!enemy.alive) continue;
      enemy.attackCooldown = Math.max(0, enemy.attackCooldown - delta);
      enemy.telegraph = Math.max(0, enemy.telegraph - delta);
      enemy.slowedDefense = Math.max(0, enemy.slowedDefense - delta);
      const target = this.targetPlayer(enemy);
      if (!target) continue;
      const dx = target.x - enemy.x;
      const dy = target.y - enemy.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const directionX = dx / distance;
      const directionY = dy / distance;
      let speed = enemy.speed;

      if (enemy.type === "ranger") {
        if (distance < 250) {
          enemy.setVelocity(-directionX * speed, -directionY * speed);
        } else if (distance > 360) {
          enemy.setVelocity(directionX * speed * 0.7, directionY * speed * 0.7);
        } else {
          enemy.setVelocity(-directionY * speed * 0.35, directionX * speed * 0.35);
        }
        if (distance < 540 && enemy.attackCooldown <= 0) {
          enemy.attackCooldown = 1.5;
          this.spawnProjectile("beam", enemy, enemy.x, enemy.y, directionX, directionY, 340, enemy.damage * 0.7, 1.5, 0);
        }
      } else {
        if (enemy.type === "charger") {
          if (enemy.telegraph <= 0 && distance < 390) {
            enemy.telegraph = 0.75;
            speed *= 2.8;
          } else if (enemy.telegraph > 0.3) {
            speed *= 0.2;
          }
        }
        if (enemy.type === "boss") speed *= 0.8;
        const bubble = state.areas.find((area) => area.kind === "bubble"
          && Math.hypot(enemy.x - area.x, enemy.y - area.y) < area.radius + ENEMY_CONFIG[enemy.type].radius);
        const barrier = state.areas.find((area) => area.kind === "barrier"
          && Math.hypot(enemy.x - area.x, enemy.y - area.y) < area.radius + ENEMY_CONFIG[enemy.type].radius);
        const repulsor = bubble ?? barrier;
        if (repulsor) {
          const awayX = enemy.x - repulsor.x;
          const awayY = enemy.y - repulsor.y;
          const awayLength = Math.max(1, Math.hypot(awayX, awayY));
          enemy.setVelocity(awayX / awayLength * speed * 1.8, awayY / awayLength * speed * 1.8);
        } else if (enemy.type === "flanker") {
          enemy.setVelocity(directionX * speed + directionY * 26, directionY * speed - directionX * 26);
        } else {
          enemy.setVelocity(directionX * speed, directionY * speed);
        }
      }
      if (distance < (enemy.type === "boss" ? 56 : 30) && enemy.attackCooldown <= 0) {
        enemy.attackCooldown = enemy.type === "boss" ? 1.4 : 0.95;
        const actual = target.damage(enemy.damage);
        if (actual > 0) {
          const knockback = enemy.type === "charger" || enemy.type === "boss" ? 390 : 210;
          target.setVelocity(directionX * knockback, directionY * knockback);
          target.invisible = 0;
          target.invulnerable = 0.55;
          this.events.emit("player-damaged", { player: target, amount: actual });
          this.emitParticles(target.x, target.y, "#ff426b", 9);
        }
      }
      if (enemy.telegraph > 0.45) {
        enemy.setVelocity(0, 0);
      }
    }
  }

  private updateAreas(delta: number): void {
    const state = this.state!;
    for (const area of state.areas) {
      area.duration -= delta;
      if (area.kind === "mine" && state.enemies.some((enemy) => Math.hypot(enemy.x - area.x, enemy.y - area.y) < 70)) {
        this.damageEnemiesNear(area.x, area.y, 120, area.strength, 300, state.players[area.owner]);
        area.duration = 0;
      } else if (area.kind === "tether") {
        state.enemies.forEach((enemy) => {
          if (Math.hypot(enemy.x - area.x, enemy.y - area.y) > area.radius) return;
          enemy.slowedDefense = 0.15;
          const dx = area.x - enemy.x;
          const dy = area.y - enemy.y;
          const length = Math.max(1, Math.hypot(dx, dy));
          const speed = enemy.velocity;
          enemy.setVelocity(speed.x + dx / length * 72, speed.y + dy / length * 72);
        });
      } else if (area.kind === "totem" || area.kind === "bubble") {
        state.players.forEach((player) => {
          if (player.alive && Math.hypot(player.x - area.x, player.y - area.y) < area.radius) {
            player.heal((area.kind === "totem" ? 8 : 3) * delta);
            if (area.kind === "totem") player.attackBoost = 0.15;
          }
        });
      } else if (area.kind === "blackhole") {
        state.players.forEach((player) => {
          if (!player.alive) return;
          const dx = area.x - player.x;
          const dy = area.y - player.y;
          const distance = Math.max(30, Math.hypot(dx, dy));
          if (distance < 410) {
            const velocity = player.velocity;
            player.setVelocity(velocity.x + dx / distance * 48, velocity.y + dy / distance * 48);
          }
          if (distance < 58 && player.invulnerable <= 0) {
            const damage = player.damage(13);
            this.events.emit("player-damaged", { player, amount: damage });
          }
        });
      } else if (area.kind === "capture" && !area.activated) {
        const playerInside = state.players.some((player) =>
          player.alive && Math.hypot(player.x - area.x, player.y - area.y) < area.radius);
        const enemyContested = state.enemies.some((enemy) =>
          Math.hypot(enemy.x - area.x, enemy.y - area.y) < area.radius + 22);
        if (playerInside && !enemyContested) area.progress = (area.progress ?? 0) + delta;
        if ((area.progress ?? 0) >= 3.2) {
          area.activated = true;
          area.duration = 0;
          this.objectiveDone("capture");
        }
      } else if (area.kind === "checkpoint" && !area.activated) {
        const playerInside = state.players.some((player) =>
          player.alive && Math.hypot(player.x - area.x, player.y - area.y) < area.radius);
        if (playerInside) {
          area.activated = true;
          area.duration = 0;
          if (area.targetIndex === state.wave.objectiveIndex) {
            state.wave.objectiveIndex += 1;
            if (state.wave.objectiveIndex >= 3) this.objectiveDone("checkpoints");
          }
        }
      }
      if (area.duration <= 0 && area.kind !== "checkpoint") area.destroy();
    }
  }

  private updateProjectiles(delta: number): void {
    const state = this.state!;
    for (const projectile of state.projectiles) {
      projectile.lifetime -= delta;
      if (projectile.kind === "mine") continue;
      projectile.x += projectile.directionX * projectile.speed * delta;
      projectile.y += projectile.directionY * projectile.speed * delta;
      if (projectile.kind === "beam") {
        if (projectile.owner < 0) {
          const player = state.players.find((candidate) =>
            candidate.alive && !this.playerInArea(candidate, "bubble")
            && !projectile.hitIds.has(candidate.id)
            && pointSegmentDistance(candidate.x, candidate.y, projectile.originX, projectile.originY, projectile.x, projectile.y) < 20);
          if (player) {
            projectile.hitIds.add(player.id);
            const damage = player.damage(projectile.damage);
            if (damage > 0) {
              this.events.emit("player-damaged", { player, amount: damage });
              this.emitParticles(player.x, player.y, "#bd72ff", 8);
            }
          }
        } else {
          const player = state.players[projectile.owner];
          const enemy = state.enemies.find((candidate) =>
            !projectile.hitIds.has(candidate.id)
            && pointSegmentDistance(candidate.x, candidate.y, player?.x ?? projectile.originX, player?.y ?? projectile.originY, projectile.x, projectile.y) < 22);
          if (enemy) {
            projectile.hitIds.add(enemy.id);
            this.hitEnemy(enemy, projectile.damage, player, 18);
          }
        }
      } else {
        const enemy = state.enemies.find((candidate) =>
          !projectile.hitIds.has(candidate.id)
          && Math.hypot(candidate.x - projectile.x, candidate.y - projectile.y) < ENEMY_CONFIG[candidate.type].radius + 12);
        if (enemy) {
          const owner = state.players[projectile.owner];
          this.hitEnemy(enemy, projectile.damage, owner, 62);
          projectile.hitIds.add(enemy.id);
          if (projectile.chainsRemaining > 0) {
            const next = state.enemies.find((candidate) =>
              !projectile.hitIds.has(candidate.id) && Math.hypot(candidate.x - enemy.x, candidate.y - enemy.y) < 155);
            if (next) {
              projectile.x = enemy.x;
              projectile.y = enemy.y;
              projectile.directionX = (next.x - enemy.x) / Math.max(1, Math.hypot(next.x - enemy.x, next.y - enemy.y));
              projectile.directionY = (next.y - enemy.y) / Math.max(1, Math.hypot(next.x - enemy.x, next.y - enemy.y));
              projectile.chainsRemaining -= 1;
              projectile.speed = 690;
            } else projectile.lifetime = 0;
          } else projectile.lifetime = 0;
        }
      }
      if (projectile.x < -40 || projectile.x > state.width + 40 || projectile.y < -40 || projectile.y > state.height + 40) projectile.lifetime = 0;
      if (projectile.lifetime <= 0) projectile.destroy();
    }
  }

  private updateParticles(delta: number): void {
    this.state!.particles.forEach((particle) => {
      particle.lifetime -= delta;
      particle.x += particle.velocityX * delta;
      particle.y += particle.velocityY * delta;
      particle.velocityX *= 0.96;
      particle.velocityY *= 0.96;
      if (particle.lifetime <= 0) particle.destroy();
    });
  }

  private updateWave(delta: number): void {
    const state = this.state!;
    const wave = state.wave;
    if (wave.wave === 0) return;
    if (wave.remainingToSpawn > 0) {
      wave.spawnTimer -= delta;
      if (wave.spawnTimer <= 0) {
        this.spawnEnemy(this.chooseEnemyType());
        wave.remainingToSpawn -= 1;
        wave.spawnTimer = Math.max(0.18, 0.86 - wave.wave * 0.012);
      }
    }
    if (!wave.bossSpawned && wave.wave % 20 === 0) {
      this.spawnEnemy("boss");
      wave.bossSpawned = true;
    }
    if (wave.objective && wave.objective !== "tank" && !this.objectiveComplete()) {
      wave.objectiveTime -= delta;
      if (wave.objectiveTime <= 0) this.failObjective();
    }
    const hasObjectiveEnemies = wave.objective === "tank" && this.objectiveEnemyId !== null;
    if (wave.remainingToSpawn === 0 && state.enemies.length === 0 && !hasObjectiveEnemies && this.objectiveComplete()) {
      wave.breakTime += delta;
      if (wave.breakTime >= 2.5) this.beginWave();
    }
  }

  private beginWave(): void {
    const state = this.state!;
    const wave = state.wave;
    wave.wave += 1;
    wave.remainingToSpawn = 5 + wave.wave * 2;
    wave.spawnTimer = 0.25;
    wave.breakTime = 0;
    wave.bossSpawned = false;
    wave.objective = wave.wave % 5 === 0 ? (["capture", "checkpoints", "tank"] as const)[Math.floor(wave.wave / 5 - 1) % 3] : null;
    wave.objectiveIndex = 0;
    wave.objectiveProgress = 0;
    wave.objectiveTime = 35;
    this.objectiveEnemyId = null;
    this.events.emit("wave-started", { wave: wave.wave });
    if (wave.objective === "capture") {
      const x = state.width * (0.25 + Math.random() * 0.5);
      const y = state.height * (0.25 + Math.random() * 0.5);
      this.addArea("capture", -1, x, y, 76, 35, 0);
      this.events.emit("objective-started", { objective: "capture" });
    } else if (wave.objective === "checkpoints") {
      for (let index = 0; index < 3; index += 1) {
        this.addArea("checkpoint", -1,
          state.width * (0.2 + index * 0.3),
          state.height * (index % 2 === 0 ? 0.28 : 0.72),
          43, 35, 0, index);
      }
      this.events.emit("objective-started", { objective: "checkpoints" });
    } else if (wave.objective === "tank") {
      this.objectiveEnemyId = this.spawnEnemy("tank", true).id;
      this.events.emit("objective-started", { objective: "tank" });
    }
  }

  private spawnEnemy(type: EnemyType, objectiveEnemy = false): EnemyObject {
    const state = this.state!;
    const edge = Math.floor(Math.random() * 4);
    const position = edge === 0 ? { x: Math.random() * state.width, y: -25 }
      : edge === 1 ? { x: state.width + 25, y: Math.random() * state.height }
        : edge === 2 ? { x: Math.random() * state.width, y: state.height + 25 }
          : { x: -25, y: Math.random() * state.height };
    const enemy = new EnemyObject(this.id(type), type, this.physics, { ...position, radius: ENEMY_CONFIG[type].radius }, Math.min(1 + state.wave.wave * 0.045, 2.5));
    state.enemies.push(enemy);
    if (objectiveEnemy) this.objectiveEnemyId = enemy.id;
    return enemy;
  }

  private chooseEnemyType(): EnemyType {
    const count = Math.min(ENEMY_TYPES.length, 2 + Math.floor(this.state!.wave.wave / 2));
    return ENEMY_TYPES[Math.floor(Math.random() * count)];
  }

  private targetPlayer(enemy: EnemyObject): PlayerObject | undefined {
    const players = this.state!.players.filter((player) => player.alive && player.invisible <= 0);
    return players.sort((left, right) =>
      Math.hypot(left.x - enemy.x, left.y - enemy.y) - Math.hypot(right.x - enemy.x, right.y - enemy.y))[0];
  }

  private hitEnemy(enemy: EnemyObject, damage: number, player: PlayerObject | undefined, knockback: number): void {
    if (!enemy.alive) return;
    const boostedDamage = damage * (player?.attackBoost ? 1.4 : 1);
    const actual = enemy.takeDamage(boostedDamage);
    if (player) player.invisible = 0;
    this.events.emit("enemy-damaged", { enemy, amount: actual, x: enemy.x, y: enemy.y, color: ENEMY_CONFIG[enemy.type].color });
    this.emitParticles(enemy.x, enemy.y, ENEMY_CONFIG[enemy.type].color, 4);
    const dx = enemy.x - (player?.x ?? enemy.x - 1);
    const dy = enemy.y - (player?.y ?? enemy.y);
    const length = Math.max(1, Math.hypot(dx, dy));
    const velocity = enemy.velocity;
    enemy.setVelocity(velocity.x + dx / length * knockback, velocity.y + dy / length * knockback);
    if (!enemy.alive) {
      this.events.emit("enemy-defeated", { enemy, x: enemy.x, y: enemy.y });
      this.emitParticles(enemy.x, enemy.y, ENEMY_CONFIG[enemy.type].color, enemy.type === "boss" ? 48 : 13);
      if (enemy.id === this.objectiveEnemyId) this.objectiveDone("tank");
      enemy.destroy();
      if (enemy.type === "splitter") {
        this.spawnEnemy("chaser");
        this.spawnEnemy("chaser");
      }
    }
  }

  private burst(player: PlayerObject, radius: number, damage: number, knockback: number, color: string): void {
    this.state!.enemies.forEach((enemy) => {
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const distance = Math.hypot(dx, dy);
      if (distance > radius) return;
      this.hitEnemy(enemy, damage * (1 - distance / (radius * 1.8)), player, knockback * (1 - distance / radius));
    });
    this.emitParticles(player.x, player.y, color, 38);
  }

  private damageEnemiesNear(x: number, y: number, radius: number, damage: number, knockback: number, player: PlayerObject | undefined): void {
    this.state!.enemies.forEach((enemy) => {
      const dx = enemy.x - x;
      const dy = enemy.y - y;
      const distance = Math.hypot(dx, dy);
      if (distance > radius) return;
      const actual = enemy.takeDamage(damage * Math.max(0.25, 1 - distance / (radius * 1.4)));
      this.events.emit("enemy-damaged", { enemy, amount: actual, x: enemy.x, y: enemy.y, color: ENEMY_CONFIG[enemy.type].color });
      const length = Math.max(1, distance);
      enemy.setVelocity(dx / length * knockback, dy / length * knockback);
      if (!enemy.alive) {
        this.events.emit("enemy-defeated", { enemy, x: enemy.x, y: enemy.y });
        this.emitParticles(enemy.x, enemy.y, ENEMY_CONFIG[enemy.type].color, 14);
        if (enemy.id === this.objectiveEnemyId) this.objectiveDone("tank");
        enemy.destroy();
        if (enemy.type === "splitter") {
          this.spawnEnemy("chaser");
          this.spawnEnemy("chaser");
        }
      }
    });
    if (player) player.invisible = 0;
    this.emitParticles(x, y, "#b8fbff", 22);
  }

  private addArea(
    kind: "bubble" | "totem" | "tether" | "barrier" | "blackhole" | "capture" | "checkpoint" | "mine",
    owner: number,
    x: number,
    y: number,
    radius: number,
    duration: number,
    strength: number,
    targetIndex?: number,
  ): void {
    this.state!.areas.push(new AreaObject(this.id(kind), kind, owner, x, y, radius, duration, strength, targetIndex));
  }

  private spawnProjectile(
    kind: "beam" | "chain",
    owner: PlayerObject | EnemyObject,
    x: number,
    y: number,
    directionX: number,
    directionY: number,
    speed: number,
    damage: number,
    lifetime: number,
    chainsRemaining: number,
  ): void {
    const ownerIndex = owner instanceof PlayerObject ? owner.index : -1;
    this.state!.projectiles.push(new ProjectileObject(
      this.id(kind), kind, ownerIndex, x, y, x, y, directionX, directionY, speed, damage, lifetime, chainsRemaining,
    ));
  }

  private emitParticles(x: number, y: number, color: string, count: number, lifetime = 0.48): void {
    for (let index = 0; index < count; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 25 + Math.random() * 190;
      this.state!.particles.push(new ParticleObject(
        this.id("particle"), x, y, color, lifetime + Math.random() * 0.24,
        Math.cos(angle) * speed, Math.sin(angle) * speed, 1.5 + Math.random() * 3,
      ));
    }
  }

  private playerInArea(player: PlayerObject, kind: "bubble"): boolean {
    return this.state!.areas.some((area) =>
      area.kind === kind && Math.hypot(player.x - area.x, player.y - area.y) < area.radius);
  }

  private objectiveComplete(): boolean {
    const state = this.state!;
    if (!state.wave.objective) return true;
    if (state.wave.objective === "capture") return !state.areas.some((area) => area.kind === "capture" && !area.activated);
    if (state.wave.objective === "checkpoints") return state.wave.objectiveIndex >= 3;
    return this.objectiveEnemyId === null;
  }

  private objectiveDone(objective: ObjectiveType): void {
    const wave = this.state!.wave;
    if (wave.objective !== objective) return;
    if (objective === "tank") this.objectiveEnemyId = null;
    wave.objectiveProgress = 1;
    this.events.emit("objective-completed", { objective });
  }

  private failObjective(): void {
    const state = this.state!;
    const objective = state.wave.objective;
    if (!objective) return;
    if (objective === "capture") {
      const capture = state.areas.find((area) => area.kind === "capture" && !area.activated);
      if (capture) {
        capture.destroy();
        this.addArea("blackhole", -1, capture.x, capture.y, 52, 16, 1);
      }
    } else if (objective === "checkpoints") {
      state.players.forEach((player) => {
        const damage = player.damage(38);
        this.events.emit("player-damaged", { player, amount: damage });
      });
      state.wave.objectiveTime = 20;
      return;
    }
    this.objectiveDone(objective);
  }

  private cleanup(): void {
    const state = this.state!;
    const destroy = <T extends { isDestroyed: boolean }>(items: T[]): T[] => items.filter((item) => !item.isDestroyed);
    state.players = state.players.filter((player) => !player.isDestroyed);
    state.enemies = destroy(state.enemies);
    state.areas = destroy(state.areas);
    state.projectiles = destroy(state.projectiles);
    state.particles = destroy(state.particles);
    if (state.players.every((player) => !player.alive) && !state.gameOver) {
      state.gameOver = true;
      this.events.emit("game-over", { wave: state.wave.wave });
    }
  }
}

function pointSegmentDistance(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
