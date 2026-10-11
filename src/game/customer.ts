import Phaser from "phaser";
import { COLORS as C, DOOR, DOOR_INSIDE, GROUP_SPOT, ItemId, ROLES, Role, SEATS } from "../config";
import { ROLE_LOOKS } from "../art/humans";
import { boil, bubbleTex, setBoil } from "../art/textures";
import { txt } from "../ui";
import { audio } from "../audio";
import { save } from "../save";
import type { GameScene } from "../scenes/GameScene";

export type CState = "enter" | "wait" | "happy" | "photo" | "angry" | "leave" | "gone";
export type CKind = "seat" | "group";

let NEXT_ID = 1;
const GROUP_OFFSETS = [-58, 0, 56];
const SCALE = 0.78;

interface Member {
  look: string;
  sprite: Phaser.GameObjects.Sprite;
  dx: number;
}

/** A human customer (or a visiting group sharing one order). Corgis run the café; humans pay. */
export class Customer {
  id = NEXT_ID++;
  g: GameScene;
  role: Role;
  kind: CKind;
  seat: number;
  state: CState = "enter";
  order: ItemId[];
  done: boolean[];
  x: number;
  y: number;
  path: { x: number; y: number }[] = [];
  speed = 125;
  patience: number;
  patienceMax: number;
  stateT = 0;
  walkT = Math.random() * 10;
  root: Phaser.GameObjects.Container;
  members: Member[] = [];
  bubble: Phaser.GameObjects.Container;
  icons: Phaser.GameObjects.Sprite[] = [];
  checks: Phaser.GameObjects.Text[] = [];
  bar: Phaser.GameObjects.Graphics;
  ring: Phaser.GameObjects.Sprite;
  mood: "n" | "h" | "a" = "n";
  highlighted = false;
  wrongs = 0;
  watching = false; // reacting to zoomies (patience paused)
  private watchSayT = 0;

  constructor(g: GameScene, role: Role, order: ItemId[], seat: number, patience: number, look?: string) {
    this.g = g;
    this.role = role;
    this.order = order;
    this.done = order.map(() => false);
    this.seat = seat;
    this.kind = role === "group" ? "group" : "seat";
    this.patience = this.patienceMax = patience;
    this.x = DOOR.x + 30;
    this.y = DOOR.y + Phaser.Math.Between(-10, 10);
    this.root = g.add.container(this.x, this.y);
    this.ring = boil(g, 0, 0, "ring").setVisible(false).setScale(this.kind === "group" ? 2.2 : 1.1);
    this.root.add(this.ring);
    const looks = this.kind === "group" ? [...ROLE_LOOKS.group] : [look ?? Phaser.Utils.Array.GetRandom(ROLE_LOOKS[role])];
    looks.forEach((lk, i) => {
      const dx = this.kind === "group" ? GROUP_OFFSETS[i] : 0;
      const sh = g.add.sprite(dx, 0, "shadow", 0).setScale(0.8, 0.7);
      const sp = boil(g, dx, 4, `h_${lk}_walkA`).setOrigin(0.5, 1).setScale(SCALE);
      this.root.add([sh, sp]);
      this.members.push({ look: lk, sprite: sp, dx });
    });
    // order bubble
    this.bubble = g.add.container(0, 0);
    const bk = bubbleTex(g, order.length);
    this.bubble.add(boil(g, 0, 0, bk).setOrigin(0.5, 1));
    const w = 24 + order.length * 52;
    order.forEach((it, i) => {
      const ix = -w / 2 + 38 + i * 52;
      const icon = boil(g, ix, -50, `item_${it}`).setScale(0.82);
      const check = txt(g, ix + 10, -40, "✓", 34, C.mintDark, true, { stroke: "#fff", strokeThickness: 5 }).setVisible(false);
      this.icons.push(icon);
      this.checks.push(check);
      this.bubble.add([icon, check]);
    });
    this.bar = g.add.graphics();
    this.bubble.add(this.bar);
    this.bubble.setVisible(false);
    if (this.kind === "group") this.speed = 105;
    this.path = [DOOR_INSIDE, ...g.nav.path(DOOR_INSIDE, this.seatPos)];
  }

  get def() {
    return ROLES[this.role];
  }
  get seatPos() {
    if (this.kind === "group") return GROUP_SPOT;
    return SEATS[this.seat];
  }
  get waiting() {
    return this.state === "wait";
  }
  /** Items still needed. */
  needs(item: ItemId): number {
    return this.order.findIndex((o, i) => o === item && !this.done[i]);
  }
  get remaining(): ItemId[] {
    return this.order.filter((_, i) => !this.done[i]);
  }
  get patienceFrac() {
    return Math.max(0, this.patience / this.patienceMax);
  }
  /** World-space anchor for bubble + interaction. */
  get anchor() {
    return { x: this.x, y: this.y };
  }
  get forgiving() {
    return this.role === "regular";
  }

  /** Distance from a point to this customer's interaction shape. */
  distTo(px: number, py: number) {
    if (this.kind === "group") return Math.max(0, Math.hypot((px - this.x) * 0.6, py - (this.y - 20)) - 50);
    return Math.hypot(px - this.x, py - (this.y - 20));
  }

