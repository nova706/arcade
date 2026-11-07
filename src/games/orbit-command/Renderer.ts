import { CanvasRenderer } from "../../engine";
import { Game } from "./Game";
import { MAP_HEIGHT, MAP_LINKS, MAP_WIDTH } from "./level";
import type { MatchSetup, MatchState } from "./types";

export interface Point {
  x: number;
  y: number;
}

export interface UpgradeHitbox {
  type: "attack" | "defense" | "income";
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MenuHitboxes {
  mode: Point[];
  style: Point[];
  players: Point[];
  start: { x: number; y: number; width: number; height: number };
}

export class Renderer extends CanvasRenderer {
  private positions: Point[] = [];
  private mapScale = 1;
  private mapOrigin: Point = { x: 0, y: 0 };
  private upgradeHitboxes: UpgradeHitbox[] = [];
  private menuHits: MenuHitboxes | null = null;

  renderMenu(ctx: CanvasRenderingContext2D, width: number, height: number, setup: MatchSetup, bestScore: number): void {
    this.clear(ctx, width, height);
    const menuHits: MenuHitboxes = { mode: [], style: [], players: [], start: { x: 0, y: 0, width: 0, height: 0 } };
    this.menuHits = menuHits;
    const cx = width / 2;
    this.text(ctx, "ORBIT COMMAND", cx, height * 0.11, 11, "#45e0d0", "center", "500", 3);
    this.text(ctx, "CONTROL THE MAP.", cx, height * 0.19, Math.min(36, width * 0.052), "#edf4fb", "center", "700");
    this.text(ctx, "Build your economy. Plan routes. Take every tower.", cx, height * 0.25, 12, "#91a0b4", "center");

    const cardW = Math.min(290, width * 0.42);
    const gap = 12;
    const y = height * 0.30;
    const cardH = Math.min(112, height * 0.21);
    const modes = [
      { mode: "conquest" as const, title: "CONQUEST", body: "Own all towers." },
      { mode: "survival" as const, title: "SURVIVAL", body: "Survive five waves." },
    ];
    modes.forEach((mode, index) => {
      const x = cx - cardW - gap / 2 + index * (cardW + gap);
      this.panel(ctx, x, y, cardW, cardH, setup.mode === mode.mode);
      this.text(ctx, `0${index + 1}`, x + 20, y + 25, 10, setup.mode === mode.mode ? "#45e0d0" : "#6f7e92", "left", "500", 1);
      this.text(ctx, mode.title, x + 20, y + 53, 18, "#e5edf7", "left", "600");
      this.text(ctx, mode.body, x + 20, y + 82, 11, "#8d9aad", "left");
      menuHits.mode.push({ x: x + cardW / 2, y: y + cardH / 2 });
    });

    const rowY = y + cardH + 22;
    this.text(ctx, "MATCH FORMAT", cx, rowY, 10, "#8392a6", "center", "500", 2);
    const formatW = 180;
    const formatX = cx - formatW;
    this.panel(ctx, formatX, rowY + 18, formatW - 8, 39, setup.style === "teams");
    this.panel(ctx, cx + 8, rowY + 18, formatW - 8, 39, setup.style === "free-for-all");
    this.text(ctx, "TEAMS", cx - formatW / 2, rowY + 43, 11, "#dce7f3", "center", "500");
    this.text(ctx, "FREE-FOR-ALL", cx + formatW / 2, rowY + 43, 11, "#dce7f3", "center", "500");
    menuHits.style = [{ x: formatX + (formatW - 8) / 2, y: rowY + 37 }, { x: cx + 8 + (formatW - 8) / 2, y: rowY + 37 }];

    const countY = rowY + 75;
    this.text(ctx, "LOCAL PLAYERS", cx, countY, 10, "#8392a6", "center", "500", 2);
    const numberW = 40;
    const total = 4 * numberW + 3 * 10;
    for (let i = 0; i < 4; i += 1) {
      const x = cx - total / 2 + i * (numberW + 10);
      this.panel(ctx, x, countY + 12, numberW, 34, setup.humanPlayers === i + 1);
      this.text(ctx, String(i + 1), x + numberW / 2, countY + 34, 12, "#dce7f3", "center", "600");
      menuHits.players.push({ x: x + numberW / 2, y: countY + 29 });
    }

    const startY = Math.min(height - 53, countY + 50);
    const startW = 190;
    this.roundRect(ctx, cx - startW / 2, startY, startW, 38, 5, "#45e0d0");
    this.text(ctx, "START MATCH", cx, startY + 24, 11, "#08201f", "center", "700", 1.5);
    menuHits.start = { x: cx - startW / 2, y: startY, width: startW, height: 38 };
    this.text(ctx, bestScore > 0 ? `BEST SCORE  ${bestScore.toLocaleString()}` : "A STRATEGY GAME PROTOTYPE", cx, height - 12, 8, "#536176", "center", "400", 1);
  }

