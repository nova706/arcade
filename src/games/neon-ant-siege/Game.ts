import { PhysicsWorld, type PhysicsBody } from "../../engine";
import type { Ant, Difficulty, GameSetup, GameState, Platform, Player, Weapon } from "./types";

const PLAYER_COLORS = ["#55f6ff", "#ff58d4", "#c5ff57", "#ffc857"];
const WEAPONS: Weapon[] = ["sword", "axe", "shield", "sword"];
const DIFFICULTY_SCALE: Record<Difficulty, number> = { easy: 0.78, normal: 1, hard: 1.28 };
const PLAYER_WIDTH = 22;
const PLAYER_HEIGHT = 62;
const PLAYER_JUMP_SPEED = 800;
const ANT_GRAVITY = 850;

export class Game {
  state: GameState | null = null;
  private readonly physics = new PhysicsWorld();
  private playerBodies = new Map<number, PhysicsBody>();
  private platformBodies: PhysicsBody[] = [];

  start(setup: GameSetup, width: number, height: number): void {
    this.physics.clear();
    this.playerBodies.clear();
    this.platformBodies = [];
    const floorY = height - 46;
    const platforms: Platform[] = [{ x: 0, y: floorY, width, height: 46 }];
    const tiers = Math.max(2, Math.floor(height / 210));
    for (let tier = 0; tier < tiers; tier += 1) {
      const y = height - 190 - tier * Math.max(112, (height - 240) / tiers);
      const count = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < count; i += 1) {
        const platformWidth = 140 + Math.random() * Math.min(150, width * 0.16);
        const x = 35 + Math.random() * Math.max(1, width - platformWidth - 70);
        platforms.push({ x, y: Math.max(105, y + (Math.random() - 0.5) * 55), width: platformWidth, height: 12 });
      }
    }

    const players: Player[] = Array.from({ length: setup.players }, (_, id) => ({
      id,
      x: width * (id + 1) / (setup.players + 1),
      y: floorY - PLAYER_HEIGHT,
      velocityY: 0,
      health: 100,
      facing: id < setup.players / 2 ? 1 : -1,
      grounded: true,
      invulnerability: 0,
      attackCooldown: 0,
      attackTime: 0,
      walkTime: 0,
      weapon: WEAPONS[id],
      color: PLAYER_COLORS[id],
      active: true,
    }));
    this.platformBodies = platforms.map((platform) => this.physics.createRectangle(
      platform.x + platform.width / 2,
      platform.y + platform.height / 2,
      platform.width,
      platform.height,
      { isStatic: true, friction: 0.8, label: "platform" },
    ));
    this.platformBodies.push(
      this.physics.createRectangle(0, height / 2, 12, height, { isStatic: true, label: "left-wall" }),
      this.physics.createRectangle(width, height / 2, 12, height, { isStatic: true, label: "right-wall" }),
    );
    players.forEach((player) => {
      this.playerBodies.set(player.id, this.physics.createRectangle(
        player.x,
        player.y + PLAYER_HEIGHT / 2,
        PLAYER_WIDTH,
        PLAYER_HEIGHT,
        { friction: 0.7, frictionAir: 0.005, restitution: 0, label: `player-${player.id + 1}` },
      ));
    });

