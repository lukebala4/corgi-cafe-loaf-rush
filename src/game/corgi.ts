import Phaser from "phaser";
import { APRONS, ApronId, ItemId } from "../config";
import { boil, setBoil } from "../art/textures";
import { save } from "../save";

/** A doodled corgi rig: shadow, legs, loaf body, apron, floppy-reactive ears. */
export class CorgiRig extends Phaser.GameObjects.Container {
  flip: Phaser.GameObjects.Container;
  bodyGroup: Phaser.GameObjects.Container;
  legs: Phaser.GameObjects.Sprite;
  body_: Phaser.GameObjects.Sprite;
  apron?: Phaser.GameObjects.Sprite;
  bow?: Phaser.GameObjects.Sprite;
  earBack: Phaser.GameObjects.Sprite;
  earFront: Phaser.GameObjects.Sprite;
  extras: Phaser.GameObjects.GameObject[] = [];
  facing = 1;
  walkT = 0;
  earLag = 0;
  baseScale: number;

  constructor(scene: Phaser.Scene, x: number, y: number, scale = 0.82, apron: ApronId | "none" | "staff" = "classic") {
    super(scene, x, y);
    this.baseScale = scale;
    const shadow = scene.add.sprite(0, 2, "shadow", 0).setScale(0.95 * scale, scale);
    this.flip = scene.add.container(0, 0);
    this.bodyGroup = scene.add.container(0, 0);
    this.legs = boil(scene, 0, -22 * scale, "corgi_legsA").setOrigin(0.5, 0).setScale(scale);
    this.body_ = boil(scene, 0, -16 * scale, "corgi_body").setOrigin(0.5, 1).setScale(scale);
    // ear pivots in body-space: head centre ~ (94-62, 28-66) relative to body origin (bottom centre)
    const hx = (94 - 62) * scale;
    const hy = -16 * scale + (8 - 66) * scale;
    this.earBack = boil(scene, hx - 10 * scale, hy + 6 * scale, "corgi_ear").setOrigin(0.5, 0.95).setScale(scale * 0.9).setTint(0xd88a40);
    this.earFront = boil(scene, hx + 6 * scale, hy + 6 * scale, "corgi_ear").setOrigin(0.5, 0.95).setScale(scale);
    this.bodyGroup.add([this.earBack, this.body_]);
    this.setApron(apron);
    this.bodyGroup.add(this.earFront);
    this.flip.add([this.legs, this.bodyGroup]);
    this.add([shadow, this.flip]);
    scene.add.existing(this);
  }

  setApron(id: ApronId | "none" | "staff") {
    this.apron?.destroy();
    this.bow?.destroy();
    this.apron = undefined;
    this.bow = undefined;
    if (id === "none") return;
    const s = this.baseScale;
    const key = id === "polka" ? "apron_polka" : "apron";
    this.apron = boil(this.scene, 0, -16 * s, key).setOrigin(0.5, 1).setScale(s);
    if (id === "staff") this.apron.setTint(0xf2786b);
    else if (id !== "polka") this.apron.setTint(Phaser.Display.Color.HexStringToColor(APRONS.find((a) => a.id === id)!.color).color);
    const idx = this.bodyGroup.getIndex(this.body_);
    this.bodyGroup.addAt(this.apron, idx + 1);
    if (id === "bowtie") {
      this.bow = boil(this.scene, (84 - 62) * s, -16 * s + (40 - 66) * s, "bowtie").setScale(s);
      this.bodyGroup.addAt(this.bow, idx + 2);
    }
  }

  addHeadwear(key: string, dx = 0, dy = 0) {
    const s = this.baseScale;
    const h = boil(this.scene, (94 - 62) * s + dx * s, -16 * s + (6 - 66) * s + dy * s, key).setScale(s);
    this.bodyGroup.add(h);
    this.extras.push(h);
    return h;
  }

