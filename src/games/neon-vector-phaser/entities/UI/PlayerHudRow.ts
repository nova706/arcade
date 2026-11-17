import Phaser from "phaser";
import { PlayerHudCard } from "./PlayerHudCard";
import type { PlayerEntity } from "../PlayerEntity";

export class PlayerHudRow extends Phaser.GameObjects.Container {
    private cards: PlayerHudCard[] = [];
    private readonly gap = 28;
    public totalWidth = 0;
    public readonly totalHeight = PlayerHudCard.HEIGHT;

    constructor(scene: Phaser.Scene) {
        super(scene, 0, 0);

        for (let i = 0; i < 4; i++) {
            const card = new PlayerHudCard(scene);
            card.setVisible(false);
            this.cards.push(card);
            this.add(card);
        }
    }

    /**
     * Updates visible player cards and returns true if the player count changed.
     */
    public render(players: PlayerEntity[]): boolean {
        const sorted = [...players].sort((a, b) => a.playerData.index - b.playerData.index);
        const count = Math.min(4, sorted.length);
        const newWidth = count > 0
            ? count * PlayerHudCard.WIDTH + (count - 1) * this.gap
            : 0;

        const sizeChanged = newWidth !== this.totalWidth;
        this.totalWidth = newWidth;

        for (let i = 0; i < 4; i++) {
            const card = this.cards[i];
            if (i < count) {
                card.setVisible(true);
                card.setPosition(i * (PlayerHudCard.WIDTH + this.gap), 0);
                card.render(sorted[i]);
            } else {
                card.setVisible(false);
            }
        }

        return sizeChanged;
    }
}
