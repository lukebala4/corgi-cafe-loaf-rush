// The crowd: young people who come in to hang out, vibe code and visit the corgis.
// They never order (only paying customers do), never block the barista, and leave on their own.
// Pudding, the café's lounge corgi, naps in the bed and wanders over for pats.
import Phaser from "phaser";
import { COLORS as C, CORGI_BED, DOOR, DOOR_INSIDE, FONT_BODY, GROUP_SPOT, LOUNGE, SOFA, TABLES, TABLE_H } from "../config";
import { CROWD_LOOKS, LOOKS } from "../art/humans";
import { boil, doodle, setBoil } from "../art/textures";
import { CorgiRig } from "./corgi";
import { save } from "../save";
import type { GameScene } from "../scenes/GameScene";

type P = { x: number; y: number };
type SpotKind = "table" | "sofa" | "bean" | "bar";
interface Spot {
  x: number;
  y: number; // feet position while seated
  kind: SpotKind;
  approach: P; // walkable point next to the seat
  depth: number;
  taken: boolean;
}

const SCALE = 0.78;
const WALK_SPEED = 120;

const CODE_LINES = [
  "it compiled first try!",
  "shipping it",
  "one more commit",
  "who broke main?",
  "vibe coding rn",
  "demo at 4!",
  "it works on my laptop",
  "pushing to prod",
  "AI wrote this bit",
  "hackathon brain",
  "building in public, day 37",
  "checking on my agents",
  "one more prompt",
  "deck v14, final final",
  "pitch night later?",
  "great wifi + plugs here",
];
const CHAT_LINES = [
  "look at that loaf!",
  "best latte in EC2",
  "corgi tax paid",
  "this place is so cute",
  "same time tomorrow?",
  "SO fluffy",
  "a corgi made my coffee",
  "ok one more pastry",
  "any London founders here?",
  "pub club after?",
  "we just closed our pre-seed!",
  "one flat white, three hours",
  "Shoreditch is back",
  "Londonmaxxing",
  "let's make a Corgi corner",
  "made it off the Luma waitlist",
  "Silicon Roundabout, baby",
];
const PHOTO_LINES = ["going on my story", "pose, corgi!", "so aesthetic", "content!!"];
const ZOOM_LINES = ["ZOOMIES!", "go go go!", "zoom zoom!", "look at them go!"];
const PAT_LINES = ["hi baby!", "can I pet you?", "who's a good loaf?", "ahh a corgi!"];
const ARCHIE_LINES = ["ARCHIE!!", "the office corgi!", "Archie came to say hi", "best colleague ever", "Archie > standup"];
/** Archie's cushion on the floor beside the lounge (decor upgrade). */
const ARCHIE_HOME = { x: 380, y: 640 };

/** Laptop lid seen from behind (stickers on the back). */
function makeTextures(g: Phaser.Scene) {
  doodle(g, "crowd_laptop", 44, 30, (p) => {
    p.rrect(4, 3, 36, 24, 3, { fill: "#d5d9de", w: 2.4 });
    p.seg(6, 4.5, 38, 4.5, { w: 1.6, color: "#a9c8e8" });
    p.circle(15, 16, 5, { fill: C.orange, w: 1.2 });
    p.dot(13.5, 15, 0.9);
    p.dot(16.5, 15, 0.9);
    p.rrect(25, 10, 9, 6, 1.5, { fill: C.sage, w: 1 });
    p.rrect(26, 19, 8, 5, 1.5, { fill: "#f2a3b0", w: 1 });
  });
  doodle(g, "crowd_cup", 18, 20, (p) => {
    p.shape(
      [
        [3, 4],
        [15, 4],
        [13, 18],
        [5, 18],
      ],
      { fill: "#fffaf0", w: 1.8 },
    );
    p.rrect(2, 2, 14, 4, 2, { fill: C.orange, w: 1.4 });
  });
}

