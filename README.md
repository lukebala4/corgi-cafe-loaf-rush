# Corgi Café: Loaf Rush

A hand-drawn notebook café game set in the orange Corgi Cafe at 74 Great Eastern Street, Shoreditch. Humans order, corgis brew, carry and serve.

**Play:** https://lukebala4.github.io/corgi-cafe-loaf-rush/

## How to play

Seven shifts, Monday to Sunday Brunch, about three minutes each. Read the order bubbles above each customer, make the item at the right station and hand it over before their patience runs out. Coins buy upgrades and café décor between days.

| Item | How to make it |
| --- | --- |
| Americano | cup stack, then espresso |
| Latte | cup stack, milk, then espresso |
| Iced Latte | make a Latte, then cold bar |
| Pally Pick-Me-Up | make an Iced Latte, then cold bar again |
| Brew Daytona | cup stack, then cold bar |
| The Juicebox | cup stack, then blender |
| Plain Croissant | left side of the pastry case |
| Corgi Orange Cake | right side of the pastry case |
| Chicken sourdough | toastie press (take it out before it burns) |

While you play, a recipe strip at the bottom of the screen shows each ordered item, its station path and the next step for what is in your paw.

Items unlock day by day. Real GBP prices and the full 61-item London menu are in the in-game **Menu** (title screen or pause menu); game coins are a separate fictional balance.

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
