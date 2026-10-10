import Phaser from "phaser";
import { Pen, Pt, hashStr } from "./pen";
import { COLORS as C } from "../config";

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
// Corgi (side view, facing right) — body, ears, legs, apron overlays
// ---------------------------------------------------------------------------
function corgiBody(p: Pen, sleepy = false) {
  p.ellipse(15, 34, 10, 9, { fill: cream, w: 2.5 }); // tail fluff
  p.rrect(14, 20, 80, 42, 21, { fill: C.caramel, w: 3 });
  p.ellipse(54, 55, 30, 7, { fill: cream, w: 0 });
  p.ellipse(22, 44, 9, 12, { fill: cream, w: 0 });
  p.seg(28, 61.5, 82, 61.5, { w: 3 });
  p.hatch(p.rrectPts(16, 22, 30, 14, 7), 5, -0.7, "rgba(196,122,51,0.45)", 1.3);
  p.ellipse(84, 44, 9, 11, { fill: cream, w: 0 });
  p.circle(94, 28, 21, { fill: C.caramel, w: 3 });
  p.ellipse(108, 37, 13, 9, { fill: cream, w: 2.5 });
  p.ellipse(99, 13, 3.5, 8, { fill: cream, w: 0 });
  p.dot(119, 33, 3.6);
  if (sleepy) {
    p.curve(
      [
        [96, 25],
        [100, 28],
        [104, 25],
      ],
      { w: 2.4 },
    );
  } else {
    p.dot(100, 24, 3.2);
    p.dot(101.2, 22.8, 1.1, "#fff");
  }
  p.ellipse(96, 36, 5, 3, { fill: "rgba(242,120,107,0.55)", w: 0 });
  p.curve(
    [
      [109, 42],
      [112.5, 45],
      [116, 42],
    ],
    { w: 2 },
  );
}

function corgiEar(p: Pen) {
  p.shape(
    [
      [5, 42],
      [12, 14],
      [17, 3],
      [22, 14],
      [30, 42],
    ],
    { fill: C.caramel, w: 3 },
  );
  p.shape(
    [
      [11, 39],
      [17, 13],
      [24, 39],
    ],
    { fill: "#f6b9a8", w: 1.5 },
  );
}

function corgiLegs(p: Pen, xs: number[]) {
  for (const x of xs) {
    p.rrect(x - 6, 0, 12, 18, 5, { fill: C.caramel, w: 2.6 });
    p.ellipse(x + 1, 18, 7.5, 4.5, { fill: cream, w: 2.4 });
  }
}

function apron(p: Pen, fill: string, polka: boolean) {
  p.shape(
    [
      [64, 31],
      [88, 31],
      [90, 60],
      [62, 60],
    ],
    { fill, w: 2.6 },
  );
  if (polka) {
    for (const [x, y] of [
      [70, 38],
      [82, 42],
      [72, 52],
      [84, 55],
    ])
      p.dot(x, y, 2.4, C.coral);
  }
  p.rrect(70, 44, 14, 9, 3, { w: 1.6 });
  p.curve(
    [
      [66, 32],
      [74, 20],
      [86, 22],
      [88, 31],
    ],
    { w: 2 },
  );
  p.curve(
    [
      [63, 40],
      [54, 37],
      [48, 42],
    ],
    { w: 2 },
  );
  p.ellipse(50, 38, 4, 3, { w: 1.6 });
}

// ---------------------------------------------------------------------------
// Seated customer (front view)
// ---------------------------------------------------------------------------
type Mood = "n" | "h" | "a";
interface DogSpec {
  fur: string;
  chest?: string;
  muzzle: string;
  paws?: string;
  ear: "floppy" | "pointy" | "folded" | "curly" | "cat";
  earColor: string;
  earInner?: string;
  head?: (p: Pen) => void;
  over?: (p: Pen, m: Mood) => void;
  face?: (p: Pen, m: Mood) => boolean; // return true if face handled
  eyeR?: number;
  eyeDX?: number;
  noseColor?: string;
}

function mirror(pts: Pt[], cx = 55): Pt[] {
  return pts.map(([x, y]) => [cx * 2 - x, y] as Pt);
}

function dogFace(p: Pen, m: Mood, s: DogSpec) {
  const ex = s.eyeDX ?? 12;
  const r = s.eyeR ?? 3.3;
  if (m === "n") {
    p.dot(55 - ex, 46, r);
    p.dot(55 + ex, 46, r);
    p.dot(55 - ex + 1.2, 44.8, r * 0.33, "#fff");
    p.dot(55 + ex + 1.2, 44.8, r * 0.33, "#fff");
    p.curve(
      [
        [49, 65],
        [52, 68],
        [55, 65.5],
        [58, 68],
        [61, 65],
      ],
      { w: 2.2 },
    );
  } else if (m === "h") {
    for (const sx of [-1, 1]) {
      const x = 55 + sx * ex;
      p.curve(
        [
          [x - 5, 48],
          [x, 42],
          [x + 5, 48],
        ],
        { w: 3 },
      );
    }
    p.shape(
      [
        [47, 64],
        [55, 66],
        [63, 64],
        [60, 72],
        [55, 74],
        [50, 72],
      ],
      { fill: "#5a2a22", w: 2.2 },
    );
    p.ellipse(55, 72, 4.5, 3.5, { fill: C.coral, w: 1.4 });
    p.ellipse(55 - ex - 6, 56, 5, 3, { fill: "rgba(242,120,107,0.6)", w: 0 });
    p.ellipse(55 + ex + 6, 56, 5, 3, { fill: "rgba(242,120,107,0.6)", w: 0 });
  } else {
    p.dot(55 - ex, 47, r * 0.85);
    p.dot(55 + ex, 47, r * 0.85);
    p.seg(55 - ex - 7, 37, 55 - ex + 5, 42, { w: 3 });
    p.seg(55 + ex + 7, 37, 55 + ex - 5, 42, { w: 3 });
    p.curve(
      [
        [48, 70],
        [52, 66],
        [55, 67],
        [58, 66],
        [62, 70],
      ],
      { w: 2.4 },
    );
  }
}

