import Phaser from "phaser";
import type { PlayerEntity } from "../PlayerEntity";

export class PlayerHudCard extends Phaser.GameObjects.Container {
    private graphics: Phaser.GameObjects.Graphics;
    private nameText: Phaser.GameObjects.Text;
    private hpText: Phaser.GameObjects.Text;

    public static readonly WIDTH = 186;
    public static readonly HEIGHT = 36;

    private readonly hpBarWidth = 136;
    private readonly hpBarHeight = 10;
    private readonly meterWidth = 12;
    private readonly meterHeight = 32;

    constructor(scene: Phaser.Scene) {
        super(scene, 0, 0);

        this.graphics = scene.add.graphics();

        // Top-left: Player tag (e.g., "P1")
        this.nameText = scene.add.text(0, 0, "", {
            fontFamily: "monospace",
            fontSize: "13px",
            fontStyle: "bold",
            stroke: "#080916",
            strokeThickness: 3,
        });

        // Top-right of HP section: Numeric HP + Shield readout
        this.hpText = scene.add.text(this.hpBarWidth, 1, "", {
            color: "#eaf2ff",
            fontFamily: "monospace",
            fontSize: "11px",
            stroke: "#080916",
            strokeThickness: 3,
        }).setOrigin(1, 0);

        this.add([this.graphics, this.nameText, this.hpText]);
    }

    public render(player: PlayerEntity): void {
        this.graphics.clear();

        const playerColor = player.color ?? 0x05d9e8;
        const hexColor = `#${playerColor.toString(16).padStart(6, "0")}`;

        // Calculate ratios
        const maxHp = Math.max(1, player.stats.getStat("maxHealth"));
        const hpRatio = Phaser.Math.Clamp(player.currentHealth / maxHp, 0, 1);
        const maxShield = Math.max(1, player.stats.getStat("maxOvershield"));
        const shieldRatio = Phaser.Math.Clamp(player.currentOvershield / maxShield, 0, 1);

        const minorRatio = Phaser.Math.Clamp(player.abilityChargePercent / 100, 0, 1);
        const superRatio = Phaser.Math.Clamp(player.superChargePercent / 100, 0, 1);

        const isCritical = hpRatio <= 0.25 && player.alive;
        const hpFillColor = !player.alive ? 0x3a3f54 : isCritical ? 0xff2a6d : playerColor;

        // 1. Labels
        this.nameText.setText(`P${player.playerData.index + 1}`);
        this.nameText.setColor(player.alive ? hexColor : "#5c647d");

        if (!player.alive) {
            this.hpText.setText("DOWN");
            this.hpText.setColor("#ff2a6d");
        } else {
            const shieldStr = player.currentOvershield > 0 ? ` +${Math.ceil(player.currentOvershield)}` : "";
            this.hpText.setText(`${Math.ceil(player.currentHealth)}${shieldStr}`);
            this.hpText.setColor("#eaf2ff");
        }

        // 2. Horizontal Health Bar (bottom-left of card)
        const hpY = 18;
        this.graphics.fillStyle(0x0b0e17, 0.85);
        this.graphics.fillRect(0, hpY, this.hpBarWidth, this.hpBarHeight);

        if (hpRatio > 0) {
            this.graphics.fillStyle(hpFillColor, 1);
            this.graphics.fillRect(0, hpY, this.hpBarWidth * hpRatio, this.hpBarHeight);
        }

        // Overshield overlay bar (thin glowing cyan/white strip along top of HP bar)
        if (shieldRatio > 0) {
            this.graphics.fillStyle(0x7df9ff, 0.95);
            this.graphics.fillRect(0, hpY, this.hpBarWidth * shieldRatio, 3);
        }

        this.graphics.lineStyle(1.5, hpFillColor, 0.9);
        this.graphics.strokeRect(0, hpY, this.hpBarWidth, this.hpBarHeight);

        // 3. Vertical Minor Ability Bar (fills bottom-to-top)
        const minorX = this.hpBarWidth + 10;
        this.drawVerticalMeter(minorX, 2, minorRatio, 0x05d9e8, playerColor);

        // 4. Vertical Super Ability Bar (fills bottom-to-top)
        const superX = minorX + this.meterWidth + 6;
        this.drawVerticalMeter(superX, 2, superRatio, 0xf9c80e, 0xfff3a1);
    }

    private drawVerticalMeter(
        x: number,
        y: number,
        ratio: number,
        chargingColor: number,
        readyColor: number
    ): void {
        const isReady = ratio >= 1;
        const activeColor = isReady ? readyColor : chargingColor;

        // Background track
        this.graphics.fillStyle(0x0b0e17, 0.85);
        this.graphics.fillRect(x, y, this.meterWidth, this.meterHeight);

        // Bottom-up fill
        const fillHeight = this.meterHeight * ratio;
        if (fillHeight > 0) {
            this.graphics.fillStyle(activeColor, isReady ? 1 : 0.75);
            this.graphics.fillRect(
                x,
                y + (this.meterHeight - fillHeight),
                this.meterWidth,
                fillHeight
            );
        }

        // Border (brightens when ready)
        this.graphics.lineStyle(1.5, activeColor, isReady ? 1 : 0.6);
        this.graphics.strokeRect(x, y, this.meterWidth, this.meterHeight);
    }
}