  renderGame(ctx: CanvasRenderingContext2D, width: number, height: number, game: Game, playerIndex: number, selected: number | null, cursors: ReadonlyMap<number, number>, upgradeTowerId: number | null): void {
    this.clear(ctx, width, height);
    const state = game.state;
    if (!state) return;
    this.drawHud(ctx, width, state, game, playerIndex, upgradeTowerId);
    this.layoutMap(width, height);
    this.drawMap(ctx, state, selected, cursors);
    this.drawUpgrades(ctx, width, height, state, game, playerIndex, upgradeTowerId);
  }

  getTowerAt(x: number, y: number): number | null {
    let best = -1;
    let bestDistance = Infinity;
    this.positions.forEach((point, index) => {
      const distance = Math.hypot(point.x - x, point.y - y);
      if (distance < bestDistance) {
        best = index;
        bestDistance = distance;
      }
    });
    return bestDistance <= Math.max(23, 30 * this.mapScale) ? best : null;
  }

  getUpgradeAt(x: number, y: number): UpgradeHitbox["type"] | null {
    return this.upgradeHitboxes.find((box) => x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height)?.type ?? null;
  }

  getMenuHits(): MenuHitboxes | null {
    return this.menuHits;
  }

  private drawHud(ctx: CanvasRenderingContext2D, width: number, state: MatchState, game: Game, playerIndex: number, upgradeTowerId: number | null): void {
    const playerFaction = game.getHumanFaction(playerIndex);
    const faction = state.factions[playerFaction];
    const tower = upgradeTowerId === null ? null : state.towers[upgradeTowerId];
    const towers = state.towers.filter((tower) => tower.owner !== null && state.factions[tower.owner].team === faction.team).length;
    const title = state.setup.mode === "conquest" ? "CONQUEST" : `SURVIVAL  /  WAVE ${state.wave} OF 5`;
    this.text(ctx, title, 26, 29, 11, "#dbe6f2", "left", "600", 1.4);
    this.text(ctx, state.setup.style === "teams" ? "TEAM MATCH" : "FREE-FOR-ALL", 26, 49, 9, "#76869b", "left", "400", 1);
    this.text(ctx, `${String(Math.floor(state.elapsed / 60)).padStart(2, "0")}:${String(Math.floor(state.elapsed % 60)).padStart(2, "0")}`, width / 2, width < 620 ? 35 : 57, 14, "#c8d5e5", "center", "500");

    const metrics = [
      { label: "UPGRADE POINTS", value: Math.floor(faction.points).toString(), color: "#f2bf57" },
      { label: "CONTROLLED", value: `${towers} / ${state.towers.length}`, color: faction.color },
      { label: "SELECTED TOWER", value: tower ? `T${String(tower.id + 1).padStart(2, "0")} · ${Math.ceil(tower.units)}/${game.maxUnits(tower)}` : "NONE", color: tower ? faction.color : "#718096" },
      { label: "ATK RATE · MAX", value: tower ? `${game.attackRate(tower).toFixed(1)}/s · ${game.maxUnits(tower)}` : "—", color: "#45e0d0" },
    ];
    const right = width - 25;
    if (width < 620) {
      this.text(ctx, `PTS ${metrics[0].value}`, right, 23, 10, metrics[0].color, "right", "600");
      this.text(ctx, `ZONES ${towers}`, right, 43, 9, faction.color, "right", "500");
      this.text(ctx, tower ? `T${tower.id + 1} ${Math.ceil(tower.units)}/${game.maxUnits(tower)} · ${game.attackRate(tower).toFixed(1)}/S` : "SELECT A TOWER", width / 2, 55, 8, "#45e0d0", "center", "500");
    } else {
      metrics.forEach((metric, i) => {
        const x = right - i * 180;
        this.text(ctx, metric.label, x, 20, 8, "#728197", "right", "500", 1);
        this.text(ctx, metric.value, x, 42, 12, metric.color, "right", "600");
      });
    }
    this.line(ctx, 20, 66, width - 20, 66, "#29384a", 1);
    if (state.message && state.message.length > 0) {
      this.roundRect(ctx, width / 2 - 150, 77, 300, 27, 4, "#172536");
      this.text(ctx, state.message, width / 2, 95, 9, "#c3d2e3", "center", "500");
    }
  }

