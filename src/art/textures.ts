import Phaser from "phaser";
import { Pen, Pt, hashStr } from "./pen";
import { COLORS as C } from "../config";
import { CB, CE, CL, Coat, CorgiMood, corgiApron, corgiBandana, corgiBody, corgiEar, corgiLegs, napCorgi } from "./corgi";
import { HH, HMood, HW, LOOKS, drawChair, drawHuman } from "./humans";
import { ITEM_DRAW, STATION_DRAW, SH, SW, star } from "./items";

const FRAMES = 3;
type Draw = (p: Pen, f: number) => void;

/** Render a doodle into a canvas texture with N line-boil frames + a looping anim of the same key. */
export function doodle(scene: Phaser.Scene, key: string, w: number, h: number, draw: Draw, frames = FRAMES, fps = 6) {
  if (scene.textures.exists(key)) return;
  const cv = document.createElement("canvas");
  cv.width = w * frames;
  cv.height = h;
  const ctx = cv.getContext("2d")!;
  for (let f = 0; f < frames; f++) {
    ctx.save();
    ctx.translate(f * w, 0);
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    ctx.clip();
    draw(new Pen(ctx, hashStr(key) + f * 7919), f);
    ctx.restore();
  }
  const tex = scene.textures.addCanvas(key, cv)!;
  for (let f = 0; f < frames; f++) tex.add(f, 0, f * w, 0, w, h);
  if (frames > 1 && !scene.anims.exists(key)) {
    scene.anims.create({
      key,
      frames: Array.from({ length: frames }, (_, i) => ({ key, frame: i })),
      frameRate: fps,
      repeat: -1,
    });
  }
}

/** Create a boiling doodle sprite. */
export function boil(scene: Phaser.Scene, x: number, y: number, key: string): Phaser.GameObjects.Sprite {
  const s = scene.add.sprite(x, y, key, 0);
  if (scene.anims.exists(key)) s.play({ key, startFrame: Math.floor(Math.random() * FRAMES) });
  return s;
}

/** Swap the texture of a boiling sprite. */
export function setBoil(s: Phaser.GameObjects.Sprite, key: string) {
  if (s.texture.key === key) return;
  if (s.scene.anims.exists(key)) s.play({ key, startFrame: Math.floor(Math.random() * FRAMES) });
  else s.setTexture(key, 0);
}

const ink = C.ink;
const cream = C.cream;

// ---------------------------------------------------------------------------
// Public builder
// ---------------------------------------------------------------------------
export const ITEM_KEYS = Object.keys(ITEM_DRAW);

