# Neon Vector

## Overview

A top-down neon co-op swarm-survival game for one to four local players. The
team chooses a weapon, super, and minor ability for each player, then fights
waves of geometric enemies in a fixed cyberpunk arena. Players and enemies have
health and survive multiple hits.

Enemy density rises each wave. Every fifth wave adds a rotating objective:
capture a zone before it becomes a black hole, reach three timed checkpoints,
or defeat an armored tank. Every twentieth wave adds a boss in addition to the
fifth-wave objective.

## Loadouts

### Weapons

- **Shockwave:** short-range radial burst, slow rate, high damage, and strong
  knockback.
- **Orbit blade:** a rotating close-range melee attack that damages and pushes
  enemies away.
- **Prism beam:** a directional, long-range attack with high damage and light
  knockback.
- **Chain shock:** directional electrical damage that chains between nearby
  enemies.

### Super abilities

Super charge builds over time.

- **Defense bubble:** enemies are repelled from the safe area. Players inside
  heal and gain overshield, but cannot attack.
- **Damage totem:** heals teammates and boosts their damage inside its area.
- **Void tether:** pulls enemies inward and lowers their defenses.
- **Supernova:** deals heavy area damage and knockback.

### Minor abilities

- **Pulse mine:** plant a proximity-triggered explosion.
- **Blink:** teleport a short distance in the movement or aim direction.
- **Ghost phase:** become invisible until attacking or until the effect expires.
- **Repel barrier:** deploy a temporary barrier that pushes enemies away.

## Enemy roster

Fast chasers, telegraphed chargers, ranged attackers, splitters, armored tanks,
flankers, and a high-health boss have distinct geometric silhouettes and
behaviors. Enemy health and density scale with wave progression.

## Controls

- **Player 1 keyboard:** WASD move/aim, F fire, G minor ability, Q super.
- **Player 2 keyboard:** Arrow keys move/aim, Enter fire, Shift minor, `/` super.
- **Player 3 keyboard:** IJKL move/aim, U fire, O minor, P super.
- **Player 4 keyboard:** Numpad 8/5/4/6 move/aim, Numpad 0 fire, Numpad 1
  minor, Numpad 2 super.
- **Gamepad:** left stick move/aim, X fire, Y minor, LB super.
- **Mouse:** Player 1 aims with pointer and fires while holding the primary
  button.
- **Arcade menu:** Escape or controller Start opens the universal menu.

## Architecture

- `Game.ts` extends the shared `BaseGame` and owns the simulation lifecycle,
  entity collections, rules, wave progression, and event emission.
- `entities/` contains `GameObject`-based players, enemies, projectiles, areas,
  particles, and physics-backed objects. Entity health and destruction are
  explicit and independently inspectable.
- `events/EventBus.ts` provides typed, synchronous events for combat feedback,
  objectives, waves, and game-over state.
- `Renderer.ts` reads simulation state and draws the scene; it does not mutate
  game rules.
- `main.ts` owns DOM setup, arcade input mapping, saved loadouts, and the frame
  loop.
- Player/enemy movement and arena boundaries use the shared Matter.js
  `PhysicsWorld`, configured without gravity. The engine's fixed-step update
  keeps physics independent of the display frame rate.

This separation is intended to keep gameplay inspectable and debuggable: start
with `Game.ts` for lifecycle and rules, entity classes for object state, the
event bus for cross-system notifications, or `Renderer.ts` for visual output.
