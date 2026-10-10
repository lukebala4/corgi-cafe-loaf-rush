import Phaser from "phaser";
import { COLORS as C, W, H } from "./config";
import { doodle } from "./art/textures";
import { txt } from "./ui";
import { audio } from "./audio";

/** Unified desktop + touch input. Edge-triggered actions are latched until consumed by the simulation. */
export class Controls {
  scene: Phaser.Scene;
  keys: Record<string, Phaser.Input.Keyboard.Key> = {};
  move = new Phaser.Math.Vector2();
  private interactLatch = false;
  private dashLatch = false;
  private pauseLatch = false;
  touchMode = false;
  // joystick
  private joyId: number | null = null;
  private joyOrigin = new Phaser.Math.Vector2();
  private joyVec = new Phaser.Math.Vector2();
  private joyBase!: Phaser.GameObjects.Image;
  private joyKnob!: Phaser.GameObjects.Image;
  private btnPaw!: Phaser.GameObjects.Container;
  private btnDash!: Phaser.GameObjects.Container;
  private dashCdArc!: Phaser.GameObjects.Graphics;
  enabled = true;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const kb = scene.input.keyboard!;
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = kb.addKeys({
      up: K.UP,
      down: K.DOWN,
      left: K.LEFT,
      right: K.RIGHT,
      w: K.W,
      a: K.A,
      s: K.S,
      d: K.D,
      space: K.SPACE,
      enter: K.ENTER,
      e: K.E,
      shift: K.SHIFT,
      esc: K.ESC,
      p: K.P,
    }) as Record<string, Phaser.Input.Keyboard.Key>;
    kb.addCapture([K.UP, K.DOWN, K.LEFT, K.RIGHT, K.SPACE, K.SHIFT]);
    const onKey = (k: string, f: () => void) => this.keys[k].on("down", () => {
      if (!this.enabled) return;
      this.touchMode = false;
      this.setTouchVisible(false);
      audio.unlock();
      f();
    });
    onKey("space", () => (this.interactLatch = true));
    onKey("e", () => (this.interactLatch = true));
    onKey("enter", () => (this.interactLatch = true));
    onKey("shift", () => (this.dashLatch = true));
    this.keys.esc.on("down", () => (this.pauseLatch = true));
    this.keys.p.on("down", () => (this.pauseLatch = true));

