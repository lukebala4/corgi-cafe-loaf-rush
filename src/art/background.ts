import Phaser from "phaser";
import { Pen, Pt } from "./pen";
import { COLORS as C, W, H, BACK_COUNTER, PASS_Y, PASS_H, DOORWAYS, PLAY, DOOR } from "../config";

function paper(p: Pen, w: number, h: number, margin = true) {
  const c = p.ctx;
  c.fillStyle = C.paper;
  c.fillRect(0, 0, w, h);
  // paper grain
  for (let i = 0; i < 900; i++) {
    c.fillStyle = `rgba(120,96,60,${0.03 + p.rng() * 0.04})`;
    c.fillRect(p.rng() * w, p.rng() * h, 1 + p.rng() * 2, 1 + p.rng() * 2);
  }
  c.strokeStyle = "rgba(127,170,214,0.55)";
  c.lineWidth = 1.3;
  for (let y = 30; y < h; y += 30) {
    c.beginPath();
    c.moveTo(0, y + p.r(0.3));
    c.lineTo(w, y + p.r(0.3));
    c.stroke();
  }
  if (margin) {
    c.strokeStyle = "rgba(236,154,154,0.85)";
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(86, 0);
    c.lineTo(86, h);
    c.stroke();
    c.beginPath();
    c.moveTo(90, 0);
    c.lineTo(90, h);
    c.stroke();
    for (const y of [150, 360, 570]) {
      p.circle(42, y, 13, { fill: "#e8dcc0", w: 1.4, color: "rgba(43,38,34,0.35)" });
      p.ellipse(43, y + 3, 9, 6, { fill: "rgba(43,38,34,0.08)", w: 0 });
    }
  }
}

export function makePaperBg(scene: Phaser.Scene, key = "bg_paper") {
  if (scene.textures.exists(key)) return key;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const p = new Pen(cv.getContext("2d")!, 4242);
  paper(p, W, H);
  // margin doodles
  p.ctx.globalAlpha = 0.5;
  p.circle(1180, 640, 34, { w: 2, color: "rgba(122,74,42,0.35)" }); // coffee ring
  p.circle(1184, 644, 30, { w: 1.2, color: "rgba(122,74,42,0.25)" });
  p.ctx.globalAlpha = 1;
  scene.textures.addCanvas(key, cv);
  return key;
}

