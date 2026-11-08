# Neon Ant Siege

## Overview

A geometric-neon, fixed-camera platform survival game for one to four local
players. Team-colored stick figures defend randomized platform layouts from
red ants, earning a brief breather after each cleared wave. Every fifth wave is
a single, oversized, slow boss ant.

## Match rules

- Players start each run at 100 health. Ant contact attacks damage players;
  depleted players are out, and the run ends when the whole team is down.
- Waves add ants in small steps and increase ant speed and damage. Easy, Normal,
  and Hard apply different baseline scaling.
- Every fifth wave contains one boss instead of a normal ant group. It has a
  large health pool, deals heavy damage, and moves slowly.
- Each run creates a fresh arrangement of neon platforms.
- Players use swords, axes, and returning throwing shields; the game has no guns.
- Player jumps and platform collisions use the engine's fixed-step Matter.js
  physics service. Ant movement and wall-climbing remain game-specific.

## Controls

- Player 1: arrows to move/jump, Space to attack.
- Player 2: A/D to move, W to jump, F to attack.
- Player 3: J/L to move, I to jump, U to attack.
- Player 4: Numpad 4/6 to move, Numpad 8 to jump, Numpad 0 to attack.
- Gamepads: left stick to move, A to jump, X to attack, Start to pause.
- Escape opens or closes the pause menu. The menu can resume, restart, or quit
  to the arcade.
