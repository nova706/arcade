import type { IEnemyBehavior } from "../interfaces/IEnemyBehavior";
import { ChaserBehavior } from "../entities/Enemies/ChaserBehavior";
import { RangerBehavior } from "../entities/Enemies/RangerBehavior";
import { ExploderBehavior } from "../entities/Enemies/ExploderBehavior";
import { ShielderBehavior } from "../entities/Enemies/ShielderBehavior";
import type { EnemyType } from "../types";

export class EnemyBehaviorFactory {
    static getBehavior(type: EnemyType): IEnemyBehavior {
        switch (type) {
            case "ranger":  return new RangerBehavior();
            case "exploder": return new ExploderBehavior();
            case "shielder": return new ShielderBehavior();
            case "boss":    return new ChaserBehavior(true);
            default:        return new ChaserBehavior(false); // standard/tank follow AI
        }
    }
}
