# Game Design: Geometric Tower Strategy

This document defines Orbit Command's intended player experience, visual style, controls, modes, and rules. Shared engine contracts are documented in [the engine guide](../../engine/README.md); game-specific implementation lives beside this document.

## Game Concept

A local multiplayer strategy game for Xbox controllers, playable in a browser. Players manage geometric towers or zones on a shared map: they plan routes between locations, capture neutral or enemy positions, and choose upgrades that shape their economy and defenses.

The focus is on strategic planning and territory control rather than direct, character-based combat. Units and attacks are resolved by the game systems; players issue orders and make upgrade decisions.

## Visual Style

- Use a clear geometric map with distinct colors and silhouettes for teams, towers, routes, units, and status.
- Keep the presentation vibrant and readable at television distance, with screen-safe margins.
- Use restrained effects to communicate events such as a route being issued, a tower changing control, an upgrade completing, or a wave arriving.
- Make ownership, income, defenses, and planned movement legible without relying on color alone.

## Players, Teams, and Bots

- Support local multiplayer with up to four human players using Xbox controllers.
- Support 4v4 team-versus-bot matches: up to four local human players cooperate against four bot-controlled opponents. Whether bots fill vacant human slots or the match scales down remains to be decided.
- Support both free-for-all and team formats in Conquest.
- Bots should make strategic decisions about capturing zones, choosing routes, and defending territory, rather than merely acting as combat targets.

## Controls

Keep the familiar gamepad-driven feel, adapted for map strategy instead of aiming and firing:

- Left stick moves a map cursor or navigates selectable locations.
- Right stick may pan the map or adjust route selection; confirm its final role during the controls prototype.
- Select a tower owned by your team, then select an adjacent neutral or enemy tower to establish a continuous attack route, or an adjacent allied tower to reinforce it. Units dispatch automatically using the source tower's attack rate and speed. Select the same source and target again to cancel the route.
- Routes may only connect directly adjacent towers. To attack farther away, capture intermediate towers and establish new local routes.
- Allied reinforcement routes stop dispatching when the target's unit capacity is full, counting units already on their way. Reinforcements above capacity return to their source when possible.
- A selects, confirms, or issues an order.
- Provide clear cancel/back and menu controls for route planning, upgrades, and match setup.
- Ignore empty or disconnected gamepad slots when assigning controllers to players.

## Core Gameplay Loop

1. Generate upgrade points over time, with owned locations and upgrades potentially affecting income.
2. Select an owned tower or zone and set a continuous attack order to an adjacent neutral or enemy location.
3. Units dispatch automatically over active routes, with attack rate controlling how often units launch and attack speed controlling their travel.
4. Capture, reinforce, or defend locations through those orders; resolve encounters using unit strength, tower defenses, and upgrades.
5. Spend upgrade points on attack, defense, or income improvements, weighing immediate strength against long-term growth.
6. Continue expanding or defending until the selected mode's victory or survival condition is met.

The prototype dispatches one unit per attack interval. Units resolve combat on arrival; tower defense reduces incoming attack strength. Tower garrisons produce units over time up to their capacity.

## Game Modes

### Conquest

- A player (in free-for-all) or team must own every tower/zone to win; the match continues if all locations are claimed but ownership is split between opposing sides.
- Support free-for-all and team variants.
- Allow team-versus-bot play, targeting 4v4 teams.
- Neutral locations, contested captures, and disconnected players are handled by the prototype's capture and match rules; controller disconnection behavior still needs design.

### Survival

- Players cooperate or compete to survive escalating waves of bots.
- Support last-player-standing and last-team-standing variants.
- Tower/zone control, routes, and upgrades provide strategic tools for surviving waves.
- Survival currently launches five escalating waves at fixed intervals; rejoin behavior and difficulty tuning remain to be designed.

## Upgrades and Progression

- Upgrade points are generated over time; the final income sources and rate are configurable game rules.
- Upgrade choices should cover at least attack, defense, and income.
- Each tower has its own attack, defense, and income upgrade levels. A team's shared upgrade points pay for improvements to a selected friendly tower.
- Attack upgrades improve attack strength, automatic dispatch rate, and unit travel speed. Defense upgrades improve damage resistance and raise unit capacity. Income upgrades increase the points generated by that tower.
- Upgrade levels range from 1 to 5. Starting towers begin with 90 units and defense level 3; other towers begin at level 1. Defense sets unit capacity, so upgrading it can also create room for additional production and reinforcements.
- Tower visuals communicate their upgrade levels: attack arcs, defense rings, and income markers.
- Expose upgrade costs, effects, and consequences clearly in the setup and match UI.

## Scores and Settings

Save completed-match results and player preferences locally in browser storage, as described in [agent-plan.md](./agent-plan.md). Saved data is per browser/device and is not synchronized.

## Prototype Rules and Remaining Decisions

- Exact player/team composition, including whether bots fill open slots and whether players may join opposing teams.
- The prototype has one persistent route per source tower. A new route replaces that source's prior route; repeating the same route cancels it. Routes are adjacent-only and are not interceptable.
- Capturing a neutral tower makes it belong to the arriving unit's faction; combat against enemy towers uses tower-specific defense and attack strength.
- Starting towers begin with larger garrisons (90 units) and defense level 3 to make their capture a longer commitment.
- Upgrade costs increase by level; upgrades are tower-specific, capped at level 5, and not reversible.
- Tie handling for simultaneous/contested Conquest outcomes.
- Survival wave schedule, escalation, elimination, and last-standing conditions.
- Bot difficulty levels and the strategic behaviors expected at each level.
- Controller disconnect/rejoin behavior, match pause rules, and local player joining flow.