interface Person {
  look: string;
  sprite: Phaser.GameObjects.Sprite;
  prop?: Phaser.GameObjects.Sprite;
  cup?: Phaser.GameObjects.Sprite;
  spot: Spot;
  state: "in" | "settle" | "sit" | "rise" | "out" | "gone";
  x: number;
  y: number;
  path: P[];
  stay: number;
  walkT: number;
  chatT: number;
  happyT: number;
  typing: boolean;
  lines: string[];
}

function walk(o: { x: number; y: number; path: P[] }, speed: number, dt: number) {
  const t = o.path[0];
  if (!t) return { done: true, dx: 0 };
  const dx = t.x - o.x;
  const dy = t.y - o.y;
  const d = Math.hypot(dx, dy);
  const s = speed * dt;
  if (d <= s) {
    o.x = t.x;
    o.y = t.y;
    o.path.shift();
    return { done: o.path.length === 0, dx };
  }
  o.x += (dx / d) * s;
  o.y += (dy / d) * s;
  return { done: false, dx };
}

export class Crowd {
  g: GameScene;
  spots: Spot[] = [];
  people: Person[] = [];
  cap: number;
  spawnT = 2;
  bubbleCount = 0;
  pudding: Pudding;
  /** Archie, the office corgi (shop decor), visits too. */
  archie?: Pudding;
  greeter: CorgiRig;
  greeted = new WeakSet<object>();
  greetCd = 0;
  constructor(g: GameScene, cap: number, preseed: number) {
    this.g = g;
    this.cap = cap;
    makeTextures(g);
    this.buildSpots();
    this.pudding = new Pudding(g, this);
    if (save.data.decor.includes("archie") && !g.tutorialMode) {
      boil(g, ARCHIE_HOME.x, ARCHIE_HOME.y + 8, "archie_cushion").setDepth(ARCHIE_HOME.y - 4);
      this.archie = new Pudding(g, this, { name: "Archie", home: ARCHIE_HOME, coat: "red", lines: ARCHIE_LINES, tag: true });
    }
    // Bean, a tricolour staff corgi, sits by the door and greets everyone who walks in
    this.greeter = new CorgiRig(g, DOOR_INSIDE.x - 64, DOOR_INSIDE.y - 34, 0.6, "classic", "tri");
    this.greeter.facing = 1;
    for (let i = 0; i < preseed; i++) this.spawn(true);
  }
  private buildSpots() {
    const sp: Spot[] = [];
    for (const t of TABLES) {
      const offs = t.w > 240 ? [-86, 0, 86] : [-46, 46];
      for (const o of offs) {
        const y = t.y + 6;
        sp.push({ x: t.x + o, y, kind: "table", approach: { x: t.x + o, y: t.y - TABLE_H / 2 - 24 }, depth: t.y + 10, taken: false });
      }
    }
    const sy = SOFA.y + SOFA.h + 14;
    for (const x of [SOFA.x + 40, SOFA.x + SOFA.w - 40]) sp.push({ x, y: sy, kind: "sofa", approach: { x, y: sy + 24 }, depth: sy, taken: false });
    sp.push({
      x: LOUNGE.x + LOUNGE.w - 22,
      y: LOUNGE.y + LOUNGE.h - 16,
      kind: "bean",
      approach: { x: LOUNGE.x + LOUNGE.w + 14, y: LOUNGE.y + LOUNGE.h - 16 },
      depth: LOUNGE.y + LOUNGE.h - 16,
      taken: false,
    });
    for (const dx of [-60, 0, 58]) {
      const x = GROUP_SPOT.x + dx;
      const y = GROUP_SPOT.y + 4;
      sp.push({ x, y, kind: "bar", approach: { x, y: y + 30 }, depth: y, taken: false });
    }
    this.spots = sp;
  }
  /** Window-bar stools are given up when a visiting group is due or present. */
  private groupSoon(): boolean {
    const d = this.g.director;
    if (d.active === "group") return true;
    if (this.g.customers.some((c) => c.kind === "group")) return true;
    const next = d.queue?.[0];
    return !!next && next.id === "group" && next.t - this.g.dayT < 20;
  }
  private freeSpots(): Spot[] {
    const bar = !this.groupSoon();
    return this.spots.filter((s) => !s.taken && (bar || s.kind !== "bar"));
  }
  private pickLook(): string {
    const used = new Set(this.people.map((p) => p.look));
    const free = CROWD_LOOKS.filter((l) => !used.has(l));
    const pool = free.length ? free : CROWD_LOOKS;
    return pool[Math.floor(Math.random() * pool.length)];
  }
  spawn(seated = false): boolean {
    if (this.people.length >= this.cap) return false;
    const free = this.freeSpots();
    if (!free.length) return false;
    const spot = free[Math.floor(Math.random() * free.length)];
    spot.taken = true;
    const look = this.pickLook();
    const L = LOOKS.find((l) => l.id === look)!;
    const startX = seated ? spot.x : DOOR.x + 30;
    const startY = seated ? spot.y : DOOR.y;
    const sprite = boil(this.g, startX, startY, seated ? `h_${look}_sit_n` : `h_${look}_walkA`)
      .setOrigin(0.5, 1)
      .setScale(SCALE)
      .setDepth(seated ? spot.depth : startY);
    const lines = L.prop === "laptop" ? CODE_LINES : L.prop === "phone" ? PHOTO_LINES.concat(CHAT_LINES) : CHAT_LINES;
    const p: Person = {
      look,
      sprite,
      spot,
      state: seated ? "sit" : "in",
      x: startX,
      y: startY,
      path: [],
      stay: seated ? Phaser.Math.FloatBetween(15, 70) : Phaser.Math.FloatBetween(45, 95),
      walkT: 0,
      chatT: Phaser.Math.FloatBetween(3, 14),
      happyT: 0,
      typing: L.prop === "laptop",
      lines,
    };
    if (!seated) {
      const nav = this.g.nav.path({ x: DOOR_INSIDE.x, y: DOOR_INSIDE.y }, spot.approach);
      p.path = [{ x: DOOR_INSIDE.x, y: DOOR_INSIDE.y }, ...nav, { x: spot.approach.x, y: spot.approach.y }];
    } else this.seat(p);
    this.people.push(p);
    return true;
  }
  private seat(p: Person) {
    const s = p.spot;
    p.x = s.x;
    p.y = s.y;
    p.state = "sit";
    p.sprite.setPosition(s.x, s.y).setDepth(s.depth).setScale(SCALE);
    setBoil(p.sprite, `h_${p.look}_sit_n`);
    if (s.kind === "table") {
      if (p.typing) p.prop = boil(this.g, s.x, s.y - 30, "crowd_laptop").setOrigin(0.5, 1).setDepth(s.depth + 11);
      p.cup = boil(this.g, s.x + (p.typing ? 26 : 14), s.y - 22, "crowd_cup").setOrigin(0.5, 1).setDepth(s.depth + 12);
    }
  }
  private stand(p: Person) {
    p.prop?.destroy();
    p.cup?.destroy();
    p.prop = undefined;
    p.cup = undefined;
    p.state = "out";
    const s = p.spot;
    s.taken = false;
    const nav = this.g.nav.path(s.approach, { x: DOOR_INSIDE.x, y: DOOR_INSIDE.y });
    p.x = s.approach.x;
    p.y = s.approach.y;
    p.path = [...nav, { x: DOOR_INSIDE.x, y: DOOR_INSIDE.y }, { x: DOOR.x + 40, y: DOOR.y }];
  }
  /** Seated people who can be visited by Pudding. */
  seated(): Person[] {
    return this.people.filter((p) => p.state === "sit");
  }
  cheer(p: Person, sec: number, line?: string) {
    p.happyT = Math.max(p.happyT, sec);
    if (line) this.say(p, line, true);
  }
  say(p: Person, line: string, force = false) {
    if (!force && this.bubbleCount >= 2) return;
    const g = this.g;
    const x = p.x;
    const y = p.y - 112;
    const t = g.add
      .text(0, 0, line, { fontFamily: `"${FONT_BODY}", cursive`, fontSize: "15px", color: C.ink })
      .setOrigin(0.5, 0.5);
    const w = t.width + 16;
    const h = 24;
    const gr = g.add.graphics();
    gr.fillStyle(0xfffaf0, 0.96);
    gr.lineStyle(2, 0x2b2622, 0.9);
    gr.fillRoundedRect(-w / 2, -h / 2, w, h, 9);
    gr.strokeRoundedRect(-w / 2, -h / 2, w, h, 9);
    gr.fillTriangle(-5, h / 2 - 1, 5, h / 2 - 1, 0, h / 2 + 7);
    gr.lineBetween(-5, h / 2, 0, h / 2 + 7);
    gr.lineBetween(5, h / 2, 0, h / 2 + 7);
    const cx = Phaser.Math.Clamp(x, 110 + w / 2, 1190 - w / 2);
    const box = g.add.container(cx, y, [gr, t]).setDepth(3900).setAlpha(0);
    this.bubbleCount++;
    g.tweens.add({ targets: box, alpha: 1, y: y - 6, duration: 180 });
    g.time.delayedCall(2600, () => {
      g.tweens.add({
        targets: box,
        alpha: 0,
        duration: 220,
        onComplete: () => {
          box.destroy();
          this.bubbleCount = Math.max(0, this.bubbleCount - 1);
        },
      });
    });
  }
  update(dt: number, allowSpawn: boolean) {
    const reduce = save.data.settings.reducedMotion;
    const zooming = this.g.director.zooming;
    if (allowSpawn) {
      this.spawnT -= dt;
      if (this.spawnT <= 0) {
        this.spawnT = this.spawn() ? Phaser.Math.FloatBetween(5, 10) : 3;
      }
    }
    // free the window bar for a visiting group
    if (this.groupSoon()) for (const p of this.people) if (p.state === "sit" && p.spot.kind === "bar") this.stand(p);
    for (const p of this.people) {
      if (p.state === "in" || p.state === "out") {
        const r = walk(p, WALK_SPEED, dt);
        if (Math.abs(r.dx) > 0.5) p.sprite.scaleX = SCALE * (r.dx < 0 ? -1 : 1);
        p.walkT += dt;
        setBoil(p.sprite, `h_${p.look}_${Math.floor(p.walkT * 4) % 2 ? "walkB" : "walkA"}`);
        p.sprite.setPosition(p.x, p.y).setDepth(p.y);
        if (r.done) {
          if (p.state === "in") p.state = "settle";
          else p.state = "gone";
        }
        continue;
      }
      if (p.state === "settle") {
        // slide from the walkway into the seat
        const s = p.spot;
        p.x += (s.x - p.x) * Math.min(1, dt * 8);
        p.y += (s.y - p.y) * Math.min(1, dt * 8);
        p.sprite.setPosition(p.x, p.y).setDepth(Math.max(p.y, s.depth));
        if (Math.hypot(s.x - p.x, s.y - p.y) < 2) this.seat(p);
        continue;
      }
      if (p.state !== "sit") continue;
      p.stay -= dt;
      p.happyT -= dt;
      p.chatT -= dt;
      if (zooming && p.happyT < 0.5 && Math.random() < dt * 0.6) this.cheer(p, 2.2, Math.random() < 0.3 ? ZOOM_LINES[Math.floor(Math.random() * ZOOM_LINES.length)] : undefined);
      const mood = p.happyT > 0 || zooming ? "h" : "n";
      // phone people lift their phones to film the zoomies, then go back to scrolling
      const film = zooming && this.g.textures.exists(`h_${p.look}_film`);
      setBoil(p.sprite, film ? `h_${p.look}_film` : `h_${p.look}_sit_${mood}`);
      // gentle typing / fidget bob
      if (!reduce) {
        const t = this.g.time.now / 1000;
        const bob = p.typing ? Math.abs(Math.sin(t * 9 + p.x)) * 1.1 : Math.sin(t * 1.6 + p.x) * 0.7;
        p.sprite.y = p.y - bob;
      }
      if (p.chatT <= 0) {
        p.chatT = Phaser.Math.FloatBetween(9, 20);
        this.say(p, p.lines[Math.floor(Math.random() * p.lines.length)]);
        if (p.lines === CODE_LINES || Math.random() < 0.3) p.happyT = 1.4;
      }
      if (p.stay <= 0 && !this.pudding.visiting(p) && !this.archie?.visiting(p)) this.stand(p);
    }
    for (const p of this.people.filter((q) => q.state === "gone")) p.sprite.destroy();
    this.people = this.people.filter((q) => q.state !== "gone");
    this.pudding.update(dt);
    this.archie?.update(dt);
    this.updateGreeter(dt);
  }
  private updateGreeter(dt: number) {
    this.greetCd -= dt;
    const arrivals: { x: number; y: number; key: object }[] = [
      ...this.people.filter((p) => p.state === "in").map((p) => ({ x: p.x, y: p.y, key: p as object })),
      ...this.g.customers.filter((c) => c.state === "enter").map((c) => ({ x: c.x, y: c.y, key: c as object })),
    ];
    for (const a of arrivals) {
      if (this.greeted.has(a.key)) continue;
      if (Math.hypot(a.x - DOOR_INSIDE.x, a.y - DOOR_INSIDE.y) > 70) continue;
      this.greeted.add(a.key);
      if (this.greetCd > 0) continue;
      this.greetCd = 1.2;
      this.greeter.celebrate(1);
      const h = this.g.add
        .text(this.greeter.x + 6, this.greeter.y - 58, "♥", { fontFamily: "sans-serif", fontSize: "18px", color: C.coral })
        .setOrigin(0.5)
        .setDepth(3950);
      this.g.tweens.add({ targets: h, y: h.y - 30, alpha: 0, duration: 1000, onComplete: () => h.destroy() });
    }
    this.greeter.animate(dt, 0, 0, 150);
  }
  destroy() {
    for (const p of this.people) {
      p.sprite.destroy();
      p.prop?.destroy();
      p.cup?.destroy();
    }
    this.people = [];
    this.pudding.destroy();
    this.archie?.destroy();
    this.greeter.destroy();
  }
}

