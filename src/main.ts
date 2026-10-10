import Phaser from "phaser";
import "@fontsource/patrick-hand";
import "@fontsource/caveat-brush";
import { H, W } from "./config";
import { BootScene, TitleScene } from "./scenes/TitleScene";
import { GameScene } from "./scenes/GameScene";
import { ResultsScene } from "./scenes/ResultsScene";
import { ShopScene } from "./scenes/ShopScene";
import { VictoryScene } from "./scenes/VictoryScene";
import { audio } from "./audio";

async function boot() {
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
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true, roundPixels: false },
    audio: { noAudio: true },
    input: { activePointers: 3 },
    fps: { target: 60 },
    scene: [BootScene, TitleScene, GameScene, ResultsScene, ShopScene, VictoryScene],
  });
  (window as unknown as { __game: Phaser.Game }).__game = game;
}

boot();
