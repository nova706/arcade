import { EnemyEntity } from "../entities/EnemyEntity";
import { PlayerEntity } from "../entities/PlayerEntity";

export interface IEnemyBehavior {
    /** Calculates velocity vector steps and returns a target if an attack triggers */
    executeMovement(enemy: EnemyEntity, target: PlayerEntity, distance: number, angle: number): PlayerEntity | null;
}
