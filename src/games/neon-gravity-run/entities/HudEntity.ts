import Phaser from "phaser";
import { PLAYER_COLORS } from "../input";
import type { PlayerEntity } from "./PlayerEntity";

export class HudEntity {
  private readonly labels: Phaser.GameObjects.Text[] = [];
  private readonly levelLabel: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    for (let index = 0; index < 4; index += 1) {
      const label = scene.add.text(18 + (index % 2) * 148, 56 + Math.floor(index / 2) * 21, "", {
        color: `#${PLAYER_COLORS[index].toString(16).padStart(6, "0")}`,
        fontFamily: "Consolas, monospace",
        fontSize: "13px",
        fontStyle: "bold",
        shadow: { color: "#000000", blur: 5, fill: true },
      }).setDepth(8);
      this.labels.push(label);
    }
    this.levelLabel = scene.add.text(640, 56, "", {
      color: "#b8c5e1",
      fontFamily: "Consolas, monospace",
      fontSize: "11px",
      letterSpacing: 2,
    }).setOrigin(0.5).setDepth(8);
  }

  update(players: readonly PlayerEntity[], levelNumber: number, levelName: string): void {
    this.levelLabel.setText(`LEVEL ${levelNumber}/5 · ${levelName.toUpperCase()}`);
    this.labels.forEach((label, index) => {
      const player = players[index];
      label.setVisible(Boolean(player));
      if (player) label.setText(`P${index + 1}  ${player.alive ? `${player.lives} LIVES` : "OUT"}`);
    });
  }

  destroy(): void {
    this.labels.forEach((label) => label.destroy());
    this.labels.length = 0;
    this.levelLabel.destroy();
  }
}
