import { CanvasRenderer } from "../../engine";
import { ENEMY_CONFIG } from "./entities/EnemyObject";
import type { AreaObject } from "./entities/AreaObject";
import type { EnemyObject } from "./entities/EnemyObject";
import type { GameState } from "./types";

export class NeonVectorRenderer extends CanvasRenderer {
  render(context: CanvasRenderingContext2D, width: number, height: number, state: GameState | null): void {
    this.drawBackground(context, width, height, state?.elapsed ?? 0);
    if (!state) return;
    state.areas.forEach((area) => this.drawArea(context, area, state.elapsed));
    state.projectiles.forEach((projectile) => this.drawProjectile(context, projectile));
    state.enemies.forEach((enemy) => this.drawEnemy(context, enemy));
    state.players.forEach((player) => this.drawPlayer(context, player, state.elapsed));
    state.particles.forEach((particle) => {
      context.globalAlpha = Math.max(0, particle.lifetime / particle.maxLifetime);
      context.fillStyle = particle.color;
      context.shadowColor = particle.color;
      context.shadowBlur = 12;
      context.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
    });
    context.globalAlpha = 1;
    context.shadowBlur = 0;
    this.drawHud(context, width, height, state);
  }

  private drawBackground(context: CanvasRenderingContext2D, width: number, height: number, elapsed: number): void {
    const gradient = context.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, Math.max(width, height) * 0.72);
    gradient.addColorStop(0, "#13162d");
    gradient.addColorStop(1, "#070916");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
    context.strokeStyle = "#52678f14";
    context.lineWidth = 1;
    const spacing = 42;
    const offset = (elapsed * 5) % spacing;
    for (let x = -spacing + offset; x < width; x += spacing) {
      context.beginPath(); context.moveTo(x, 0); context.lineTo(x, height); context.stroke();
    }
    for (let y = -spacing + offset; y < height; y += spacing) {
      context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke();
    }
    context.strokeStyle = "#55f6ff33";
    context.lineWidth = 2;
    context.strokeRect(10, 10, width - 20, height - 20);
    context.strokeStyle = "#b762ff25";
    context.lineWidth = 1;
    context.strokeRect(17, 17, width - 34, height - 34);
  }

  private drawArea(context: CanvasRenderingContext2D, area: AreaObject, elapsed: number): void {
    const pulse = 1 + Math.sin(elapsed * 4 + area.x) * 0.035;
    const style: Record<string, { color: string; fill: string }> = {
      bubble: { color: "#55f6ff", fill: "#55f6ff12" },
      totem: { color: "#c5ff57", fill: "#c5ff5714" },
      tether: { color: "#bd72ff", fill: "#bd72ff12" },
      barrier: { color: "#55f6ff", fill: "#55f6ff33" },
      blackhole: { color: "#b762ff", fill: "#6e37ff55" },
      capture: { color: "#ffc857", fill: "#ffc85719" },
      checkpoint: { color: "#55f6ff", fill: "#55f6ff15" },
      mine: { color: "#ff9d45", fill: "#ff9d4525" },
    };
    const { color, fill } = style[area.kind];
    context.save();
    context.globalAlpha = area.kind === "checkpoint" && area.activated ? 0.28 : 0.82;
    context.shadowColor = color;
    context.shadowBlur = 18;
    if (area.kind === "barrier") {
      context.translate(area.x, area.y);
      context.rotate(-0.4);
      context.fillStyle = fill;
      context.strokeStyle = color;
      context.lineWidth = 2;
      context.fillRect(-area.radius, -7, area.radius * 2, 14);
      context.strokeRect(-area.radius, -7, area.radius * 2, 14);
    } else {
      context.beginPath();
      context.arc(area.x, area.y, area.radius * pulse, 0, Math.PI * 2);
      context.fillStyle = fill;
      context.fill();
      context.strokeStyle = color;
      context.lineWidth = area.kind === "bubble" || area.kind === "blackhole" ? 2.5 : 1.5;
      context.setLineDash(area.kind === "bubble" || area.kind === "checkpoint" ? [8, 7] : []);
      context.stroke();
      context.setLineDash([]);
      if (area.kind === "capture" || area.kind === "checkpoint") {
        context.beginPath();
        context.arc(area.x, area.y, area.radius * 0.72, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (area.progress ?? 0) / (area.kind === "capture" ? 3.2 : 1));
        context.strokeStyle = "#f4f7ff";
        context.lineWidth = 4;
        context.stroke();
      }
      if (area.kind === "blackhole") {
        context.strokeStyle = "#e7d8ff";
        context.beginPath();
        context.arc(area.x, area.y, area.radius * 0.55, elapsed * 2, elapsed * 2 + Math.PI * 1.4);
        context.stroke();
      }
    }
    context.restore();
  }

  private drawPlayer(context: CanvasRenderingContext2D, player: GameState["players"][number], elapsed: number): void {
    if (!player.alive || (player.invisible > 0 && Math.floor(elapsed * 14) % 2 === 0)) return;
    context.save();
    context.translate(player.x, player.y);
    context.rotate(Math.PI / 4);
    context.shadowColor = player.color;
    context.shadowBlur = 20;
    context.fillStyle = `${player.color}35`;
    context.strokeStyle = player.color;
    context.lineWidth = 2.5;
    context.fillRect(-10, -10, 20, 20);
    context.strokeRect(-10, -10, 20, 20);
    context.rotate(-Math.PI / 4);
    context.beginPath();
    context.moveTo(Math.cos(player.attackAngle) * 8, Math.sin(player.attackAngle) * 8);
    context.lineTo(Math.cos(player.attackAngle) * 24, Math.sin(player.attackAngle) * 24);
    context.strokeStyle = "#f6f7ff";
    context.lineWidth = 3;
    context.stroke();
    context.restore();
    if (player.overshield > 0) {
      context.beginPath();
      context.arc(player.x, player.y, 22, 0, Math.PI * 2);
      context.strokeStyle = "#93cfff";
      context.lineWidth = 2;
      context.stroke();
    }
    context.fillStyle = player.color;
    context.font = "700 10px 'DM Mono', monospace";
    context.textAlign = "center";
    context.fillText(`P${player.index + 1}`, player.x, player.y - 24);
  }

  private drawEnemy(context: CanvasRenderingContext2D, enemy: EnemyObject): void {
    if (!enemy.alive) return;
    const config = ENEMY_CONFIG[enemy.type];
    const radius = config.radius;
    context.save();
    context.translate(enemy.x, enemy.y);
    context.rotate(Math.atan2(enemy.velocity.y, enemy.velocity.x));
    context.shadowColor = config.color;
    context.shadowBlur = enemy.type === "boss" ? 25 : 14;
    context.fillStyle = `${config.color}35`;
    context.strokeStyle = config.color;
    context.lineWidth = enemy.type === "boss" || enemy.type === "tank" ? 3 : 2;
    context.beginPath();
    if (enemy.type === "chaser" || enemy.type === "boss") {
      context.moveTo(radius, 0);
      context.lineTo(-radius * 0.75, -radius * 0.72);
      context.lineTo(-radius * 0.38, 0);
      context.lineTo(-radius * 0.75, radius * 0.72);
    } else if (enemy.type === "ranger") {
      context.rect(-radius * 0.72, -radius * 0.72, radius * 1.44, radius * 1.44);
    } else if (enemy.type === "tank") {
      for (let point = 0; point < 6; point += 1) {
        const angle = point * Math.PI / 3;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (point === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
    } else {
      context.moveTo(0, -radius);
      context.lineTo(radius, 0);
      context.lineTo(0, radius);
      context.lineTo(-radius, 0);
    }
    context.closePath();
    context.fill();
    context.stroke();
    context.restore();
    if (enemy.health < enemy.maxHealth) {
      context.fillStyle = "#22283c";
      context.fillRect(enemy.x - radius, enemy.y - radius - 7, radius * 2, 3);
      context.fillStyle = config.color;
      context.fillRect(enemy.x - radius, enemy.y - radius - 7, radius * 2 * enemy.health / enemy.maxHealth, 3);
    }
    if (enemy.telegraph > 0) {
      context.beginPath();
      context.arc(enemy.x, enemy.y, radius + 10 + Math.sin(enemy.telegraph * 25) * 3, 0, Math.PI * 2);
      context.strokeStyle = "#ffb945";
      context.lineWidth = 2;
      context.stroke();
    }
  }

  private drawProjectile(context: CanvasRenderingContext2D, projectile: GameState["projectiles"][number]): void {
    context.save();
    context.strokeStyle = projectile.kind === "beam" ? (projectile.owner < 0 ? "#bd72ff" : "#bdfcff") : "#5df5ff";
    context.shadowColor = context.strokeStyle;
    context.shadowBlur = 16;
    context.lineWidth = projectile.kind === "beam" ? 5 : 3;
    context.beginPath();
    if (projectile.kind === "beam") context.moveTo(projectile.originX, projectile.originY);
    else context.moveTo(projectile.x - projectile.directionX * 28, projectile.y - projectile.directionY * 28);
    context.lineTo(projectile.x, projectile.y);
    context.stroke();
    if (projectile.kind === "chain") {
      context.beginPath();
      context.moveTo(projectile.x - 6, projectile.y - 9);
      context.lineTo(projectile.x + 2, projectile.y);
      context.lineTo(projectile.x - 3, projectile.y + 8);
      context.stroke();
    }
    context.restore();
  }

  private drawHud(context: CanvasRenderingContext2D, width: number, height: number, state: GameState): void {
    context.textAlign = "center";
    context.fillStyle = "#ecf4ff";
    context.shadowColor = "#55f6ff";
    context.shadowBlur = 14;
    context.font = "700 22px 'DM Mono', monospace";
    context.fillText(`WAVE ${String(state.wave.wave).padStart(2, "0")}`, width / 2, 36);
    context.shadowBlur = 0;
    context.font = "10px 'DM Mono', monospace";
    context.fillStyle = "#8793b4";
    context.fillText(`${state.enemies.length} HOSTILES`, width / 2, 54);
    state.players.forEach((player, index) => {
      const x = 20 + index % 2 * Math.max(160, width - 225);
      const y = 31 + Math.floor(index / 2) * 54;
      const barWidth = Math.min(175, width * 0.28);
      context.textAlign = "left";
      context.font = "700 10px 'DM Mono', monospace";
      context.fillStyle = player.color;
      context.fillText(`P${index + 1} · ${player.loadout.weapon.toUpperCase()}`, x, y);
      this.bar(context, x, y + 7, barWidth, 7, player.health / player.maxHealth, player.color);
      this.bar(context, x, y + 18, barWidth, 4, player.superCharge / 100, "#bd72ff");
      context.font = "8px 'DM Mono', monospace";
      context.fillStyle = "#8892b0";
      context.fillText(`${player.loadout.super.toUpperCase()} ${Math.floor(player.superCharge)}% · ${player.loadout.minor.toUpperCase()} ${player.minorCooldown > 0 ? `${player.minorCooldown.toFixed(1)}s` : "READY"}`, x, y + 35);
    });
    if (state.wave.objective) {
      context.textAlign = "center";
      context.font = "700 11px 'DM Mono', monospace";
      context.fillStyle = "#ffc857";
      const label = state.wave.objective === "capture" ? "CAPTURE THE ZONE BEFORE THE BLACK HOLE FORMS"
        : state.wave.objective === "checkpoints" ? `CHECKPOINT ${Math.min(3, state.wave.objectiveIndex + 1)} / 3 · ${Math.ceil(state.wave.objectiveTime)}s`
          : "ELIMINATE THE ARMORED TANK";
      context.fillText(label, width / 2, height - 20);
    }
  }

  private bar(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, ratio: number, color: string): void {
    context.fillStyle = "#20263a";
    context.fillRect(x, y, width, height);
    context.fillStyle = color;
    context.shadowColor = color;
    context.shadowBlur = 7;
    context.fillRect(x, y, width * Math.max(0, Math.min(1, ratio)), height);
    context.shadowBlur = 0;
  }
}