function seatedDog(p: Pen, s: DogSpec, m: Mood) {
  p.ellipse(55, 98, 32, 26, { fill: s.fur, w: 3 });
  if (s.chest) p.ellipse(55, 95, 15, 19, { fill: s.chest, w: 0 });
  p.hatch(p.ellipsePts(55, 108, 30, 12), 5, -0.7, "rgba(43,38,34,0.18)");
  p.ellipse(42, 119, 9, 6, { fill: s.paws ?? s.chest ?? s.fur, w: 2.5 });
  p.ellipse(68, 119, 9, 6, { fill: s.paws ?? s.chest ?? s.fur, w: 2.5 });
  const pointyL: Pt[] = [
    [28, 44],
    [27, 18],
    [31, 6],
    [41, 18],
    [50, 30],
  ];
  const catL: Pt[] = [
    [30, 40],
    [30, 14],
    [33, 10],
    [48, 28],
  ];
  if (s.ear === "pointy" || s.ear === "cat") {
    const L = s.ear === "pointy" ? pointyL : catL;
    p.shape(L, { fill: s.earColor, w: 3 });
    p.shape(mirror(L), { fill: s.earColor, w: 3 });
    const inner = (pts: Pt[]): Pt[] => {
      const cx = pts.reduce((a, b) => a + b[0], 0) / pts.length;
      const cy = pts.reduce((a, b) => a + b[1], 0) / pts.length;
      return pts.map(([x, y]) => [cx + (x - cx) * 0.55, cy + (y - cy) * 0.55 + 2] as Pt);
    };
    p.shape(inner(L), { fill: s.earInner ?? "#f6b9a8", w: 0 });
    p.shape(inner(mirror(L)), { fill: s.earInner ?? "#f6b9a8", w: 0 });
  }
  p.ellipse(55, 50, 30, 27, { fill: s.fur, w: 3 });
  s.head?.(p);
  p.ellipse(55, 63, 15, 11, { fill: s.muzzle, w: 2.5 });
  p.ellipse(55, 57, 5.5, 4, { fill: s.noseColor ?? ink, w: 0 });
  if (s.ear === "floppy") {
    const L: Pt[] = [
      [32, 30],
      [22, 38],
      [17, 60],
      [23, 72],
      [32, 66],
      [37, 42],
    ];
    p.shape(L, { fill: s.earColor, w: 3 });
    p.shape(mirror(L), { fill: s.earColor, w: 3 });
  } else if (s.ear === "folded") {
    const L: Pt[] = [
      [32, 28],
      [22, 33],
      [27, 45],
      [38, 34],
    ];
    p.shape(L, { fill: s.earColor, w: 2.6 });
    p.shape(mirror(L), { fill: s.earColor, w: 2.6 });
  } else if (s.ear === "curly") {
    for (const [x, y] of [
      [26, 46],
      [23, 58],
      [27, 70],
    ]) {
      p.circle(x, y, 9, { fill: s.earColor, w: 2.6 });
      p.circle(110 - x, y, 9, { fill: s.earColor, w: 2.6 });
    }
  }
  if (!s.face?.(p, m)) dogFace(p, m, s);
  s.over?.(p, m);
}

