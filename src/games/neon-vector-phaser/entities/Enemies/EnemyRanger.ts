import { EnemyEntity } from "./EnemyEntity";
import { PlayerEntity } from "../PlayerEntity";

export class EnemyRanger extends EnemyEntity {
    
    protected override executeMovement(target: PlayerEntity, distance: number, angle: number): PlayerEntity | null {
        let speed = this.speed;
        
        // Back pedal if players get too close
        if (distance < 260) {
            speed *= -0.75;
        }
        
        this.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

        if (distance < 300) {
            if (this.attackCooldown <= 0) {
                this.attackCooldown = 0.95;
                this.scene.effectsManager.addProjectile(
                    this.x,
                    this.y,
                    Math.cos(angle),
                    Math.sin(angle),
                    distance,
                    this.color,
                    0.12,
                );
                return target;
            }
        }
        return null;
    }
}
