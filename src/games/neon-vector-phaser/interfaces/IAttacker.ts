import type { NeonVectorScene } from "../scene/NeonVectorScene";
import type { StatComponent } from "../systems/stats/StatComponent";

export interface IAttacker {
    id: string;
    x: number;
    y: number;
    attackAngle: number;
    color: number;          // Visual effect tracking
    scene: NeonVectorScene; // Central game state access
    playerIndex?: number;      // Optional player index for team-based logic
    setPosition: (x: number, y: number) => void
    stats: StatComponent
}