  private layoutMap(width: number, height: number): void {
    const top = 112;
    const bottom = 105;
    const side = Math.min(70, width * 0.07);
    const availableW = width - side * 2;
    const availableH = height - top - bottom;
    this.mapScale = Math.min(availableW / MAP_WIDTH, availableH / MAP_HEIGHT);
    const mapW = MAP_WIDTH * this.mapScale;
    const mapH = MAP_HEIGHT * this.mapScale;
    this.mapOrigin = { x: (width - mapW) / 2, y: top + (availableH - mapH) / 2 };
  }

  private drawMap(ctx: CanvasRenderingContext2D, state: MatchState, selected: number | null, cursors: ReadonlyMap<number, number>): void {
    const toScreen = (x: number, y: number): Point => ({
      x: this.mapOrigin.x + x * this.mapScale,
      y: this.mapOrigin.y + y * this.mapScale,
    });
    this.positions = state.towers.map((tower) => toScreen(tower.x, tower.y));
    const mapWidth = MAP_WIDTH * this.mapScale;
    const mapHeight = MAP_HEIGHT * this.mapScale;
    this.roundRect(ctx, this.mapOrigin.x - 12, this.mapOrigin.y - 12, mapWidth + 24, mapHeight + 24, 5, "#0e1926");
    this.strokeRect(ctx, this.mapOrigin.x - 12, this.mapOrigin.y - 12, mapWidth + 24, mapHeight + 24, "#233449");
    this.drawGrid(ctx, this.mapOrigin.x, this.mapOrigin.y, mapWidth, mapHeight);

    for (const [a, b] of MAP_LINKS) {
      const from = this.positions[a];
      const to = this.positions[b];
      this.line(ctx, from.x, from.y, to.x, to.y, "#324359", 1.5);
    }

    for (const order of state.routeOrders) {
      const from = this.positions[order.source];
      const to = this.positions[order.destination];
      const destination = state.towers[order.destination];
      const isReinforcement = destination.owner !== null
        && state.factions[destination.owner].team === state.factions[order.owner].team;
      const color = isReinforcement ? "#64c9ff" : state.factions[order.owner].color;
      ctx.save();
      ctx.setLineDash([6, 5]);
      ctx.shadowColor = color;
      ctx.shadowBlur = 7;
      this.line(ctx, from.x, from.y, to.x, to.y, color, 2);
      ctx.restore();
    }

    for (const march of state.marches) {
      const from = this.positions[march.source];
      const to = this.positions[march.destination];
      const x = from.x + (to.x - from.x) * march.progress;
      const offset = (march.id % 3 - 1) * 5;
      const y = from.y + (to.y - from.y) * march.progress + offset;
      const color = state.factions[march.owner].color;
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      this.circle(ctx, x, y, Math.max(4, this.mapScale * 8), color);
      ctx.restore();
    }

    state.towers.forEach((tower, index) => {
      const { x, y } = this.positions[index];
      const radius = Math.max(18, this.mapScale * 27);
      const ownerColor = tower.owner === null ? "#8c9aad" : state.factions[tower.owner].color;
      if (tower.owner !== null) {
        ctx.save();
        ctx.globalAlpha = 0.12;
        this.circle(ctx, x, y, radius + 10, ownerColor);
        ctx.restore();
      }
      this.circle(ctx, x, y, radius, "#121f2e");
      this.strokeCircle(ctx, x, y, radius, selected === tower.id ? "#ffffff" : ownerColor, selected === tower.id ? 2.4 : 1.6);
      this.drawUpgradeStyle(ctx, x, y, radius, tower);
      this.drawTowerGlyph(ctx, x, y, ownerColor, radius * 0.44);
      this.roundRect(ctx, x - 18, y + radius + 4, 36, 16, 3, "#0b121d");
      this.text(ctx, tower.owner === null ? "NEUTRAL" : `${Math.ceil(tower.units)} U`, x, y + radius + 15, 8, tower.owner === null ? "#8c9aad" : "#e4edf7", "center", "500");
      this.text(ctx, `T${String(tower.id + 1).padStart(2, "0")}`, x, y - radius - 8, 8, "#75869a", "center", "500");
    });

    for (const [player, towerId] of cursors) {
      const point = this.positions[towerId];
      if (!point) continue;
      ctx.save();
      ctx.setLineDash([3, 3]);
      this.strokeCircle(ctx, point.x, point.y, Math.max(25, this.mapScale * 36), state.factions[player].color, 1.5);
      ctx.restore();
    }

    this.text(ctx, "ADJACENT ROUTES: ATTACK ENEMIES · REINFORCE ALLIES", this.mapOrigin.x, this.mapOrigin.y + mapHeight + 34, 8, "#596b81", "left", "500", 0.5);
  }