export function buildTextures(scene: Phaser.Scene) {
  // corgi parts (real-shaped Pembroke, red-and-white or tricolour)
  for (const coat of ["red", "tri"] as Coat[]) {
    for (const m of ["n", "h", "s"] as CorgiMood[]) doodle(scene, `corgi_body_${coat}_${m}`, CB.w, CB.h, (p) => corgiBody(p, coat, m));
    doodle(scene, `corgi_ear_${coat}`, CE.w, CE.h, (p) => corgiEar(p, coat));
    for (const [k, ph] of [
      ["N", 0],
      ["A", 1],
      ["B", -1],
    ] as [string, number][])
      doodle(scene, `corgi_legs${k}_${coat}`, CL.w, CL.h, (p) => corgiLegs(p, coat, ph));
    doodle(scene, `napcorgi_${coat}`, 140, 70, (p) => napCorgi(p, coat));
  }
  doodle(scene, "apron", CB.w, CB.h, (p) => corgiApron(p, "#ffffff", false));
  doodle(scene, "apron_polka", CB.w, CB.h, (p) => corgiApron(p, "#fff2c2", true));
  doodle(scene, "bandana", CB.w, CB.h, (p) => corgiBandana(p));
  doodle(scene, "bowtie", 30, 20, (p) => {
    p.shape(
      [
        [15, 10],
        [3, 2],
        [3, 18],
      ],
      { fill: C.coral, w: 2 },
    );
    p.shape(
      [
        [15, 10],
        [27, 2],
        [27, 18],
      ],
      { fill: C.coral, w: 2 },
    );
    p.circle(15, 10, 3.5, { fill: C.coral, w: 2 });
  });
  doodle(scene, "cap", 48, 28, (p) => {
    p.shape(
      [
        [6, 24],
        [10, 8],
        [24, 3],
        [38, 8],
        [42, 24],
      ],
      { fill: C.mint, w: 2.6 },
    );
    p.rrect(30, 20, 18, 6, 3, { fill: C.mintDark, w: 2.2 });
    p.dot(24, 6, 2.5, cream);
  });
  doodle(scene, "mask", 44, 20, (p) => {
    p.rrect(2, 4, 40, 12, 6, { fill: ink, w: 0 });
    p.ellipse(16, 10, 4, 3, { fill: "#fff", w: 0 });
    p.ellipse(30, 10, 4, 3, { fill: "#fff", w: 0 });
    p.seg(2, 8, -4, 2, { w: 2.4 });
  });
  doodle(scene, "shadow", 110, 28, (p) => {
    p.ellipse(55, 14, 48, 10, { fill: "rgba(43,38,34,0.16)", w: 0 });
    p.hatch(p.ellipsePts(55, 14, 46, 9), 6, -0.6, "rgba(43,38,34,0.22)", 1.2);
  });
  doodle(scene, "shadow_big", 240, 50, (p) => {
    p.ellipse(120, 25, 110, 20, { fill: "rgba(43,38,34,0.16)", w: 0 });
    p.hatch(p.ellipsePts(120, 25, 106, 18), 7, -0.6, "rgba(43,38,34,0.22)", 1.2);
  });

  // customers: humans, seated and walking
  for (const L of LOOKS) {
    for (const m of ["n", "h", "a"] as HMood[]) doodle(scene, `h_${L.id}_sit_${m}`, HW, HH, (p) => drawHuman(p, L, "sit", m));
    doodle(scene, `h_${L.id}_walkA`, HW, HH, (p) => drawHuman(p, L, "walkA", "n"));
    doodle(scene, `h_${L.id}_walkB`, HW, HH, (p) => drawHuman(p, L, "walkB", "n"));
    doodle(scene, `h_${L.id}_walkH`, HW, HH, (p) => drawHuman(p, L, "walkA", "h"));
  }
  doodle(scene, "chair", 70, 96, (p) => drawChair(p));

  // items
  for (const [k, d] of Object.entries(ITEM_DRAW)) doodle(scene, `item_${k}`, 54, 54, (p) => d(p));

  // stations
  for (const [k, d] of Object.entries(STATION_DRAW)) doodle(scene, `st_${k}`, SW, SH, (p) => d(p));
  doodle(scene, "st_pad", 100, 40, (p) => {
    p.rrect(6, 4, 88, 32, 6, { fill: "#fffaf0", w: 2.4 });
    p.rrect(10, 8, 80, 24, 4, { w: 1.2, color: C.caramel });
    p.dot(50, 22, 4, "rgba(227,155,79,0.55)");
    for (const [x, y] of [
      [44, 15],
      [50, 13],
      [56, 15],
    ])
      p.dot(x, y, 1.8, "rgba(227,155,79,0.55)");
  });
  doodle(scene, "press_hot", 60, 26, (p) => {
    for (const x of [14, 30, 46])
      p.curve(
        [
          [x, 24],
          [x - 4, 14],
          [x + 2, 3],
        ],
        { w: 2.2, color: "rgba(90,81,74,0.5)" },
      );
  });
  doodle(scene, "soon", 96, 64, (p) => {
    p.poly(
      [
        [6, 6],
        [90, 4],
        [92, 58],
        [8, 60],
      ],
      { fill: "#fff2a8", w: 2.2 },
    );
  });

  // furniture: pale rectangular communal tables with thin dark legs
  for (const w of [200, 280]) doodle(scene, `table_${w}`, w + 20, 88, (p) => tableDraw(p, w));

  // UI bits
  doodle(scene, "paw", 20, 20, (p) => {
    p.dot(10, 13, 4.2, "rgba(43,38,34,0.55)");
    p.dot(4.5, 7, 2.2, "rgba(43,38,34,0.55)");
    p.dot(10, 4.5, 2.2, "rgba(43,38,34,0.55)");
    p.dot(15.5, 7, 2.2, "rgba(43,38,34,0.55)");
  });
  doodle(scene, "star", 28, 28, (p) => star(p, 14, 14, 11, C.caramel));
  doodle(scene, "star_mint", 28, 28, (p) => star(p, 14, 14, 11, C.mint));
  doodle(scene, "star_coral", 28, 28, (p) => star(p, 14, 14, 11, C.coral));
  doodle(scene, "star_empty", 28, 28, (p) => star(p, 14, 14, 11, "#efe5cc"));
  doodle(scene, "heart", 26, 24, (p) => {
    p.shape(
      [
        [13, 22],
        [3, 12],
        [3, 6],
        [8, 2],
        [13, 6],
        [18, 2],
        [23, 6],
        [23, 12],
      ],
      { fill: C.coral, w: 2.2 },
    );
  });
  doodle(scene, "coin", 30, 30, (p) => {
    p.circle(15, 15, 12, { fill: "#f6c453", w: 2.6 });
    p.dot(15, 17.5, 3.4, "#c9922b");
    p.dot(10.5, 12.5, 1.7, "#c9922b");
    p.dot(15, 10.5, 1.7, "#c9922b");
    p.dot(19.5, 12.5, 1.7, "#c9922b");
  });
  doodle(scene, "puff", 48, 40, (p) => {
    for (const [x, y, r] of [
      [16, 24, 11],
      [30, 22, 12],
      [24, 14, 10],
    ])
      p.circle(x, y, r, { fill: "#f4f0e8", w: 2.2 });
  });
  doodle(scene, "storm", 70, 54, (p) => {
    for (const [x, y, r] of [
      [20, 22, 12],
      [36, 16, 15],
      [52, 22, 12],
    ])
      p.circle(x, y, r, { fill: "#8f8a96", w: 2.4 });
    p.poly(
      [
        [36, 32],
        [30, 44],
        [37, 43],
        [32, 53],
        [44, 38],
        [37, 39],
      ],
      { fill: "#f6c453", w: 1.8 },
    );
  });
  doodle(scene, "ring", 120, 44, (p) => {
    p.ellipse(60, 22, 52, 15, { w: 4, color: C.mint, double: true });
  });
  doodle(scene, "ring_coral", 120, 44, (p) => {
    p.ellipse(60, 22, 52, 15, { w: 3.5, color: C.coral });
  });
  doodle(scene, "arrow", 44, 56, (p) => {
    p.poly(
      [
        [15, 4],
        [29, 4],
        [29, 30],
        [40, 30],
        [22, 52],
        [4, 30],
        [15, 30],
      ],
      { fill: C.caramel, w: 2.8 },
    );
  });
  doodle(scene, "xspot", 80, 56, (p) => {
    p.ellipse(40, 30, 34, 18, { w: 2.4, color: C.coral });
    p.seg(26, 18, 54, 42, { w: 5, color: C.coral });
    p.seg(54, 18, 26, 42, { w: 5, color: C.coral });
  });
  doodle(scene, "camera", 44, 34, (p) => {
    p.rrect(4, 8, 36, 24, 5, { fill: "#6e6660", w: 2.4 });
    p.rrect(10, 3, 12, 7, 2, { fill: "#6e6660", w: 2 });
    p.circle(22, 20, 8, { fill: "#cfdbe3", w: 2.4 });
    p.dot(34, 13, 2.4, C.coral);
  });
  doodle(scene, "flash", 140, 140, (p) => {
    const c = p.ctx;
    const g = c.createRadialGradient(70, 70, 0, 70, 70, 70);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, 140, 140);
  }, 1);
  doodle(scene, "tape", 90, 30, (p) => {
    const pts: Pt[] = [];
    for (let i = 0; i <= 6; i++) pts.push([4 + i * 13.6, 3 + (i % 2) * 2]);
    for (let i = 0; i <= 3; i++) pts.push([86 + (i % 2) * 3, 4 + i * 7]);
    for (let i = 6; i >= 0; i--) pts.push([4 + i * 13.6, 26 - (i % 2) * 2]);
    for (let i = 3; i >= 0; i--) pts.push([4 - (i % 2) * 3, 4 + i * 7]);
    p.shapeSharp(pts, { fill: C.tape, w: 0 });
  }, 1);
  doodle(scene, "joy_base", 200, 200, (p) => {
    p.circle(100, 100, 86, { fill: "rgba(255,250,240,0.55)", w: 3.5 });
    p.circle(100, 100, 60, { w: 1.6, color: "rgba(43,38,34,0.35)" });
  });
  doodle(scene, "joy_knob", 96, 96, (p) => {
    p.circle(48, 48, 38, { fill: C.caramel, w: 3.5 });
    p.dot(48, 54, 7, cream);
    for (const [x, y] of [
      [37, 40],
      [48, 35],
      [59, 40],
    ])
      p.dot(x, y, 3.6, cream);
  });

  // decorations (London references, redrawn)
  doodle(scene, "deco_plant", 90, 130, (p) => flowerPot(p, 45, 126, 1));
  doodle(scene, "deco_bunting", 1000, 60, (p) => {
    p.curve(
      [
        [0, 6],
        [250, 16],
        [500, 20],
        [750, 16],
        [1000, 6],
      ],
      { w: 2 },
    );
    const cols = [C.orangeSoft, C.sage, "#a9c8e8", "#f2c46a"];
    for (let i = 0; i < 15; i++) {
      const x = 34 + i * 66;
      const y = 8 + Math.sin((x / 1000) * Math.PI) * 12;
      const c = p.ctx;
      c.save();
      c.translate(x, y);
      c.rotate(((i % 3) - 1) * 0.09);
      polaroid(p, 0, 0, cols[i % 4], i);
      c.restore();
    }
  });
  doodle(
    scene,
    "deco_lights",
    1000,
    60,
    (p, f) => {
      for (let i = 0; i < 9; i++) {
        const x = 60 + i * 110;
        const len = 18 + (i % 2) * 8;
        p.seg(x, 0, x, len, { w: 1.6 });
        const lit = (i + f) % 3 !== 0;
        if (lit) p.circle(x, len + 16, 15, { fill: "rgba(255,226,160,0.4)", w: 0 });
        copperBell(p, x, len, 0.8);
      }
    },
    3,
    3,
  );
  doodle(scene, "deco_portrait", 92, 108, (p) => renaissanceCorgi(p, 46, 54, 1));

  // title art: sleeping corgi in a giant cup
  doodle(scene, "title_cup_back", 340, 260, (p) => {
    p.ellipse(150, 70, 128, 34, { fill: "#6b3d22", w: 3.5 });
    p.ellipse(150, 76, 112, 24, { fill: "#8a5530", w: 0 });
  });
  // Real-shaped Pembroke head peeking over the rim: big upright rounded-triangle ears with wide bases,
  // a foxlike tapered muzzle, white blaze and cheeks, black nose, closed sleepy eyes.
  doodle(scene, "title_corgi", 240, 150, (p) => {
    const ear = (sx: number) => {
      const X = (x: number) => 120 + (x - 120) * sx;
      p.shape(
        [
          [X(64), 76],
          [X(52), 46],
          [X(50), 18],
          [X(58), 8],
          [X(72), 14],
          [X(92), 34],
          [X(104), 54],
        ],
        { fill: C.caramel, w: 3.4 },
      );
      p.shape(
        [
          [X(70), 66],
          [X(61), 42],
          [X(60), 22],
          [X(68), 20],
          [X(84), 36],
          [X(94), 54],
        ],
        { fill: "#f6c0ae", w: 0 },
      );
      // a few fur ticks at the ear base
      p.seg(X(66), 60, X(72), 54, { w: 1.6, color: "rgba(43,38,34,0.45)" });
    };
    ear(1);
    ear(-1);
    // head: broad at the cheeks, tapering to the muzzle
    p.shape(
      [
        [70, 82],
        [78, 58],
        [100, 46],
        [120, 44],
        [140, 46],
        [162, 58],
        [170, 82],
        [164, 106],
        [146, 124],
        [120, 132],
        [94, 124],
        [76, 106],
      ],
      { fill: C.caramel, w: 3.5 },
    );
    // white blaze down the forehead opening into the muzzle and cheeks
    p.shape(
      [
        [114, 48],
        [126, 48],
        [128, 74],
        [146, 92],
        [150, 112],
        [136, 126],
        [120, 130],
        [104, 126],
        [90, 112],
        [94, 92],
        [112, 74],
      ],
      { fill: cream, w: 0 },
    );
    p.curve(
      [
        [96, 116],
        [108, 126],
        [120, 130],
        [132, 126],
        [144, 116],
      ],
      { w: 2.2, color: "rgba(43,38,34,0.5)" },
    );
    // nose and mouth
    p.shape(
      [
        [111, 98],
        [129, 98],
        [124, 107],
        [116, 107],
      ],
      { fill: ink, w: 2 },
    );
    p.seg(120, 107, 120, 113, { w: 2.2 });
    p.curve(
      [
        [110, 113],
        [115, 117],
        [120, 113],
        [125, 117],
        [130, 113],
      ],
      { w: 2.2 },
    );
    // sleepy closed eyes
    for (const x of [97, 143])
      p.curve(
        [
          [x - 9, 84],
          [x, 90],
          [x + 9, 84],
        ],
        { w: 3.2 },
      );
    p.ellipse(86, 102, 7, 4.5, { fill: "rgba(242,120,107,0.55)", w: 0 });
    p.ellipse(154, 102, 7, 4.5, { fill: "rgba(242,120,107,0.55)", w: 0 });
    // white chest ruff resting on the rim
    p.shape(
      [
        [82, 150],
        [88, 132],
        [104, 128],
        [120, 134],
        [136, 128],
        [152, 132],
        [158, 150],
      ],
      { fill: cream, w: 3 },
    );
  });
  doodle(scene, "title_cup_front", 340, 260, (p) => {
    p.curve(
      [
        [268, 92],
        [324, 98],
        [326, 160],
        [262, 178],
      ],
      { w: 14, color: ink },
    );
    p.curve(
      [
        [268, 92],
        [322, 98],
        [324, 160],
        [262, 178],
      ],
      { w: 8, color: "#fff" },
    );
    p.shape(
      [
        [22, 72],
        [32, 170],
        [70, 236],
        [150, 248],
        [230, 236],
        [268, 170],
        [278, 72],
        [150, 104],
      ],
      { fill: "#fffaf0", w: 4 },
    );
    p.curve(
      [
        [26, 96],
        [150, 128],
        [276, 96],
      ],
      { w: 1, color: "rgba(0,0,0,0)" },
    );
    p.hatch(
      [
        [40, 190],
        [260, 190],
        [230, 236],
        [150, 248],
        [70, 236],
      ],
      6,
      -0.7,
      "rgba(43,38,34,0.18)",
    );
    p.ellipse(150, 254, 150, 6, { fill: "rgba(43,38,34,0.12)", w: 0 });
  });
  // title cue: the orange moulded double-bay shopfront (fascia lettering is added as text by the title scene)
  doodle(scene, "title_storefront", 200, 150, (p) => {
    const O = C.orange;
    p.rrect(2, 0, 196, 6, 2, { fill: "#e8d3a0", w: 2 });
    p.rrect(4, 5, 192, 20, 2, { fill: O, w: 3 });
    p.rrect(4, 25, 192, 118, 2, { fill: O, w: 3 });
    for (const x0 of [14, 112]) {
      p.rrect(x0, 32, 74, 78, 2, { fill: "#eaf2f4", w: 2.6 });
      for (const k of [1, 2]) p.seg(x0 + (74 * k) / 3, 32, x0 + (74 * k) / 3, 110, { w: 1.6, color: O });
      p.seg(x0, 60, x0 + 74, 60, { w: 1.6, color: O });
      p.seg(x0 + 6, 40, x0 + 20, 54, { w: 1.4, color: "rgba(255,255,255,0.9)" });
      p.rrect(x0, 114, 74, 24, 2, { fill: O, w: 2.2 });
      p.rrect(x0 + 6, 118, 28, 16, 2, { w: 1.6, color: C.orangeDark });
      p.rrect(x0 + 40, 118, 28, 16, 2, { w: 1.6, color: C.orangeDark });
    }
    // centre pilaster with a little winged corgi decal
    p.seg(100, 25, 100, 143, { w: 2, color: C.orangeDark });
    p.ellipse(100, 70, 5, 4.5, { fill: "#fffaf0", w: 1.4 });
    p.shape([[96, 67], [95, 61], [99, 65]], { fill: "#fffaf0", w: 1.2 });
    p.shape([[104, 67], [105, 61], [101, 65]], { fill: "#fffaf0", w: 1.2 });
    p.curve([[95, 72], [88, 66], [90, 76]], { w: 1.4, color: "#fffaf0" });
    p.curve([[105, 72], [112, 66], [110, 76]], { w: 1.4, color: "#fffaf0" });
    // tiny window lettering hint and a hanging picture string
    p.seg(20, 98, 52, 98, { w: 1.6, color: "rgba(255,255,255,0.95)" });
    p.curve([[16, 36], [51, 42], [86, 36]], { w: 1, color: "rgba(43,38,34,0.5)" });
    for (const x of [26, 42, 58, 74]) p.rrect(x - 3, 38, 6, 7, 2, { fill: "#fffaf0", w: 1 });
    p.seg(0, 145, 200, 145, { w: 2.6 });
  });
  // shop decor icons
  doodle(scene, "icon_polaroids", 90, 50, (p) => {
    p.curve([[4, 10], [45, 20], [86, 10]], { w: 1.6 });
    ([[14, 13, -8, "#f6c0ae"], [38, 17, 4, "#a9c8e8"], [62, 16, -3, "#a3ae8f"]] as [number, number, number, string][]).forEach(([x, y, , col]) => {
      p.rrect(x, y, 20, 24, 1.5, { fill: "#fffaf0", w: 2 });
      p.rrect(x + 3, y + 3, 14, 13, 1, { fill: col, w: 1.2 });
      p.dot(x + 10, y, 2, C.copper);
    });
  });
  doodle(scene, "icon_lamp", 56, 56, (p) => {
    p.seg(28, 2, 28, 18, { w: 1.8 });
    p.shape([[10, 40], [14, 26], [22, 19], [34, 19], [42, 26], [46, 40]], { fill: C.copper, w: 2.6 });
    p.seg(16, 28, 22, 22, { w: 1.6, color: "rgba(255,255,255,0.7)" });
    p.ellipse(28, 42, 9, 4, { fill: "#fff2c2", w: 1.8 });
    for (const [x, y] of [[16, 50], [28, 53], [40, 50]] as [number, number][]) p.seg(x, y, x + (x - 28) * 0.15, y + 3, { w: 1.4, color: C.caramel });
  });
  doodle(scene, "steam", 40, 80, (p) => {
    p.curve(
      [
        [20, 76],
        [10, 56],
        [26, 38],
        [12, 18],
        [22, 2],
      ],
      { w: 3, color: "rgba(90,81,74,0.45)" },
    );
  });
  doodle(scene, "butt", 70, 64, (p) => {
    p.shape(
      [
        [35, 60],
        [8, 36],
        [6, 16],
        [18, 4],
        [35, 14],
        [52, 4],
        [64, 16],
        [62, 36],
      ],
      { fill: C.caramel, w: 3.4 },
    );
    p.ellipse(22, 26, 10, 12, { fill: cream, w: 0 });
    p.ellipse(48, 26, 10, 12, { fill: cream, w: 0 });
    p.ellipse(35, 16, 6, 5, { fill: cream, w: 2.2 });
    p.seg(35, 24, 35, 48, { w: 2.2 });
  });
}

