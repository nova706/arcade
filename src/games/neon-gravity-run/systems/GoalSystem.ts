import type { GoalEntity } from "../entities/GoalEntity";
import type { PlayerEntity } from "../entities/PlayerEntity";
import type { NeonGravityRunScene } from "../scene/NeonGravityRunScene";
import type { LandingState } from "../types";

export class GoalSystem {
  constructor(
    private readonly scene: NeonGravityRunScene,
    private readonly goal: GoalEntity,
  ) {}

  checkLanding(player: PlayerEntity, landing: LandingState): void {
    if (landing.goalPad && landing.afterJump && this.goal.containsOpening(player.x, player.y)) {
      this.scene.playerWon(player);
    }
  }
}