const DOGS: Record<string, DogSpec> = {
  beagle: {
    fur: "#c98a4b",
    chest: cream,
    muzzle: cream,
    paws: cream,
    ear: "floppy",
    earColor: "#6e3f22",
    head: (p) => p.ellipse(55, 38, 5, 14, { fill: cream, w: 0 }),
  },
  pug: {
    fur: "#e8c690",
    chest: "#f3dcb0",
    muzzle: "#4a3d36",
    ear: "folded",
    earColor: "#3d3430",
    eyeR: 4.4,
    eyeDX: 14,
    head: (p) => {
      p.curve(
        [
          [46, 33],
          [55, 30],
          [64, 33],
        ],
        { w: 1.6, color: "#8a6a44" },
      );
      p.curve(
        [
          [48, 38],
          [55, 36],
          [62, 38],
        ],
        { w: 1.6, color: "#8a6a44" },
      );
    },
  },
  shiba: {
    fur: "#e08a3c",
    chest: cream,
    muzzle: cream,
    paws: cream,
    ear: "pointy",
    earColor: "#e08a3c",
    earInner: cream,
    head: (p) => {
      p.ellipse(39, 60, 12, 9, { fill: cream, w: 0 });
      p.ellipse(71, 60, 12, 9, { fill: cream, w: 0 });
      p.dot(46, 37, 2.6, cream);
      p.dot(64, 37, 2.6, cream);
    },
  },
  retriever: {
    fur: "#f0b860",
    chest: "#f7d08a",
    muzzle: "#f7d08a",
    ear: "floppy",
    earColor: "#d9963c",
    face: (p, m) => {
      if (m !== "n") return false;
      p.dot(43, 46, 3.6);
      p.dot(67, 46, 3.6);
      p.dot(44.2, 44.6, 1.2, "#fff");
      p.dot(68.2, 44.6, 1.2, "#fff");
      p.shape(
        [
          [48, 64],
          [55, 66],
          [62, 64],
          [59, 70],
          [55, 71],
          [51, 70],
        ],
        { fill: "#5a2a22", w: 2 },
      );
      p.ellipse(55, 71, 4, 4, { fill: C.coral, w: 1.4 });
      return true;
    },
  },
  poodle: {
    fur: "#fbf7f2",
    muzzle: "#fbf7f2",
    chest: "#fbf7f2",
    ear: "curly",
    earColor: "#f4ece4",
    head: (p) => {
      p.circle(55, 24, 15, { fill: "#fbf7f2", w: 2.6 });
      p.circle(41, 28, 10, { fill: "#fbf7f2", w: 2.6 });
      p.circle(69, 28, 10, { fill: "#fbf7f2", w: 2.6 });
      p.ellipse(57, 13, 20, 7, { fill: ink, w: 2 });
      p.seg(57, 6, 59, 2, { w: 3 });
    },
    over: (p) => {
      p.shape(
        [
          [18, 40],
          [26, 46],
          [18, 52],
        ],
        { fill: "#f6a6b6", w: 2 },
      );
      p.shape(
        [
          [34, 40],
          [26, 46],
          [34, 52],
        ],
        { fill: "#f6a6b6", w: 2 },
      );
    },
  },
  cat: {
    fur: "#a4a4b0",
    chest: "#e9e9ef",
    muzzle: "#e9e9ef",
    ear: "cat",
    earColor: "#a4a4b0",
    earInner: "#f6b9a8",
    noseColor: "#e58a8a",
    face: (p, m) => {
      // whiskers
      for (const s of [-1, 1]) {
        p.seg(55 + s * 12, 62, 55 + s * 30, 58, { w: 1.4 });
        p.seg(55 + s * 12, 65, 55 + s * 30, 66, { w: 1.4 });
      }
      if (m === "n") {
        for (const s of [-1, 1]) {
          const x = 55 + s * 12;
          p.ellipse(x, 47, 5, 3.5, { fill: "#d8e86a", w: 2 });
          p.dot(x, 47.5, 1.6);
          p.seg(x - 6, 44, x + 6, 44.5, { w: 3 });
        }
        p.curve(
          [
            [50, 68],
            [55, 66],
            [60, 68],
          ],
          { w: 2 },
        );
      } else if (m === "h") {
        for (const s of [-1, 1]) {
          const x = 55 + s * 12;
          p.curve(
            [
              [x - 5, 47],
              [x, 43],
              [x + 5, 47],
            ],
            { w: 3 },
          );
        }
        p.curve(
          [
            [50, 66],
            [52.5, 68.5],
            [55, 66.5],
            [57.5, 68.5],
            [60, 66],
          ],
          { w: 2 },
        );
        p.ellipse(37, 57, 5, 3, { fill: "rgba(242,120,107,0.7)", w: 0 });
        p.ellipse(73, 57, 5, 3, { fill: "rgba(242,120,107,0.7)", w: 0 });
      } else {
        for (const s of [-1, 1]) {
          const x = 55 + s * 12;
          p.ellipse(x, 47, 5, 5, { fill: "#d8e86a", w: 2 });
          p.seg(x, 43.5, x, 50.5, { w: 2 });
          p.seg(x - s * 7, 39, x + s * 5, 43, { w: 3 });
        }
        p.shape(
          [
            [49, 67],
            [61, 67],
            [55, 74],
          ],
          { fill: "#5a2a22", w: 2 },
        );
      }
      return true;
    },
  },
  influencer: {
    fur: C.caramel,
    chest: cream,
    muzzle: cream,
    paws: cream,
    ear: "pointy",
    earColor: C.caramel,
    head: (p) => p.ellipse(55, 36, 5, 13, { fill: cream, w: 0 }),
    face: (p, m) => {
      p.rrect(36, 40, 16, 11, 4, { fill: ink, w: 2 });
      p.rrect(58, 40, 16, 11, 4, { fill: ink, w: 2 });
      p.seg(52, 44, 58, 44, { w: 2.4 });
      p.seg(39, 43, 44, 42, { w: 1.6, color: "#fff" });
      p.seg(61, 43, 66, 42, { w: 1.6, color: "#fff" });
      if (m === "a") {
        p.curve(
          [
            [49, 70],
            [55, 66],
            [61, 70],
          ],
          { w: 2.4 },
        );
      } else if (m === "h") {
        p.shape(
          [
            [47, 64],
            [55, 66],
            [63, 64],
            [59, 71],
            [51, 71],
          ],
          { fill: "#5a2a22", w: 2 },
        );
      } else {
        p.curve(
          [
            [50, 66],
            [56, 68],
            [62, 64],
          ],
          { w: 2.2 },
        );
      }
      return true;
    },
  },
};

// ---------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------
function latteTop(p: Pen, fancy: boolean) {
  p.ellipse(27, 38, 23, 9, { fill: "#fff", w: 2.4 });
  p.ellipse(44, 26, 6, 5, { w: 3 });
  p.ellipse(27, 27, 19, 14, { fill: "#fff", w: 3 });
  p.ellipse(27, 27, 14.5, 10, { fill: "#b07a4a", w: 1.6 });
  // foam corgi face
  p.shape(
    [
      [20, 26],
      [21, 18],
      [25, 23],
    ],
    { fill: "#f6e5c8", w: 0 },
  );
  p.shape(
    [
      [34, 26],
      [33, 18],
      [29, 23],
    ],
    { fill: "#f6e5c8", w: 0 },
  );
  p.ellipse(27, 29, 8, 6, { fill: "#f6e5c8", w: 0 });
  p.dot(24.5, 28, 1.1, "#7a4a2a");
  p.dot(29.5, 28, 1.1, "#7a4a2a");
  p.dot(27, 31, 1.2, "#7a4a2a");
  if (fancy) {
    p.shape(
      [
        [21, 18],
        [23, 12],
        [27, 16],
        [31, 12],
        [33, 18],
      ],
      { fill: "#f6c453", w: 1.6 },
    );
    star(p, 7, 10, 5, C.caramel);
    star(p, 47, 8, 4, C.mint);
    star(p, 46, 44, 3.5, C.coral);
    p.curve(
      [
        [9, 20],
        [6, 26],
        [10, 32],
      ],
      { w: 1.6, color: C.coral },
    );
  }
}