// ---------------------------------------------------------------------------
// London décor helpers (shared by the room background and cosmetic décor)
// ---------------------------------------------------------------------------
export function tableDraw(p: Pen, w: number) {
  const W = w + 20;
  p.ellipse(W / 2, 80, w / 2 - 6, 6, { fill: "rgba(43,38,34,0.14)", w: 0 });
  for (const x of [32, W - 32]) p.seg(x, 46, x + 1, 74, { w: 2.4, color: "#55504b" });
  for (const x of [20, W - 20]) p.seg(x, 50, x - 1, 84, { w: 3 });
  p.rrect(10, 16, w, 34, 7, { fill: C.table, w: 3 });
  p.rrect(10, 46, w, 8, 3, { fill: "#c99f6a", w: 2.6 });
  for (const k of [0.3, 0.62]) {
    const y = 20 + k * 26;
    p.curve(
      [
        [20, y],
        [W * 0.4, y - 3],
        [W - 24, y + 1],
      ],
      { w: 1.1, color: "#b98c56" },
    );
  }
  // white pot with orange flowers in the middle
  flowerPot(p, W / 2, 34, 0.32);
}

export function flowerPot(p: Pen, cx: number, bottom: number, s: number) {
  const y0 = bottom - 126 * s;
  const X = (x: number) => cx + (x - 45) * s;
  const Y = (y: number) => y0 + y * s;
  for (const [x, y] of [
    [45, 40],
    [24, 58],
    [66, 56],
    [34, 30],
    [58, 32],
  ] as Pt[]) {
    p.seg(X(45), Y(92), X(x), Y(y + 8), { w: Math.max(1.2, 2.2 * s), color: C.sageDark });
    p.ellipse(X(x + (x < 45 ? 6 : -6)), Y(y + 26), 6 * s + 1, 11 * s + 1, { fill: C.sage, w: Math.max(1, 2 * s) });
  }
  for (const [x, y] of [
    [45, 34],
    [24, 52],
    [66, 50],
    [34, 24],
    [58, 26],
  ] as Pt[]) {
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2;
      p.circle(X(x + Math.cos(a) * 6), Y(y + Math.sin(a) * 6), 5 * s + 0.6, { fill: C.orange, w: Math.max(0.8, 1.6 * s) });
    }
    p.dot(X(x), Y(y), 3 * s + 0.5, "#f6c453");
  }
  p.shape(
    [
      [X(22), Y(88)],
      [X(68), Y(88)],
      [X(62), Y(126)],
      [X(28), Y(126)],
    ],
    { fill: "#ffffff", w: Math.max(1.4, 3 * s) },
  );
  p.seg(X(23), Y(97), X(67), Y(97), { w: Math.max(1, 2 * s) });
}

