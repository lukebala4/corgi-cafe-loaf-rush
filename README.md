# Corgi Café: Loaf Rush

A hand-drawn notebook café game set in the orange Corgi Cafe at 74 Great Eastern Street, Shoreditch. Humans order, corgis brew, carry and serve.

**Play:** https://lukebala4.github.io/corgi-cafe-loaf-rush/

## How to play

Seven shifts, Monday to Sunday Brunch, about three minutes each. Read the order bubbles above each customer, make the item at the right station and hand it over before their patience runs out. Coins buy upgrades and café décor between days. The shop restocks after Tuesday and Thursday with stronger upgrade levels, and late décor includes plugs at every table, a Tonight board, laptop stickers and a visit from Archie, the café's office corgi.

| Item | How to make it |
| --- | --- |
| Americano | cup stack, then espresso |
| Latte | cup stack, milk, then espresso |
| Iced Latte (milky, white straw) | make a Latte, then cold bar |
| Pally Pick-Me-Up | make an Iced Latte, then cold bar again |
| Brew Daytona (dark, black sleeve) | empty cup from the cup stack, then cold bar |
| The Juicebox | cup stack, then blender |
| Plain Croissant | left side of the pastry case |
| Corgi Orange Cake | right side of the pastry case |
| Chicken sourdough | toastie press (take it out before it burns) |

While you play, a recipe strip at the bottom of the screen shows each ordered item, its station path and the next step for what is in your paw.

Items unlock day by day. Real GBP prices and the full 61-item London menu are in the in-game **Menu** (title screen or pause menu); game coins are a separate fictional balance.

## Little rewards

Small touches inspired by 2000s and 2010s casual games, kept kind: no login streaks, no energy timers, nothing that punishes time away.

- **Combo notes and stamps.** Each order in a streak plays the next note up the scale. Streaks of 3, 5, 8 and 12 slam down an ink stamp (`Nice!`, `Pawsome!`, `LOAF-TASTIC!`, `UNSTOPPABLE LOAF!`).
- **Coins you can see.** Tips arc up into the coin counter, which rolls up with a cha-ching.
- **Today's Special.** Each shift has one special item (sticker by the pause button, star on matching order bubbles). Its base price pays double.
- **Golden guests.** Roughly once a week a guest arrives with a golden glow and a starry bubble. They wait a little longer and tip big.
- **Last orders.** Twenty seconds before closing the bell rings and the door stops opening. Serve everyone still waiting for a slow-motion confetti finish and a tidy-close bonus.
- **Results.** Coins count up, stars slam in one at a time, and a short line tells you how close the next star was.
- **Sticker Book** (title screen or pause menu). Guests, staff corgis, menu items and café moments you have met appear as stickers; the rest stay as pencil outlines with a hint.
- **Achievements.** 15 achievement stickers pop up as small toasts. Three of them unlock aprons that coins cannot buy: Spotless, Golden and Brunch Legend.
- **Endless Brunch** (unlocks after surviving Sunday Brunch). No clock, customers keep coming faster, three walkouts end the run. Your best score is saved and shareable. It does not change your week, coins or stars.

## Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Move | WASD or arrow keys | Virtual joystick |
| Interact | Space, Enter or E | PAW |
| Zoomies dash | Shift | ZOOM |
| Swap item in paw (with the second paw slot upgrade) | Q | SWAP |
| Pause | Esc or P | Pause button |

Progress saves in the browser. Audio starts after your first tap or key press. Results and the final screen can make a shareable scorecard image (Share, Download PNG, Copy link); nothing is posted unless you choose to.

## Development

```bash
pnpm install
pnpm dev
pnpm build
```

Phaser 3, TypeScript and Vite. All artwork is drawn procedurally in code (`src/art/`); no photographs are shipped. See [docs/LONDON_ADAPTATION.md](docs/LONDON_ADAPTATION.md) for the reference-to-game mapping, menu evidence, inferred values and test results.

Corgi Cafe is a real café; this is an unofficial fan game. Staff corgis and customers are fictional.