  /** Animate from velocity. speedFrac 0..1, dashing gives flattened ears + stretch. */
  animate(dt: number, vx: number, vy: number, maxSpeed: number, dashing = false) {
    const sp = Math.hypot(vx, vy);
    const frac = Math.min(1, sp / maxSpeed);
    if (vx > 8) this.facing = 1;
    else if (vx < -8) this.facing = -1;
    this.flip.scaleX += (this.facing - this.flip.scaleX) * Math.min(1, dt * 18);
    const reduce = save.data.settings.reducedMotion;
    if (frac > 0.08) {
      this.walkT += dt * (8 + frac * 8);
      const step = Math.sin(this.walkT * Math.PI);
      setBoil(this.legs, step > 0 ? "corgi_legsA" : "corgi_legsB");
      const bob = Math.abs(step) * (reduce ? 1 : 4) * frac;
      this.bodyGroup.y = -bob;
      const sq = reduce ? 0 : 0.05 * Math.abs(Math.cos(this.walkT * Math.PI)) * frac;
      this.bodyGroup.scaleY = 1 - sq + (dashing ? -0.08 : 0);
      this.bodyGroup.scaleX = 1 + sq + (dashing ? 0.14 : 0);
    } else {
      this.walkT = 0;
      setBoil(this.legs, "corgi_legsA");
      const t = this.scene.time.now / 1000;
      this.bodyGroup.y += (0 - this.bodyGroup.y) * Math.min(1, dt * 12);
      const breathe = reduce ? 0 : Math.sin(t * 2.6) * 0.02;
      this.bodyGroup.scaleY += (1 + breathe - this.bodyGroup.scaleY) * Math.min(1, dt * 10);
      this.bodyGroup.scaleX += (1 - breathe - this.bodyGroup.scaleX) * Math.min(1, dt * 10);
    }
    // ears: lag behind movement, flop when stopping, flatten when dashing
    const target = dashing ? -1.0 : -0.45 * frac;
    this.earLag += (target - this.earLag) * Math.min(1, dt * (dashing ? 20 : 7));
    const flop = reduce ? 0 : Math.sin(this.scene.time.now / 90) * 0.08 * frac;
    this.earFront.rotation = this.earLag + flop;
    this.earBack.rotation = this.earLag * 0.8 - 0.15 - flop;
    this.setDepth(this.y);
  }

  /** Squash pop, e.g. when picking something up. */
  pop() {
    if (save.data.settings.reducedMotion) return;
    this.scene.tweens.add({ targets: this.bodyGroup, scaleY: 1.18, scaleX: 0.88, duration: 70, yoyo: true, ease: "Quad.out" });
  }
}

/** The player: physics state + carried items display. */
export class Player {
  x: number;
  y: number;
  vx = 0;
  vy = 0;
  r = 18;
  speed = 300;
  rig: CorgiRig;
  items: ItemId[] = [];
  capacity = 1;
  dashT = 0;
  dashCd = 0;
  dashDir = new Phaser.Math.Vector2(1, 0);
  stunT = 0;
  stuckT = 0;
  pawT = 0;
  pawSide = 1;
  carryC: Phaser.GameObjects.Container;
  carrySprites: Phaser.GameObjects.Sprite[] = [];
  carryBg: Phaser.GameObjects.Ellipse;

  constructor(scene: Phaser.Scene, x: number, y: number, apron: ApronId) {
    this.x = x;
    this.y = y;
    this.rig = new CorgiRig(scene, x, y, 0.82, apron);
    this.carryC = scene.add.container(x, y - 92);
    this.carryBg = scene.add.ellipse(0, 0, 70, 58, 0xffffff, 0.92).setStrokeStyle(3, 0x7fcfb0);
    this.carryC.add(this.carryBg);
    this.carryC.setVisible(false);
  }

  get dashing() {
    return this.dashT > 0;
  }

  refreshCarry(scene: Phaser.Scene) {
    for (const s of this.carrySprites) s.destroy();
    this.carrySprites = [];
    const n = this.items.length;
    this.carryC.setVisible(n > 0);
    this.carryBg.setSize(n > 1 ? 118 : 70, 58);
    this.carryBg.setDisplaySize(n > 1 ? 118 : 70, 58);
    this.items.forEach((it, i) => {
      const s = boil(scene, n > 1 ? (i === 0 ? -26 : 26) : 0, 0, `item_${it}`).setScale(0.92);
      this.carryC.add(s);
      this.carrySprites.push(s);
    });
    if (n) {
      this.carryC.setScale(0.6);
      scene.tweens.add({ targets: this.carryC, scale: 1, duration: 180, ease: "Back.out" });
    }
  }

  sync() {
    this.rig.setPosition(this.x, this.y);
    this.carryC.setPosition(this.x, this.y - 92 + this.rig.bodyGroup.y);
    this.carryC.setDepth(this.y + 0.5);
  }
}
