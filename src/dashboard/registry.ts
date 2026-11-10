import type { InputManager, NamespacedSettingsStore } from "../engine";

const stickmanClashUrl = new URL("../games/stickman-clash/index.html", import.meta.url).href;

export interface GameEntry {
    id: string;
    title: string;
    subtitle: string;
    description: string;
    controls: string;
    accent: string;
    mount(host: HTMLElement, onExit: () => void, input: InputManager, settings: NamespacedSettingsStore): Promise<void>;
}

export const games: readonly GameEntry[] = [
    {
        id: "orbit-command",
        title: "Orbit Command",
        subtitle: "Territory strategy",
        description: "Build your economy, plan adjacent routes, and take control of the map.",
        controls: "Gamepad or keyboard",
        accent: "#45e0d0",
        async mount(host, onExit, input) {
            const game = await import("../games/orbit-command/main");
            game.mountOrbitCommand(host, onExit, input);
        },
    },
    {
        id: "neon-ant-siege",
        title: "Neon Ant Siege",
        subtitle: "Co-op wave survival",
        description: "Stand together, swing hard, and hold the neon platforms against an endless ant siege.",
        controls: "Keyboard or gamepad · 1–4 players",
        accent: "#ff3b63",
        async mount(host, onExit, input, settings) {
            const game = await import("../games/neon-ant-siege/main");
            game.mountNeonAntSiege(host, onExit, input, settings);
        },
    },
    //   {
    //     id: "neon-vector",
    //     title: "Neon Vector",
    //     subtitle: "Co-op swarm survival",
    //     description: "Build a crew, tune your loadouts, and fight an evolving geometric swarm together.",
    //     controls: "1–4 players · Keyboard, mouse, or gamepad",
    //     accent: "#bd72ff",
    //     async mount(host, onExit, input, settings) {
    //       const game = await import("../games/neon-vector/main");
    //       game.mountNeonVector(host, onExit, input, settings);
    //     },
    //   },
    {
        id: "neon-vector",
        title: "Neon Vector",
        subtitle: "Co-op swarm survival",
        description: "Build a crew, tune your loadouts, and fight an evolving geometric swarm together.",
        controls: "1–4 players · Keyboard, mouse, or gamepad",
        accent: "#bd72ff",
        async mount(host, onExit, input, settings) {
            const game = await import("../games/neon-vector-phaser/main");
            await game.mountNeonVectorPhaser(host, onExit, input, settings);
        },
    },
    {
        id: "stickman-clash",
        title: "Stickman Clash",
        subtitle: "Arena fighter",
        description: "A colorful stickman arena fighter with solo, versus, and three-player modes.",
        controls: "Keyboard or gamepad",
        accent: "#66fcf1",
        async mount(host, onExit) {
            const shell = document.createElement("div");
            shell.className = "standalone-game";

            const frame = document.createElement("iframe");
            frame.className = "standalone-game-frame";
            frame.src = stickmanClashUrl;
            frame.title = "Stickman Clash: 3-Player Supreme Edition";
            frame.allow = "gamepad";

            const exit = document.createElement("button");
            exit.className = "standalone-game-exit";
            exit.type = "button";
            exit.textContent = "ARCADE";
            exit.addEventListener("click", onExit, { once: true });

            shell.append(frame, exit);
            host.replaceChildren(shell);
        },
    },
];
