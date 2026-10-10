import Phaser from "phaser";
import { BIGLOAF_SPOT, BREEDS, Breed, COLORS as C, DACHS_SPOT, DOOR, DOOR_INSIDE, ItemId, SEATS } from "../config";
import { boil, bubbleTex, setBoil } from "../art/textures";
import { puff, txt } from "../ui";
import { audio } from "../audio";
import { save } from "../save";
import type { GameScene } from "../scenes/GameScene";

export type CState = "enter" | "wait" | "happy" | "photo" | "angry" | "leave" | "zoom" | "return" | "gone";
export type CKind = "seat" | "dachs" | "bigloaf";

let NEXT_ID = 1;

export class Customer {
  id = NEXT_ID++;
  g: GameScene;
  breed: Breed;
  kind: CKind;
  seat: number;
  state: CState = "enter";
  order: ItemId[]; // full order
  done: boolean[];
  x: number;
  y: number;
  path: { x: number; y: number }[] = [];
  speed = 150;
  patience: number;
  patienceMax: number;
  stateT = 0;
  hopT = Math.random() * 10;
  root: Phaser.GameObjects.Container;
  sprite?: Phaser.GameObjects.Sprite;
  dParts?: { back: Phaser.GameObjects.Sprite; mid: Phaser.GameObjects.Sprite; front: Phaser.GameObjects.Sprite; c: Phaser.GameObjects.Container };
  dLen = 230;
  bubble: Phaser.GameObjects.Container;
  icons: Phaser.GameObjects.Sprite[] = [];
  checks: Phaser.GameObjects.Text[] = [];
  bar: Phaser.GameObjects.Graphics;
  ring: Phaser.GameObjects.Sprite;
  mood: "n" | "h" | "a" = "n";
  zoomIdx = 0;
  highlighted = false;
  wrongs = 0;
  scale: number;

  constructor(g: GameScene, breed: Breed, order: ItemId[], seat: number, patience: number) {
    this.g = g;
    this.breed = breed;
    this.order = order;
    this.done = order.map(() => false);
    this.seat = seat;
    this.kind = breed === "dachshund" ? "dachs" : breed === "bigloaf" ? "bigloaf" : "seat";
    this.patience = this.patienceMax = patience;
    this.scale = this.kind === "bigloaf" ? 0.95 : 0.78;
    const sc = g;
    this.x = DOOR.x + 30;
    this.y = DOOR.y + Phaser.Math.Between(-10, 10);
    this.root = sc.add.container(this.x, this.y);
    this.ring = boil(sc, 0, 0, "ring").setVisible(false).setScale(this.kind === "bigloaf" ? 2.1 : 1);
    this.root.add(this.ring);
    const shadow = sc.add.sprite(0, 0, this.kind === "bigloaf" ? "shadow_big" : "shadow", 0).setScale(this.kind === "seat" ? 0.7 : 1);
    if (this.kind === "dachs") {
      const c = sc.add.container(0, 0);
      const back = boil(sc, 0, 0, "dachs_back").setOrigin(0, 0.5);
      const mid = boil(sc, 0, 0, "dachs_mid").setOrigin(0, 0.5);
      const front = boil(sc, 0, 0, "dachs_front_n").setOrigin(0, 0.5);
      c.add([back, mid, front]);
      this.dParts = { back, mid, front, c };
      shadow.setScale(2.4, 1);
      this.root.add([shadow, c]);
      this.layoutDachs();
      this.speed = 110;
    } else {
      this.sprite = boil(sc, 0, 4, `${breed}_n`).setOrigin(0.5, 1).setScale(this.scale);
      this.root.add([shadow, this.sprite]);
      if (this.kind === "bigloaf") this.speed = 70;
    }
    // order bubble
    this.bubble = sc.add.container(0, 0);
    const bk = bubbleTex(sc, order.length);
    const bub = boil(sc, 0, 0, bk).setOrigin(0.5, 1);
    this.bubble.add(bub);
    const w = 24 + order.length * 52;
    order.forEach((it, i) => {
      const ix = -w / 2 + 38 + i * 52;
      const icon = boil(sc, ix, -50, `item_${it}`).setScale(0.82);
      const check = txt(sc, ix + 10, -40, "✓", 34, C.mintDark, true, { stroke: "#fff", strokeThickness: 5 }).setVisible(false);
      this.icons.push(icon);
      this.checks.push(check);
      this.bubble.add([icon, check]);
    });
    this.bar = sc.add.graphics();
    this.bubble.add(this.bar);
    this.bubble.setVisible(false);
    // path in
    this.path = [DOOR_INSIDE, ...this.destPath(DOOR_INSIDE)];
  }

