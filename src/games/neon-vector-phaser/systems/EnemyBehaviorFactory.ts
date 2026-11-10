import type { IEnemyBehavior } from "../interfaces/IEnemyBehavior";
import { ChaserBehavior } from "../entities/Enemies/ChaserBehavior";
import { RangerBehavior } from "../entities/Enemies/RangerBehavior";
import { ChargerBehavior } from "../entities/Enemies/ChargerBehavior";
import type { EnemyType } from "../types";

export class EnemyBehaviorFactory {
    static getBehavior(type: EnemyType): IEnemyBehavior {
        switch (type) {
            case "ranger":  return new RangerBehavior();
            case "charger": return new ChargerBehavior();
            case "boss":    return new ChaserBehavior(true);
            default:        return new ChaserBehavior(false); // standard/tank follow AI
        }
    }
}
