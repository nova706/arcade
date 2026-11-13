import { EnemyChaser } from "../entities/Enemies/EnemyChaser";
import { EnemyRanger } from "../entities/Enemies/EnemyRanger";
import { EnemyExploder } from "../entities/Enemies/EnemyExploder";
import { EnemyShielder } from "../entities/Enemies/EnemyShielder";
import type { EnemyType } from "../types";
import type { EnemyEntity } from "../entities/Enemies/EnemyEntity";
import type { NeonVectorScene } from "../scene/NeonVectorScene";

export class EnemyFactory {
    static create(scene: NeonVectorScene, x: number, y: number, type: EnemyType, wave: number): EnemyEntity {
        switch (type) {
            case "ranger": return new EnemyRanger(scene, x, y, type, wave);
            case "exploder": return new EnemyExploder(scene, x, y, type, wave);
            case "shielder": return new EnemyShielder(scene, x, y, type, wave);
            case "boss": return new EnemyChaser(scene, x, y, type, wave);
            default: return new EnemyChaser(scene, x, y, type, wave);
        }
    }
}