export function polaroid(p: Pen, x: number, y: number, col: string, i: number) {
  p.rrect(x - 15, y + 2, 30, 34, 2, { fill: "#fffaf0", w: 1.8 });
  p.rrect(x - 12, y + 5, 24, 21, 1, { fill: col, w: 1.2 });
  if (i % 3 === 0) {
    // tiny corgi face
    p.shape(
      [
        [x - 7, y + 15],
        [x - 6, y + 8],
        [x - 2, y + 12],
      ],
      { fill: C.caramel, w: 1 },
    );
    p.shape(
      [
        [x + 7, y + 15],
        [x + 6, y + 8],
        [x + 2, y + 12],
      ],
      { fill: C.caramel, w: 1 },
    );
    p.ellipse(x, y + 17, 6, 5, { fill: C.caramel, w: 1 });
    p.ellipse(x, y + 19, 3, 2.4, { fill: "#fffaf0", w: 0 });
  } else if (i % 3 === 1) {
    // two people waving
    p.circle(x - 5, y + 13, 3, { fill: "#e8b98f", w: 1 });
    p.circle(x + 5, y + 13, 3, { fill: "#9a6440", w: 1 });
    p.rrect(x - 9, y + 17, 8, 8, 2, { fill: C.orange, w: 1 });
    p.rrect(x + 1, y + 17, 8, 8, 2, { fill: "#3b4a66", w: 1 });
  } else {
    // a cup with the corgi logo
    p.rrect(x - 5, y + 11, 10, 12, 2, { fill: "#fff", w: 1 });
    p.rrect(x - 5, y + 15, 10, 4, 1, { fill: C.orange, w: 0 });
  }
  p.dot(x, y + 2, 2.2, C.orangeDark); // peg
}

