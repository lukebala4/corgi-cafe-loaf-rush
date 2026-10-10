# Corgi Café: Loaf Rush  -  Implementation Plan

## Approach
- **Stack**: Phaser 3.90 + TypeScript, bundled by Vite into a static site (`dist/`). No server, no database, no API keys.
- **Art**: 100% procedural. A "pen" module draws jittered, hand-inked strokes on Canvas2D; every character, item and station is rendered into 3 "line-boil" frames at boot and cycled at ~7 fps so everything wobbles like an animated doodle.
- **Audio**: procedural WebAudio (SFX + a looping ukulele/marimba-style tune). Audio context is created only after the first pointer/key interaction; visible mute buttons.
- **Simulation**: fixed 60 Hz step with an accumulator (frame-rate independent). Custom circle-vs-rect collision for the player; NPCs use A* on a coarse nav grid of static obstacles.
- **Layout**: 1280×720 logical playfield, `Scale.FIT` (no distortion, letterboxed). Touch joystick + large buttons appear on touch devices.
- **Save**: `localStorage` (`corgicafe.save.v1`)  -  day, coins, upgrades, cosmetics, settings, tutorial flag, per-day stars. Reset with confirmation.

## Café layout (notebook lines as architecture)
- Top rule: **back counter** carrying stations: Cup stack, Espresso, Milk/Foam, Ice bucket, Pastry case, Toaster, Trash.
- Second rule: **pass counter** with three "doorways"; a Pickup pad lives on it (assistant corgi picks up from here).
- Dining floor: 6 tables in 2 rows; customers sit beside tables; door on the right wall.

## Recipes (2-3 actions)
| Item | Steps |
| --- | --- |
| Coffee | Cup stack → Espresso (brews) → take |
| Croissant | Pastry case |
| Corgi latte | Coffee → Milk station (draws art) |
| Fancy latte (poodle) | Latte → Milk station again |
| Puppuccino | Cup → Milk station |
| Iced coffee | Coffee → Ice bucket |
| Sleepy-corgi toast | Toaster (start) → take (burns if left too long) |

## Progression
7 days (~3 min each, Sunday Brunch finale). Menu, customer personalities and events unlock gradually. Results screen → upgrade shop → next day. Upgrades: espresso speed, second carry slot, dash length/cooldown, patience cushions, assistant corgi, aprons and decorations (decor = +tip %).

## Project structure
- `src/main.ts`  -  boot, font loading, Phaser config.
- `src/config.ts`  -  layout constants, recipes, customers, days, upgrades.
- `src/art/pen.ts`, `src/art/textures.ts`  -  procedural doodle drawing.
- `src/audio.ts`  -  WebAudio SFX and music.
- `src/save.ts`  -  persistence.
- `src/input.ts`  -  keyboard + virtual joystick.
- `src/game/*`  -  Player, Customer, stations, nav grid, events, assistant, tutorial.
- `src/scenes/*`  -  Boot, Title, Game (incl. pause), Results, Shop, Victory.
- `src/ui.ts`  -  sticker buttons, taped scraps, toggles.

## Design
- **Design Movement**: Sketchbook doodle / "margin drawings"  -  ballpoint ink on a lined school notepad.
- **Core Principles**: everything is drawn by hand (no perfect geometry); notebook rules are the architecture; colour is a reward, used sparingly; motion is always a little alive (line boil).
- **Color Philosophy**: cream paper `#fbf3df`, ink `#2b2622`, faint blue rules `#9fc3e6`, red margin. Accents: caramel `#e39b4f` (corgis, coffee), coral `#f2786b` (urgency, hearts), mint `#7fcfb0` (success, go). Warm and cozy; coral only when something needs attention.
- **Layout Paradigm**: asymmetric notebook page  -  HUD scraps taped along the top edge at slight angles, punch holes on the left margin, menus as torn scraps rather than centred cards.
- **Signature Elements**: masking-tape strips; hatched pen shadows; sticker buttons with white die-cut borders.
- **Interaction Philosophy**: every press squashes; stations bounce when used; contextual prompt doodles appear only near what you can use.
- **Animation**: 3-frame line boil at ~7 fps, squash & stretch on steps and landings, paw-print trails on dash, floating tip numbers, gentle (and optional) screen shake.
- **Typography System**: "Caveat Brush" for headlines/numbers, "Patrick Hand" for body and prompts.
- **Brand Essence**: a cozy-chaos café management game for anyone who melts at corgi loaves  -  hand-drawn, frantic, warm. *Cozy, cheeky, chaotic.*
- **Brand Voice**: short, warm, a bit cheeky. "One more loaf-latte, then bed." / "Table 3 is becoming a dachshund."
- **Wordmark & Logo**: "Corgi Café" brush-lettered with the "o" replaced by a corgi butt (heart-shaped) in a coffee cup.
- **Signature Brand Color**: Caramel Loaf `#e39b4f`.
