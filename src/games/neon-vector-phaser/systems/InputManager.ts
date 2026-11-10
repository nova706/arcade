import Phaser from "phaser";
import { getControllerValue, InputManager, isControllerDown, isControllerPressed, type PlayerInput } from "../../../engine";
import type { PlayerEntity } from "../entities/PlayerEntity";
import { CONTROLLER_INPUTS, KEYBOARD_INPUTS } from "../input";
import type { NeonVectorScene } from "../scene/NeonVectorScene";
import type { PlayerCommand } from "../types";

const PREVENT_DEFAULT_KEYS = new Set([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);

export class InputSystem {

    private readonly downKeys = new Set<string>();
    private readonly pressedKeys = new Set<string>();
    private mouseDown = false;
    private mouseMinorPressed = false;
    private mouseX = 0;
    private mouseY = 0;

    constructor(
        private readonly gamepads: InputManager,
        private readonly scene: NeonVectorScene,
    ) {}

    public start(): void {
        this.scene.input.mouse?.disableContextMenu();
        this.scene.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
            this.mouseX = pointer.worldX;
            this.mouseY = pointer.worldY;
        });
        this.scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
            if (pointer.leftButtonDown()) this.mouseDown = true;
            if (pointer.rightButtonDown()) this.mouseMinorPressed = true;
        });
        this.scene.input.on("pointerup", () => { this.mouseDown = false; });
    }

    public readCommand(index: number, controller: PlayerInput | undefined, player: PlayerEntity): PlayerCommand {
        const keys = KEYBOARD_INPUTS[index];
        if (!keys) return this.emptyCommand();
        const moveX = Number(this.downKeys.has(keys.right)) - Number(this.downKeys.has(keys.left))
            + getControllerValue(controller, CONTROLLER_INPUTS.moveX);
        const moveY = Number(this.downKeys.has(keys.down)) - Number(this.downKeys.has(keys.up))
            + getControllerValue(controller, CONTROLLER_INPUTS.moveY);
        const pointerAim = index === 0 && this.mouseDown;
        const rightX = getControllerValue(controller, CONTROLLER_INPUTS.aimX);
        const rightY = getControllerValue(controller, CONTROLLER_INPUTS.aimY);
        const stickAim = Math.abs(rightX) + Math.abs(rightY) > 0.2;
        return {
            moveX,
            moveY,
            aimX: pointerAim ? this.mouseX - player.x : stickAim ? rightX : moveX,
            aimY: pointerAim ? this.mouseY - player.y : stickAim ? rightY : moveY,
            fire: this.downKeys.has(keys.fire) || isControllerDown(controller, CONTROLLER_INPUTS.fire) || pointerAim,
            useMinor: this.consumeKeyPress(keys.minor)
                || isControllerPressed(controller, CONTROLLER_INPUTS.minor)
                || (index === 0 && this.consumeMouseMinorPress()),
            useSuper: this.consumeKeyPress(keys.super) || isControllerPressed(controller, CONTROLLER_INPUTS.super),
        };
    }

    public pollGamepads(): PlayerInput[] {
        return this.gamepads.poll();
    }

    private consumeKeyPress(key: string): boolean {
        if (!this.pressedKeys.has(key)) return false;
        this.pressedKeys.delete(key);
        return true;
    }

    private consumeMouseMinorPress(): boolean {
        if (!this.mouseMinorPressed) return false;
        this.mouseMinorPressed = false;
        return true;
    }

    clearKeyState(): void {
        this.clearKeys();
    }

    public readonly onKeyDown = (event: KeyboardEvent): void => {
        if (PREVENT_DEFAULT_KEYS.has(event.key)) event.preventDefault();
        const key = this.keyName(event);
        if (!this.downKeys.has(key)) this.pressedKeys.add(key);
        this.downKeys.add(key);
    };

    public readonly onKeyUp = (event: KeyboardEvent): void => {
        this.downKeys.delete(this.keyName(event));
    };

    public readonly clearKeys = (): void => {
        this.downKeys.clear();
        this.pressedKeys.clear();
    };

    private keyName(event: KeyboardEvent): string {
        if (event.code.startsWith("Numpad")) return event.code;
        return event.key.length === 1 ? event.key.toLowerCase() : event.key;
    }

    private emptyCommand(): PlayerCommand {
        return { moveX: 0, moveY: 0, aimX: 0, aimY: -1, fire: false, useMinor: false, useSuper: false };
    }
}
