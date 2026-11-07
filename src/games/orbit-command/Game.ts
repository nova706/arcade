import { createTowers } from "./level";
import { BaseGame } from "../../engine";
import type { Faction, GameMode, MatchSetup, MatchState, MatchStyle, Tower } from "./types";

export const FACTION_COLORS = ["#44dfcf", "#f25c75", "#f3bd55", "#9d83ff", "#64a8ff", "#ff8c52", "#b8dd62", "#ef77d5"];
const BASE_MAX_UNITS = 80;
const INCOME_INTERVAL = 1;
const PRODUCTION_INTERVAL = 3.5;
const WAVE_INTERVAL = 22;
const SURVIVAL_WAVES = 5;

export function defaultSetup(): MatchSetup {
  return { mode: "conquest", style: "teams", humanPlayers: 1 };
}

export class Game extends BaseGame<MatchState, MatchSetup> {
  private incomeClock = 0;
  private productionClock = 0;
  private botClocks = new Map<number, number>();
  private nextMarchId = 1;
  private messageClock = 0;

  override start(setup: MatchSetup): void {
    const factions = this.createFactions(setup);
    const towers = createTowers();
    const starts = setup.style === "teams" ? [0, 1, 5, 9, 4, 3, 8, 11] : [0, 4, 9, 11];
    starts.forEach((towerId, i) => {
      const owner = i;
      towers[towerId].owner = owner;
      towers[towerId].units = 90;
      towers[towerId].defenseLevel = 3;
    });

    this.state = {
      setup: { ...setup },
      factions,
      towers,
      marches: [],
      routeOrders: [],
      elapsed: 0,
      wave: 0,
      waveTimer: WAVE_INTERVAL,
      finished: false,
      winner: null,
      message: "",
    };
    this.incomeClock = 0;
    this.productionClock = 0;
    this.botClocks.clear();
    this.nextMarchId = 1;
  }

  private createFactions(setup: MatchSetup): Faction[] {
    const count = setup.style === "teams" ? 8 : 4;
    return Array.from({ length: count }, (_, id) => {
      const team = setup.style === "teams" ? (id < 4 ? 0 : 1) : id;
      const isHuman = setup.style === "teams" ? id < setup.humanPlayers : id < setup.humanPlayers;
      return {
        id,
        team,
        name: isHuman ? `PLAYER ${id + 1}` : setup.style === "teams" ? `BOT ${id % 4 + 1}` : `BOT ${id + 1}`,
        color: FACTION_COLORS[id],
        isHuman,
        points: 10,
      };
    });
  }

  getHumanFaction(playerIndex: number): number {
    const state = this.state;
    if (!state) return -1;
    return Math.min(playerIndex, state.setup.humanPlayers - 1);
  }

  tick(delta: number): void {
    const state = this.state;
    if (!state || state.finished) return;
    const dt = Math.min(delta, 0.1);
    state.elapsed += dt;
    this.messageClock = Math.max(0, this.messageClock - dt);

    this.incomeClock += dt;
    this.productionClock += dt;
    if (this.incomeClock >= INCOME_INTERVAL) {
      this.incomeClock -= INCOME_INTERVAL;
      for (const faction of state.factions) {
        const towerIncome = state.towers
          .filter((tower) => tower.owner === faction.id)
          .reduce((total, tower) => total + tower.incomeLevel, 0);
        faction.points += 1 + towerIncome;
      }

    }
    if (this.productionClock >= PRODUCTION_INTERVAL) {
      this.productionClock -= PRODUCTION_INTERVAL;
      for (const tower of state.towers) {
        if (tower.owner !== null && tower.units < this.maxUnits(tower)) {
          tower.units = Math.min(this.maxUnits(tower), tower.units + Math.ceil(tower.production));
        }
      }
    }

    this.advanceMarches(dt);
    this.updateRouteOrders(dt);
    this.updateBots(dt);
    if (state.setup.mode === "survival") this.updateSurvival(dt);
    else this.checkConquestVictory();
  }

  override update(deltaSeconds: number): void {
    this.tick(deltaSeconds);
  }

  private advanceMarches(dt: number): void {
    const state = this.state!;
    const completed: Array<{ marchId: number; towerId: number }> = [];
    for (const march of state.marches) {
      const from = state.towers[march.source];
      const to = state.towers[march.destination];
      const distance = Math.hypot(to.x - from.x, to.y - from.y);
      march.progress += dt * (this.marchSpeed(from) / Math.max(distance, 1));
      if (march.progress >= 1) {
        completed.push({ marchId: march.id, towerId: to.id });
      }
    }
    for (const arrival of completed) {
      const marchIndex = state.marches.findIndex((march) => march.id === arrival.marchId);
      if (marchIndex < 0) continue;
      const [march] = state.marches.splice(marchIndex, 1);
      this.resolveArrival(march, arrival.towerId);
    }
  }

