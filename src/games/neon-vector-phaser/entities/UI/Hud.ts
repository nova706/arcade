import Phaser from "phaser";
import type { NeonVectorScene } from "../../scene/NeonVectorScene";
import { ObjectiveTimerBar } from "./ObjectiveTimerBar";
import { PlayerHudRow } from "./PlayerHudRow";

export type HudAnchor =

    | "top-left" | "top-center" | "top-right"
    | "center-left" | "center" | "center-right"
    | "bottom-left" | "bottom-center" | "bottom-right";

export interface HudSlotOptions {
    anchor: HudAnchor;
    offsetX?: number;
    offsetY?: number;
    getWidth?: () => number;
    getHeight?: () => number;
}

interface HudSlot {
    object: Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform;
    options: Required<HudSlotOptions>;
}

export class Hud extends Phaser.GameObjects.Container {
    public readonly scene: NeonVectorScene;
    private readonly screenPadding = 18;
    private slots: HudSlot[] = [];

    private waveText: Phaser.GameObjects.Text;
    private objectiveBar: ObjectiveTimerBar;
    private playerRow: PlayerHudRow;

    constructor(scene: NeonVectorScene) {
        super(scene, 0, 0);
        this.scene = scene;
        this.setScrollFactor(0);
        this.setDepth(100);

        // 1. Top-Center: Wave & Enemy Counter
        // Origin (0.5, 0) + getWidth: () => 0 anchors the exact text center to screenWidth / 2
        this.waveText = scene.add.text(0, 0, "", {
            color: "#eaf2ff",
            fontFamily: "monospace",
            fontSize: "14px",
            fontStyle: "bold",
            stroke: "#080916",
            strokeThickness: 3,
        }).setOrigin(0.5, 0);

        this.addWidget(this.waveText, {
            anchor: "top-center",
            getWidth: () => 0,
            getHeight: () => this.waveText.height,
        });

        // 2. Top-Center (Below Wave Text): Objective Timer Bar
        this.objectiveBar = new ObjectiveTimerBar(scene);
        this.addWidget(this.objectiveBar, {
            anchor: "top-center",
            offsetY: 42,
            getWidth: () => this.objectiveBar.barWidth,
            getHeight: () => this.objectiveBar.barHeight,
        });

        // 3. Bottom-Center: Up to 4 Player Cards (Left to Right)
        this.playerRow = new PlayerHudRow(scene);
        this.addWidget(this.playerRow, {
            anchor: "bottom-center",
            getWidth: () => this.playerRow.totalWidth,
            getHeight: () => this.playerRow.totalHeight,
        });

        this.scene.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
        this.layout();
    }

    public addWidget(
        object: Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform,
        options: HudSlotOptions
    ): void {
        const resolved: Required<HudSlotOptions> = {
            anchor: options.anchor,
            offsetX: options.offsetX ?? 0,
            offsetY: options.offsetY ?? 0,
            getWidth: options.getWidth ?? (() => ("width" in object ? (object as any).width : 0)),
            getHeight: options.getHeight ?? (() => ("height" in object ? (object as any).height : 0)),
        };

        const slot: HudSlot = { object, options: resolved };
        this.slots.push(slot);
        this.add(object);
        this.positionSlot(slot);
    }

    public layout(): void {
        for (const slot of this.slots) {
            this.positionSlot(slot);
        }
    }

    private positionSlot(slot: HudSlot): void {
        const { width: screenW, height: screenH } = this.scene.scale;
        const pad = this.screenPadding;
        const { anchor, offsetX, offsetY, getWidth, getHeight } = slot.options;

        const w = getWidth();
        const h = getHeight();

        let x = pad;
        let y = pad;

        if (anchor.endsWith("center")) {
            x = (screenW - w) * 0.5;
        } else if (anchor.endsWith("right")) {
            x = screenW - w - pad;
        }

        if (anchor.startsWith("center")) {
            y = (screenH - h) * 0.5;
        } else if (anchor.startsWith("bottom")) {
            y = screenH - h - pad;
        }

        slot.object.setPosition(x + offsetX, y + offsetY);
    }

    public update(): void {
        // 1. Top-Center Wave Counter
        const wave = String(this.scene.waveManager.wave).padStart(2, "0");
        const enemyCount = this.scene.getEnemies().length;
        this.waveText.setText(`WAVE ${wave}  ·  ENEMIES ${enemyCount}`);

        // 2. Top-Center Objective Bar
        const objMgr = this.scene.objectiveManager;
        this.objectiveBar.render(
            objMgr.objective,
            objMgr.objectiveTimer,
            objMgr.getProgressRatio()
        );

        // 3. Bottom-Center Player Cards (re-center only if player count changes)
        const playerCountChanged = this.playerRow.render(this.scene.getPlayers());
        if (playerCountChanged) {
            this.layout();
        }
    }

    public override destroy(fromScene?: boolean): void {
        this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this);
        super.destroy(fromScene);
    }
}
