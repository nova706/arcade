import type { IEnemyBehavior } from "../../interfaces/IEnemyBehavior";
import { EnemyEntity } from "../EnemyEntity";
import { PlayerEntity } from "../PlayerEntity";

export class RangerBehavior implements IEnemyBehavior {
    executeMovement(enemy: EnemyEntity, target: PlayerEntity, distance: number, angle: number): PlayerEntity | null {
        let speed = enemy.speed;
        
        // Back pedal if players get too close
        if (distance < 260) {
            speed *= -0.75;
        }
        
        enemy.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

        if (distance < 300) {
            if (enemy.attackCooldown <= 0) {
                enemy.attackCooldown = 0.95;
                enemy.scene.addProjectile(
                    enemy.x,
                    enemy.y,
                    Math.cos(angle),
                    Math.sin(angle),
                    distance,
                    enemy.color,
                    0.12,
                );
                return target;
            }
        }
        return null;
    }
}
