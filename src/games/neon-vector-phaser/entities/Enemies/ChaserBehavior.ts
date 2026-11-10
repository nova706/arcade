import type { IEnemyBehavior } from "../../interfaces/IEnemyBehavior";
import { EnemyEntity } from "../EnemyEntity";
import { PlayerEntity } from "../PlayerEntity";

export class ChaserBehavior implements IEnemyBehavior {
    constructor(private isBoss: boolean = false) {}

    executeMovement(enemy: EnemyEntity, target: PlayerEntity, distance: number, angle: number): PlayerEntity | null {
        const speed = enemy.speed * (this.isBoss ? 0.8 : 1);
        enemy.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

        const attackRange = this.isBoss ? 56 : 30;
        if (distance < attackRange && enemy.attackCooldown <= 0) {
            enemy.attackCooldown = this.isBoss ? 1.4 : 0.95;
            return target;
        }
        return null;
    }
}
