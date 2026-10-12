import Phaser from "phaser";
import { COLORS as C, DAYS, W } from "../config";
import { boil } from "../art/textures";
import { burst, button, scrap, shake, txt } from "../ui";
import { audio } from "../audio";
import { save } from "../save";
import type { DayStats } from "./GameScene";
import { openShare } from "../share";
import { confetti, inkStamp } from "../fx";
import { unlock } from "../meta";

type ResultData = DayStats & { stars: number; prevStars?: number; best?: number; prevBest?: number; newBest?: boolean };

const mmss = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;

export class ResultsScene extends Phaser.Scene {
  /** Pending reveal steps; a tap or key skips straight to the end. */
  private timers: Phaser.Time.TimerEvent[] = [];
  private finishers: (() => void)[] = [];
  private revealed = false;

  constructor() {
    super("Results");
  }

  create(st: ResultData) {
    this.timers = [];
    this.finishers = [];
    this.revealed = false;
    this.add.image(0, 0, "bg_paper").setOrigin(0);
    audio.music("title");
    if (st.endless) this.endlessResults(st);
    else this.dayResults(st);
    // tap anywhere (outside the buttons) or press a key to skip the count-up
    this.input.on("pointerdown", () => this.skip());
    this.input.keyboard!.on("keydown", (e: KeyboardEvent) => {
      if (e.key !== "Enter") this.skip();
    });
  }

  private later(ms: number, fn: () => void) {
    this.timers.push(this.time.delayedCall(ms, fn));
  }

  private skip() {
    if (this.revealed) return;
    this.revealed = true;
    for (const t of this.timers) t.remove(false);
    this.timers = [];
    for (const f of this.finishers) f();
  }

  /** Count a number up with rising ticks. Returns the time it takes. */
  private countUp(t: Phaser.GameObjects.Text, to: number, fmt: (n: number) => string, onPass?: { at: number; fn: () => void }) {
    const reduce = save.data.settings.reducedMotion;
    const dur = reduce ? 500 : Math.min(1500, 450 + to * 4);
    const steps = Math.max(1, Math.round(dur / 55));
    let passed = false;
    for (let i = 1; i <= steps; i++) {
      this.later((i * dur) / steps, () => {
        const v = Math.round((to * i) / steps);
        t.setText(fmt(v));
        audio.play("tick", Math.floor((i / steps) * 30));
        if (onPass && !passed && v >= onPass.at) {
          passed = true;
          onPass.fn();
        }
      });
    }
    this.finishers.push(() => {
      t.setText(fmt(to));
      if (onPass && !passed && to >= onPass.at) {
        passed = true;
        onPass.fn();
      }
    });
    return dur;
  }