function star(p: Pen, cx: number, cy: number, r: number, fill: string) {
  const pts: Pt[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  p.shapeSharp(pts, { fill, w: 1.6, j: 0.4 });
}

function toastShape(p: Pen, burnt: boolean) {
  const fill = burnt ? "#3a2e28" : "#f2c27a";
  p.rrect(6, 20, 40, 26, 12, { fill, w: 3, color: burnt ? ink : "#9a5a24" });
  p.shape(
    [
      [34, 22],
      [38, 9],
      [42, 22],
    ],
    { fill, w: 2.4 },
  );
  p.shape(
    [
      [40, 23],
      [46, 12],
      [47, 26],
    ],
    { fill, w: 2.4 },
  );
  if (!burnt) {
    p.rrect(10, 24, 32, 18, 8, { fill: "#f8dcaa", w: 0 });
    p.curve(
      [
        [33, 32],
        [36, 35],
        [39, 32],
      ],
      { w: 2 },
    );
    p.dot(44, 34, 2);
    p.ellipse(16, 40, 5, 4, { fill: "#f8dcaa", w: 1.6 });
  } else {
    p.seg(32, 30, 37, 35, { w: 2, color: "#fff" });
    p.seg(37, 30, 32, 35, { w: 2, color: "#fff" });
    p.curve(
      [
        [16, 16],
        [12, 10],
        [17, 5],
      ],
      { w: 2, color: "#8b8b8b" },
    );
    p.curve(
      [
        [24, 16],
        [21, 9],
        [26, 3],
      ],
      { w: 2, color: "#8b8b8b" },
    );
  }
}

const ITEM_DRAW: Record<string, (p: Pen) => void> = {
  cup: (p) => {
    p.poly(
      [
        [15, 14],
        [39, 14],
        [35, 47],
        [19, 47],
      ],
      { fill: "#fff", w: 2.8 },
    );
    p.poly(
      [
        [16.5, 24],
        [37.6, 24],
        [36.5, 34],
        [17.6, 34],
      ],
      { fill: C.caramel, w: 2 },
    );
    p.rrect(12, 9, 30, 7, 3, { fill: cream, w: 2.6 });
  },
  coffee: (p) => {
    p.curve(
      [
        [38, 24],
        [47, 25],
        [46, 36],
        [37, 38],
      ],
      { w: 3.4 },
    );
    p.rrect(11, 17, 28, 31, 7, { fill: C.coral, w: 3 });
    p.ellipse(25, 18, 13, 4, { fill: "#6b3d22", w: 2.4 });
    p.curve(
      [
        [20, 12],
        [17, 7],
        [21, 2],
      ],
      { w: 1.8, color: "#9b8f86" },
    );
    p.curve(
      [
        [29, 12],
        [26, 6],
        [30, 1],
      ],
      { w: 1.8, color: "#9b8f86" },
    );
    p.seg(16, 32, 34, 32, { w: 1.4, color: "#fff" });
  },
  latte: (p) => latteTop(p, false),
  fancy: (p) => latteTop(p, true),
  pupcup: (p) => {
    p.poly(
      [
        [16, 26],
        [38, 26],
        [35, 48],
        [19, 48],
      ],
      { fill: "#fff", w: 2.8 },
    );
    p.ellipse(27, 25, 13, 6, { fill: cream, w: 2.4 });
    p.ellipse(27, 19, 10, 5.5, { fill: cream, w: 2.4 });
    p.ellipse(27, 13, 6, 4.5, { fill: cream, w: 2.4 });
    p.rrect(32, 4, 14, 7, 3.5, { fill: "#d9a063", w: 2 });
    // paw stamp
    p.dot(27, 39, 3.2, C.caramel);
    p.dot(22.5, 34.5, 1.6, C.caramel);
    p.dot(27, 33, 1.6, C.caramel);
    p.dot(31.5, 34.5, 1.6, C.caramel);
  },
  iced: (p) => {
    p.seg(30, 2, 24, 24, { w: 3.6, color: C.mintDark });
    p.poly(
      [
        [14, 12],
        [40, 12],
        [36, 50],
        [18, 50],
      ],
      { fill: "rgba(205,232,240,0.85)", w: 2.8 },
    );
    p.poly(
      [
        [15.5, 24],
        [38.5, 24],
        [36, 48],
        [18.5, 48],
      ],
      { fill: "#a8703f", w: 0 },
    );
    p.rrect(19, 18, 9, 9, 2, { fill: "rgba(255,255,255,0.85)", w: 1.6 });
    p.rrect(28, 22, 8, 8, 2, { fill: "rgba(255,255,255,0.85)", w: 1.6 });
    p.rrect(22, 30, 8, 8, 2, { fill: "rgba(255,255,255,0.7)", w: 1.4 });
    p.seg(18, 16, 19, 44, { w: 1.6, color: "#fff" });
  },
  croissant: (p) => {
    const segs: [number, number, number, number][] = [
      [10, 34, 7, 9],
      [17, 26, 8, 11],
      [27, 22, 9, 13],
      [37, 26, 8, 11],
      [44, 34, 7, 9],
    ];
    for (const [x, y, rx, ry] of segs) p.ellipse(x, y, rx, ry, { fill: "#e7a456", w: 2.6 });
    p.curve(
      [
        [20, 22],
        [23, 30],
      ],
      { w: 1.6, color: "#9a5a24" },
    );
    p.curve(
      [
        [34, 22],
        [31, 30],
      ],
      { w: 1.6, color: "#9a5a24" },
    );
    p.seg(24, 16, 30, 15, { w: 1.6, color: "#fff3d6" });
  },
  toast: (p) => toastShape(p, false),
  burnt: (p) => toastShape(p, true),
};

// ---------------------------------------------------------------------------
// Stations (origin bottom-centre sits on the counter front)
// ---------------------------------------------------------------------------
const SW = 124;
const SH = 92;
const STATION_DRAW: Record<string, (p: Pen) => void> = {
  cups: (p) => {
    for (const [x, y, rot] of [
      [40, 0, -0.06],
      [62, 4, 0.02],
      [84, 0, 0.07],
    ] as const) {
      for (let k = 0; k < 3; k++) {
        const top = 18 + y + k * 14;
        p.poly(
          [
            [x - 14 + rot * 40, top],
            [x + 14 + rot * 40, top],
            [x + 11, top + 26],
            [x - 11, top + 26],
          ],
          { fill: "#fff", w: 2.6 },
        );
        p.seg(x - 12, top + 10, x + 12, top + 10, { w: 1.6, color: C.caramel });
      }
    }
    p.ellipse(62, 86, 52, 5, { fill: "rgba(43,38,34,0.12)", w: 0 });
  },
  espresso: (p) => {
    p.rrect(18, 14, 88, 66, 12, { fill: C.coral, w: 3 });
    p.rrect(14, 8, 96, 12, 5, { fill: "#d8d0c4", w: 2.6 });
    p.circle(38, 36, 11, { fill: "#fff", w: 2.4 });
    p.seg(38, 36, 44, 30, { w: 2 });
    p.circle(90, 34, 7, { fill: C.mint, w: 2.4 });
    p.rrect(46, 44, 34, 11, 4, { fill: "#6e6660", w: 2.4 });
    p.seg(56, 55, 56, 60, { w: 3 });
    p.seg(70, 55, 70, 60, { w: 3 });
    p.rrect(32, 78, 60, 8, 3, { fill: "#6e6660", w: 2.4 });
    p.hatch(p.rrectPts(20, 60, 84, 18, 6), 5, -0.7, "rgba(43,38,34,0.25)");
  },
  milk: (p) => {
    // pitcher
    p.shape(
      [
        [22, 30],
        [52, 30],
        [56, 82],
        [18, 82],
      ],
      { fill: "#cfdbe3", w: 3 },
    );
    p.shape(
      [
        [22, 30],
        [14, 24],
        [26, 26],
      ],
      { fill: "#cfdbe3", w: 2.4 },
    );
    p.curve(
      [
        [54, 40],
        [64, 46],
        [56, 66],
      ],
      { w: 3 },
    );
    p.seg(26, 44, 30, 74, { w: 2, color: "#fff" });
    // palette + brush ("art station")
    p.ellipse(90, 64, 26, 18, { fill: "#f3d8b0", w: 3 });
    p.circle(80, 58, 4.5, { fill: C.caramel, w: 1.6 });
    p.circle(92, 54, 4.5, { fill: C.mint, w: 1.6 });
    p.circle(103, 60, 4.5, { fill: C.coral, w: 1.6 });
    p.circle(95, 72, 5, { fill: C.paper, w: 1.8 });
    p.seg(70, 20, 96, 50, { w: 4 });
    p.ellipse(97, 52, 4, 6, { fill: C.coral, w: 2 });
  },
  ice: (p) => {
    p.shape(
      [
        [22, 38],
        [102, 38],
        [94, 84],
        [30, 84],
      ],
      { fill: C.mint, w: 3 },
    );
    for (const [x, y] of [
      [36, 24],
      [52, 18],
      [68, 22],
      [84, 26],
      [46, 30],
      [76, 32],
    ])
      p.rrect(x - 7, y, 15, 14, 3, { fill: "#f4fbff", w: 2 });
    p.ellipse(62, 38, 41, 6, { fill: "rgba(255,255,255,0.4)", w: 2.6 });
    p.seg(30, 56, 94, 56, { w: 1.6, color: C.mintDark });
    star(p, 100, 18, 6, "#fff");
  },
  pastry: (p) => {
    p.rrect(18, 74, 88, 10, 4, { fill: C.caramel, w: 2.6 });
    p.seg(62, 84, 62, 90, { w: 4 });
    p.shape(
      [
        [22, 74],
        [24, 40],
        [40, 22],
        [62, 16],
        [84, 22],
        [100, 40],
        [102, 74],
      ],
      { fill: "rgba(214,236,246,0.55)", w: 2.8 },
    );
    p.circle(62, 12, 4, { fill: C.mint, w: 2 });
    const mini = (x: number, y: number) => {
      for (const [dx, dy, rx, ry] of [
        [-10, 4, 5, 6],
        [-5, -1, 6, 7],
        [3, -2, 6, 8],
        [10, 3, 5, 6],
      ])
        p.ellipse(x + dx, y + dy, rx, ry, { fill: "#e7a456", w: 2 });
    };
    mini(46, 62);
    mini(76, 62);
    mini(62, 46);
    p.curve(
      [
        [32, 66],
        [30, 46],
        [42, 32],
      ],
      { w: 2.4, color: "rgba(255,255,255,0.9)" },
    );
  },
  toaster: (p) => {
    p.rrect(20, 32, 84, 52, 16, { fill: "#e9c08a", w: 3 });
    p.rrect(34, 26, 22, 10, 3, { fill: "#6e6660", w: 2.4 });
    p.rrect(66, 26, 22, 10, 3, { fill: "#6e6660", w: 2.4 });
    p.rrect(104, 44, 10, 18, 3, { fill: C.coral, w: 2.4 });
    p.circle(44, 62, 6, { fill: C.mint, w: 2 });
    p.seg(26, 50, 96, 50, { w: 1.4, color: "#fff" });
    p.hatch(p.rrectPts(22, 66, 80, 16, 8), 5, -0.7, "rgba(43,38,34,0.25)");
    p.rrect(30, 84, 12, 5, 2, { fill: ink, w: 0 });
    p.rrect(84, 84, 12, 5, 2, { fill: ink, w: 0 });
  },
  trash: (p) => {
    p.shape(
      [
        [34, 30],
        [90, 30],
        [84, 86],
        [40, 86],
      ],
      { fill: "#b9c7c2", w: 3 },
    );
    p.rrect(28, 22, 68, 10, 4, { fill: "#9fb1ab", w: 2.6 });
    p.rrect(54, 14, 16, 8, 3, { fill: "#9fb1ab", w: 2.4 });
    for (const x of [48, 62, 76]) p.seg(x, 40, x - (x - 62) * 0.15, 78, { w: 1.6 });
    // fish bone doodle sticking out (it's a café, someone had sardines)
    p.seg(74, 22, 86, 6, { w: 2 });
  },
};

// ---------------------------------------------------------------------------
// Public builder
// ---------------------------------------------------------------------------
export const ITEM_KEYS = Object.keys(ITEM_DRAW);

export function buildTextures(scene: Phaser.Scene) {
  // corgi parts
  doodle(scene, "corgi_body", 124, 66, (p) => corgiBody(p));
  doodle(scene, "corgi_ear", 34, 44, (p) => corgiEar(p));
  doodle(scene, "corgi_legsA", 124, 26, (p) => corgiLegs(p, [27, 41, 75, 89]));
  doodle(scene, "corgi_legsB", 124, 26, (p) => corgiLegs(p, [22, 46, 70, 94]));
  doodle(scene, "apron", 124, 66, (p) => apron(p, "#ffffff", false));
  doodle(scene, "apron_polka", 124, 66, (p) => apron(p, "#fff2c2", true));
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

  // customers
  for (const [breed, spec] of Object.entries(DOGS)) {
    for (const m of ["n", "h", "a"] as Mood[]) doodle(scene, `${breed}_${m}`, 110, 128, (p) => seatedDog(p, spec, m));
  }
  // dachshund (lying, stretchable)
  const DB = "#9a5a2e";
  const DBelly = "#c88a52";
  doodle(scene, "dachs_back", 60, 64, (p) => {
    p.curve(
      [
        [14, 24],
        [4, 14],
        [2, 6],
      ],
      { w: 4, color: ink },
    );
    p.rrect(20, 42, 11, 14, 5, { fill: DB, w: 2.4 });
    p.rrect(36, 42, 11, 14, 5, { fill: DB, w: 2.4 });
    p.rrect(10, 18, 90, 28, 14, { fill: DB, w: 3 });
    p.ellipse(50, 42, 30, 4, { fill: DBelly, w: 0 });
  });
  doodle(scene, "dachs_mid", 32, 64, (p) => {
    const c = p.ctx;
    c.fillStyle = DB;
    c.fillRect(0, 18, 32, 28);
    p.ellipse(16, 42, 22, 4, { fill: DBelly, w: 0 });
    p.seg(-4, 18, 36, 18, { w: 3 });
    p.seg(-4, 46, 36, 46, { w: 3 });
    p.curve(
      [
        [6, 26],
        [16, 24],
        [26, 26],
      ],
      { w: 1.2, color: "#6e3f22" },
    );
  });
  for (const m of ["n", "h", "a"] as Mood[]) {
    doodle(scene, `dachs_front_${m}`, 110, 64, (p) => {
      p.rrect(28, 42, 11, 14, 5, { fill: DB, w: 2.4 });
      p.rrect(44, 42, 11, 14, 5, { fill: DB, w: 2.4 });
      p.rrect(-30, 18, 92, 28, 14, { fill: DB, w: 3 });
      p.ellipse(20, 42, 34, 4, { fill: DBelly, w: 0 });
      p.circle(70, 24, 18, { fill: DB, w: 3 });
      p.ellipse(88, 30, 15, 9, { fill: DBelly, w: 2.6 });
      p.dot(102, 28, 3.4);
      p.shape(
        [
          [60, 14],
          [52, 22],
          [52, 44],
          [60, 48],
          [66, 30],
        ],
        { fill: "#6e3f22", w: 2.6 },
      );
      if (m === "n") {
        p.dot(74, 20, 3);
        p.dot(75, 19, 1, "#fff");
      } else if (m === "h") {
        p.curve(
          [
            [70, 22],
            [74, 17],
            [78, 22],
          ],
          { w: 2.6 },
        );
        p.ellipse(92, 38, 4, 4, { fill: C.coral, w: 1.4 });
      } else {
        p.dot(74, 21, 2.6);
        p.seg(69, 14, 79, 18, { w: 2.6 });
      }
    });
  }
  // the big loaf
  for (const m of ["n", "h", "a"] as Mood[]) {
    doodle(scene, `bigloaf_${m}`, 240, 220, (p) => {
      const fluff = (cx: number, cy: number, rx: number, ry: number, n: number, fill: string, w = 3) => {
        const pts: Pt[] = [];
        for (let i = 0; i < n * 4; i++) {
          const a = (i / (n * 4)) * Math.PI * 2;
          const k = 1 + 0.06 * Math.sin(a * n) + p.r(0.015);
          pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
        }
        p.shape(pts, { fill, w });
      };
      p.shape(
        [
          [60, 70],
          [52, 10],
          [100, 50],
        ],
        { fill: C.caramel, w: 3 },
      );
      p.shape(
        [
          [180, 70],
          [188, 10],
          [140, 50],
        ],
        { fill: C.caramel, w: 3 },
      );
      fluff(120, 125, 105, 88, 14, "#fff4e0");
      fluff(120, 92, 70, 52, 10, "#f2c48a", 2.4);
      p.ellipse(120, 112, 32, 22, { fill: "#fff4e0", w: 2.6 });
      p.ellipse(120, 102, 8, 6, { fill: ink, w: 0 });
      if (m === "h") {
        for (const x of [94, 146])
          p.curve(
            [
              [x - 8, 88],
              [x, 80],
              [x + 8, 88],
            ],
            { w: 4 },
          );
        p.shape(
          [
            [106, 114],
            [134, 114],
            [126, 128],
            [114, 128],
          ],
          { fill: "#5a2a22", w: 2.6 },
        );
        p.ellipse(120, 126, 6, 4, { fill: C.coral, w: 1.6 });
      } else if (m === "a") {
        p.dot(94, 86, 5);
        p.dot(146, 86, 5);
        p.seg(82, 72, 104, 80, { w: 4 });
        p.seg(158, 72, 136, 80, { w: 4 });
        p.curve(
          [
            [108, 126],
            [120, 118],
            [132, 126],
          ],
          { w: 3 },
        );
      } else {
        p.dot(94, 86, 5.5);
        p.dot(146, 86, 5.5);
        p.dot(96, 84, 1.8, "#fff");
        p.dot(148, 84, 1.8, "#fff");
        p.curve(
          [
            [110, 114],
            [115, 119],
            [120, 115],
            [125, 119],
            [130, 114],
          ],
          { w: 2.6 },
        );
      }
      // party hat
      p.shape(
        [
          [104, 46],
          [120, 2],
          [136, 46],
        ],
        { fill: C.mint, w: 2.6 },
      );
      p.dot(120, 4, 5, C.coral);
      p.ellipse(70, 190, 18, 10, { fill: "#fff4e0", w: 2.6 });
      p.ellipse(170, 190, 18, 10, { fill: "#fff4e0", w: 2.6 });
    });
  }
  // napping staff corgi
  doodle(scene, "napcorgi", 130, 70, (p) => {
    p.ellipse(16, 42, 10, 9, { fill: cream, w: 2.5 });
    p.rrect(12, 22, 96, 40, 20, { fill: C.caramel, w: 3 });
    p.ellipse(60, 58, 40, 6, { fill: cream, w: 0 });
    p.seg(26, 61.5, 96, 61.5, { w: 3 });
    p.rrect(70, 30, 18, 30, 5, { fill: C.coral, w: 2.4 });
    p.circle(104, 44, 19, { fill: C.caramel, w: 3 });
    p.ellipse(116, 52, 12, 8, { fill: cream, w: 2.4 });
    p.dot(126, 49, 3);
    p.curve(
      [
        [100, 42],
        [105, 46],
        [110, 42],
      ],
      { w: 2.4 },
    );
    p.shape(
      [
        [92, 30],
        [78, 18],
        [96, 22],
      ],
      { fill: C.caramel, w: 2.4 },
    );
    p.ellipse(110, 64, 10, 4, { fill: cream, w: 2 });
  });

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
  doodle(scene, "toast_up", 60, 20, (p) => {
    p.rrect(4, 4, 22, 18, 6, { fill: "#f2c27a", w: 2.4 });
    p.rrect(34, 4, 22, 18, 6, { fill: "#f2c27a", w: 2.4 });
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

  // furniture
  doodle(scene, "table", 140, 88, (p) => {
    p.ellipse(70, 76, 56, 8, { fill: "rgba(43,38,34,0.15)", w: 0 });
    p.rrect(30, 50, 10, 26, 3, { fill: "#b9763a", w: 2.4 });
    p.rrect(100, 50, 10, 26, 3, { fill: "#b9763a", w: 2.4 });
    p.rrect(10, 14, 120, 44, 20, { fill: "#e7b57d", w: 3 });
    p.curve(
      [
        [26, 28],
        [60, 24],
        [96, 30],
      ],
      { w: 1.3, color: "#b9763a" },
    );
    p.curve(
      [
        [40, 42],
        [76, 40],
        [112, 44],
      ],
      { w: 1.3, color: "#b9763a" },
    );
    p.hatch(p.rrectPts(12, 42, 116, 14, 7), 5, -0.7, "rgba(43,38,34,0.2)");
    // tiny vase
    p.rrect(98, 8, 12, 16, 4, { fill: C.mint, w: 2 });
    p.seg(104, 8, 102, 0, { w: 1.6, color: C.mintDark });
    p.circle(102, 2, 3.5, { fill: C.coral, w: 1.6 });
  });

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

  // decorations
  doodle(scene, "deco_plant", 90, 130, (p) => {
    for (const [x, y, a] of [
      [45, 30, 0],
      [22, 50, -0.6],
      [68, 48, 0.6],
      [34, 22, -0.3],
      [60, 24, 0.35],
    ] as const) {
      p.seg(45, 92, x, y + 10, { w: 2.2, color: C.mintDark });
      p.ellipse(x, y, 15, 21, { fill: C.mint, w: 2.6 });
      p.seg(x, y - 16, x + Math.sin(a) * 4, y + 18, { w: 1.4, color: C.mintDark });
    }
    p.shape(
      [
        [20, 88],
        [70, 88],
        [64, 126],
        [26, 126],
      ],
      { fill: C.coral, w: 3 },
    );
    p.seg(22, 98, 68, 98, { w: 2 });
  });
  doodle(scene, "deco_bunting", 1000, 50, (p) => {
    p.curve(
      [
        [0, 6],
        [250, 16],
        [500, 20],
        [750, 16],
        [1000, 6],
      ],
      { w: 2.2 },
    );
    const cols = [C.caramel, C.coral, C.mint];
    for (let i = 0; i < 24; i++) {
      const x = 20 + i * 41;
      const y = 6 + Math.sin((x / 1000) * Math.PI) * 14;
      p.poly(
        [
          [x - 13, y],
          [x + 13, y],
          [x, y + 26],
        ],
        { fill: cols[i % 3], w: 2 },
      );
    }
  });
  doodle(
    scene,
    "deco_lights",
    1000,
    40,
    (p, f) => {
      p.curve(
        [
          [0, 6],
          [250, 14],
          [500, 18],
          [750, 14],
          [1000, 6],
        ],
        { w: 2 },
      );
      const cols = ["#f6c453", C.coral, C.mint, "#9fc3e6"];
      for (let i = 0; i < 30; i++) {
        const x = 16 + i * 33.5;
        const y = 8 + Math.sin((x / 1000) * Math.PI) * 10;
        const lit = (i + f) % 3 !== 0;
        if (lit) p.circle(x, y + 13, 9, { fill: "rgba(255,240,180,0.45)", w: 0 });
        p.ellipse(x, y + 12, 4.5, 6.5, { fill: lit ? cols[i % 4] : "#d9d2c3", w: 1.8 });
      }
    },
    3,
    3,
  );
  doodle(scene, "deco_portrait", 92, 108, (p) => {
    p.rrect(4, 4, 84, 100, 6, { fill: "#d9a063", w: 3 });
    p.rrect(14, 14, 64, 80, 4, { fill: "#a9c8e8", w: 2.4 });
    p.circle(46, 60, 20, { fill: C.caramel, w: 2.6 });
    p.ellipse(46, 68, 10, 7, { fill: cream, w: 2 });
    p.dot(46, 64, 2.4);
    p.dot(39, 56, 2.2);
    p.dot(53, 56, 2.2);
    p.shape(
      [
        [32, 46],
        [30, 32],
        [40, 42],
      ],
      { fill: C.caramel, w: 2.2 },
    );
    p.shape(
      [
        [60, 46],
        [62, 32],
        [52, 42],
      ],
      { fill: C.caramel, w: 2.2 },
    );
    p.poly(
      [
        [36, 38],
        [38, 26],
        [44, 32],
        [46, 22],
        [50, 32],
        [56, 26],
        [58, 38],
      ],
      { fill: "#f6c453", w: 2 },
    );
    p.rrect(22, 82, 48, 10, 2, { fill: C.coral, w: 1.6 });
  });

  // title art: sleeping corgi in a giant cup
  doodle(scene, "title_cup_back", 340, 260, (p) => {
    p.ellipse(150, 70, 128, 34, { fill: "#6b3d22", w: 3.5 });
    p.ellipse(150, 76, 112, 24, { fill: "#8a5530", w: 0 });
  });
  doodle(scene, "title_corgi", 240, 150, (p) => {
    p.shape(
      [
        [70, 66],
        [62, 10],
        [104, 44],
      ],
      { fill: C.caramel, w: 3.4 },
    );
    p.shape(
      [
        [76, 60],
        [69, 24],
        [96, 46],
      ],
      { fill: "#f6b9a8", w: 0 },
    );
    p.shape(
      [
        [170, 66],
        [180, 12],
        [138, 44],
      ],
      { fill: C.caramel, w: 3.4 },
    );
    p.shape(
      [
        [164, 60],
        [174, 26],
        [146, 46],
      ],
      { fill: "#f6b9a8", w: 0 },
    );
    p.ellipse(120, 92, 64, 50, { fill: C.caramel, w: 3.5 });
    p.ellipse(120, 62, 9, 22, { fill: cream, w: 0 });
    p.ellipse(120, 112, 34, 22, { fill: cream, w: 3 });
    p.ellipse(120, 100, 9, 6, { fill: ink, w: 0 });
    for (const x of [92, 148])
      p.curve(
        [
          [x - 10, 84],
          [x, 92],
          [x + 10, 84],
        ],
        { w: 3.4 },
      );
    p.ellipse(84, 104, 8, 5, { fill: "rgba(242,120,107,0.6)", w: 0 });
    p.ellipse(156, 104, 8, 5, { fill: "rgba(242,120,107,0.6)", w: 0 });
    p.curve(
      [
        [112, 116],
        [116, 120],
        [120, 117],
        [124, 120],
        [128, 116],
      ],
      { w: 2.4 },
    );
    // paws on the rim
    p.ellipse(60, 138, 20, 11, { fill: cream, w: 3 });
    p.ellipse(180, 138, 20, 11, { fill: cream, w: 3 });
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
