import Phaser from "phaser";
import type { NeonGravityRunScene } from "../scene/NeonGravityRunScene";
import type { LandingState, PlayerCommand } from "../types";
import type { PlatformEntity } from "../entities/PlatformEntity";
import type { PlayerEntity } from "../entities/PlayerEntity";

export class PlatformSystem {
  private colliders: Phaser.Physics.Arcade.Collider[] = [];

  constructor(private readonly scene: NeonGravityRunScene) {}

  connect(players: readonly PlayerEntity[], platforms: readonly PlatformEntity[]): void {
    this.disconnect();
    for (const player of players) {
      for (const platform of platforms) {
        this.colliders.push(this.scene.physics.add.collider(
          player,
          platform,
          () => player.setGrounded(platform.goalPad),
          () => this.canLand(player, platform),
        ));
      }
    }
  }

  updatePlayer(player: PlayerEntity, command: PlayerCommand, landing: LandingState, delta: number): void {
    player.update(command, landing, delta);
  }

  disconnect(): void {
    this.colliders.forEach((collider) => collider.destroy());
    this.colliders = [];
  }

  private canLand(player: PlayerEntity, platform: PlatformEntity): boolean {
    const body = player.body;
    const platformBody = platform.body;
    if (!(platformBody instanceof Phaser.Physics.Arcade.StaticBody)) return false;
    if (player.gravityDirection > 0) {
      return body.velocity.y >= 0 && body.prev.y + body.height <= platformBody.top + 10;
    }
    return body.velocity.y <= 0 && body.prev.y >= platformBody.bottom - 10;
  }
}