  private drawUpgrades(ctx: CanvasRenderingContext2D, width: number, height: number, state: MatchState, game: Game, playerIndex: number, towerId: number | null): void {
    const faction = state.factions[game.getHumanFaction(playerIndex)];
    const tower = towerId === null ? null : state.towers[towerId];
    const labels = [
      { type: "attack" as const, key: "1", title: "ASSAULT", desc: "+ power · rate · speed", level: tower?.attackLevel ?? 0, color: "#ff906b" },
      { type: "defense" as const, key: "2", title: "FORTIFY", desc: "+ defense · unit capacity", level: tower?.defenseLevel ?? 0, color: "#69bfff" },
      { type: "income" as const, key: "3", title: "ECONOMY", desc: "+ tower income", level: tower?.incomeLevel ?? 0, color: "#f2bf57" },
    ];
    const cardWidth = Math.min(220, (width - 40) / 3);
    const gap = width < 500 ? 5 : 10;
    const totalWidth = cardWidth * 3 + gap * 2;
    const startX = (width - totalWidth) / 2;
    const y = height - 76;
    this.upgradeHitboxes = [];
    this.text(ctx, tower ? `TOWER ${String(tower.id + 1).padStart(2, "0")} · INDIVIDUAL UPGRADES` : "SELECT A FRIENDLY TOWER TO UPGRADE IT", width / 2, y - 9, 8, "#8493a7", "center", "500", 0.6);
    labels.forEach((item, index) => {
      const x = startX + index * (cardWidth + gap);
      const level = Math.max(1, item.level);
      const cost = game.upgradeCost(item.type, level);
      this.roundRect(ctx, x, y, cardWidth, 57, 4, tower ? "#142131" : "#101923");
      this.strokeRect(ctx, x, y, cardWidth, 57, "#2a3a4e");
      const compact = cardWidth < 125;
      const activeColor = tower ? item.color : "#657286";
      this.text(ctx, item.key, x + (compact ? 8 : 14), y + 18, 8, activeColor, "left", "500");
      this.text(ctx, compact ? item.title.split(" ")[0] : item.title, x + (compact ? 23 : 32), y + 19, compact ? 8 : 10, "#dce7f3", "left", "600");
      if (!compact) this.text(ctx, `LV ${tower ? item.level : "—"}  ·  ${item.desc}`, x + 14, y + 38, 8, "#8291a4", "left");
      else this.text(ctx, `LV ${tower ? item.level : "—"}`, x + 8, y + 39, 8, "#8291a4", "left");
      this.text(ctx, tower ? (item.level < 5 ? `${cost} PTS` : "MAX") : "SELECT", x + cardWidth - 8, y + 19, 7, tower && faction.points >= cost ? "#f2bf57" : "#738197", "right", "500");
      for (let pip = 0; pip < 5; pip += 1) {
        this.roundRect(ctx, x + 14 + pip * 10, y + 47, 7, 3, 1, pip < item.level ? activeColor : "#354255");
      }
      this.upgradeHitboxes.push({ type: item.type, x, y, width: cardWidth, height: 57 });
    });
  }

