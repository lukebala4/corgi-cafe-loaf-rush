import Phaser from "phaser";
import { Pen, Pt } from "./pen";
import { COLORS as C, W, H, BACK_COUNTER, PASS_Y, PASS_H, DOORWAYS, PLAY, DOOR, TABLES, COLUMN, GROUP_SPOT, LOUNGE, SOFA, CORGI_BED, MERCH } from "../config";
import { copperBell, flowerPot, polaroid, renaissanceCorgi } from "./textures";

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
  p.ctx.globalAlpha = 0.5;
  p.circle(1180, 640, 34, { w: 2, color: "rgba(122,74,42,0.35)" }); // coffee ring
  p.circle(1184, 644, 30, { w: 1.2, color: "rgba(122,74,42,0.25)" });
  p.ctx.globalAlpha = 1;
  scene.textures.addCanvas(key, cv);
  return key;
}

const rect = (x: number, y: number, w: number, h: number): Pt[] => [
  [x, y],
  [x + w, y],
  [x + w, y + h],
  [x, y + h],
];

function label(c: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, color: string, font = "Patrick Hand", rot = 0, outline?: string) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.font = `${size}px "${font}", cursive`;
  c.fillStyle = color;
  c.textAlign = "center";
  c.textBaseline = "middle";
  if (outline) {
    c.strokeStyle = outline;
    c.lineWidth = Math.max(2.5, size / 7);
    c.lineJoin = "round";
    c.strokeText(s, 0, 0);
  }
  c.fillText(s, 0, 0);
  c.restore();
}

/** Glowing orange neon lettering on a dark board. */
function neon(c: CanvasRenderingContext2D, s: string, x: number, y: number, size: number) {
  c.save();
  c.font = `${size}px "Caveat Brush", cursive`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.shadowColor = "rgba(255,138,61,0.95)";
  c.shadowBlur = 9;
  c.fillStyle = "#ff8a3d";
  c.fillText(s, x, y);
  c.shadowBlur = 0;
  c.fillStyle = "#ffd2b0";
  c.fillText(s, x, y - 0.6);
  c.restore();
}

/** A small paw print decal. */
function pawPrint(p: Pen, x: number, y: number, rot: number, color: string) {
  const c = p.ctx;
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  p.ellipse(0, 2, 4.2, 3.4, { fill: color, w: 0 });
  for (const [dx, dy] of [
    [-4.5, -3],
    [-1.5, -5.5],
    [1.5, -5.5],
    [4.5, -3],
  ])
    p.dot(dx, dy, 1.6, color);
  c.restore();
}

/** Warm white rough-painted brick, sketched loosely so the notebook rules still show through. */
function brick(p: Pen, x0: number, y0: number, x1: number, y1: number) {
  p.ctx.fillStyle = "rgba(245,239,228,0.78)";
  p.ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  const bh = 11;
  for (let row = 0, y = y0 + 4; y < y1 - 2; row++, y += bh) {
    p.seg(x0 + 2, y, x1 - 2, y, { w: 0.9, color: "rgba(150,128,104,0.35)" });
    for (let x = x0 + (row % 2 ? 14 : 0); x < x1; x += 28) p.seg(x, y, x, Math.min(y + bh, y1 - 2), { w: 0.9, color: "rgba(150,128,104,0.3)" });
  }
  // painted-over speckle
  for (let i = 0; i < 220; i++) p.dot(x0 + p.rng() * (x1 - x0), y0 + p.rng() * (y1 - y0), 0.7 + p.rng(), "rgba(150,128,104,0.18)");
}

/** White subway tiles with dark grout, as on the back-bar wall. */
function subway(p: Pen, x0: number, y0: number, x1: number, y1: number) {
  p.rrect(x0, y0, x1 - x0, y1 - y0, 2, { fill: "#ffffff", w: 1.6, color: "rgba(43,38,34,0.55)" });
  const th = 9;
  for (let row = 0, y = y0 + th; y < y1; row++, y += th) p.seg(x0 + 1, y, x1 - 1, y, { w: 0.9, color: "rgba(70,64,60,0.45)" });
  for (let row = 0, y = y0; y < y1 - 1; row++, y += th)
    for (let x = x0 + (row % 2 ? 11 : 0) + 22; x < x1; x += 22) p.seg(x, y, x, Math.min(y + th, y1), { w: 0.9, color: "rgba(70,64,60,0.45)" });
}

