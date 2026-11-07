# Project Guide

This project is a lightweight TypeScript arcade for browser-based game
prototypes, hosted as static assets. The current structure and deployment steps
are described in the [project README](./README.md).

## Architecture

- Shared browser-game contracts live in [`src/engine/`](./src/engine/README.md):
  lifecycle, game objects, input, local player slots, canvas setup, and
  namespaced settings storage.
- The game picker and registration API live in [`src/dashboard/`](./src/dashboard/).
- Each game's rules, UI, rendering, persistence schema, styles, and design
  requirements belong in its own [`src/games/`](./src/games/) directory. See
  [Orbit Command's design](./src/games/orbit-command/GAME_DESIGN.md).
- Physics, particle systems, and other optional systems should only be added
  when a game needs them. Keep those systems isolated behind documented
  interfaces; do not make a specific game's rules or art part of the engine.

## Adding a game

1. Create `src/games/<game-id>/` and keep its implementation, styles, and
   `GAME_DESIGN.md` together.
2. Provide a mount function that receives a host element, shared `InputManager`,
   and dashboard exit callback.
3. Add a descriptor to `src/dashboard/registry.ts`; the dashboard dynamically
   loads the game when selected.
4. Run `npm run build` and test launch/return through the dashboard.

## Target and technology

- TypeScript strict mode, Vite, browser APIs, and static hosting.
- HTML Canvas 2D is used by Orbit Command; other games may use a different
  rendering approach.
- Gamepad input supports four stable local player slots. The engine maps A/B/X,
  Y, and LB to semantic actions, and also provides keyboard edge helpers.
- `localStorage` is per browser/device. Each game owns its settings schema,
  validation, versioning, and migrations.
- There is no runtime server or backend. Builds must remain static and
  self-contained.

## Container delivery

The root `Dockerfile` builds the Vite output and serves it with Nginx on port
80. GitHub Actions publishes the image to GHCR from pushes to the default
branch and version tags. Configure the resulting image and port 80 in Portainer;
the GHCR package must be public or Portainer must have registry credentials.
