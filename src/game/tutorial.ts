import Phaser from "phaser";
import { COLORS as C } from "../config";
import { boil } from "../art/textures";
import { button, scrap, txt } from "../ui";
import { save } from "../save";
import type { GameScene } from "../scenes/GameScene";

type P = { x: number; y: number };
interface Step {
  text: () => string;
  target?: () => P | null;
  enter?: () => void;
  done: () => boolean;
}

export class Tutorial {
  g: GameScene;
  i = -1;
  panel: Phaser.GameObjects.Container;
  label: Phaser.GameObjects.Text;
  arrow: Phaser.GameObjects.Sprite;
  xspot: Phaser.GameObjects.Sprite;
  steps: Step[];
  dashSeen = false;
  finished = false;
  private goBtn?: Phaser.GameObjects.Container;

  constructor(g: GameScene) {
    this.g = g;
    this.panel = scrap(g, 640, 652, 700, 74, -1, false).setDepth(8000);
    this.label = txt(g, 0, 4, "", 24, C.ink, false, { wordWrap: { width: 660 } });
    this.panel.add(this.label);
    this.arrow = boil(g, 0, 0, "arrow").setDepth(7000).setVisible(false);
    this.xspot = boil(g, 420, 205, "xspot").setDepth(5).setVisible(false);
    const t = g.controls;
    const st = (id: string) => g.stations.find((s) => s.id === id)!;
    const iy = (id: string) => ({ x: st(id).ix, y: st(id).iy - 60 });
    this.steps = [
      {
        text: () => (t.touchMode ? "Welcome to Corgi Cafe, 74 Great Eastern Street! Drag on the left side of the screen to walk to the red X." : "Welcome to Corgi Cafe, 74 Great Eastern Street! Walk to the red X with WASD or the arrow keys."),
        enter: () => this.xspot.setVisible(true),
        target: () => ({ x: 420, y: 160 }),
        done: () => Math.hypot(g.player.x - 420, g.player.y - 205) < 45,
      },
      {
        text: () => (t.touchMode ? "Nice loaf-walk! Tap ZOOM for a zoomies dash." : "Nice loaf-walk! Press SHIFT for a zoomies dash."),
        enter: () => {
          this.xspot.setVisible(false);
          this.dashSeen = false;
        },
        done: () => this.dashSeen,
      },
      {
        text: () => `Americano time. Stand by the CUPS and press ${t.interactLabel} to grab a branded cup.`,
        target: () => iy("cups"),
        done: () => g.player.items.includes("cup"),
      },
      {
        text: () => `Carry the cup to the ESPRESSO machine and press ${t.interactLabel} to pull a shot.`,
        target: () => iy("espresso"),
        done: () => st("espresso").state !== "idle",
      },
      {
        text: () => `Wait for the ding, then press ${t.interactLabel} to pick up your Americano.`,
        target: () => iy("espresso"),
        done: () => g.player.items.includes("americano"),
      },
      {
        text: () => `A regular just sat down. Walk out through a gap in the counter and press ${t.interactLabel} beside them.`,
        enter: () => g.spawnScripted("regular", ["americano"], 0),
        target: () => {
          const c = g.customers.find((c) => c.role === "regular" && c.waiting);
          return c ? { x: c.x, y: c.y - 200 } : null;
        },
        done: () => g.stats.served >= 1,
      },
      {
        text: () => "A first-time visitor wants a Plain Croissant. Grab one from the CROISSANTS basket and serve it!",
        enter: () => g.spawnScripted("newcomer", ["croissant"], 1),
        target: () => {
          if (!g.player.items.includes("croissant")) return iy("croissant");
          const c = g.customers.find((c) => c.role === "newcomer" && c.waiting);
          return c ? { x: c.x, y: c.y - 200 } : null;
        },
        done: () => g.stats.served >= 2,
      },
      {
        text: () => "Brilliant! Humans order, corgis serve. Fast service means bigger tips and combos, and patience bars run out. Ready?",
        enter: () => {
          this.goBtn = button(g, 900, 600, 220, 54, "Open the café!", C.mint, () => this.finish(), 26).setDepth(8100);
        },
        done: () => false,
      },
    ];
    this.next();
  }

  private next() {
    this.i++;
    const s = this.steps[this.i];
    if (!s) return;
    s.enter?.();
    this.label.setText(s.text());
    this.panel.setScale(0.9);
    this.g.tweens.add({ targets: this.panel, scale: 1, duration: 200, ease: "Back.out" });
  }

  update() {
    if (this.finished) return;
    const s = this.steps[this.i];
    if (!s) return;
    this.label.setText(s.text());
    const tp = s.target?.();
    if (tp) {
      this.arrow.setVisible(true);
      this.arrow.setPosition(tp.x, tp.y + Math.sin(this.g.time.now / 180) * 8);
    } else this.arrow.setVisible(false);
    if (s.done()) {
      this.g.floatAt(this.g.player.x, this.g.player.y - 120, "nice!", C.mintDark);
      this.next();
    }
  }

  finish() {
    if (this.finished) return;
    this.finished = true;
    save.data.tutorialDone = true;
    save.write();
    this.g.scene.start("Game", { day: save.data.day >= 7 ? 0 : save.data.day });
  }
}
