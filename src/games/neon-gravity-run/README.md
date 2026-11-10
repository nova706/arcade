# Neon Gravity Run

## Overview

A fixed-screen, side-view parkour platform game for one to four local players.
Players control neon stick figures through a cyberpunk obstacle course where
every jump reverses that player's gravity: a jump from below sends the player
toward the ceiling, and a jump from above sends them back toward the floor.
The character flips upside down as gravity changes, allowing them to run along
the opposite-facing surfaces of platforms.

The whole level remains visible; the camera does not scroll. In versus play,
the first player to reach the goal wins. In single-player play, the objective
is to reach the goal.

## Visual Style

- Use the arcade's neon, cyberpunk visual language, with bright stickman
  silhouettes against a dark environment.
- Make gravity direction, jump transitions, platform surfaces, remaining
  lives, and the goal easy to read at a glance.
- Render the floor and ceiling as slowly flowing lava. Lava contact costs a
  life and returns the player to the starting point.
- Keep the fixed level legible at the target playfield size, with screen-safe
  margins and clear gaps between platforms.

## Match Rules

- Support single-player and local PvP for up to four players.
- Each player starts with five lives.
- Touching the lava floor or ceiling costs one life and respawns the player at
  the beginning of the level.
- When a player's lives are exhausted, they are out of the round.
- The first player to enter the goal successfully wins a PvP round. In
  single-player mode, successfully entering the goal completes the level.

## Movement and Gravity

- Players can run left and right while grounded and while airborne.
- Each jump inverts gravity for that player and flips their character so they
  can run on a surface above them.
- Players can jump from the floor toward a ceiling platform, or from the
  ceiling toward a floor platform. The level must provide reachable landing
  surfaces for both transitions.
- A player can land and run on the underside of a platform while pulled
  upward, or jump from its top while inverted and flip to land on its upper
  surface.
- Preserve gaps between platforms so players must time jumps and steer in the
  air rather than traverse a continuous walkway.

## Level Layout

- Build a single, fully visible side-view course with a clear starting point
  and finish.
- Use floor and ceiling platforms as the main routes. Arrange their positions
  and gaps to require alternating gravity transitions.
- Add middle platforms to increase difficulty and divide the course into two
  main lanes: floor-to-middle and middle-to-ceiling.
- Treat middle platforms like other platforms: players may attach to their
  underside while pulled upward, or land and run on top of them.
- Keep the layout fair for every player spawn and make hazards and possible
  landing surfaces visually distinct.

## Goal

The finish is a static circular object with an approximately 45-degree section
removed. The opening may face any direction, but remains static during play;
the current level faces it downward. To finish, a player must jump into the
opening and land on the goal pad inside the cut-out section; merely touching
the outside of the circle does not count. On successful entry, the player
shrinks inside the goal, an immediate win message is shown, and a result screen
confirms the winner or single-player completion.

## Controls

Each player has independent keyboard bindings:

- Player 1: A/D to move, W to jump.
- Player 2: left/right arrows to move, Up to jump.
- Player 3: J/L to move, I to jump.
- Player 4: Numpad 4/6 to move, Numpad 8 to jump.
- Gamepad: left stick or D-pad to move, A to jump. Press A on an unassigned
  controller to join its player slot; disconnected controllers do not reserve
  their slots.
- Escape or controller Start opens the shared arcade menu.

## Phaser Architecture

Implemented as a separate Phaser 4 game, following the data, base-class,
entity, system, and scene organization used by Neon Vector: Phaser.

- `scene/NeonGravityRunScene.ts` is the Phaser Scene and composition root. It
  owns level setup, match lifecycle, respawns, and round completion.
- `data/GameData.ts` defines the fixed level, player count, lives, physics
  tuning, and goal opening.
- `entities/` contains the shared base entity and the player, platform, lava,
  goal, and HUD entities.
- `systems/` separates keyboard/gamepad input, one-way platform collision,
  lava hazards, and goal validation.
- Phaser 4 Arcade Physics applies per-player gravity, keeping each player's
  jump inversion independent.

The game is registered in the arcade dashboard and uses its shared pause menu
and game-scoped preferences.