    scene.input.addPointer(2);
    this.buildTouch();
    const touchy = scene.sys.game.device.input.touch && navigator.maxTouchPoints > 0;
    this.touchMode = touchy;
    this.setTouchVisible(touchy);
  }

  private buildTouch() {
    const s = this.scene;
    doodle(s, "touch_btn_mint", 150, 150, (p) => {
      p.circle(75, 80, 64, { fill: "rgba(43,38,34,0.18)", w: 0 });
      p.circle(75, 74, 66, { fill: "#fff", w: 2 });
      p.circle(75, 74, 58, { fill: C.mint, w: 3.5 });
    });
    doodle(s, "touch_btn_coral", 130, 130, (p) => {
      p.circle(65, 70, 54, { fill: "rgba(43,38,34,0.18)", w: 0 });
      p.circle(65, 64, 56, { fill: "#fff", w: 2 });
      p.circle(65, 64, 49, { fill: C.coral, w: 3.5 });
    });
    this.joyBase = s.add.image(190, H - 170, "joy_base", 0).setDepth(9000).setAlpha(0.85).setScrollFactor(0);
    this.joyKnob = s.add.image(190, H - 170, "joy_knob", 0).setDepth(9001).setScrollFactor(0);
    const mk = (x: number, y: number, key: string, label: string, sub: string, onDown: () => void) => {
      const c = s.add.container(x, y).setDepth(9000).setScrollFactor(0);
      const img = s.add.image(0, 0, key, 0);
      const t = txt(s, 0, -8, label, 30, C.ink, true);
      const t2 = txt(s, 0, 22, sub, 16, C.ink);
      c.add([img, t, t2]);
      c.setSize(img.width, img.height);
      c.setInteractive(new Phaser.Geom.Circle(img.width / 2, img.height / 2, img.width / 2), Phaser.Geom.Circle.Contains);
      c.on("pointerdown", (_p: Phaser.Input.Pointer, _x: number, _y: number, ev: Phaser.Types.Input.EventData) => {
        ev?.stopPropagation?.();
        if (!this.enabled) return;
        audio.unlock();
        onDown();
        s.tweens.add({ targets: c, scale: 0.88, duration: 60, yoyo: true });
      });
      return c;
    };
    this.btnPaw = mk(W - 120, H - 150, "touch_btn_mint", "PAW", "interact", () => (this.interactLatch = true));
    this.btnDash = mk(W - 270, H - 85, "touch_btn_coral", "ZOOM", "dash", () => (this.dashLatch = true));
    this.dashCdArc = s.add.graphics().setDepth(9002).setScrollFactor(0);

    s.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      if (!this.enabled) return;
      if (p.wasTouch && !this.touchMode) {
        this.touchMode = true;
        this.setTouchVisible(true);
      }
      if (!this.touchMode) return;
      if (this.joyId === null && p.x < W * 0.55 && p.y > 90) {
        this.joyId = p.id;
        this.joyOrigin.set(p.x, p.y);
        this.joyBase.setPosition(p.x, p.y);
        this.joyKnob.setPosition(p.x, p.y);
        this.joyVec.set(0, 0);
      }
    });
    s.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (p.id !== this.joyId) return;
      const dx = p.x - this.joyOrigin.x;
      const dy = p.y - this.joyOrigin.y;
      const len = Math.hypot(dx, dy);
      const max = 70;
      const k = len > max ? max / len : 1;
      this.joyKnob.setPosition(this.joyOrigin.x + dx * k, this.joyOrigin.y + dy * k);
      const mag = Math.min(1, len / max);
      if (len < 10) this.joyVec.set(0, 0);
      else this.joyVec.set((dx / len) * mag, (dy / len) * mag);
    });
    const end = (p: Phaser.Input.Pointer) => {
      if (p.id !== this.joyId) return;
      this.joyId = null;
      this.joyVec.set(0, 0);
      this.joyBase.setPosition(190, H - 170);
      this.joyKnob.setPosition(190, H - 170);
    };
    s.input.on("pointerup", end);
    s.input.on("pointerupoutside", end);
  }

  setTouchVisible(v: boolean) {
    this.joyBase?.setVisible(v);
    this.joyKnob?.setVisible(v);
    this.btnPaw?.setVisible(v);
    this.btnDash?.setVisible(v);
    this.dashCdArc?.setVisible(v);
  }

  /** Show dash cooldown on the touch button. */
  drawDashCooldown(frac: number) {
    const g = this.dashCdArc;
    g.clear();
    if (!this.touchMode || frac <= 0) return;
    g.lineStyle(7, 0x2b2622, 0.5);
    g.beginPath();
    g.arc(this.btnDash.x, this.btnDash.y - 6, 58, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
    g.strokePath();
  }

  update() {
    const k = this.keys;
    let x = 0;
    let y = 0;
    if (this.enabled) {
      if (k.left.isDown || k.a.isDown) x -= 1;
      if (k.right.isDown || k.d.isDown) x += 1;
      if (k.up.isDown || k.w.isDown) y -= 1;
      if (k.down.isDown || k.s.isDown) y += 1;
    }
    if (x || y) {
      const l = Math.hypot(x, y);
      this.move.set(x / l, y / l);
    } else if (this.joyVec.lengthSq() > 0 && this.enabled) {
      this.move.copy(this.joyVec);
    } else this.move.set(0, 0);
  }

  takeInteract() {
    const v = this.interactLatch;
    this.interactLatch = false;
    return v;
  }
  takeDash() {
    const v = this.dashLatch;
    this.dashLatch = false;
    return v;
  }
  takePause() {
    const v = this.pauseLatch;
    this.pauseLatch = false;
    return v;
  }
  clear() {
    this.interactLatch = this.dashLatch = this.pauseLatch = false;
    this.joyId = null;
    this.joyVec.set(0, 0);
  }
  get interactLabel() {
    return this.touchMode ? "PAW" : "SPACE";
  }
}