/** Orange lower panelling (brand orange drawn in marker). */
function orangePanels(p: Pen, x0: number, y0: number, x1: number, y1: number, step = 46) {
  p.rrect(x0, y0, x1 - x0, y1 - y0, 3, { fill: C.orange, w: 2.6 });
  for (let x = x0 + step; x < x1 - 10; x += step) p.seg(x, y0 + 2, x, y1 - 2, { w: 1.2, color: C.orangeDark });
  p.seg(x0 + 4, y0 + 3, x1 - 4, y0 + 3, { w: 1, color: "rgba(255,255,255,0.45)" });
}

/** One of the three portrait menu panels behind the counter. */
function menuPanel(p: Pen, x: number, y: number, w: number, h: number, title: string, kind: "list" | "logo" | "food") {
  const c = p.ctx;
  p.rrect(x, y, w, h, 3, { fill: "#2f2b29", w: 2.4 });
  p.rrect(x + 4, y + 4, w - 8, h - 8, 2, { fill: "#eaf4ec", w: 0 });
  if (kind === "logo") {
    label(c, "CORGI", x + w / 2, y + 17, 12, C.ink, "Caveat Brush");
    label(c, "CAFE", x + w / 2, y + 29, 12, C.ink, "Caveat Brush");
    // tiny corgi head icon
    p.circle(x + w / 2, y + 44, 6, { fill: C.orange, w: 1.4 });
    p.shape([[x + w / 2 - 6, y + 42], [x + w / 2 - 4, y + 34], [x + w / 2 - 1, y + 40]], { fill: C.orange, w: 1.2 });
    p.shape([[x + w / 2 + 6, y + 42], [x + w / 2 + 4, y + 34], [x + w / 2 + 1, y + 40]], { fill: C.orange, w: 1.2 });
    return;
  }
  label(c, title, x + w / 2, y + 13, 11, C.ink, "Caveat Brush");
  for (let i = 0; i < 4; i++) {
    const ly = y + 24 + i * 8;
    p.seg(x + 9, ly, x + w - 16, ly, { w: 1.2, color: "rgba(43,38,34,0.55)" });
    p.seg(x + w - 13, ly, x + w - 9, ly, { w: 1.2, color: "rgba(43,38,34,0.55)" });
  }
  if (kind === "food") p.rrect(x + 8, y + h - 14, w - 16, 7, 1, { fill: C.orange, w: 0 });
}

/** Sage dome pendant lamp over a table. */
function sageDome(p: Pen, x: number, y: number) {
  p.seg(x, y - 26, x, y - 8, { w: 1.2, color: "rgba(43,38,34,0.5)" });
  p.ellipse(x, y + 14, 34, 9, { fill: "rgba(255,226,160,0.25)", w: 0 });
  p.shape(
    [
      [x - 17, y + 4],
      [x - 13, y - 4],
      [x - 5, y - 9],
      [x + 5, y - 9],
      [x + 13, y - 4],
      [x + 17, y + 4],
    ],
    { fill: C.sage, w: 2.2 },
  );
  p.seg(x - 15, y + 4, x + 15, y + 4, { w: 1.4, color: C.sageDark });
}

