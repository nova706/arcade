import { EnemyChaser } from "../Enemies/EnemyChaser";
import { EnemyRanger } from "../Enemies/EnemyRanger";
import { EnemyExploder } from "../Enemies/EnemyExploder";
import { EnemyShielder } from "../Enemies/EnemyShielder";
import type { EnemyType } from "../../types";
import type { EnemyEntity } from "../Enemies/EnemyEntity";
import type { NeonVectorScene } from "../../scene/NeonVectorScene";

type Constructor = new (
    scene: NeonVectorScene,
    x: number,
    y: number,
    type: EnemyType,
    wave: number) => EnemyEntity

const REGISTRY: Record<EnemyType, Constructor> = {
    ranger: EnemyRanger,
    exploder: EnemyExploder,
    shielder: EnemyShielder,
    boss: EnemyChaser,
    chaser: EnemyChaser,
    splitter: EnemyChaser,
    tank: EnemyChaser,
    flanker: EnemyChaser
};

export const EnemyFactory = {
    create(scene: NeonVectorScene, x: number, y: number, type: EnemyType, wave: number): EnemyEntity {
        const EntityClass = REGISTRY[type];
        if (!EntityClass) throw new Error(`Enemy type ${type} not found`);
        return new EntityClass(scene, x, y, type, wave);
    }
}
