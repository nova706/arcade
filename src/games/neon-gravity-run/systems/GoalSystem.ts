import type { GoalEntity } from "../entities/GoalEntity";
import type { PlayerEntity } from "../entities/PlayerEntity";
import type { NeonGravityRunScene } from "../scene/NeonGravityRunScene";

export class GoalSystem {
  constructor(
    private readonly scene: NeonGravityRunScene,
    private readonly goal: GoalEntity,
  ) {}

  update(players: readonly PlayerEntity[], time: number): void {
    this.goal.update(time);
    for (const player of players) {
      if (!player.alive) continue;
      if (this.goal.enteredThroughGap(player.x, player.y)) {
        this.scene.playerWon(player);
        return;
      }
      if (this.goal.touchesLava(player.x, player.y)) {
        this.scene.lavaHit(player);
      }
    }
  }
}
