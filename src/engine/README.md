# Shared Game Engine

The engine contains browser-game services that are intentionally independent of
any one game's rules or visual design. The arcade dashboard and each game are
separate modules; new games register a launch adapter in
[`src/dashboard/registry.ts`](../dashboard/registry.ts).

## Building a game

1. Add a directory under `src/games/<game-id>/`.
2. Define game-specific state, setup, rules, renderer, persistence schema, and
   styles inside that directory.
3. Implement `BaseGame<State, Setup>` for simulation lifecycle when the game
   needs a stateful simulation. Keep game rules out of engine classes.
4. Extend `CanvasRenderer` for canvas games, or use another rendering surface
   for a game with a different visual architecture.
5. Add a registry entry whose `mount(host, onExit, input, settings, gameMenu)`
   function mounts the game into the supplied element. Games that use the
   engine can consume the shared input manager and game-scoped settings store;
   call `onExit` when the player returns to the dashboard. The dashboard adds
   a universal arcade menu and dispatches `arcade:pause` with a boolean `detail`
   to pause/resume engine-based game loops. Games may register additional menu
   buttons through `gameMenu`; keep any resulting game-specific screens in the
   game itself.
6. Document the game's design and controls alongside its implementation.

An existing self-contained HTML game does not need to be adapted to the engine.
Reference its HTML file as a Vite asset URL and load it in an iframe from the
registry adapter. This keeps the original document unchanged while ensuring
Vite copies it into the production site.

## Services

### `BaseGame<State, Setup>`

The minimal lifecycle contract. `state` is nullable before start and after
`stop()`. A game implements `start(setup)` and `update(deltaSeconds)`. The host
owns scheduling; simulations should clamp large deltas or use their own fixed
step if deterministic physics is required.

### `GameObject`

An optional entity base with stable identity, active/destroyed state, an
`update(deltaSeconds)` hook, and an idempotent `destroy()` lifecycle. Games can
own plain objects instead; this is not an ECS requirement.

### `InputManager`

Poll `poll()` once per frame to receive up to four controller snapshots. Each
snapshot has normalized stick axes and edge-triggered semantic actions:
`confirm`, `cancel`, `primary`, `secondary`, and `tertiary`. The current browser
compatibility mapping for those actions is A/B/X/Y/LB. The `start` action maps
to the controller's Start button. Axis values inside the 0.2 dead zone become
zero.
`getGamepadStatuses()` returns joined player slots with raw axis values, pressed
button indexes, device identity, and mapping. `getUnassignedGamepads()` reports
connected controllers that have not joined. A controller only reserves the
next open player slot after its A/confirm button is pressed, so an idle or
stale browser gamepad slot cannot take Player 1. Gamepad discovery still
depends on browser focus and user input.
Controller button values, down states, press edges, and axes are available in
each `PlayerInput` snapshot. `ControllerInput` is the enum for standard controls;
`getControllerValue`, `isControllerDown`, and `isControllerPressed` resolve
them without relying on raw button indexes in game code. Each engine-backed
game keeps its editable keyboard and controller bindings in a local `input.ts`
file (except standalone Stickman Clash).
Keyboard helpers expose `isKeyDown()` and consume-once `consumeKeyPress()`.
Gameplay should consume snapshots rather than call `navigator.getGamepads()`.

### `PlayerManager`

Manages stable local player slots mapped to the matching gamepad indices.
Configure one to four local players for a match. Game-specific faction, team,
and bot rules remain in the game implementation.

### `CanvasRenderer`

Provides high-DPI canvas sizing and a 2D context. Extend it for a canvas-based
game; drawing and hit testing remain game-specific. Non-canvas games can use a
different renderer without changing the engine contract.

### `PhysicsWorld`

Owns a Matter.js 2D world and provides rectangle and circle bodies, positions,
velocities, scaling, removal, and fixed 60 Hz stepping. Gravity is configurable
per world and defaults to downward gravity. Velocity helpers use pixels per
second; the service converts them to Matter.js's per-step representation.
Games own their physics bodies and should clear the world when a run ends.

### `SettingsStore`

Reads and writes JSON under caller-provided keys. The game owns validation,
versioning, defaults, and migration policy. Parse, quota, and access errors are
not swallowed; callers should report them through their normal error surface.
The dashboard passes each registered game a namespace-scoped store, so its
keys are isolated from settings belonging to other games.

### `GameMenuContext`

Games can register a labeled button in the universal pause menu with
`registerPauseMenuAction(label, onSelect)`. The callback receives controls to
close the menu while keeping the game paused, or reopen it later. The game owns
the behavior and any screens shown by the action; the shared menu only hosts
buttons.

## Extension boundaries

Particles, audio, networking, and scene management are not included until a
game needs them. Add them as isolated services with small typed
interfaces and documented lifecycle/ownership rules. A physics implementation
should own its bodies and fixed-step simulation; renderers should not mutate
game state. Avoid putting a game's rules, assets, colors, or terminology here.