  // ===================================================================== a day of the week
  private dayResults(st: ResultData) {
    const def = DAYS[st.day];
    const reduce = save.data.settings.reducedMotion;
    scrap(this, 640, 350, 640, 520, -1.2, true);
    txt(this, 640, 140, `${def.name}  -  done!`, 56, C.caramel, true, { stroke: C.ink, strokeThickness: 3 });
    const lines: [string, string][] = [
      ["Orders served", `${st.served}`],
      ["Huffy exits", `${st.missed}`],
      ["Funny mistakes", `${st.mistakes}`],
      ["Best combo", `${st.bestCombo}`],
      ["Tips", `${st.tips}`],
    ];
    lines.forEach(([a, b], i) => {
      const y = 208 + i * 36;
      txt(this, 470, y, a, 26, C.ink).setOrigin(0, 0.5);
      txt(this, 810, y, b, 28, C.ink, true).setOrigin(1, 0.5);
    });
    // little highlights of the day, only when they happened
    const chips: string[] = [];
    if (st.finale) chips.push("last loaf served");
    if (st.golden) chips.push("golden guest");
    if (st.specials) chips.push(`${st.specials} special${st.specials > 1 ? "s" : ""}`);
    if (chips.length) txt(this, 640, 386, `★ ${chips.join("  ·  ★ ")}`, 20, C.caramelDark, true);

    const goalHit = st.earned >= st.goal;
    const fmt = (n: number) => `Earned ${n} coins  (goal ${st.goal})`;
    const earned = txt(this, 640, 424, fmt(0), 32, C.coral, true);
    const countMs = this.countUp(earned, st.earned, fmt, {
      at: st.goal,
      fn: () => {
        earned.setColor(C.mintDark);
        this.tweens.add({ targets: earned, scale: 1.08, yoyo: true, duration: 110 });
      },
    });
    if (!goalHit) earned.setColor(C.coral);

    // stars: empty slots first, then each earned star slams in with a rising ding
    const slots: Phaser.GameObjects.Sprite[] = [];
    for (let i = 0; i < 3; i++) slots.push(boil(this, 560 + i * 80, 490, "star_empty").setScale(2.2).setAlpha(0.9));
    const earnedStars: Phaser.GameObjects.Sprite[] = [];
    const slam = (i: number, instant: boolean) => {
      if (earnedStars[i]) return;
      const s = boil(this, slots[i].x, slots[i].y, "star").setDepth(5);
      earnedStars[i] = s;
      audio.play("star", i);
      burst(this, s.x, s.y, ["star", "star_mint", "star_coral"], 7 + i * 2, 60);
      if (instant || reduce) {
        s.setScale(2.2);
        return;
      }
      s.setScale(4.6).setAlpha(0.2);
      this.tweens.add({ targets: s, scale: 2.2, alpha: 1, angle: { from: -25, to: 0 }, duration: 170, ease: "Quad.in", onComplete: () => shake(this, 80, 0.002 + i * 0.001) });
    };
    const gap = reduce ? 200 : 420;
    for (let i = 0; i < st.stars; i++) this.later(countMs + 250 + i * gap, () => slam(i, false));
    this.finishers.push(() => {
      for (let i = 0; i < st.stars; i++) slam(i, true);
    });

    // after the stars: a kind near-miss nudge or a new-best stamp, then any achievement stickers
    const after = countMs + 250 + st.stars * gap + 150;
    const tail = () => {
      if (this.children.getByName("resultTail")) return;
      const next = st.stars === 0 ? st.goal * 0.5 : st.stars === 1 ? st.goal : st.goal * 1.4;
      const short = Math.ceil(next - st.earned);
      let note = "";
      if (st.stars < 3 && short > 0 && short <= Math.max(10, st.goal * 0.15)) note = `So close! Only ${short} coins off star ${st.stars + 1}.`;
      if (note) {
        const n = txt(this, 640, 548, note, 24, C.coral, true).setName("resultTail");
        if (!reduce) this.tweens.add({ targets: n, angle: { from: -1.5, to: 1.5 }, yoyo: true, repeat: -1, duration: 700 });
      } else {
        const quip = st.stars >= 3 ? "Legendary loafing. Shoreditch is talking." : st.stars === 2 ? "The regulars are already telling their friends." : st.stars === 1 ? "Not bad for a tiny-legged barista." : "Tomorrow is a new loaf.";
        txt(this, 640, 548, quip, 22, C.inkSoft).setName("resultTail");
      }
      if (st.stars > (st.prevStars ?? 0) && st.stars > 0 && (st.prevStars ?? 0) > 0) inkStamp(this, 850, 470, "New best!", 2, undefined, 50);
      if (st.stars >= 3) unlock(this, "three");
      if (st.served >= 6 && st.mistakes === 0 && st.missed === 0) unlock(this, "spotless");
    };
    this.later(after, tail);
    this.finishers.push(tail);

    const last = st.day >= DAYS.length - 1;
    button(this, 850, 640, 300, 60, last ? "The grand finale →" : "Upgrade shop →", C.mint, () => this.scene.start(last ? "Victory" : "Shop"), 30);
    button(this, 400, 640, 180, 52, "Replay day", "#f6c453", () => this.scene.start("Game", { day: st.day }), 24);
    const share = button(this, 610, 640, 180, 52, "Share", C.orange, () => {
      share.setEnabled(false);
      const quip = st.stars >= 3 ? "Legendary loafing." : st.stars === 2 ? "The regulars are telling their friends." : "Tiny legs, big shift.";
      void openShare(
        this,
        {
          headline: `${def.name} done!`,
          stats: [
            ["Orders served", `${st.served}`],
            ["Coins earned", `${st.earned} / ${st.goal}`],
            ["Best combo", `x${st.bestCombo}`],
          ],
          stars: st.stars,
          maxStars: 3,
          caption: `${quip} Humans ordered, corgis served.`,
          file: `corgi-cafe-${def.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`,
          shareText: `Humbled to announce I just ran the ${def.name} shift at Corgi Café: Loaf Rush. ${st.earned} coins, best combo x${st.bestCombo}. Can you beat my loaves?`,
        },
        () => share.setEnabled(true),
      );
    }, 24);
    this.input.keyboard!.once("keydown-ENTER", () => this.scene.start(last ? "Victory" : "Shop"));
  }

