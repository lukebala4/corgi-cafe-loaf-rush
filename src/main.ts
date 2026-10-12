import Phaser from "phaser";
import { renderScorecard } from "./share";
import "@fontsource/patrick-hand";
import "@fontsource/caveat-brush";
import { H, W } from "./config";
import { BootScene, TitleScene } from "./scenes/TitleScene";
import { GameScene } from "./scenes/GameScene";
import { ResultsScene } from "./scenes/ResultsScene";
import { ShopScene } from "./scenes/ShopScene";
import { VictoryScene } from "./scenes/VictoryScene";
import { audio } from "./audio";
import { attachGame, installZoomGuards } from "./viewport";

async function boot() {
  // block accidental page zoom from the very first touch (before fonts finish loading)
  installZoomGuards();
  try {
    await Promise.race([
      Promise.all([document.fonts.load('32px "Patrick Hand"'), document.fonts.load('32px "Caveat Brush"')]),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch {
    /* fall back to system fonts */
  }
  // audio may only start after a user gesture
  const unlock = () => audio.unlock();
  window.addEventListener("pointerdown", unlock);
  window.addEventListener("keydown", unlock);
  // no page scrolling / zooming while playing
  window.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });
  window.addEventListener("wheel", (e) => e.preventDefault(), { passive: false });
  window.addEventListener("contextmenu", (e) => e.preventDefault());

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: "game",
    width: W,
    height: H,
    backgroundColor: "#efe4c8",
    // FIT keeps the whole café visible; resizeInterval makes Phaser notice size changes quickly
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, resizeInterval: 150 },
    render: { antialias: true, roundPixels: false },
    audio: { noAudio: true },
    input: { activePointers: 3 },
    fps: { target: 60 },
    scene: [BootScene, TitleScene, GameScene, ResultsScene, ShopScene, VictoryScene],
  });
  (window as unknown as { __game: Phaser.Game }).__game = game;
  attachGame(game);
}

boot();

// Dev-only hook used to render the static social preview image (public/og-image.png).
if (import.meta.env.DEV) (window as unknown as { __renderScorecard: typeof renderScorecard }).__renderScorecard = renderScorecard;