  private resolveArrival(march: MatchState["marches"][number], towerId: number): void {
    const state = this.state!;
    const tower = state.towers[towerId];
    const attacker = state.factions[march.owner];
    if (tower.owner === null) {
      tower.owner = march.owner;
      tower.units = march.units;
      this.notify(`${attacker.name} captured an unclaimed tower`);
      return;
    }
    const defender = state.factions[tower.owner];
    if (defender.team === attacker.team) {
      const overflow = Math.max(0, tower.units + march.units - this.maxUnits(tower));
      tower.units = Math.min(this.maxUnits(tower), tower.units + march.units);
      if (overflow > 0) this.returnOverflow(march, overflow);
      return;
    }

    const attackStrength = march.units * march.attackPower;
    const damage = attackStrength / this.defenseMultiplier(tower);
    if (damage > tower.units) {
      const remaining = Math.max(1, Math.floor(attackStrength - tower.units * this.defenseMultiplier(tower)));
      tower.owner = march.owner;
      tower.units = Math.min(this.maxUnits(tower), remaining);
      this.notify(`${attacker.name} took a defended tower`);
    } else {
      tower.units = Math.max(0, tower.units - damage);
      if (tower.units === 0) {
        tower.owner = null;
        this.notify("A tower has been neutralized");
      }
    }
  }

  private returnOverflow(march: MatchState["marches"][number], units: number): void {
    const source = this.state!.towers[march.source];
    if (source.owner === march.owner) {
      source.units = Math.min(this.maxUnits(source), source.units + units);
    }
  }

  toggleRouteOrder(owner: number, sourceId: number, destinationId: number): "started" | "stopped" | "invalid" {
    const state = this.state;
    if (!state || state.finished || sourceId === destinationId) return "invalid";
    const source = state.towers[sourceId];
    if (source.owner === null || state.factions[source.owner].team !== state.factions[owner].team || !source.neighbors.includes(destinationId)) return "invalid";
    const existing = state.routeOrders.findIndex((order) => order.source === sourceId);
    if (existing >= 0) {
      const order = state.routeOrders[existing];
      if (order.destination === destinationId) {
        state.routeOrders.splice(existing, 1);
        return "stopped";
      }
      state.routeOrders.splice(existing, 1);
    }

    state.routeOrders.push({ owner: source.owner, source: sourceId, destination: destinationId, progress: 0 });
    return "started";
  }

  private updateRouteOrders(dt: number): void {
    const state = this.state!;
    const active: typeof state.routeOrders = [];
    for (const order of state.routeOrders) {
      const source = state.towers[order.source];
      const destination = state.towers[order.destination];
      const faction = state.factions[order.owner];
      const destinationIsFriendly = destination.owner !== null
        && state.factions[destination.owner].team === faction.team;
      if (source.owner !== order.owner) continue;

      const inTransit = state.marches
        .filter((march) => march.destination === destination.id && state.factions[march.owner].team === faction.team)
        .reduce((total, march) => total + march.units, 0);
      let spaceAvailable = this.maxUnits(destination) - destination.units - inTransit;
      if (!destinationIsFriendly || spaceAvailable > 0) {
        order.progress += this.attackRate(source) * dt;
      }
      while (order.progress >= 1 && source.units > 1) {
        if (destinationIsFriendly && spaceAvailable <= 0) break;
        order.progress -= 1;
        source.units -= 1;
        state.marches.push({
          id: this.nextMarchId++,
          owner: order.owner,
          source: order.source,
          destination: order.destination,
          units: 1,
          attackPower: this.attackPower(source),
          progress: 0,
        });
        if (destinationIsFriendly) spaceAvailable -= 1;
      }
      if (source.units <= 1) order.progress = Math.min(order.progress, 0.99);
      active.push(order);
    }
    state.routeOrders = active;
  }

  upgrade(factionId: number, towerId: number, type: "attack" | "defense" | "income"): boolean {
    const state = this.state;
    if (!state || state.finished) return false;
    const faction = state.factions[factionId];
    const tower = state.towers[towerId];
    if (tower.owner === null || state.factions[tower.owner].team !== faction.team) return false;
    const level = this.towerUpgradeLevel(tower, type);
    const cost = this.upgradeCost(type, level);
    if (level >= 5 || faction.points < cost) return false;
    faction.points -= cost;
    if (type === "attack") tower.attackLevel += 1;
    else if (type === "defense") tower.defenseLevel += 1;
    else tower.incomeLevel += 1;
    this.notify(`TOWER ${String(tower.id + 1).padStart(2, "0")}: ${type.toUpperCase()} LEVEL ${level + 1}`);
    return true;
  }

  towerUpgradeLevel(tower: Tower, type: "attack" | "defense" | "income"): number {
    if (type === "attack") return tower.attackLevel;
    if (type === "defense") return tower.defenseLevel;
    return tower.incomeLevel;
  }

  upgradeCost(type: "attack" | "defense" | "income", level: number): number {
    return (type === "income" ? 12 : 10) + (level - 1) * 8;
  }