export function copperBell(p: Pen, x: number, y: number, s: number) {
  p.shape(
    [
      [x - 4 * s, y],
      [x + 4 * s, y],
      [x + 9 * s, y + 10 * s],
      [x + 13 * s, y + 18 * s],
      [x - 13 * s, y + 18 * s],
      [x - 9 * s, y + 10 * s],
    ],
    { fill: C.copper, w: 2.2 },
  );
  p.ellipse(x, y + 18 * s, 13 * s, 3 * s, { fill: "#ffe7b0", w: 1.6 });
  p.seg(x - 4 * s, y + 4 * s, x - 8 * s, y + 14 * s, { w: 1.2, color: "rgba(255,240,210,0.8)" });
}

/** Painterly Renaissance corgi bust (inspired by the mural wall, original drawing). */
export function renaissanceCorgi(p: Pen, cx: number, cy: number, s: number) {
  const X = (x: number) => cx + x * s;
  const Y = (y: number) => cy + y * s;
  p.rrect(X(-42), Y(-50), 84 * s, 100 * s, 6 * s, { fill: "#c9a24a", w: 3 });
  p.rrect(X(-33), Y(-41), 66 * s, 82 * s, 30 * s, { fill: "#3f5a4a", w: 2.4 });
  // robe + ruff
  p.shape(
    [
      [X(-28), Y(40)],
      [X(-22), Y(14)],
      [X(22), Y(14)],
      [X(28), Y(40)],
    ],
    { fill: "#8f2f3a", w: 2.2 },
  );
  const ruff: Pt[] = [];
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const r = i % 2 ? 1 : 1.12;
    ruff.push([X(Math.cos(a) * 20 * r), Y(12 + Math.sin(a) * 7 * r)]);
  }
  p.shape(ruff, { fill: "#fffaf0", w: 1.8 });
  // ears
  p.shape(
    [
      [X(-15), Y(-14)],
      [X(-14), Y(-36)],
      [X(-3), Y(-20)],
    ],
    { fill: C.caramel, w: 2.2 },
  );
  p.shape(
    [
      [X(15), Y(-14)],
      [X(14), Y(-36)],
      [X(3), Y(-20)],
    ],
    { fill: C.caramel, w: 2.2 },
  );
  // fox-like head with white blaze and muzzle
  p.shape(
    [
      [X(-16), Y(-14)],
      [X(-8), Y(-22)],
      [X(8), Y(-22)],
      [X(16), Y(-14)],
      [X(14), Y(-2)],
      [X(6), Y(8)],
      [X(-6), Y(8)],
      [X(-14), Y(-2)],
    ],
    { fill: C.caramel, w: 2.4 },
  );
  p.shape(
    [
      [X(-2), Y(-22)],
      [X(2), Y(-22)],
      [X(4), Y(-8)],
      [X(8), Y(2)],
      [X(4), Y(8)],
      [X(-4), Y(8)],
      [X(-8), Y(2)],
      [X(-4), Y(-8)],
    ],
    { fill: "#fffaf0", w: 0 },
  );
  p.dot(X(-7), Y(-9), 1.8 * s + 0.4);
  p.dot(X(7), Y(-9), 1.8 * s + 0.4);
  p.ellipse(X(0), Y(1), 3 * s, 2.4 * s, { fill: C.ink, w: 0 });
  p.hatch(p.rrectPts(X(-31), Y(-39), 62 * s, 30 * s, 14 * s), 6, -0.7, "rgba(255,240,210,0.18)");
}