/** Tiny orange 3D-corgi figure, for the rear-wall installation. */
function figureCorgi(p: Pen, x: number, y: number, s: number, flip: boolean) {
  const f = flip ? -1 : 1;
  const X = (dx: number) => x + dx * s * f;
  const Y = (dy: number) => y + dy * s;
  p.shape(
    [
      [X(-9), Y(2)],
      [X(-9), Y(-3)],
      [X(4), Y(-4)],
      [X(7), Y(-8)],
      [X(8), Y(-12)],
      [X(10), Y(-8)],
      [X(12), Y(-11)],
      [X(13), Y(-6)],
      [X(16), Y(-4)],
      [X(10), Y(-1)],
      [X(9), Y(2)],
    ],
    { fill: "#ff8a3d", w: 1 },
  );
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
  const bc = BACK_COUNTER;

  // ------------------------------------------------------------ counter wall (top of the screen)
  brick(p, PLAY.left, 0, PLAY.right, 62);
  subway(p, bc.x - 4, 58, bc.x + bc.w + 4, 96);
  // three portrait menu panels: DRINKS / CORGI CAFE / FOOD
  menuPanel(p, 872, 4, 60, 58, "DRINKS", "list");
  menuPanel(p, 942, 2, 60, 60, "", "logo");
  menuPanel(p, 1012, 4, 60, 58, "FOOD", "food");
  // copper bell pendants (more hang over the counter with the decoration upgrade)
  // neon sign on the brick: the café's own line
  p.rrect(730, 6, 134, 50, 8, { fill: "#2f2b29", w: 2.4 });
  neon(c, "where tech", 797, 21, 19);
  neon(c, "builders meet.", 797, 40, 19);
  for (const x of [1094]) {
    p.seg(x, 0, x, 18, { w: 1.2, color: "rgba(43,38,34,0.6)" });
    copperBell(p, x, 18, 0.8);
  }

  // ------------------------------------------------------------ kitchen lane floor (behind the counter)
  c.save();
  c.strokeStyle = "rgba(43,38,34,0.07)";
  c.lineWidth = 1;
  for (let x = PLAY.left; x < PLAY.right; x += 30) {
    c.beginPath();
    c.moveTo(x + p.r(1), bc.y + bc.h);
    c.lineTo(x + p.r(1), PASS_Y);
    c.stroke();
  }
  c.restore();

  // ------------------------------------------------------------ dining floor: timber boards on the notebook rules
  c.fillStyle = "rgba(167,120,80,0.09)";
  c.fillRect(PLAY.left, PASS_Y + PASS_H, PLAY.right - PLAY.left, PLAY.bottom - PASS_Y - PASS_H);
  for (let y = 300, row = 0; y < PLAY.bottom; y += 30, row++) {
    for (let x = PLAY.left + 40 + (row % 3) * 70; x < PLAY.right; x += 210 + (row % 2) * 30)
      p.seg(x, y - 29, x + p.r(1), y - 1, { w: 1, color: "rgba(140,96,60,0.25)" });
  }
  p.hatch(rect(PLAY.left, PASS_Y + PASS_H, PLAY.right - PLAY.left, PLAY.bottom - PASS_Y - PASS_H), 52, -0.35, "rgba(167,120,80,0.07)", 1.2);

  // laptop lounge under the skylight: orange rug, sage sofa, beanbag, the café corgi's bed
  {
    const L = LOUNGE;
    p.ellipse(L.x + L.w / 2, L.y + L.h / 2 + 4, L.w / 2 + 6, L.h / 2 + 4, { fill: "rgba(255,248,214,0.35)", w: 0 }); // skylight glow
    p.rrect(L.x, L.y, L.w, L.h, 12, { fill: "rgba(240,112,42,0.30)", w: 2.4, color: C.orangeDark });
    p.rrect(L.x + 8, L.y + 8, L.w - 16, L.h - 16, 8, { w: 1.2, color: "rgba(201,86,26,0.45)" });
    for (let y = L.y + 6; y < L.y + L.h - 4; y += 8) {
      p.seg(L.x - 6, y, L.x, y, { w: 1.2, color: C.orangeDark });
      p.seg(L.x + L.w, y, L.x + L.w + 6, y, { w: 1.2, color: C.orangeDark });
    }
    for (const [x, y, r] of [
      [L.x + 120, L.y + 70, 0.3],
      [L.x + 146, L.y + 92, -0.2],
    ] as [number, number, number][])
      pawPrint(p, x, y, r, "rgba(255,250,240,0.8)");
    // sofa
    const S = SOFA;
    p.rrect(S.x, S.y, S.w, S.h + 10, 8, { fill: C.sage, w: 2.8 });
    p.rrect(S.x - 6, S.y + 8, 14, S.h + 4, 5, { fill: C.sage, w: 2.6 });
    p.rrect(S.x + S.w - 8, S.y + 8, 14, S.h + 4, 5, { fill: C.sage, w: 2.6 });
    p.rrect(S.x + 10, S.y + S.h - 4, S.w / 2 - 12, 16, 5, { fill: "#cfe3c8", w: 2.2 });
    p.rrect(S.x + S.w / 2 + 2, S.y + S.h - 4, S.w / 2 - 12, 16, 5, { fill: "#cfe3c8", w: 2.2 });
    p.hatch(p.rrectPts(S.x + 4, S.y + 3, S.w - 8, 12, 5), 6, -0.8, "rgba(43,38,34,0.18)");
    // corgi-face cushion on the sofa arm
    p.circle(S.x + S.w - 16, S.y + 10, 8, { fill: C.orange, w: 1.8 });
    p.shape([[S.x + S.w - 23, S.y + 6], [S.x + S.w - 22, S.y - 3], [S.x + S.w - 17, S.y + 3]], { fill: C.orange, w: 1.4 });
    p.shape([[S.x + S.w - 9, S.y + 6], [S.x + S.w - 10, S.y - 3], [S.x + S.w - 15, S.y + 3]], { fill: C.orange, w: 1.4 });
    p.ellipse(S.x + S.w - 16, S.y + 13, 4.5, 3, { fill: "#fffaf0", w: 0 });
    p.dot(S.x + S.w - 16, S.y + 11, 1.4);
    // beanbag
    p.ellipse(L.x + L.w - 22, L.y + L.h - 30, 22, 16, { fill: C.orangeSoft, w: 2.6 });
    p.curve([[L.x + L.w - 36, L.y + L.h - 36], [L.x + L.w - 24, L.y + L.h - 42], [L.x + L.w - 10, L.y + L.h - 36]], { w: 1.4, color: "rgba(43,38,34,0.4)" });
    // corgi bed, water bowl and a tennis ball
    const B = CORGI_BED;
    p.ellipse(B.x, B.y, 30, 15, { fill: "#c99f6a", w: 2.6 });
    p.ellipse(B.x, B.y + 1, 22, 9, { fill: "#f3e7d4", w: 1.8 });
    p.ellipse(B.x + 44, B.y + 14, 9, 4.5, { fill: "#a9c8e8", w: 2 });
    p.ellipse(B.x + 44, B.y + 13, 6, 2.6, { fill: "#d7e8f6", w: 0 });
    p.circle(B.x + 60, B.y + 8, 4.2, { fill: "#d8e05a", w: 1.6 });
  }

  // ------------------------------------------------------------ back bar
  p.rrect(bc.x - 4, 118, bc.w + 8, 34, 6, { fill: "#f6ead6", w: 3.2 });
  p.seg(bc.x, 126, bc.x + bc.w, 126, { w: 1.4, color: "#c99f6a" });
  orangePanels(p, bc.x - 4, 152, bc.x + bc.w + 4, 168, 60);

  // ------------------------------------------------------------ the pass: pale wood top, orange panelled front
  const segs: [number, number][] = [];
  let x0 = PLAY.left;
  for (const d of DOORWAYS) {
    if (d.x0 > x0) segs.push([x0, d.x0]);
    x0 = d.x1;
  }
  segs.push([x0, PLAY.right]);
  for (const [a, b] of segs) {
    p.rrect(a, PASS_Y, b - a, PASS_H, 5, { fill: "#f6ead6", w: 3 });
    p.seg(a + 6, PASS_Y + 8, b - 6, PASS_Y + 8, { w: 1.2, color: "#c99f6a" });
    orangePanels(p, a + 2, PASS_Y + PASS_H, b - 2, PASS_Y + PASS_H + 14, 44);
  }
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

  // ------------------------------------------------------------ sage dome lamps over the communal tables
  for (const t of TABLES) {
    const n = t.w > 240 ? 3 : 2;
    for (let i = 0; i < n; i++) sageDome(p, t.x + (i - (n - 1) / 2) * 76, t.y - 70);
  }

  // slim pale column mid-room: a short post stub (the camera cuts it off), brass collar, floor shadow
  {
    const cx = COLUMN.x;
    const base = COLUMN.y + 6;
    const top = base - 58;
    p.ellipse(cx + 4, base + 2, 17, 5, { fill: "rgba(43,38,34,0.14)", w: 0 });
    p.rrect(cx - 8, top, 16, base - top, 3, { fill: "#f4efe6", w: 2.4 });
    p.seg(cx + 3, top + 6, cx + 3, base - 6, { w: 1.4, color: "rgba(43,38,34,0.18)" });
    p.rrect(cx - 10, base - 12, 20, 6, 2, { fill: C.copper, w: 1.8 });
    p.ellipse(cx, top, 8, 2.6, { fill: "#fffaf0", w: 1.8 });
  }

  // ------------------------------------------------------------ rear wall (left): corgi figure installation + polaroids
  p.rrect(PLAY.left + 2, 288, 30, 128, 3, { fill: C.orange, w: 2.2 });
  for (let i = 0; i < 9; i++) figureCorgi(p, PLAY.left + 12 + (i % 2) * 10, 298 + i * 13, 0.85, i % 2 === 1);
  p.rrect(PLAY.left + 2, 436, 30, 100, 3, { fill: "#d9b07e", w: 2.2, color: C.orangeDark });
  for (let i = 0; i < 4; i++) {
    c.save();
    c.translate(PLAY.left + 6 + (i % 2) * 4, 442 + i * 23);
    c.rotate(((i % 3) - 1) * 0.12);
    c.scale(0.6, 0.6);
    polaroid(p, 0, 0, [C.orangeSoft, C.sage, "#a9c8e8", "#f2c46a"][i % 4], i + 3);
    c.restore();
  }
  // string of corgi + community pictures along the rear wall
  p.curve(
    [
      [PLAY.left + 4, 556],
      [PLAY.left + 16, 610],
      [PLAY.left + 4, 676],
    ],
    { w: 1.2 },
  );
  for (let i = 0; i < 3; i++) {
    c.save();
    c.translate(PLAY.left + 6, 566 + i * 38);
    c.rotate(((i % 2) - 0.5) * 0.18);
    c.scale(0.55, 0.55);
    polaroid(p, 0, 0, [C.sage, C.orangeSoft, "#f2c46a"][i], i + 9);
    c.restore();
  }

  // ------------------------------------------------------------ long side wall (bottom, cut away by the camera)
  p.rrect(PLAY.left + 4, PLAY.bottom - 16, 760, 14, 5, { fill: C.orange, w: 2.4 });
  for (let x = PLAY.left + 80; x < PLAY.left + 760; x += 90) p.seg(x, PLAY.bottom - 15, x, PLAY.bottom - 3, { w: 1, color: C.orangeDark });
  {
    const cols = ["#f3e7d4", C.sage, C.orangeSoft];
    let i = 0;
    for (let x = PLAY.left + 40; x < PLAY.left + 740; x += 64, i++) p.rrect(x, PLAY.bottom - 26, 30, 12, 5, { fill: cols[i % 3], w: 2 });
  }

  // ------------------------------------------------------------ walls
  p.seg(PLAY.left, 64, PLAY.left, PLAY.bottom, { w: 4 });
  p.seg(PLAY.right, 64, PLAY.right, DOOR.y - 46, { w: 4 });
  p.seg(PLAY.right, DOOR.y + 46, PLAY.right, PLAY.bottom, { w: 4 });
  p.seg(PLAY.left, PLAY.bottom, PLAY.right, PLAY.bottom, { w: 4 });
  p.hatch(rect(PLAY.left - 12, 64, 12, PLAY.bottom - 64), 5, -0.8, "rgba(43,38,34,0.3)");
  p.hatch(rect(PLAY.left, PLAY.bottom, PLAY.right - PLAY.left, 12), 5, -0.8, "rgba(43,38,34,0.3)");

  // ------------------------------------------------------------ street frontage (right): orange double bay
  const sx = PLAY.right + 6;
  for (const [y0, y1] of [
    [96, DOOR.y - 50],
    [DOOR.y + 50, PLAY.bottom + 6],
  ]) {
    p.rrect(sx, y0, 64, y1 - y0, 4, { fill: C.orange, w: 2.8 });
    // multi-pane window inside the frame
    p.rrect(sx + 8, y0 + 10, 26, y1 - y0 - 20, 2, { fill: "rgba(169,200,232,0.55)", w: 1.8 });
    for (let y = y0 + 10 + 36; y < y1 - 14; y += 36) p.seg(sx + 9, y, sx + 33, y, { w: 1.2 });
    p.seg(sx + 21, y0 + 11, sx + 21, y1 - 11, { w: 1.2 });
  }
  // fascia lettering, read vertically
  label(c, "Corgi Cafe", sx + 50, 250, 26, "#ffffff", "Caveat Brush", Math.PI / 2, C.ink);
  label(c, "74", sx + 50, 640, 28, "#ffffff", "Caveat Brush", Math.PI / 2, C.ink);
  // little winged corgi decal on the pilaster
  p.ellipse(sx + 49, 560, 7, 5, { fill: "#ffffff", w: 1.2 });
  p.curve(
    [
      [sx + 44, 556],
      [sx + 38, 548],
      [sx + 46, 551],
    ],
    { w: 1.4, color: "#ffffff" },
  );
  p.curve(
    [
      [sx + 54, 556],
      [sx + 60, 548],
      [sx + 52, 551],
    ],
    { w: 1.4, color: "#ffffff" },
  );
  // door: open, with doormat and an OPEN sign
  p.line(
    [
      [PLAY.right, DOOR.y - 46],
      [PLAY.right + 50, DOOR.y - 60],
    ],
    { w: 3.4 },
  );
  p.rrect(PLAY.right - 30, DOOR.y - 30, 26, 60, 6, { fill: "#f7a36c", w: 2.4 });
  for (let i = 0; i < 4; i++) p.seg(PLAY.right - 26, DOOR.y - 22 + i * 14, PLAY.right - 8, DOOR.y - 22 + i * 14, { w: 1.2, color: C.orangeDark });
  p.rrect(PLAY.right + 8, DOOR.y + 54, 60, 26, 5, { fill: "#ffffff", w: 2.2 });
  label(c, "OPEN", PLAY.right + 38, DOOR.y + 67, 18, C.orangeDark, "Caveat Brush");

  // ------------------------------------------------------------ window bar with high stools (visiting groups sit here)
  p.rrect(1010, 556, 190, 24, 5, { fill: "#f6ead6", w: 2.8 });
  p.seg(1016, 564, 1194, 564, { w: 1.1, color: "#c99f6a" });
  for (const x of [1030, 1180]) flowerPot(p, x, 562, 0.2);
  for (const dx of [-58, 0, 56]) {
    const x = GROUP_SPOT.x + dx;
    const y = GROUP_SPOT.y + 8;
    p.seg(x - 9, y - 6, x - 12, y + 22, { w: 2.2, color: "#55504b" });
    p.seg(x + 9, y - 6, x + 12, y + 22, { w: 2.2, color: "#55504b" });
    p.ellipse(x, y - 8, 17, 6, { fill: C.chair, w: 2.4 });
  }
  // instant camera on the window bar
  p.rrect(1060, 557, 22, 14, 3, { fill: "#fffaf0", w: 2 });
  p.circle(1071, 564, 4.2, { fill: "#2f2a29", w: 1.4 });
  p.dot(1078, 559.5, 1.4, C.orange);

  // ------------------------------------------------------------ margin doodles (no captions)
  c.save();
  c.globalAlpha = 0.85;
  renaissanceCorgi(p, 44, 250, 0.62); // gold-framed Renaissance corgi portrait, like the café's mural wall
  // the corgi latte mascot: a sleepy corgi in a cup, with a little heart
  {
    const x = 44;
    const y = 480;
    p.shape([[x - 13, y - 13], [x - 8, y - 22], [x - 4, y - 14]], { fill: C.orange, w: 1.6 });
    p.shape([[x + 13, y - 13], [x + 8, y - 22], [x + 4, y - 14]], { fill: C.orange, w: 1.6 });
    p.ellipse(x, y - 6, 14, 11, { fill: C.orange, w: 2 });
    p.ellipse(x, y - 1, 8, 5.5, { fill: "#fffaf0", w: 0 });
    p.curve([[x - 8, y - 8], [x - 5, y - 6], [x - 2, y - 8]], { w: 1.6 });
    p.curve([[x + 2, y - 8], [x + 5, y - 6], [x + 8, y - 8]], { w: 1.6 });
    p.dot(x, y - 3, 1.8);
    p.shape([[x - 20, y], [x + 20, y], [x + 16, y + 30], [x - 16, y + 30]], { fill: "#fffaf0", w: 2.2 });
    p.curve([[x + 19, y + 6], [x + 30, y + 10], [x + 18, y + 22]], { w: 2.2 });
    p.ellipse(x, y + 33, 26, 5, { fill: "#f3e7d4", w: 2 });
    p.shape([[x + 22, y - 30], [x + 26, y - 34], [x + 30, y - 30], [x + 26, y - 24]], { fill: C.orangeSoft, w: 1.4 });
  }
  c.restore();
  // paw prints from the door into the café
  for (let i = 0; i < 7; i++) pawPrint(p, DOOR.x - 74 - i * 22, DOOR.y + 8 + (i % 2) * 12 + i * 2, -Math.PI / 2 - 0.15, "rgba(201,86,26,0.28)");
  // merch shelf by the door: corduroy caps, corgi mugs, totes
  {
    const M = MERCH;
    p.rrect(M.x, M.y, M.w, M.h, 4, { fill: "#d9b07e", w: 2.8 });
    for (const y of [M.y + 36, M.y + 72]) p.seg(M.x + 2, y, M.x + M.w - 2, y, { w: 2.2 });
    for (const x of [M.x + 14, M.x + 38]) {
      p.shape([[x - 10, M.y + 28], [x - 9, M.y + 18], [x, M.y + 13], [x + 9, M.y + 18], [x + 10, M.y + 28]], { fill: "#7a5236", w: 2 });
      p.seg(x - 12, M.y + 29, x + 11, M.y + 29, { w: 2.4, color: "#6a4630" });
      p.ellipse(x, M.y + 21, 3.2, 2.4, { fill: C.orange, w: 1 });
    }
    for (const x of [M.x + 11, M.x + 27, M.x + 43]) {
      p.rrect(x - 6, M.y + 52, 12, 14, 2, { fill: "#fffaf0", w: 1.8 });
      p.curve([[x + 6, M.y + 55], [x + 10, M.y + 59], [x + 6, M.y + 63]], { w: 1.6 });
      p.dot(x, M.y + 59, 2.4, C.orange);
    }
    for (const x of [M.x + 15, M.x + 39]) {
      p.curve([[x - 6, M.y + 86], [x, M.y + 78], [x + 6, M.y + 86]], { w: 1.6 });
      p.rrect(x - 10, M.y + 86, 20, 20, 2, { fill: "#f3e7d4", w: 2 });
      p.circle(x, M.y + 96, 4, { fill: C.orange, w: 1.2 });
    }
  }
  // a coffee ring, because notebooks
  p.circle(1245, 690, 22, { w: 2, color: "rgba(122,74,42,0.25)" });
  p.circle(1248, 693, 18, { w: 1.2, color: "rgba(122,74,42,0.18)" });

  scene.textures.addCanvas(key, cv);
  return key;
}