  get def() {
    return BREEDS[this.breed];
  }
  get seatPos() {
    if (this.kind === "dachs") return { x: DACHS_SPOT.x, y: DACHS_SPOT.y };
    if (this.kind === "bigloaf") return BIGLOAF_SPOT;
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

  private destPath(from: { x: number; y: number }) {
    if (this.kind === "dachs") return [{ x: DACHS_SPOT.x + 140, y: DACHS_SPOT.y }, { x: DACHS_SPOT.x, y: DACHS_SPOT.y }];
    return this.g.nav.path(from, this.seatPos);
  }

  private layoutDachs() {
    const d = this.dParts!;
    const L = this.dLen;
    const midW = Math.max(4, L - 60 - 110 + 8);
    d.back.x = -L / 2;
    d.mid.x = -L / 2 + 56;
    d.mid.scaleX = midW / 32;
    d.front.x = L / 2 - 110;
  }

  /** World-space anchor for bubble + interaction. */
  get anchor() {
    if (this.kind === "dachs") {
      const flip = this.dParts!.c.scaleX;
      return { x: this.x + flip * (this.dLen / 2 - 34), y: this.y };
    }
    return { x: this.x, y: this.y };
  }

  /** Distance from point to this customer's interaction shape. */
  distTo(px: number, py: number) {
    if (this.kind === "dachs") {
      const x0 = this.x - this.dLen / 2;
      const x1 = this.x + this.dLen / 2;
      const cx = Math.max(x0, Math.min(px, x1));
      return Math.hypot(px - cx, py - this.y);
    }
    if (this.kind === "bigloaf") return Math.max(0, Math.hypot(px - this.x, py - (this.y - 40)) - 80);
    return Math.hypot(px - this.x, py - (this.y - 20));
  }

  solidRect() {
    if (this.kind === "dachs" && (this.state === "wait" || this.state === "happy" || this.state === "angry"))
      return { x: this.x - this.dLen / 2 + 8, y: this.y - 14, w: this.dLen - 16, h: 28 };
    if (this.kind === "bigloaf" && this.state !== "enter" && this.state !== "leave" && this.state !== "gone")
      return { x: this.x - 70, y: this.y - 52, w: 140, h: 62 };
    return null;
  }

  setMood(m: "n" | "h" | "a") {
    if (m === this.mood) return;
    this.mood = m;
    if (this.sprite) setBoil(this.sprite, `${this.breed}_${m}`);
    if (this.dParts) setBoil(this.dParts.front, `dachs_front_${m}`);
  }

  say(line: string, color: string = C.ink) {
    const a = this.anchor;
    const yOff = this.kind === "bigloaf" ? 250 : 190;
    const t = txt(this.g, a.x, a.y - yOff, line, 20, color, false, {
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
      this.state = this.breed === "influencer" ? "photo" : "happy";
      this.stateT = 0;
      this.setMood("h");
      this.bubble.setVisible(false);
      this.ring.setVisible(false);
      this.say(Phaser.Utils.Array.GetRandom(this.def.lines.happy), C.mintDark);
      this.hopBig();
      return true;
    }
    this.hopBig();
    return false;
  }

  wrong(item: ItemId) {
    this.wrongs++;
    const lines = item === "burnt" ? ["Is this... charcoal?!", "*cough* very crispy"] : this.def.lines.wrong;
    this.say(Phaser.Utils.Array.GetRandom(lines), C.coral);
    if (this.breed !== "retriever") {
      this.patience = Math.max(1, this.patience - this.patienceMax * 0.12);
      if (this.sprite) this.g.tweens.add({ targets: this.sprite, x: 6, yoyo: true, repeat: 3, duration: 50 });
    } else this.hopBig();
  }

  hopBig() {
    const t = this.sprite ?? this.dParts!.c;
    if (save.data.settings.reducedMotion) return;
    this.g.tweens.add({ targets: t, y: t.y - 16, scaleY: t.scaleY * 1.08, duration: 120, yoyo: true, ease: "Quad.out" });
  }

  startZoom() {
    if (this.state !== "wait" || this.kind !== "seat") return;
    this.state = "zoom";
    this.bubble.setVisible(false);
    this.ring.setVisible(false);
    const loop = this.g.zoomLoop;
    let best = 0;
    let bd = Infinity;
    loop.forEach((p, i) => {
      const d = Math.hypot(p.x - this.x, p.y - this.y);
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    this.zoomIdx = best;
    this.path = [loop[best]];
    this.speed = 330 + Math.random() * 60;
  }

  endZoom() {
    if (this.state !== "zoom") return;
    this.state = "return";
    this.path = this.g.nav.path({ x: this.x, y: this.y }, this.seatPos);
    this.speed = 260;
  }

  leave(angry: boolean) {
    if (this.state === "leave" || this.state === "gone") return;
    if (angry) {
      this.state = "angry";
      this.stateT = 0;
      this.setMood("a");
      this.bubble.setVisible(false);
      this.ring.setVisible(false);
      this.say(Phaser.Utils.Array.GetRandom(this.def.lines.leave), C.coral);
      const a = this.anchor;
      const cloud = boil(this.g, a.x, a.y - (this.kind === "bigloaf" ? 220 : 140), "storm").setDepth(4700);
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
    if (this.kind === "dachs") {
      this.dParts!.c.scaleX = 1;
      this.path = [
        { x: DOOR_INSIDE.x - this.dLen / 2, y: this.y },
        { x: DOOR.x + this.dLen, y: DOOR.y },
      ];
    } else this.path = [...this.g.nav.path({ x: this.x, y: this.y }, DOOR_INSIDE), { x: DOOR.x + 40, y: DOOR.y }];
    this.speed = this.mood === "a" ? 230 : 170;
    if (this.kind === "bigloaf") this.speed = 90;
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
    if (this.sprite && Math.abs(dx) > 2) this.sprite.scaleX = this.scale * (dx < 0 ? -1 : 1);
    this.hopT += dt * (this.speed > 250 ? 16 : 10);
    return this.path.length === 0;
  }

  update(dt: number) {
    this.stateT += dt;
    const moving = this.state === "enter" || this.state === "leave" || this.state === "zoom" || this.state === "return";
    switch (this.state) {
      case "enter":
        if (this.walk(dt)) this.arrive();
        break;
      case "return":
        if (this.walk(dt)) {
          this.state = "wait";
          this.bubble.setVisible(true);
        }
        break;
      case "zoom":
        if (this.walk(dt)) {
          this.zoomIdx = (this.zoomIdx + 1) % this.g.zoomLoop.length;
          this.path = [this.g.zoomLoop[this.zoomIdx]];
        }
        break;
      case "wait": {
        if (!this.g.patienceFrozen) this.patience -= dt;
        const f = this.patienceFrac;
        if (this.breed === "cat") this.setMood(f < 0.3 ? "a" : "n");
        else this.setMood(f < 0.3 ? "a" : f > 0.8 && this.breed === "retriever" ? "h" : "n");
        if (this.kind === "dachs") {
          this.dLen = 230 + 110 * (1 - f);
          this.layoutDachs();
        }
        if (this.patience <= 0) this.g.customerTimedOut(this);
        break;
      }
      case "happy":
        if (this.stateT > 1.1) this.goOut();
        break;
      case "photo":
        if (this.stateT > 0.5 && this.stateT - dt <= 0.5) this.g.influencerPhoto(this);
        if (this.stateT > 1.8) this.goOut();
        break;
      case "angry":
        if (this.stateT > 0.9) this.goOut();
        break;
      case "leave":
        if (this.walk(dt)) {
          this.state = "gone";
        }
        break;
    }
    // visuals
    this.root.setPosition(this.x, this.y);
    this.root.setDepth(this.y);
    const body = this.sprite;
    if (body) {
      const hop = moving ? Math.abs(Math.sin(this.hopT)) * (save.data.settings.reducedMotion ? 2 : 8) : 0;
      body.y = 4 - hop;
      if (!moving && this.state === "wait" && this.patienceFrac < 0.3) body.angle = Math.sin(this.g.time.now / 40) * 2;
      else body.angle = 0;
    }
    if (this.kind === "dachs" && this.dParts) {
      this.dParts.c.y = moving ? -Math.abs(Math.sin(this.hopT * 1.4)) * 3 : 0;
    }
    if (this.bubble.visible) {
      const a = this.anchor;
      const yOff = this.kind === "bigloaf" ? 200 : this.kind === "dachs" ? 40 : 100;
      const urgent = this.patienceFrac < 0.3 && !save.data.settings.reducedMotion;
      this.bubble.setPosition(a.x + (urgent ? Math.sin(this.g.time.now / 30) * 2 : 0), a.y - yOff);
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
    if (this.g.patienceFrozen) {
      g.fillStyle(0xffffff, 0.5);
      g.fillRoundedRect(-w / 2, -14, w, 8, 4);
    }
  }

  private arrive() {
    this.state = "wait";
    this.stateT = 0;
    if (this.kind === "dachs") {
      this.dParts!.c.scaleX = -1;
      puff(this.g, this.x, this.y, 3);
    }
    if (this.kind === "bigloaf") this.g.shakeSmall();
    this.bubble.setVisible(true);
    this.bubble.setScale(0.2);
    this.g.tweens.add({ targets: this.bubble, scale: 1, duration: 260, ease: "Back.out" });
    this.say(Phaser.Utils.Array.GetRandom(this.def.lines.order));
    audio.play(this.breed === "cat" ? "wrong" : "bark");
  }

  destroy() {
    this.root.destroy();
    this.bubble.destroy();
  }
}