  // ===================================================================== Endless Brunch
  private endlessResults(st: ResultData) {
    const reduce = save.data.settings.reducedMotion;
    scrap(this, 640, 350, 640, 520, -1.2, true);
    txt(this, 640, 140, "Endless Brunch", 58, C.coral, true, { stroke: C.ink, strokeThickness: 3 });
    txt(this, 640, 186, "Three walkouts and the brunch rush wins. This time.", 20, C.inkSoft);
    const lines: [string, string][] = [
      ["Orders served", `${st.served}`],
      ["Time on the floor", mmss(st.time)],
      ["Best combo", `${st.bestCombo}`],
      ["Specials served", `${st.specials}`],
      ["Golden guests", `${st.golden}`],
    ];
    lines.forEach(([a, b], i) => {
      const y = 226 + i * 34;
      txt(this, 470, y, a, 25, C.ink).setOrigin(0, 0.5);
      txt(this, 810, y, b, 27, C.ink, true).setOrigin(1, 0.5);
    });
    const fmt = (n: number) => `Score: ${n}`;
    const score = txt(this, 640, 420, fmt(0), 46, C.caramelDark, true, { stroke: "#fffaf0", strokeThickness: 5 });
    const countMs = this.countUp(score, st.earned, fmt);
    const best = st.best ?? st.earned;
    const bestT = txt(this, 640, 470, st.newBest ? `New personal best!  (was ${st.prevBest ?? 0})` : `Personal best: ${best}`, 24, st.newBest ? C.mintDark : C.inkSoft, true).setAlpha(0);
    const reveal = () => {
      if (bestT.alpha === 1) return;
      bestT.setAlpha(1);
      if (st.newBest && st.earned > 0) {
        audio.play("finale");
        inkStamp(this, 880, 410, "NEW BEST!", 4, undefined, 50);
        confetti(this, 40, 60);
      } else audio.play("star", 0);
      const quip = st.served >= 40 ? "Brunch royalty. The corgis want your autograph." : st.served >= 25 ? "Shoreditch has never seen loaves move like this." : st.served >= 12 ? "A proper brunch shift. Again?" : "Warm-up round. The croissants believe in you.";
      txt(this, 640, 548, quip, 22, C.inkSoft);
      if (st.served >= 30) unlock(this, "legend");
    };
    this.later(countMs + (reduce ? 100 : 300), reveal);
    this.finishers.push(reveal);

    button(this, 850, 640, 300, 60, "Go again →", C.mint, () => this.scene.start("Game", { endless: true }), 30);
    button(this, 400, 640, 180, 52, "Title", "#fffaf0", () => this.scene.start("Title"), 24);
    const share = button(this, 610, 640, 180, 52, "Share", C.orange, () => {
      share.setEnabled(false);
      void openShare(
        this,
        {
          headline: "Endless Brunch!",
          stats: [
            ["Score", `${st.earned}`],
            ["Orders served", `${st.served}`],
            ["Time on the floor", mmss(st.time)],
          ],
          stars: Math.min(3, Math.floor(st.served / 10)),
          maxStars: 3,
          caption: st.newBest ? "New personal best. The loaves are unstoppable." : "Three walkouts and the rush wins. Again!",
          file: "corgi-cafe-endless-brunch.png",
          shareText: `I served ${st.served} orders in Endless Brunch at Corgi Café: Loaf Rush and scored ${st.earned}. Think you can beat my loaves?`,
        },
        () => share.setEnabled(true),
      );
    }, 24);
    this.input.keyboard!.once("keydown-ENTER", () => this.scene.start("Game", { endless: true }));
    void W;
  }
}
