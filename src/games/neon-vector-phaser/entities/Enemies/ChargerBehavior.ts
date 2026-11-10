import type { IEnemyBehavior } from "../../interfaces/IEnemyBehavior";
import { EnemyEntity } from "../EnemyEntity";
import { PlayerEntity } from "../PlayerEntity";

export class ChargerBehavior implements IEnemyBehavior {
    executeMovement(enemy: EnemyEntity, target: PlayerEntity, distance: number, angle: number): PlayerEntity | null {
        // Handle charging telegraph phase states
        if (distance < 360 && enemy.telegraph <= 0) {
            enemy.telegraph = 0.6;
        }

        let speed = enemy.speed;
        if (enemy.telegraph > 0.25) {
            speed *= enemy.telegraph < 0.45 ? 2.7 : 0.15; // Slow down to wind up, then rocket forward!
        }

        enemy.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

        if (distance < 30 && enemy.attackCooldown <= 0) {
            enemy.attackCooldown = 0.95;
            return target;
        }
        return null;
    }
}
