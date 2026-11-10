import type { NeonVectorScene } from "../scene/NeonVectorScene";

export interface IAttacker {
    x: number;
    y: number;
    attackAngle: number;
    color: number;          // Visual effect tracking
    attackBoost: number;    // Multiplier step (0 or higher)
    invisibleTime: number;  // Used to break stealth when shooting
    scene: NeonVectorScene; // Central game state access
    playerIndex?: number;      // Optional player index for team-based logic
}