  solidRect() {
    if (this.kind === "group" && this.state !== "enter" && this.state !== "leave" && this.state !== "gone")
      return { x: this.x - 88, y: this.y - 16, w: 176, h: 26 };
    return null;
  }

  private seated() {
    return this.state === "wait" || this.state === "happy" || this.state === "photo" || this.state === "angry";
  }

  private applyPose() {
    const sit = this.seated();
    const step = Math.floor(this.walkT * 1.6) % 2 === 0 ? "walkA" : "walkB";
    for (const m of this.members) {
      const filming = this.state === "photo" && this.g.textures.exists(`h_${m.look}_film`);
      const key = filming ? `h_${m.look}_film` : sit ? `h_${m.look}_sit_${this.mood}` : this.state === "leave" && this.mood === "h" ? `h_${m.look}_walkH` : `h_${m.look}_${step}`;
      setBoil(m.sprite, key);
    }
  }

  setMood(m: "n" | "h" | "a") {
    if (m === this.mood) return;
    this.mood = m;
    this.applyPose();
  }

  say(line: string, color: string = C.ink) {
    const a = this.anchor;
    const t = txt(this.g, a.x, a.y - 196, line, 20, color, false, {
      backgroundColor: "#fffaf0",
      padding: { x: 8, y: 3 },
    });
    t.setDepth(4800);
    t.setAngle(Phaser.Math.Between(-3, 3));
    t.setX(Phaser.Math.Clamp(a.x, 120 + t.width / 2, 1180 - t.width / 2));
    this.g.tweens.add({ targets: t, y: t.y - 16, alpha: 0, delay: 1700, duration: 500, onComplete: () => t.destroy() });
  }

  setHighlight(items: Set<ItemId>) {
    const on = this.waiting && this.remaining.some((r) => items.has(r));
    this.highlighted = on;
    this.ring.setVisible(on);
    this.order.forEach((it, i) => {
      const glow = on && !this.done[i] && items.has(it);
      this.icons[i].setScale(glow ? 0.82 + Math.sin(this.g.time.now / 120) * 0.08 : 0.82);
    });
  }

  /** Mark an item delivered. Returns true when the whole order is complete. */
  deliver(idx: number): boolean {
    this.done[idx] = true;
    this.checks[idx].setVisible(true).setScale(0.3);
    this.g.tweens.add({ targets: this.checks[idx], scale: 1, duration: 200, ease: "Back.out" });
    this.icons[idx].setAlpha(0.45);
    if (this.done.every(Boolean)) {
      this.state = this.role === "creator" ? "photo" : "happy";
      this.stateT = 0;
      this.watching = false;
      this.setMood("h");
      this.bubble.setVisible(false);
      this.ring.setVisible(false);
      this.say(Phaser.Utils.Array.GetRandom(this.def.lines.happy), C.mintDark);
      this.delight();
      return true;
    }
    this.delight(true);
    return false;
  }

  wrong(item: ItemId) {
    this.wrongs++;
    const lines = item === "burnt" ? ["Is this... charcoal?!", "*cough* very crispy"] : this.def.lines.wrong;
    this.say(Phaser.Utils.Array.GetRandom(lines), C.coral);
    if (!this.forgiving) {
      this.patience = Math.max(1, this.patience - this.patienceMax * 0.12);
      if (!save.data.settings.reducedMotion)
        for (const m of this.members) this.g.tweens.add({ targets: m.sprite, x: m.dx + 5, yoyo: true, repeat: 3, duration: 50 });
    }
  }

  /** Human delight beat: a little bounce and a hand-drawn heart. */
  delight(small = false) {
    if (save.data.settings.reducedMotion) return;
    for (const m of this.members)
      this.g.tweens.add({ targets: m.sprite, y: m.sprite.y - (small ? 6 : 12), duration: 120, yoyo: true, ease: "Quad.out" });
  }

  /** Zoomies: staff corgis run laps; humans stay put, react, and stop the clock on their patience. */
  startZoom() {
    if (this.state !== "wait") return;
    this.watching = true;
    this.watchSayT = Math.random() * 1.2;
    this.setMood("h");
  }
  endZoom() {
    this.watching = false;
    if (this.state === "wait") this.setMood("n");
  }

  leave(angry: boolean) {
    if (this.state === "leave" || this.state === "gone") return;
    this.watching = false;
    if (angry) {
      this.state = "angry";
      this.stateT = 0;
      this.setMood("a");
      this.bubble.setVisible(false);
      this.ring.setVisible(false);
      this.say(Phaser.Utils.Array.GetRandom(this.def.lines.leave), C.coral);
      const a = this.anchor;
      const cloud = boil(this.g, a.x, a.y - 150, "storm").setDepth(4700);
      this.g.tweens.add({ targets: cloud, y: cloud.y - 30, alpha: 0, delay: 900, duration: 600, onComplete: () => cloud.destroy() });
      audio.play("huff");
      return;
    }
    this.goOut();
  }