    this.state = {
      setup,
      width,
      height,
      wave: 1,
      players,
      ants: [],
      platforms,
      projectiles: [],
      spawnRemaining: 0,
      spawnTimer: 0,
      wavePause: 0,
      gameOver: false,
      nextAntId: 1,
    };
    this.beginWave();
  }

  resize(width: number, height: number): void {
    const state = this.state;
    if (!state) return;
    const scaleX = width / state.width;
    const scaleY = height / state.height;
    state.platforms = state.platforms.map((platform) => ({
      x: platform.x * scaleX,
      y: platform.y * scaleY,
      width: platform.width * scaleX,
      height: platform.height * scaleY,
    }));
    this.platformBodies.forEach((body) => {
      const position = this.physics.getPosition(body);
      this.physics.scale(body, scaleX, scaleY);
      this.physics.setPosition(body, { x: position.x * scaleX, y: position.y * scaleY });
    });
    state.players.forEach((player) => {
      player.x *= scaleX;
      player.y *= scaleY;
      const body = this.playerBodies.get(player.id);
      if (body) {
        const position = this.physics.getPosition(body);
        this.physics.scale(body, scaleX, scaleY);
        this.physics.setPosition(body, { x: position.x * scaleX, y: position.y * scaleY });
      }
    });
    state.ants.forEach((ant) => {
      ant.x *= scaleX;
      ant.y *= scaleY;
    });
    state.projectiles.forEach((projectile) => {
      projectile.x *= scaleX;
      projectile.y *= scaleY;
    });
    state.width = width;
    state.height = height;
  }

  movePlayer(playerId: number, direction: number): void {
    const player = this.state?.players[playerId];
    if (!player?.active) return;
    const movement = Math.max(-1, Math.min(1, direction));
    const body = this.playerBodies.get(playerId);
    if (!body) return;
    const velocity = this.physics.getVelocity(body);
    this.physics.setVelocity(body, { x: movement * 310, y: velocity.y });
    if (movement !== 0) {
      player.facing = movement < 0 ? -1 : 1;
      player.walkTime += 1 / 60;
    }
  }

  jump(playerId: number): void {
    const player = this.state?.players[playerId];
    if (!player?.active || !player.grounded) return;
    const body = this.playerBodies.get(playerId);
    if (!body) return;
    const velocity = this.physics.getVelocity(body);
    this.physics.setVelocity(body, { x: velocity.x, y: -PLAYER_JUMP_SPEED });
    player.velocityY = -PLAYER_JUMP_SPEED;
    player.grounded = false;
  }

  attack(playerId: number): void {
    const state = this.state;
    const player = state?.players[playerId];
    if (!state || !player?.active || player.attackCooldown > 0) return;
    player.attackCooldown = player.weapon === "axe" ? 0.72 : 0.48;
    player.attackTime = 0.24;
    if (player.weapon === "shield") {
      state.projectiles.push({
        x: player.x + player.facing * 20,
        y: player.y + 30,
        velocityX: player.facing * 540,
        owner: playerId,
        returning: false,
        hitAnts: new Set(),
      });
      return;
    }

    const reach = player.weapon === "axe" ? 76 : 58;
    const damage = player.weapon === "axe" ? 42 : 29;
    for (const ant of state.ants) {
      const inFront = (ant.x - player.x) * player.facing > -12 && Math.abs(ant.x - player.x) < reach;
      if (inFront && Math.abs(ant.y - player.y) < (ant.boss ? 65 : 48)) this.damageAnt(ant, damage);
    }
  }

  update(deltaSeconds: number): void {
    const state = this.state;
    if (!state || state.gameOver) return;
    const delta = Math.min(deltaSeconds, 0.05);
    this.physics.step(delta);
    this.updatePlayers(delta);
    this.updateAnts(delta);
    this.updateProjectiles(delta);
    this.updateWaves(delta);
  }

  stop(): void {
    this.physics.clear();
    this.playerBodies.clear();
    this.platformBodies = [];
    this.state = null;
  }

  private updatePlayers(delta: number): void {
    const state = this.state!;
    for (const player of state.players) {
      if (!player.active) continue;
      const body = this.playerBodies.get(player.id);
      if (!body) continue;
      const position = this.physics.getPosition(body);
      const velocity = this.physics.getVelocity(body);
      player.x = position.x;
      player.y = position.y - PLAYER_HEIGHT / 2;
      player.velocityY = velocity.y;
      player.attackCooldown = Math.max(0, player.attackCooldown - delta);
      player.attackTime = Math.max(0, player.attackTime - delta);
      player.invulnerability = Math.max(0, player.invulnerability - delta);
      const feet = player.y + PLAYER_HEIGHT;
      player.grounded = velocity.y >= -25 && state.platforms.some((platform) =>
        Math.abs(feet - platform.y) < 8
        && player.x + PLAYER_WIDTH / 2 > platform.x
        && player.x - PLAYER_WIDTH / 2 < platform.x + platform.width);
    }
  }

  private updateAnts(delta: number): void {
    const state = this.state!;
    for (const ant of state.ants) {
      ant.attackCooldown = Math.max(0, ant.attackCooldown - delta);
      const target = this.closestPlayer(ant);
      if (!target) continue;
      const dx = target.x - ant.x;
      const dy = target.y - ant.y;
      ant.facing = dx < 0 ? -1 : 1;
      ant.walkTime += delta * (ant.boss ? 2 : 5);

      const climbing = dy < -26;
      const previousBottom = ant.y + this.antHeight(ant);
      if (climbing) {
        const wallX = target.x < state.width / 2 ? 10 : state.width - 10;
        if (Math.abs(wallX - ant.x) > 5) {
          ant.x += Math.sign(wallX - ant.x) * ant.speed * delta;
          ant.velocityY += ANT_GRAVITY * delta;
          ant.y += ant.velocityY * delta;
          for (const platform of state.platforms) {
            const bottom = ant.y + this.antHeight(ant);
            if (ant.velocityY >= 0 && previousBottom <= platform.y && bottom >= platform.y
              && ant.x > platform.x - 8 && ant.x < platform.x + platform.width + 8) {
              ant.y = platform.y - this.antHeight(ant);
              ant.velocityY = 0;
            }
          }
        } else {
          ant.y -= Math.min(Math.abs(dy), ant.speed * 0.78 * delta);
          ant.velocityY = 0;
        }
      } else {
        ant.x += Math.sign(dx) * ant.speed * delta;
        ant.velocityY += ANT_GRAVITY * delta;
        ant.y += ant.velocityY * delta;
        for (const platform of state.platforms) {
          const bottom = ant.y + this.antHeight(ant);
          if (ant.velocityY >= 0 && previousBottom <= platform.y && bottom >= platform.y
            && ant.x > platform.x - 8 && ant.x < platform.x + platform.width + 8) {
            ant.y = platform.y - this.antHeight(ant);
            ant.velocityY = 0;
          }
        }
      }
      ant.x = Math.max(8, Math.min(state.width - 8, ant.x));
      if (Math.abs(dx) < (ant.boss ? 52 : 34) && Math.abs(dy) < (ant.boss ? 62 : 40) && ant.attackCooldown <= 0) {
        this.hurtPlayer(target, ant.damage);
        ant.attackCooldown = ant.boss ? 1.45 : 1.1;
      }
    }
  }

  private updateProjectiles(delta: number): void {
    const state = this.state!;
    state.projectiles = state.projectiles.filter((projectile) => {
      const owner = state.players[projectile.owner];
      if (!owner?.active) return false;
      if (projectile.returning) {
        const dx = owner.x - projectile.x;
        projectile.x += Math.sign(dx) * 640 * delta;
        projectile.y += (owner.y + 30 - projectile.y) * Math.min(1, delta * 7);
        return Math.abs(dx) > 20;
      }
      projectile.x += projectile.velocityX * delta;
      if (projectile.x < 10 || projectile.x > state.width - 10) projectile.returning = true;
      for (const ant of state.ants) {
        if (!projectile.hitAnts.has(ant.id) && Math.abs(ant.x - projectile.x) < (ant.boss ? 34 : 24)
          && Math.abs(ant.y + this.antHeight(ant) / 2 - projectile.y) < (ant.boss ? 42 : 25)) {
          this.damageAnt(ant, 24);
          projectile.hitAnts.add(ant.id);
          projectile.returning = true;
        }
      }
      return true;
    });
  }

  private updateWaves(delta: number): void {
    const state = this.state!;
    if (state.spawnRemaining > 0) {
      state.spawnTimer -= delta;
      if (state.spawnTimer <= 0) {
        this.spawnAnt(state.wave % 5 === 0);
        state.spawnRemaining -= 1;
        state.spawnTimer = state.wave % 5 === 0 ? 99 : 0.62;
      }
      return;
    }
    if (state.ants.length === 0) {
      state.wavePause += delta;
      if (state.wavePause >= 2.1) {
        state.wave += 1;
        state.wavePause = 0;
        this.beginWave();
      }
    }
  }

  private beginWave(): void {
    const state = this.state!;
    state.spawnRemaining = state.wave % 5 === 0 ? 1 : 3 + Math.floor(state.wave / 2);
    state.spawnTimer = 0;
  }

  private spawnAnt(boss: boolean): void {
    const state = this.state!;
    const scale = DIFFICULTY_SCALE[state.setup.difficulty];
    const waveGrowth = 1 + (state.wave - 1) * 0.055;
    const height = boss ? PLAYER_HEIGHT : 30;
    const x = Math.random() < 0.5 ? 20 : state.width - 20;
    state.ants.push({
      id: state.nextAntId++,
      x,
      y: state.height - 46 - height,
      velocityY: 0,
      health: (boss ? 430 : 48) * waveGrowth * scale,
      maxHealth: (boss ? 430 : 48) * waveGrowth * scale,
      speed: (boss ? 52 : 68) * (1 + (state.wave - 1) * 0.025) * scale,
      damage: (boss ? 27 : 8) * (1 + (state.wave - 1) * 0.07) * scale,
      boss,
      attackCooldown: 0.5,
      facing: x < state.width / 2 ? 1 : -1,
      walkTime: 0,
    });
  }

  private closestPlayer(ant: Ant): Player | undefined {
    const players = this.state!.players.filter((player) => player.active);
    return players.sort((left, right) => Math.hypot(left.x - ant.x, left.y - ant.y)
      - Math.hypot(right.x - ant.x, right.y - ant.y))[0];
  }

  private damageAnt(ant: Ant, damage: number): void {
    ant.health -= damage;
    if (ant.health <= 0) this.state!.ants = this.state!.ants.filter((candidate) => candidate !== ant);
  }

  private hurtPlayer(player: Player, damage: number): void {
    if (!player.active || player.invulnerability > 0) return;
    player.health = Math.max(0, player.health - damage);
    player.invulnerability = 0.72;
    if (player.health === 0) {
      player.active = false;
      if (this.state!.players.every((candidate) => !candidate.active)) this.state!.gameOver = true;
    }
  }

  private antHeight(ant: Ant): number {
    return ant.boss ? PLAYER_HEIGHT : 30;
  }
}
