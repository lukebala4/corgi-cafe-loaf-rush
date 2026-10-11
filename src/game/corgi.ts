import Phaser from "phaser";
import { APRONS, ApronId, ItemId } from "../config";
import { boil, setBoil } from "../art/textures";
import { CB, CE, Coat, CorgiMood, EAR_FAR, EAR_NEAR, THROAT } from "../art/corgi";
import { save } from "../save";

const BODY_Y = -10; // body canvas bottom, in unscaled rig units
const CX = CB.w / 2;
/** Body-canvas point -> rig space (unscaled). */
const bx = (x: number) => x - CX;
const by = (y: number) => BODY_Y + (y - CB.h);

export type RigWear = ApronId | "none" | "staff";

/** A doodled Pembroke corgi: shadow, short legs, long low body, big erect reactive ears. */
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
  coat: Coat;
  mood: CorgiMood = "n";
  private cheerT = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, scale = 0.82, wear: RigWear = "classic", coat: Coat = "red") {
    super(scene, x, y);
    this.baseScale = scale;
    this.coat = coat;
    const s = scale;
    const shadow = scene.add.sprite(0, 2, "shadow", 0).setScale(1.05 * s, s);
    this.flip = scene.add.container(0, 0);
    this.bodyGroup = scene.add.container(0, 0);
    this.legs = boil(scene, 0, 2 * s, `corgi_legsN_${coat}`).setOrigin(0.5, 1).setScale(s);
    this.body_ = boil(scene, 0, BODY_Y * s, `corgi_body_${coat}_n`).setOrigin(0.5, 1).setScale(s);
    const oy = 44 / CE.h;
    this.earBack = boil(scene, bx(EAR_FAR.x) * s, by(EAR_FAR.y) * s, `corgi_ear_${coat}`).setOrigin(0.5, oy).setScale(s * 0.92).setTint(0xd9c4b0);
    this.earFront = boil(scene, bx(EAR_NEAR.x) * s, by(EAR_NEAR.y) * s, `corgi_ear_${coat}`).setOrigin(0.5, oy).setScale(s);
    this.bodyGroup.add([this.earBack, this.body_]);
    this.setApron(wear);
    this.bodyGroup.add(this.earFront);
    this.flip.add([this.legs, this.bodyGroup]);
    this.add([shadow, this.flip]);
    scene.add.existing(this);
  }

  setApron(id: RigWear) {
    this.apron?.destroy();
    this.bow?.destroy();
    this.apron = undefined;
    this.bow = undefined;
    if (id === "none") return;
    const s = this.baseScale;
    const key = id === "staff" ? "bandana" : id === "polka" ? "apron_polka" : "apron";
    this.apron = boil(this.scene, 0, BODY_Y * s, key).setOrigin(0.5, 1).setScale(s);
    if (id !== "polka" && id !== "staff") this.apron.setTint(Phaser.Display.Color.HexStringToColor(APRONS.find((a) => a.id === id)!.color).color);
    const idx = this.bodyGroup.getIndex(this.body_);
    this.bodyGroup.addAt(this.apron, idx + 1);
    if (id === "bowtie") {
      this.bow = boil(this.scene, bx(THROAT.x) * s, by(THROAT.y + 4) * s, "bowtie").setScale(s * 0.9);
      this.bodyGroup.addAt(this.bow, idx + 2);
    }
  }

  /** Headwear anchored at the top of the head (dx, dy in unscaled body pixels). */
  addHeadwear(key: string, dx = 0, dy = 0) {
    const s = this.baseScale;
    const h = boil(this.scene, (bx(108) + dx) * s, (by(6) + dy) * s, key).setScale(s);
    this.bodyGroup.add(h);
    this.extras.push(h);
    return h;
  }

  setMood(m: CorgiMood) {
    if (m === this.mood) return;
    this.mood = m;
    setBoil(this.body_, `corgi_body_${this.coat}_${m}`);
  }

  /** Success beat: ears perk, tongue out, rump wiggle (skipped motion with reduced motion). */
  celebrate(sec = 0.9) {
    this.cheerT = sec;
    this.setMood("h");
  }

  /** Animate from velocity. Dashing flattens the ears and stretches the loaf. */
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
      setBoil(this.legs, `corgi_legs${step > 0 ? "A" : "B"}_${this.coat}`);
      const bob = Math.abs(step) * (reduce ? 1 : 3.5) * frac;
      this.bodyGroup.y = -bob;
      const sq = reduce ? 0 : 0.04 * Math.abs(Math.cos(this.walkT * Math.PI)) * frac;
      this.bodyGroup.scaleY = 1 - sq + (dashing ? -0.07 : 0);
      this.bodyGroup.scaleX = 1 + sq + (dashing ? 0.12 : 0);
    } else {
      this.walkT = 0;
      setBoil(this.legs, `corgi_legsN_${this.coat}`);
      const t = this.scene.time.now / 1000;
      this.bodyGroup.y += (0 - this.bodyGroup.y) * Math.min(1, dt * 12);
      const breathe = reduce ? 0 : Math.sin(t * 2.6) * 0.015;
      this.bodyGroup.scaleY += (1 + breathe - this.bodyGroup.scaleY) * Math.min(1, dt * 10);
      this.bodyGroup.scaleX += (1 - breathe - this.bodyGroup.scaleX) * Math.min(1, dt * 10);
    }
    // celebration: perked ears + rump wiggle
    let perk = 0;
    if (this.cheerT > 0) {
      this.cheerT -= dt;
      perk = 0.22;
      this.bodyGroup.rotation = reduce ? 0 : Math.sin(this.cheerT * 32) * 0.05;
      if (this.cheerT <= 0) {
        this.bodyGroup.rotation = 0;
        if (this.mood === "h") this.setMood("n");
      }
    }
    // ears: stay erect, lag back with speed, pin flat when dashing
    const target = dashing ? -0.95 : -0.35 * frac + perk;
    this.earLag += (target - this.earLag) * Math.min(1, dt * (dashing ? 20 : 7));
    const flop = reduce ? 0 : Math.sin(this.scene.time.now / 90) * 0.06 * frac;
    this.earFront.rotation = this.earLag + flop;
    this.earBack.rotation = this.earLag * 0.8 - 0.12 - flop;
    this.setDepth(this.y);
  }

  /** Squash pop, e.g. when picking something up. */
  pop() {
    if (save.data.settings.reducedMotion) return;
    this.scene.tweens.add({ targets: this.bodyGroup, scaleY: 1.14, scaleX: 0.9, duration: 70, yoyo: true, ease: "Quad.out" });
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
  pawMark: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, apron: ApronId) {
    this.x = x;
    this.y = y;
    this.rig = new CorgiRig(scene, x, y, 0.82, apron, "red");
    this.carryC = scene.add.container(x, y - 104);
    this.carryBg = scene.add.ellipse(0, 0, 70, 58, 0xffffff, 0.92).setStrokeStyle(3, 0xf0702a);
    this.pawMark = scene.add
      .text(0, 30, "in paw", { fontFamily: "Patrick Hand", fontSize: "14px", color: "#c9561a", stroke: "#fffaf0", strokeThickness: 4 })
      .setOrigin(0.5);
    this.carryC.add([this.carryBg, this.pawMark]);
    this.carryC.setVisible(false);
  }

  get dashing() {
    return this.dashT > 0;
  }

  /** Swap the two carried items so the other one is "in paw" (used first by stations). */
  swap(scene: Phaser.Scene) {
    if (this.items.length < 2) return false;
    this.items.reverse();
    this.refreshCarry(scene);
    return true;
  }

  refreshCarry(scene: Phaser.Scene) {
    for (const s of this.carrySprites) s.destroy();
    this.carrySprites = [];
    const n = this.items.length;
    this.carryC.setVisible(n > 0);
    this.carryBg.setSize(n > 1 ? 118 : 70, 58);
    this.carryBg.setDisplaySize(n > 1 ? 118 : 70, 58);
    this.items.forEach((it, i) => {
      const s = boil(scene, n > 1 ? (i === 0 ? -26 : 26) : 0, 0, `item_${it}`).setScale(n > 1 && i === 0 ? 0.74 : 0.92);
      if (n > 1 && i === 0) s.setAlpha(0.75);
      this.carryC.add(s);
      this.carrySprites.push(s);
    });
    // the last item is the one in paw (stations use it first)
    this.pawMark.setVisible(n > 1).setX(26);
    this.carryC.bringToTop(this.pawMark);
    if (n) {
      this.carryC.setScale(0.6);
      scene.tweens.add({ targets: this.carryC, scale: 1, duration: 180, ease: "Back.out" });
    }
  }

  sync() {
    this.rig.setPosition(this.x, this.y);
    this.carryC.setPosition(this.x, this.y - 104 + this.rig.bodyGroup.y);
    this.carryC.setDepth(this.y + 0.5);
  }
}
