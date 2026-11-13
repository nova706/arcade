import { EnemyEntity } from "./EnemyEntity";
import { PlayerEntity } from "../PlayerEntity";

export class EnemyChaser extends EnemyEntity {

    override executeMovement(target: PlayerEntity, distance: number, angle: number): PlayerEntity | null {
        const speed = this.speed * (this.type === "boss" ? 0.8 : 1);
        this.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

        const attackRange = this.type === "boss" ? 56 : 30;
        if (distance < attackRange && this.attackCooldown <= 0) {
            this.attackCooldown = this.type === "boss" ? 1.4 : 0.95;
            return target;
        }
        return null;
    }
}
