# Neon Gravity Run

## Overview

A fixed-screen, side-view parkour platform game for one to four local players.
Players control neon stick figures through a cyberpunk obstacle course where
every jump reverses that player's gravity: a jump from below sends the player
toward the ceiling, and a jump from above sends them back toward the floor.
The character flips upside down as gravity changes, allowing them to move
between opposite-facing platform surfaces. Bounce pads flip gravity
automatically and briefly boost airborne movement.

The whole level remains visible; the camera does not scroll. The game has five
progressively harder levels. The first player through each level's goal wins
that round; single-player advances through the course until all five levels
are complete.

## Visual Style

- Use the arcade's neon, cyberpunk visual language, with bright stickman
  silhouettes against a dark environment.
- Make gravity direction, jump transitions, platform surfaces, bounce pads,
  remaining lives, and the goal easy to read at a glance.
- Render the floor, ceiling, and goal ring as slowly flowing lava. Lava
  contact costs a life and returns the player to the starting point.
- Keep the fixed level legible at the target playfield size, with screen-safe
  margins and clear gaps between platforms.

## Match Rules

- Support single-player and local PvP for up to four players.
- Each player starts each level with five lives.
- Touching the lava floor, ceiling, or circular goal ring costs one life and
  respawns the player at the beginning of the current level.
- When a player's lives are exhausted, they are out of the round.
- The first player to pass through the goal ring's opening wins the PvP round.
  Touching the ring itself is lava; there is no special landing pad or
  landing requirement inside the goal.
- A winner can advance to the next level or retry the current level. Completing
  level five completes the run.

## Movement and Gravity

- Players can run left and right while grounded and while airborne.
- Each jump inverts gravity for that player and flips their character so they
  can run on a surface above them.
- Gravity is lighter than the initial prototype so jumps have a slower, more
  controlled arc.
- Players can jump from the floor toward a ceiling platform, or from the
  ceiling toward a floor platform. The level must provide reachable landing
  surfaces for both transitions.
- A player can land and run on the underside of a platform while pulled
  upward, or jump from its top while inverted and flip to land on its upper
  surface.
- Preserve gaps between platforms so players must time jumps and steer in the
  air rather than traverse a continuous walkway.

## Levels and Layout

- Provide five authored, fixed-screen layouts that increase in difficulty.
- Each level has a designated safe route and extra decoy platforms intended
  to misdirect players. The safe route alternates between underside and top
  landings and leads from the start to the goal.
- Route data is validated against jump height, movement speed, and platform
  widths so every designated route remains reachable.
- Platforms are thinner and shorter than in the first prototype. Later levels
  narrow the safe-route pads and increase the gaps.
- Some safe-route platforms are bounce pads. Landing on one automatically
  flips gravity and launches the player away from the pad with increased
  vertical speed and a temporary horizontal air-speed boost.
- A middle pad may be used on either face: players can attach underneath while
  moving upward or land on top while moving downward.

## Goal

The finish is a static, slowly flowing lava ring with an approximately
45-degree section removed. The current goal faces its opening downward. Touch
the ring and the player loses a life; pass through the opening and into the
circle to win. No goal pad or special landing is required. The player shrinks
into the circle, an immediate win message appears, and a result screen
confirms the winner or level completion.

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
- `data/GameData.ts` defines all five levels, their validated safe routes and
  decoys, player count, lives, physics tuning, and goal geometry.
- `entities/` contains the shared base entity and the player, modified
  platforms, flowing lava, goal ring, and HUD entities.
- `systems/` separates keyboard/gamepad input, platform collisions and bounce
  modifiers, floor/ceiling hazards, and goal-ring lava/entry checks.
- Phaser 4 Arcade Physics applies per-player gravity, keeping each player's
  jump inversion independent.

The game is registered in the arcade dashboard and uses its shared pause menu
and game-scoped preferences.
