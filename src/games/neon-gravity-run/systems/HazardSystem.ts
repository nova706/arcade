import { GameData } from "../data/GameData";
import type { LavaEntity } from "../entities/LavaEntity";
import type { PlayerEntity } from "../entities/PlayerEntity";
import type { NeonGravityRunScene } from "../scene/NeonGravityRunScene";

export class HazardSystem {
  constructor(
    private readonly scene: NeonGravityRunScene,
    private readonly topLava: LavaEntity,
    private readonly bottomLava: LavaEntity,
  ) {}

  update(time: number, players: readonly PlayerEntity[]): void {
    this.topLava.update(time);
    this.bottomLava.update(time);
    const height = this.scene.scale.height;
    for (const player of players) {
      if (!player.alive || player.invulnerability > 0) continue;
      const body = player.body;
      const touchesTopLava = body.top <= GameData.LAVA_HEIGHT;
      const touchesBottomLava = body.bottom >= height - GameData.LAVA_HEIGHT;
      if (touchesTopLava || touchesBottomLava) this.scene.lavaHit(player);
    }
  }
}
