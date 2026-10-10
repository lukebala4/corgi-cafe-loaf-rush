import Phaser from "phaser";
import { COLORS as C, FONT_BODY, FONT_HEAD } from "./config";
import { boil, scrapTex, stickerTex } from "./art/textures";
import { audio } from "./audio";
import { save } from "./save";

export function txt(
  scene: Phaser.Scene,
  x: number,
  y: number,
  s: string,
  size = 24,
  color: string = C.ink,
  head = false,
  extra: Phaser.Types.GameObjects.Text.TextStyle = {},
): Phaser.GameObjects.Text {
  const t = scene.add.text(x, y, s, {
    fontFamily: `"${head ? FONT_HEAD : FONT_BODY}", "Comic Sans MS", cursive`,
    fontSize: `${size}px`,
    color,
    align: "center",
    ...extra,
  });
  t.setResolution(2);
  t.setOrigin(0.5);
  return t;
}

export interface Btn extends Phaser.GameObjects.Container {
  label: Phaser.GameObjects.Text;
  bg: Phaser.GameObjects.Sprite;
  setEnabled(on: boolean): Btn;
  enabled: boolean;
}

export function button(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  fill: string,
  onClick: () => void,
  size = 30,
): Btn {
  const c = scene.add.container(x, y) as Btn;
  const bg = boil(scene, 0, 0, stickerTex(scene, w, h, fill));
  const t = txt(scene, 0, -2, label, size, C.ink, true);
  c.add([bg, t]);
  c.label = t;
  c.bg = bg;
  c.enabled = true;
  c.setSize(w + 10, h + 10);
  c.setInteractive({ useHandCursor: true });
  c.on("pointerover", () => c.enabled && scene.tweens.add({ targets: c, scale: 1.06, angle: Phaser.Math.Between(-2, 2), duration: 120 }));
  c.on("pointerout", () => scene.tweens.add({ targets: c, scale: 1, angle: 0, duration: 120 }));
  c.on("pointerdown", (_p: Phaser.Input.Pointer, _x: number, _y: number, ev: Phaser.Types.Input.EventData) => {
    ev?.stopPropagation?.();
    audio.unlock();
    if (!c.enabled) {
      audio.play("wrong");
      scene.tweens.add({ targets: c, x: x + 6, yoyo: true, repeat: 2, duration: 40 });
      return;
    }
    audio.play("click");
    scene.tweens.add({
      targets: c,
      scaleX: 1.12,
      scaleY: 0.88,
      duration: 70,
      yoyo: true,
      onComplete: () => onClick(),
    });
  });
  c.setEnabled = (on: boolean) => {
    c.enabled = on;
    c.setAlpha(on ? 1 : 0.5);
    return c;
  };
  return c;
}

/** Taped scrap of paper, with masking tape on the top corners. */
export function scrap(scene: Phaser.Scene, x: number, y: number, w: number, h: number, angle = 0, lined = true, fill?: string) {
  const c = scene.add.container(x, y);
  const bg = scene.add.image(0, 0, scrapTex(scene, w, h, lined, fill), 0);
  const t1 = scene.add.image(-w / 2 + 26, -h / 2 + 2, "tape", 0).setAngle(-28).setScale(0.75);
  const t2 = scene.add.image(w / 2 - 26, -h / 2 + 2, "tape", 0).setAngle(24).setScale(0.75);
  c.add([bg, t1, t2]);
  c.setAngle(angle);
  return c;
}

/** Small checkbox toggle drawn as a sticker. */
export function toggle(scene: Phaser.Scene, x: number, y: number, label: string, get: () => boolean, set: (v: boolean) => void, w = 230) {
  const b = button(scene, x, y, w, 44, "", get() ? C.mint : "#e9e0cc", () => {
    set(!get());
    refresh();
  }, 22);
  const refresh = () => {
    b.label.setText(`${get() ? "☑" : "☐"}  ${label}`);
    const k = stickerTex(scene, w, 44, get() ? C.mint : "#e9e0cc");
    b.bg.play({ key: k });
  };
  b.label.setFontFamily(`"${FONT_BODY}", cursive`);
  refresh();
  return b;
}

export function floatText(scene: Phaser.Scene, x: number, y: number, s: string, color: string = C.caramelDark, size = 30, rise = 60) {
  const t = txt(scene, x, y, s, size, color, true, { stroke: "#fffaf0", strokeThickness: 6 });
  t.setDepth(5000);
  t.setScale(0.4);
  scene.tweens.add({ targets: t, scale: 1, duration: 160, ease: "Back.out" });
  scene.tweens.add({
    targets: t,
    y: y - rise,
    alpha: 0,
    delay: 500,
    duration: 700,
    ease: "Quad.in",
    onComplete: () => t.destroy(),
  });
  return t;
}

/** A little celebratory burst of doodle stars / hearts. */
export function burst(scene: Phaser.Scene, x: number, y: number, keys: string[] = ["star", "star_mint", "star_coral", "heart"], n = 8, dist = 70) {
  const reduce = save.data.settings.reducedMotion;
  const count = reduce ? Math.ceil(n / 2) : n;
  for (let i = 0; i < count; i++) {
    const k = keys[i % keys.length];
    const s = scene.add.image(x, y, k, 0).setDepth(4999).setScale(0.5);
    const a = (i / count) * Math.PI * 2 + Math.random() * 0.5;
    const d = dist * (0.6 + Math.random() * 0.6);
    scene.tweens.add({
      targets: s,
      x: x + Math.cos(a) * d,
      y: y + Math.sin(a) * d - 20,
      angle: Phaser.Math.Between(-180, 180),
      scale: 0.9,
      alpha: 0,
      duration: 650 + Math.random() * 300,
      ease: "Cubic.out",
      onComplete: () => s.destroy(),
    });
  }
}

export function puff(scene: Phaser.Scene, x: number, y: number, n = 5) {
  for (let i = 0; i < n; i++) {
    const s = scene.add.image(x + Phaser.Math.Between(-20, 20), y + Phaser.Math.Between(-10, 10), "puff", 0).setDepth(4998).setScale(0.6);
    scene.tweens.add({
      targets: s,
      x: s.x + Phaser.Math.Between(-40, 40),
      y: s.y - Phaser.Math.Between(10, 40),
      scale: 1.2,
      alpha: 0,
      duration: 500 + Math.random() * 300,
      onComplete: () => s.destroy(),
    });
  }
}

export function shake(scene: Phaser.Scene, ms = 120, k = 0.004) {
  if (save.data.settings.reducedMotion) return;
  scene.cameras.main.shake(ms, k);
}

/** Wobbly idle motion for a doodle: subtle rotation breathing. */
export function wobble(scene: Phaser.Scene, target: Phaser.GameObjects.Components.Transform & Phaser.GameObjects.GameObject, amp = 2, ms = 1400) {
  if (save.data.settings.reducedMotion) return;
  scene.tweens.add({ targets: target, angle: { from: -amp, to: amp }, duration: ms, yoyo: true, repeat: -1, ease: "Sine.inOut" });
}