/** Sticker button background (white die-cut border + coloured core). */
export function stickerTex(scene: Phaser.Scene, w: number, h: number, fill: string): string {
  const key = `sticker_${w}x${h}_${fill}`;
  doodle(scene, key, w + 16, h + 18, (p) => {
    p.rrect(6, 10, w + 4, h + 4, Math.min(22, h / 2), { fill: "rgba(43,38,34,0.18)", w: 0 });
    p.rrect(4, 4, w + 6, h + 6, Math.min(24, h / 2 + 2), { fill: "#fff", w: 2 });
    p.rrect(8, 7, w - 2, h, Math.min(20, h / 2), { fill, w: 3 });
    p.curve(
      [
        [18, 14],
        [w * 0.45, 12],
      ],
      { w: 2.2, color: "rgba(255,255,255,0.7)" },
    );
  });
  return key;
}

/** Torn notebook scrap panel. */
export function scrapTex(scene: Phaser.Scene, w: number, h: number, lined = true, fill: string = "#fffaf0"): string {
  const key = `scrap_${w}x${h}_${lined ? 1 : 0}_${fill}`;
  doodle(
    scene,
    key,
    w + 20,
    h + 20,
    (p) => {
      const pts: Pt[] = [];
      const torn = (x0: number, y0: number, x1: number, y1: number, amp: number) => {
        const n = Math.max(4, Math.round(Math.hypot(x1 - x0, y1 - y0) / 14));
        for (let i = 0; i < n; i++) {
          const t = i / n;
          pts.push([x0 + (x1 - x0) * t + p.r(amp), y0 + (y1 - y0) * t + p.r(amp)]);
        }
      };
      torn(10, 10, w + 10, 10, 1.5);
      torn(w + 10, 10, w + 10, h + 10, 1.5);
      torn(w + 10, h + 10, 10, h + 10, 3.2);
      torn(10, h + 10, 10, 10, 1.5);
      const shadow = pts.map(([x, y]) => [x + 4, y + 6] as Pt);
      p.shapeSharp(shadow, { fill: "rgba(43,38,34,0.16)", w: 0, j: 0 });
      p.shapeSharp(pts, { fill, w: 1.6, j: 0.3, color: "rgba(43,38,34,0.55)" });
      if (lined) {
        const c = p.ctx;
        c.save();
        c.beginPath();
        c.moveTo(pts[0][0], pts[0][1]);
        for (const [x, y] of pts) c.lineTo(x, y);
        c.closePath();
        c.clip();
        c.strokeStyle = "rgba(127,170,214,0.45)";
        c.lineWidth = 1.2;
        for (let y = 40; y < h + 10; y += 26) {
          c.beginPath();
          c.moveTo(10, y);
          c.lineTo(w + 10, y);
          c.stroke();
        }
        c.strokeStyle = "rgba(236,154,154,0.6)";
        c.beginPath();
        c.moveTo(38, 10);
        c.lineTo(38, h + 10);
        c.stroke();
        c.restore();
      }
    },
    1,
  );
  return key;
}

/** Order bubble sized for n items. */
export function bubbleTex(scene: Phaser.Scene, n: number): string {
  const key = `bubble_${n}`;
  const w = 24 + n * 52;
  doodle(scene, key, w + 8, 84, (p) => {
    p.rrect(4, 4, w, 60, 20, { fill: "#fff", w: 2.8 });
    p.shape(
      [
        [w / 2 - 6, 62],
        [w / 2 + 10, 62],
        [w / 2 - 2, 80],
      ],
      { fill: "#fff", w: 0 },
    );
    p.line(
      [
        [w / 2 - 7, 63],
        [w / 2 - 2, 80],
        [w / 2 + 11, 63],
      ],
      { w: 2.8 },
    );
  });
  return key;
}
