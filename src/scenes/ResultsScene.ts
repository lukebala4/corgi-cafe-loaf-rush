import Phaser from "phaser";
import { COLORS as C, DAYS } from "../config";
import { boil } from "../art/textures";
import { burst, button, scrap, txt } from "../ui";
import { audio } from "../audio";
import type { DayStats } from "./GameScene";

export class ResultsScene extends Phaser.Scene {
  constructor() {
    super("Results");
  }

  create(st: DayStats & { stars: number }) {
    this.add.image(0, 0, "bg_paper").setOrigin(0);
    audio.music("title");
    const def = DAYS[st.day];
    const p = scrap(this, 640, 350, 640, 520, -1.2, true);
    void p;
    txt(this, 640, 140, `${def.name} — done!`, 56, C.caramel, true, { stroke: C.ink, strokeThickness: 3 });
    const lines: [string, string][] = [
      ["Loaves served", `${st.served}`],
      ["Huffy exits", `${st.missed}`],
      ["Funny mistakes", `${st.mistakes}`],
      ["Best combo", `${st.bestCombo}`],
      ["Tips", `${st.tips}`],
    ];
    lines.forEach(([a, b], i) => {
      const y = 215 + i * 38;
      txt(this, 470, y, a, 26, C.ink).setOrigin(0, 0.5);
      txt(this, 810, y, b, 28, C.ink, true).setOrigin(1, 0.5);
    });
    const goalHit = st.earned >= st.goal;
    txt(this, 640, 420, `Earned ${st.earned} coins  (goal ${st.goal})`, 32, goalHit ? C.mintDark : C.coral, true);
    for (let i = 0; i < 3; i++) {
      const s = boil(this, 560 + i * 80, 488, i < st.stars ? "star" : "star_empty").setScale(0);
      this.tweens.add({
        targets: s,
        scale: 2.2,
        delay: 300 + i * 260,
        duration: 300,
        ease: "Back.out",
        onStart: () => {
          if (i < st.stars) {
            audio.play("coin");
            burst(this, s.x, s.y, ["star", "star_mint"], 6, 50);
          }
        },
      });
    }
    const quip = st.stars >= 3 ? "Legendary loafing." : st.stars === 2 ? "The town is talking (about you)." : st.stars === 1 ? "Not bad for a tiny-legged barista." : "Tomorrow is a new loaf.";
    txt(this, 640, 548, quip, 22, C.inkSoft);
    const last = st.day >= DAYS.length - 1;
    button(this, 760, 640, 300, 60, last ? "The grand finale →" : "Upgrade shop →", C.mint, () => this.scene.start(last ? "Victory" : "Shop"), 30);
    button(this, 470, 640, 200, 52, "Replay day", "#f6c453", () => this.scene.start("Game", { day: st.day }), 24);
    this.input.keyboard!.once("keydown-ENTER", () => this.scene.start(last ? "Victory" : "Shop"));
  }
}