  private goOut() {
    this.state = "leave";
    this.bubble.setVisible(false);
    this.ring.setVisible(false);
    this.path = [...this.g.nav.path({ x: this.x, y: this.y }, DOOR_INSIDE), { x: DOOR.x + 60, y: DOOR.y }];
    this.speed = this.mood === "a" ? 190 : 140;
    this.applyPose();
  }

  private walk(dt: number): boolean {
    const t = this.path[0];
    if (!t) return true;
    const dx = t.x - this.x;
    const dy = t.y - this.y;
    const d = Math.hypot(dx, dy);
    const step = this.speed * dt;
    if (d <= step) {
      this.x = t.x;
      this.y = t.y;
      this.path.shift();
    } else {
      this.x += (dx / d) * step;
      this.y += (dy / d) * step;
    }
    if (Math.abs(dx) > 2) for (const m of this.members) m.sprite.scaleX = SCALE * (dx < 0 ? -1 : 1);
    const before = Math.floor(this.walkT * 1.6);
    this.walkT += dt * 5;
    if (Math.floor(this.walkT * 1.6) !== before) this.applyPose();
    return this.path.length === 0;
  }

  update(dt: number) {
    this.stateT += dt;
    const moving = this.state === "enter" || this.state === "leave";
    switch (this.state) {
      case "enter":
        if (this.walk(dt)) this.arrive();
        break;
      case "wait": {
        if (!this.g.patienceFrozen && !this.watching) this.patience -= dt;
        if (this.watching) {
          this.watchSayT -= dt;
          if (this.watchSayT <= 0) {
            this.watchSayT = 99;
            this.say(Phaser.Utils.Array.GetRandom(this.def.lines.zoom));
          }
        } else {
          const f = this.patienceFrac;
          if (this.role === "sceptic") this.setMood(f < 0.3 ? "a" : "n");
          else this.setMood(f < 0.3 ? "a" : f > 0.8 && this.role === "regular" ? "h" : "n");
        }
        if (this.patience <= 0) this.g.customerTimedOut(this);
        break;
      }
      case "happy":
        if (this.stateT > 1.2) this.goOut();
        break;
      case "photo":
        if (this.stateT > 0.5 && this.stateT - dt <= 0.5) this.g.creatorPhoto(this);
        if (this.stateT > 1.9) this.goOut();
        break;
      case "angry":
        if (this.stateT > 0.9) this.goOut();
        break;
      case "leave":
        if (this.walk(dt)) this.state = "gone";
        break;
    }
    // visuals
    this.root.setPosition(this.x, this.y);
    this.root.setDepth(this.y);
    const rm = save.data.settings.reducedMotion;
    for (const m of this.members) {
      const bob = moving ? Math.abs(Math.sin(this.walkT * 2.5)) * (rm ? 1 : 3) : 0;
      if (!this.g.tweens.isTweening(m.sprite)) {
        m.sprite.y = 4 - bob;
        m.sprite.x = m.dx;
      }
      if (this.state === "wait" && !this.watching && this.patienceFrac < 0.3 && !rm) m.sprite.angle = Math.sin(this.g.time.now / 40) * 1.5;
      else if (this.watching && !rm) m.sprite.angle = Math.sin(this.g.time.now / 90 + m.dx) * 3;
      else m.sprite.angle = 0;
    }
    if (this.bubble.visible) {
      const a = this.anchor;
      const urgent = this.patienceFrac < 0.3 && !this.watching && !rm;
      this.bubble.setPosition(a.x + (urgent ? Math.sin(this.g.time.now / 30) * 2 : 0), a.y - 118);
      this.bubble.setDepth(4000 + this.y * 0.01);
      this.drawBar();
    }
  }

  private drawBar() {
    const g = this.bar;
    g.clear();
    const w = 16 + this.order.length * 52;
    const f = this.patienceFrac;
    const col = f > 0.55 ? 0x7fcfb0 : f > 0.3 ? 0xe39b4f : 0xf2786b;
    g.fillStyle(0xefe5cc, 1);
    g.fillRoundedRect(-w / 2, -14, w, 8, 4);
    g.fillStyle(col, 1);
    g.fillRoundedRect(-w / 2, -14, Math.max(6, w * f), 8, 4);
    g.lineStyle(2, 0x2b2622, 0.9);
    g.strokeRoundedRect(-w / 2, -14, w, 8, 4);
    if (this.g.patienceFrozen || this.watching) {
      g.fillStyle(0xffffff, 0.5);
      g.fillRoundedRect(-w / 2, -14, w, 8, 4);
    }
  }

  private arrive() {
    this.state = "wait";
    this.stateT = 0;
    for (const m of this.members) m.sprite.scaleX = SCALE;
    this.applyPose();
    this.bubble.setVisible(true);
    this.bubble.setScale(0.2);
    this.g.tweens.add({ targets: this.bubble, scale: 1, duration: 260, ease: "Back.out" });
    this.say(Phaser.Utils.Array.GetRandom(this.def.lines.order));
    audio.play("pop");
    if (this.g.director.zooming) this.startZoom();
  }

  destroy() {
    this.root.destroy();
    this.bubble.destroy();
  }
}
