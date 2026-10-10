# Corgi Café: Loaf Rush

A hand-drawn notebook café game staffed entirely by corgis.

## Play

Once GitHub Pages finishes its first deployment, open the Pages URL shown in the repository's **Settings → Pages** section.

## Controls

- **WASD / arrow keys:** move
- **Space / Enter / E:** interact
- **Shift:** zoomies dash
- **Esc / P:** pause
- **Mobile:** virtual joystick, PAW, and ZOOM buttons

The game saves progress locally in the browser. Audio begins after the first interaction.

## Development

```bash
pnpm install
pnpm dev
```

Production build:

```bash
pnpm build
```

The project is built with Phaser, TypeScript, and Vite. Artwork is procedural and follows the notebook-doodle visual direction.
