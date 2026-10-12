// Celebration effects for the nostalgia pack: rubber ink stamps and paper confetti.
// Both honour Reduced motion (no slam, no spin, far fewer pieces).
import Phaser from "phaser";
import { COLORS as C, H, W } from "./config";
import { save } from "./save";
import { shake, txt } from "./ui";

const STAMP_COLORS = [C.mintDark, C.orange, C.coral, "#c8506a"];
const STAMP_SIZES = [46, 56, 66, 70];

/**
 * Slam a hand-inked stamp onto the page ("Nice!", "Pawsome!", "LOAF-TASTIC!").
 * tier 1..4 controls size and colour. Gone again in about a second, so it never blocks play.
 */
export function inkStamp(scene: Phaser.Scene, x: number, y: number, text: string, tier: number, sub?: string, depth = 9300) {
  const reduce = save.data.settings.reducedMotion;
  const ti = Phaser.Math.Clamp(tier, 1, 4) - 1;
  const col = STAMP_COLORS[ti];
  const hex = Phaser.Display.Color.HexStringToColor(col).color;
  const c = scene.add.container(x, y).setDepth(depth);
  const t = txt(scene, 0, sub ? -10 : 0, text, STAMP_SIZES[ti], col, true, { stroke: "#fffaf0", strokeThickness: 6 });
  const s = sub ? txt(scene, 0, t.height / 2 + 2, sub, 19, C.ink, true, { stroke: "#fffaf0", strokeThickness: 4 }) : null;
  const w = t.width + 46;
  const h = t.height + (s ? s.height + 6 : 0) + 16;
  const g = scene.add.graphics();
  g.fillStyle(0xfffaf0, 0.82).fillRoundedRect(-w / 2, -h / 2, w, h, 14);
  g.lineStyle(5, hex, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, 14);
  g.lineStyle(2, hex, 0.75).strokeRoundedRect(-w / 2 + 7, -h / 2 + 7, w - 14, h - 14, 9);
  // a few ink speckles round the edge, like a real rubber stamp
  for (let i = 0; i < 7; i++) {
    const a = Math.random() * Math.PI * 2;
    g.fillStyle(hex, 0.7).fillCircle(Math.cos(a) * (w / 2 + 6), Math.sin(a) * (h / 2 + 5), 1.5 + Math.random() * 2.5);
  }
  c.add(s ? [g, t, s] : [g, t]);
  c.setAngle((Math.random() < 0.5 ? -1 : 1) * Phaser.Math.FloatBetween(3, 7));
  if (reduce) {
    c.setAlpha(0);
    scene.tweens.add({ targets: c, alpha: 1, duration: 120 });
  } else {
    c.setScale(2.3).setAlpha(0);
    scene.tweens.add({
      targets: c,
      scale: 1,
      alpha: 1,
      duration: 130,
      ease: "Quad.in",
      onComplete: () => shake(scene, 90, 0.0025 + ti * 0.0008),
    });
  }
  scene.tweens.add({ targets: c, alpha: 0, y: y - 24, delay: 720 + ti * 90, duration: 320, ease: "Quad.in", onComplete: () => c.destroy() });
  return c;
}

/** Paper confetti and doodle stars drifting down over the whole page. */
export function confetti(scene: Phaser.Scene, n = 40, depth = 9450) {
  const reduce = save.data.settings.reducedMotion;
  const count = reduce ? Math.ceil(n / 5) : n;
  const cols = [0xf0702a, 0x7fcfb0, 0xf2786b, 0xf6c453, 0xa9c8e8, 0xfffaf0];
  const keys = ["star", "star_mint", "star_coral", "heart"];
  for (let i = 0; i < count; i++) {
    const x = Phaser.Math.Between(40, W - 40);
    const y0 = -20 - Math.random() * 160;
    const piece =
      i % 3 === 0
        ? scene.add.image(x, y0, keys[i % keys.length], 0).setScale(0.6)
        : scene.add.rectangle(x, y0, 9, 14, cols[i % cols.length]).setStrokeStyle(1.5, 0x2b2622);
    piece.setDepth(depth);
    const dur = 1500 + Math.random() * 1100;
    scene.tweens.add({
      targets: piece,
      y: H + 30,
      x: x + Phaser.Math.Between(-90, 90),
      angle: reduce ? 0 : Phaser.Math.Between(-540, 540),
      duration: reduce ? dur * 0.8 : dur,
      delay: Math.random() * 300,
      ease: "Sine.in",
      onComplete: () => piece.destroy(),
    });
  }
}