/** Pudding naps in the lounge bed, then trots over to someone for a pat. */
class Pudding {
  g: GameScene;
  crowd: Crowd;
  rig: CorgiRig;
  nap: Phaser.GameObjects.Sprite;
  zzz: Phaser.GameObjects.Text;
  state: "nap" | "walk" | "visit" | "back" = "nap";
  home: { x: number; y: number };
  name: string;
  lines: string[];
  tag?: Phaser.GameObjects.Text;
  x: number;
  y: number;
  path: P[] = [];
  t = Phaser.Math.FloatBetween(8, 16);
  target?: Person;
  constructor(
    g: GameScene,
    crowd: Crowd,
    opts: { name: string; home: { x: number; y: number }; coat: "red" | "tri"; lines: string[]; tag?: boolean } = {
      name: "Pudding",
      home: CORGI_BED,
      coat: "red",
      lines: PAT_LINES,
    },
  ) {
    this.g = g;
    this.crowd = crowd;
    this.home = opts.home;
    this.name = opts.name;
    this.lines = opts.lines;
    this.x = opts.home.x;
    this.y = opts.home.y + 6;
    this.nap = boil(g, this.home.x, this.home.y + 12, `napcorgi_${opts.coat}`).setOrigin(0.5, 1).setScale(0.5).setDepth(this.home.y + 12);
    this.zzz = g.add
      .text(this.home.x + 22, this.home.y - 26, "z z", { fontFamily: `"${FONT_BODY}", cursive`, fontSize: "16px", color: C.inkSoft })
      .setDepth(this.home.y + 13);
    this.rig = new CorgiRig(g, this.x, this.y, 0.56, "classic", opts.coat);
    if (opts.tag) {
      this.tag = g.add
        .text(opts.home.x, opts.home.y - 40, opts.name, {
          fontFamily: `"${FONT_BODY}", cursive`,
          fontSize: "15px",
          color: C.ink,
          backgroundColor: "#fffaf0",
          padding: { x: 4, y: 1 },
        })
        .setOrigin(0.5)
        .setDepth(3940);
    }
    this.rig.setVisible(false);
  }
  visiting(p: Person) {
    return this.target === p && (this.state === "walk" || this.state === "visit");
  }
  private setNapping(on: boolean) {
    this.nap.setVisible(on);
    this.zzz.setVisible(on);
    this.rig.setVisible(!on);
  }
  update(dt: number) {
    const t = this.g.time.now / 1000;
    if (this.state === "nap") {
      this.tag?.setPosition(this.home.x, this.home.y - 34);
      this.zzz.setAlpha(0.5 + Math.sin(t * 2) * 0.3);
      this.zzz.y = this.home.y - 26 + Math.sin(t * 1.3) * 2;
      this.t -= dt;
      // zoomies wake Pudding too
      if (this.t <= 0 || (this.g.director.zooming && Math.random() < dt * 0.4)) {
        const choices = this.crowd.seated().filter((p) => p.stay > 8);
        if (!choices.length) {
          this.t = 4;
          return;
        }
        this.target = choices[Math.floor(Math.random() * choices.length)];
        const a = this.target.spot.approach;
        const goal = { x: a.x + 28, y: a.y + (this.target.spot.kind === "table" ? 0 : 4) };
        this.x = this.home.x + 34;
        this.y = this.home.y + 10;
        this.path = [...this.g.nav.path({ x: this.x, y: this.y }, goal), goal];
        this.state = "walk";
        this.setNapping(false);
      }
      return;
    }
    let vx = 0;
    let vy = 0;
    if (this.state === "walk" || this.state === "back") {
      const ox = this.x;
      const oy = this.y;
      const r = walk(this, 150, dt);
      vx = (this.x - ox) / Math.max(dt, 1e-4);
      vy = (this.y - oy) / Math.max(dt, 1e-4);
      if (this.state === "walk" && (!this.target || this.target.state !== "sit")) {
        this.goBack();
      } else if (r.done) {
        if (this.state === "walk") {
          this.state = "visit";
          this.t = 4.5;
          this.rig.facing = -1;
          this.rig.celebrate(1.2);
          if (this.target) this.crowd.cheer(this.target, 4.5, this.lines[Math.floor(Math.random() * this.lines.length)]);
          this.heart();
        } else {
          this.state = "nap";
          this.t = Phaser.Math.FloatBetween(14, 26);
          this.setNapping(true);
        }
      }
    } else if (this.state === "visit") {
      this.t -= dt;
      if (Math.floor(this.t * 2) !== Math.floor((this.t + dt) * 2) && Math.floor(this.t) % 2 === 0) this.heart();
      if (this.t <= 0 || !this.target || this.target.state !== "sit") this.goBack();
    }
    this.rig.setPosition(this.x, this.y);
    this.rig.animate(dt, vx, vy, 150);
    this.tag?.setPosition(this.x, this.y - 52);
  }
  private heart() {
    const g = this.g;
    const h = g.add
      .text(this.x + Phaser.Math.Between(-10, 10), this.y - 60, "♥", { fontFamily: "sans-serif", fontSize: "20px", color: C.coral })
      .setOrigin(0.5)
      .setDepth(3950);
    g.tweens.add({ targets: h, y: h.y - 34, alpha: 0, duration: 1100, onComplete: () => h.destroy() });
  }
  private goBack() {
    this.state = "back";
    this.target = undefined;
    const goal = { x: this.home.x + 34, y: this.home.y + 10 };
    this.path = [...this.g.nav.path({ x: this.x, y: this.y }, goal), goal];
  }
  destroy() {
    this.tag?.destroy();
    this.rig.destroy();
    this.nap.destroy();
    this.zzz.destroy();
  }
}