  private botUpgrade(factionId: number): void {
    const towers = this.state!.towers.filter((tower) => tower.owner === factionId);
    if (towers.length === 0) return;
    const tower = towers.sort((a, b) => a.units - b.units)[0];
    const type = tower.defenseLevel < 3 ? "defense" : "attack";
    if (!this.upgrade(factionId, tower.id, type)) this.upgrade(factionId, tower.id, "income");
  }

  maxUnits(tower: Tower): number {
    return BASE_MAX_UNITS + (tower.defenseLevel - 1) * 20;
  }

  attackPower(tower: Tower): number {
    return 1 + (tower.attackLevel - 1) * 0.25;
  }

  attackRate(tower: Tower): number {
    return 1 + (tower.attackLevel - 1) * 0.3;
  }

  marchSpeed(tower: Tower): number {
    return 200 + (tower.attackLevel - 1) * 25;
  }

  defenseMultiplier(tower: Tower): number {
    return 1 + (tower.defenseLevel - 1) * 0.25;
  }

  private updateBots(dt: number): void {
    const state = this.state!;
    for (const faction of state.factions) {
      if (faction.isHuman) continue;
      const remaining = (this.botClocks.get(faction.id) ?? 2) - dt;
      if (remaining > 0) {
        this.botClocks.set(faction.id, remaining);
        continue;
      }
      this.botClocks.set(faction.id, 2.8 + Math.random() * 1.8);
      this.botUpgrade(faction.id);
      this.makeBotMove(faction.id);
    }
  }

  private makeBotMove(factionId: number): void {
    const state = this.state!;
    const faction = state.factions[factionId];
    const activeSources = new Set(state.routeOrders.filter((order) => order.owner === factionId).map((order) => order.source));
    const sources = state.towers.filter((tower) => tower.owner === factionId && tower.units >= 2 && !activeSources.has(tower.id));
    if (sources.length === 0) return;
    let best: { source: Tower; target: Tower; score: number } | null = null;
    for (const source of sources) {
      for (const targetId of source.neighbors) {
        const target = state.towers[targetId];
        if (target.owner !== null && state.factions[target.owner].team === faction.team) continue;
        const defenders = target.owner === null ? 0 : target.units;
        const score = (target.owner === null ? 18 : -defenders) + Math.random() * 5;
        if (!best || score > best.score) best = { source, target, score };
      }
    }
    if (best) this.toggleRouteOrder(factionId, best.source.id, best.target.id);
  }

  private updateSurvival(dt: number): void {
    const state = this.state!;
    state.waveTimer -= dt;
    const livingTeams = this.teamsWithTowers();
    if (!livingTeams.has(0)) {
      this.finish(1, "The bot team overwhelmed your command");
      return;
    }
    if (state.waveTimer <= 0 && state.wave < SURVIVAL_WAVES) {
      state.wave += 1;
      state.waveTimer = WAVE_INTERVAL;
      this.launchWave(state.wave);
      this.notify(`WAVE ${state.wave} INCOMING`);
    }
    if (state.wave >= SURVIVAL_WAVES && state.waveTimer <= 0) {
      this.finish(0, "All five waves repelled");
    }
  }

  private launchWave(wave: number): void {
    const state = this.state!;
    const sources = state.towers.filter((tower) => tower.owner !== null && state.factions[tower.owner].team === 1);
    if (sources.length === 0) return;
    for (const source of sources) {
      source.attackLevel = Math.min(5, Math.max(source.attackLevel, wave));
      const route = source.neighbors
        .map((neighborId) => state.towers[neighborId])
        .filter((tower) => tower.owner === null || state.factions[tower.owner].team === 0);
      if (route.length === 0) continue;
      const target = route[Math.floor(Math.random() * route.length)];
      const currentOrder = state.routeOrders.find((order) => order.source === source.id);
      if (currentOrder?.destination !== target.id) this.toggleRouteOrder(source.owner!, source.id, target.id);
    }
  }

  private checkConquestVictory(): void {
    const state = this.state!;
    if (!state.towers.every((tower) => tower.owner !== null)) return;

    const winningTeam = state.factions[state.towers[0].owner!].team;
    if (state.towers.every((tower) => state.factions[tower.owner!].team === winningTeam)) {
      this.finish(winningTeam, "One side controls every tower");
    }
  }

  private teamsWithTowers(): Set<number> {
    const state = this.state!;
    return new Set(state.towers.flatMap((tower) => tower.owner === null ? [] : [state.factions[tower.owner].team]));
  }

  private finish(winner: number, message: string): void {
    const state = this.state!;
    state.finished = true;
    state.winner = winner;
    state.message = message;
  }

  private notify(message: string): void {
    const state = this.state;
    if (!state) return;
    state.message = message;
    this.messageClock = 2.4;
  }
}

export function normalizeSetup(mode: GameMode, style: MatchStyle, humanPlayers: number): MatchSetup {
  return { mode, style, humanPlayers: Math.max(1, Math.min(4, Math.floor(humanPlayers))) };
}
