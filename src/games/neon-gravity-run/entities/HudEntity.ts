import Phaser from "phaser";
import { PLAYER_COLORS } from "../input";
import type { PlayerEntity } from "./PlayerEntity";

export class HudEntity {
  private readonly labels: Phaser.GameObjects.Text[] = [];

  constructor(scene: Phaser.Scene) {
    for (let index = 0; index < 4; index += 1) {
      const label = scene.add.text(18 + (index % 2) * 148, 16 + Math.floor(index / 2) * 22, "", {
        color: `#${PLAYER_COLORS[index].toString(16).padStart(6, "0")}`,
        fontFamily: "Consolas, monospace",
        fontSize: "13px",
        fontStyle: "bold",
        shadow: { color: "#000000", blur: 5, fill: true },
      }).setDepth(8);
      this.labels.push(label);
    }
  }

  update(players: readonly PlayerEntity[]): void {
    this.labels.forEach((label, index) => {
      const player = players[index];
      label.setVisible(Boolean(player));
      if (player) label.setText(`P${index + 1}  ${player.alive ? `${player.lives} LIVES` : "OUT"}`);
    });
  }

  destroy(): void {
    this.labels.forEach((label) => label.destroy());
    this.labels.length = 0;
  }
}
