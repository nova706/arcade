# Neon Vector: Phaser

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

- **Shockwave:** low-damage, short-range radial wave with an expanding ring
  effect and very strong outward knockback.
- **Orbit blade:** a rotating melee attack with increased reach; firing triggers
  a heavy outward strike with high damage and knockback.
- **Prism beam:** a directional, long-range attack with high damage and light
  knockback.
- **Chain shock:** a forward electrical burst that chains between nearby
  enemies; it draws an arc burst and enemy-to-enemy links rather than a laser.

Weapon damage, cooldown, reach, knockback, and chain/burst values live in
`data/Loadouts.ts` and are shown in the loadout screen.

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
- **Ghost phase:** become nearly invisible and untargetable until attacking or
  until the effect expires.
- **Repel barrier:** deploy a temporary line barrier that physically pushes
  enemies away when they contact it.

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
- **Gamepad:** left stick move, right stick aim, RT fire, LT minor, RB super.
- **Mouse:** Player 1 aims with pointer and fires while holding the primary
  button.
- **Arcade menu:** Escape or controller Start opens the universal menu.

## Phaser architecture

This implementation is a separate game from the original Neon Vector and uses
Phaser 4's MIT-licensed framework and Arcade Physics.

- `scene/NeonVectorScene.ts` is the Phaser Scene and the composition root. It
  owns the wave and objective director, input translation, cross-entity combat,
  and scene lifecycle.
- `entities/` contains Phaser Game Objects that own their visual children,
  transforms, and (for players/enemies) Arcade Physics bodies. Each actor has
  per-frame and fixed-step update methods. The Scene schedules their fixed-step
  hooks from the Arcade Physics world-step event.
- `data/Loadouts.ts` contains reusable default loadout data and player colors;
  saved selections are plain data in the game-scoped settings store.
- `main.ts` hosts Phaser inside the arcade, provides the loadout screen, and
  bridges the arcade input/settings/pause contracts.

Phaser 4.2.1 is installed from npm. Its Arcade Physics owns movement and world
bounds, with zero gravity for the top-down arena. The existing game's design
brief remains the baseline; this version is intended to make object ownership,
scene lifecycle, and per-entity behavior easier to inspect.

The arena uses a fixed 1280 × 720 logical playfield. Phaser's FIT scale mode
scales the complete arena to the available stage without changing its world
bounds, and enemy spawns stay at least 64 logical pixels from each edge so the
largest enemy and its health bar remain visible.
