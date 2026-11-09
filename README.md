# Playroom Arcade

A static TypeScript arcade for browser-based game prototypes.

## Project layout

- [`src/engine/`](./src/engine/README.md) contains reusable browser-game lifecycle,
  input, player, canvas, object, and storage foundations.
- [`src/dashboard/`](./src/dashboard/) contains the game catalog and arcade
  launcher. Register each game in `registry.ts`.
- [`src/games/`](./src/games/) keeps each game's implementation, styles, rules,
  and design document together. See
  [Orbit Command](./src/games/orbit-command/GAME_DESIGN.md) and
  [Neon Ant Siege](./src/games/neon-ant-siege/GAME_DESIGN.md) and
  [Neon Vector](./src/games/neon-vector/README.md) and
  [Neon Vector: Phaser](./src/games/neon-vector-phaser/README.md) for game designs.
- Standalone HTML games can be registered as URL-loaded iframe entries. They
  do not need to use the engine; keep their original HTML intact and point the
  registry entry at it with Vite's asset URL handling.
- Every launched game gets a shared arcade menu (Escape or controller Start)
  with resume and quit-to-arcade actions. Engine-based
  games listen for the `arcade:pause` window event; iframe games can always be
  exited from the parent arcade menu, even when they cannot be paused.

## Local development

```sh
npm ci
npm run dev
```

`npm run build` runs the strict TypeScript build and creates the static site in
`dist/`.

## Container deployment

The [Dockerfile](./Dockerfile) builds the Vite site and serves only the compiled
assets with Nginx on port 80. On each push to `main`, the GitHub Actions
workflow builds the image and, if the build succeeds, publishes
`ghcr.io/<owner>/<repository>:latest`.

For Portainer, deploy the published GHCR image and expose container port `80`.
Ensure the package is public or configure registry credentials in Portainer.