/** Café floor plan drawn on the notebook page. Regenerated when decorations change. */
export function makeCafeBg(scene: Phaser.Scene): string {
  const key = "bg_cafe";
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const p = new Pen(cv.getContext("2d")!, 777);
  paper(p, W, H);
  const c = p.ctx;

  // kitchen floor: faint scribbled tiles
  c.save();
  c.strokeStyle = "rgba(43,38,34,0.07)";
  c.lineWidth = 1;
  for (let x = PLAY.left; x < PLAY.right; x += 30) {
    c.beginPath();
    c.moveTo(x + p.r(1), BACK_COUNTER.y + BACK_COUNTER.h);
    c.lineTo(x + p.r(1), PASS_Y);
    c.stroke();
  }
  c.restore();

  // dining floorboards (diagonal hatch, very light)
  const dining: Pt[] = [
    [PLAY.left, PASS_Y + PASS_H],
    [PLAY.right, PASS_Y + PASS_H],
    [PLAY.right, PLAY.bottom],
    [PLAY.left, PLAY.bottom],
  ];
  p.hatch(dining, 46, -0.35, "rgba(196,122,51,0.08)", 1.2);

  // back wall strip above the counter
  p.rrect(BACK_COUNTER.x, 64, BACK_COUNTER.w, 58, 4, { fill: "rgba(169,200,232,0.18)", w: 0 });
  // shelf line with mugs
  p.seg(BACK_COUNTER.x + 10, 80, BACK_COUNTER.x + BACK_COUNTER.w - 10, 80, { w: 1.4, color: "rgba(43,38,34,0.25)" });

  // back counter (top surface + front face on the ruled line y=150)
  const bc = BACK_COUNTER;
  p.rrect(bc.x - 4, 118, bc.w + 8, 34, 6, { fill: "#f3d8b0", w: 3.2 });
  p.seg(bc.x, 126, bc.x + bc.w, 126, { w: 1.4, color: "#c47a33" });
  p.hatch(
    [
      [bc.x, 152],
      [bc.x + bc.w, 152],
      [bc.x + bc.w, 166],
      [bc.x, 166],
    ],
    6,
    -0.8,
    "rgba(43,38,34,0.22)",
  );

  // pass counter with three doorways
  const segs: [number, number][] = [];
  let x0 = PLAY.left;
  for (const d of DOORWAYS) {
    segs.push([x0, d.x0]);
    x0 = d.x1;
  }
  segs.push([x0, PLAY.right]);
  for (const [a, b] of segs) {
    p.rrect(a, PASS_Y, b - a, PASS_H, 5, { fill: "#f3d8b0", w: 3 });
    p.seg(a + 6, PASS_Y + 8, b - 6, PASS_Y + 8, { w: 1.2, color: "#c47a33" });
    p.hatch(
      [
        [a, PASS_Y + PASS_H + 1],
        [b, PASS_Y + PASS_H + 1],
        [b, PASS_Y + PASS_H + 12],
        [a, PASS_Y + PASS_H + 12],
      ],
      6,
      -0.8,
      "rgba(43,38,34,0.2)",
    );
  }
  // doorway floor arrows
  for (const d of DOORWAYS) {
    const mx = (d.x0 + d.x1) / 2;
    p.curve(
      [
        [mx - 10, PASS_Y + 4],
        [mx, PASS_Y + 16],
        [mx + 10, PASS_Y + 4],
      ],
      { w: 1.6, color: "rgba(43,38,34,0.25)" },
    );
  }

  // walls
  p.seg(PLAY.left, 64, PLAY.left, PLAY.bottom, { w: 4 });
  p.seg(PLAY.right, 64, PLAY.right, DOOR.y - 46, { w: 4 });
  p.seg(PLAY.right, DOOR.y + 46, PLAY.right, PLAY.bottom, { w: 4 });
  p.seg(PLAY.left, PLAY.bottom, PLAY.right, PLAY.bottom, { w: 4 });
  p.hatch(
    [
      [PLAY.left - 12, 64],
      [PLAY.left, 64],
      [PLAY.left, PLAY.bottom],
      [PLAY.left - 12, PLAY.bottom],
    ],
    5,
    -0.8,
    "rgba(43,38,34,0.3)",
  );
  p.hatch(
    [
      [PLAY.left, PLAY.bottom],
      [PLAY.right, PLAY.bottom],
      [PLAY.right, PLAY.bottom + 12],
      [PLAY.left, PLAY.bottom + 12],
    ],
    5,
    -0.8,
    "rgba(43,38,34,0.3)",
  );
  // door: open, with doormat
  p.line(
    [
      [PLAY.right, DOOR.y - 46],
      [PLAY.right + 50, DOOR.y - 60],
    ],
    { w: 3.4 },
  );
  p.rrect(PLAY.right - 30, DOOR.y - 30, 26, 60, 6, { fill: "#e9a7a0", w: 2.4 });
  for (let i = 0; i < 4; i++) p.seg(PLAY.right - 26, DOOR.y - 22 + i * 14, PLAY.right - 8, DOOR.y - 22 + i * 14, { w: 1.2, color: "#b85e55" });
  // OPEN sign
  p.rrect(PLAY.right + 10, DOOR.y - 110, 66, 32, 6, { fill: C.mint, w: 2.6 });
  c.fillStyle = C.ink;
  c.font = `22px "Caveat Brush", cursive`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText("OPEN", PLAY.right + 43, DOOR.y - 93);

  // margin notes
  c.save();
  c.translate(46, 260);
  c.rotate(-Math.PI / 2);
  c.font = `20px "Patrick Hand", cursive`;
  c.fillStyle = "rgba(43,38,34,0.45)";
  c.fillText("kitchen", 0, 0);
  c.restore();
  c.save();
  c.translate(46, 470);
  c.rotate(-Math.PI / 2);
  c.font = `20px "Patrick Hand", cursive`;
  c.fillStyle = "rgba(43,38,34,0.45)";
  c.fillText("dining (no zoomies pls)", 0, 0);
  c.restore();
  p.circle(1245, 660, 26, { w: 2, color: "rgba(122,74,42,0.3)" });
  p.circle(1248, 663, 22, { w: 1.2, color: "rgba(122,74,42,0.2)" });

  scene.textures.addCanvas(key, cv);
  return key;
}