  private drawUpgradeStyle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, tower: MatchState["towers"][number]): void {
    if (tower.defenseLevel > 1) {
      ctx.save();
      ctx.globalAlpha = 0.35 + tower.defenseLevel * 0.08;
      ctx.setLineDash(tower.defenseLevel >= 4 ? [] : [4, 3]);
      this.strokeCircle(ctx, x, y, radius + 3 + tower.defenseLevel, "#69bfff", 1 + tower.defenseLevel * 0.35);
      ctx.restore();
    }

    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#ff906b";
    ctx.beginPath();
    ctx.arc(x, y, radius + 5, -Math.PI * 0.8, -Math.PI * 0.8 + tower.attackLevel * 0.28);
    ctx.stroke();
    ctx.restore();

    for (let pip = 0; pip < tower.incomeLevel; pip += 1) {
      this.circle(ctx, x - radius * 0.65 + pip * 4, y - radius * 0.67, 1.5, "#f2bf57");
    }
  }

  private drawGrid(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): void {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.clip();
    for (let gx = 0; gx <= MAP_WIDTH; gx += 50) {
      const sx = x + gx * this.mapScale;
      this.line(ctx, sx, y, sx, y + height, gx % 100 === 0 ? "#1c2a3b" : "#172333", 1);
    }
    for (let gy = 0; gy <= MAP_HEIGHT; gy += 50) {
      const sy = y + gy * this.mapScale;
      this.line(ctx, x, sy, x + width, sy, gy % 100 === 0 ? "#1c2a3b" : "#172333", 1);
    }
    ctx.restore();
  }

  private drawTowerGlyph(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, radius: number): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.9;
    ctx.fillRect(-radius * 0.55, -radius * 0.55, radius * 1.1, radius * 1.1);
    ctx.fillStyle = "#132130";
    ctx.fillRect(-radius * 0.22, -radius * 0.22, radius * 0.44, radius * 0.44);
    ctx.restore();
  }

  private clear(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.fillStyle = "#0a121d";
    ctx.fillRect(0, 0, width, height);
    const gradient = ctx.createRadialGradient(width * 0.5, height * 0.45, 10, width * 0.5, height * 0.45, Math.max(width, height) * 0.75);
    gradient.addColorStop(0, "#111e2c");
    gradient.addColorStop(1, "#0a121d");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  private panel(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, selected: boolean): void {
    this.roundRect(ctx, x, y, width, height, 5, selected ? "#172b36" : "#111d2a");
    this.strokeRect(ctx, x, y, width, height, selected ? "#45e0d0" : "#29394d");
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, color: string): void {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    ctx.fill();
  }

  private strokeRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string): void {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);
  }

  private line(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, width: number): void {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }

  private circle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string): void {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  private strokeCircle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string, width: number): void {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }

  private text(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign = "left", weight = "400", spacing = 0): void {
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = "alphabetic";
    ctx.font = `${weight} ${size}px "DM Mono", Consolas, monospace`;
    if (spacing === 0) ctx.fillText(text, x, y);
    else {
      let cursor = x - (align === "center" ? this.measureTracked(ctx, text, spacing) / 2 : align === "right" ? this.measureTracked(ctx, text, spacing) : 0);
      for (const character of text) {
        ctx.fillText(character, cursor, y);
        cursor += ctx.measureText(character).width + spacing;
      }
    }
  }

  private measureTracked(ctx: CanvasRenderingContext2D, text: string, spacing: number): number {
    return ctx.measureText(text).width + Math.max(0, text.length - 1) * spacing;
  }
}
