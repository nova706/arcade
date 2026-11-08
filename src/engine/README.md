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
5. Add a registry entry whose `mount(host, onExit, input, settings)` function
   mounts the game into the supplied element. Games that use the engine can
   consume the shared input manager and game-scoped settings store; call
   `onExit` when the player returns to the dashboard. The dashboard adds a
   universal arcade menu and dispatches `arcade:pause` with a boolean `detail`
   to pause/resume engine-based game loops.
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
mapping is A/B/X/Y/LB. The `start` action maps to the controller's Start button.
Axis values inside the 0.2 dead zone become zero.
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

## Extension boundaries

Particles, audio, networking, and scene management are not included until a
game needs them. Add them as isolated services with small typed
interfaces and documented lifecycle/ownership rules. A physics implementation
should own its bodies and fixed-step simulation; renderers should not mutate
game state. Avoid putting a game's rules, assets, colors, or terminology here.
