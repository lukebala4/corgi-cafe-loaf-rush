// Menu items (54 x 54) and bar stations (124 x 92) for the London café.
import { Pen, Pt } from "./pen";
import { COLORS as C } from "../config";

const ink = C.ink;
const cream = C.cream;

export function star(p: Pen, cx: number, cy: number, r: number, fill: string) {
  const pts: Pt[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  p.shapeSharp(pts, { fill, w: 1.6, j: 0.4 });
}

/** Tiny white winged-corgi-ish logo mark (ears + face) used on cups and signs. */
export function logoMark(p: Pen, x: number, y: number, s: number, fill = "#fffaf0") {
  p.shape(
    [
      [x - 3.2 * s, y - 0.5 * s],
      [x - 2.6 * s, y - 4 * s],
      [x - 0.8 * s, y - 1.6 * s],
    ],
    { fill, w: 0 },
  );
  p.shape(
    [
      [x + 3.2 * s, y - 0.5 * s],
      [x + 2.6 * s, y - 4 * s],
      [x + 0.8 * s, y - 1.6 * s],
    ],
    { fill, w: 0 },
  );
  p.ellipse(x, y + 0.4 * s, 3.1 * s, 2.5 * s, { fill, w: 0 });
}

function steam(p: Pen, xs: number[], y = 12) {
  for (const x of xs)
    p.curve(
      [
        [x, y],
        [x - 3, y - 5],
        [x + 1, y - 10],
      ],
      { w: 1.8, color: "#9b8f86" },
    );
}

/** White Corgi Cafe paper cup with the orange band. */
function paperCup(p: Pen, top: "empty" | "coffee" | "lid") {
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
      [16.4, 25],
      [37.6, 25],
      [36.6, 35],
      [17.5, 35],
    ],
    { fill: C.orange, w: 2 },
  );
  logoMark(p, 27, 30.5, 1.05);
  if (top === "lid") p.rrect(12, 9, 30, 7, 3, { fill: cream, w: 2.6 });
  else if (top === "coffee") {
    p.ellipse(27, 14.5, 12.4, 3.6, { fill: "#3a2418", w: 2.4 });
    p.ellipse(25, 14, 5, 1.4, { fill: "rgba(201,140,80,0.7)", w: 0 });
  } else p.ellipse(27, 14.5, 12.4, 3.6, { fill: "#e9e4dc", w: 2.4 });
}

/** Clear plastic cup with layered contents. layers: [fromY, colour] painted bottom-up. */
function clearCup(p: Pen, layers: [number, string][], ice = true, straw: string | null = C.orange) {
  if (straw) p.seg(31, 1, 26, 26, { w: 3.6, color: straw });
  const outline: Pt[] = [
    [14, 12],
    [40, 12],
    [36, 50],
    [18, 50],
  ];
  p.poly(outline, { fill: "rgba(214,236,244,0.75)", w: 0 });
  for (const [y, col] of layers) {
    const t = (y - 12) / 38;
    const xl = 14 + 4 * t + 1.2;
    const xr = 40 - 4 * t - 1.2;
    p.poly(
      [
        [xl, y],
        [xr, y],
        [35, 48.5],
        [19, 48.5],
      ],
      { fill: col, w: 0 },
    );
  }
  if (ice) {
    p.rrect(19, 17, 9, 9, 2, { fill: "rgba(255,255,255,0.8)", w: 1.5 });
    p.rrect(28, 21, 8, 8, 2, { fill: "rgba(255,255,255,0.75)", w: 1.5 });
    p.rrect(21, 28, 8, 8, 2, { fill: "rgba(255,255,255,0.6)", w: 1.3 });
  }
  p.poly(outline, { fill: null, w: 2.8 });
  p.seg(18, 16, 20, 45, { w: 1.6, color: "rgba(255,255,255,0.9)" });
}

function latteCup(p: Pen) {
  p.ellipse(27, 40, 23, 8, { fill: "#fff", w: 2.4 }); // saucer
  p.ellipse(44, 27, 6, 5, { w: 3 });
  p.ellipse(27, 28, 19, 14, { fill: "#fff", w: 3 });
  p.ellipse(27, 28, 14.5, 10, { fill: "#b07a4a", w: 1.6 });
  // foam corgi face (latte art)
  p.shape(
    [
      [20, 27],
      [21, 18.5],
      [25, 24],
    ],
    { fill: "#f6e5c8", w: 0 },
  );
  p.shape(
    [
      [34, 27],
      [33, 18.5],
      [29, 24],
    ],
    { fill: "#f6e5c8", w: 0 },
  );
  p.ellipse(27, 30, 8, 6, { fill: "#f6e5c8", w: 0 });
  p.dot(24.5, 29, 1.1, "#7a4a2a");
  p.dot(29.5, 29, 1.1, "#7a4a2a");
  p.dot(27, 32, 1.2, "#7a4a2a");
  p.ellipse(13, 40, 3, 2, { fill: C.orange, w: 0 });
}

function sandwich(p: Pen, burnt: boolean) {
  const crust = burnt ? "#2f2622" : "#c98a4a";
  const crumb = burnt ? "#463a33" : "#f2dcb0";
  p.ellipse(27, 47, 22, 4, { fill: "rgba(43,38,34,0.12)", w: 0 });
  p.rrect(7, 33, 40, 12, 6, { fill: crust, w: 2.6 });
  p.rrect(10, 35, 34, 6, 3, { fill: crumb, w: 0 });
  if (!burnt) {
    p.line(
      [
        [8, 32],
        [14, 29],
        [20, 32],
        [26, 29],
        [32, 32],
        [38, 29],
        [46, 32],
      ],
      { w: 3.4, color: "#5f8f3e" },
    ); // spinach
    p.rrect(10, 26, 34, 6, 3, { fill: "#f3e3c4", w: 1.6 }); // chicken
    p.ellipse(18, 27, 5, 2.4, { fill: "#9cc36a", w: 1.2 }); // avocado
    p.ellipse(35, 27, 5, 2.4, { fill: "#9cc36a", w: 1.2 });
    p.curve(
      [
        [12, 25],
        [20, 27],
        [28, 24],
        [36, 27],
        [42, 25],
      ],
      { w: 1.8, color: "#e04a3a" },
    ); // sweet chilli mayo
  }
  p.rrect(7, 14, 40, 13, 6, { fill: crust, w: 2.6 });
  for (const x of [16, 25, 34]) p.seg(x - 3, 16, x + 3, 25, { w: 2, color: burnt ? "#111" : "#7a4a22" });
  if (burnt) {
    p.seg(23, 18, 31, 24, { w: 2.2, color: "#fff" });
    p.seg(31, 18, 23, 24, { w: 2.2, color: "#fff" });
    steam(p, [18, 28, 36], 12);
  }
}

export const ITEM_DRAW: Record<string, (p: Pen) => void> = {
  cup: (p) => paperCup(p, "empty"),
  milk: (p) => {
    p.shape(
      [
        [17, 16],
        [37, 16],
        [40, 47],
        [14, 47],
      ],
      { fill: "#cfdbe3", w: 2.8 },
    );
    p.shape(
      [
        [17, 16],
        [9, 11],
        [20, 13],
      ],
      { fill: "#cfdbe3", w: 2.2 },
    );
    p.curve(
      [
        [38, 22],
        [47, 27],
        [40, 40],
      ],
      { w: 3 },
    );
    p.ellipse(27, 16, 10, 3.4, { fill: "#fff", w: 2 });
    p.seg(19, 24, 21, 42, { w: 1.8, color: "#fff" });
    steam(p, [22, 31], 10);
  },
  americano: (p) => {
    paperCup(p, "coffee");
    steam(p, [22, 31], 9);
  },
  latte: latteCup,
  icedlatte: (p) =>
    clearCup(p, [
      [24, "#efe2cc"],
      [34, "#c79a6a"],
      [42, "#a8703f"],
    ]),
  pally: (p) => {
    clearCup(
      p,
      [
        [22, "#d8e3b0"],
        [32, "#b8c98a"],
        [42, "#a8703f"],
      ],
      false,
      "#7d9a4a",
    );
    // pistachio + vanilla cold foam dome
    p.ellipse(27, 13, 15, 7, { fill: "#fffaf0", w: 2.4 });
    for (const [x, y] of [
      [22, 11],
      [28, 9],
      [33, 12],
      [25, 14],
    ] as Pt[])
      p.dot(x, y, 1.3, "#6f8d3c");
  },
  daytona: (p) => {
    clearCup(p, [[20, "rgba(150,96,48,0.85)"]], true, null);
    // coconut wedge on the rim
    p.shape(
      [
        [34, 14],
        [38, 6],
        [46, 7],
        [44, 14],
      ],
      { fill: "#fffaf0", w: 2.2 },
    );
    p.seg(37, 7, 45, 8, { w: 2.4, color: "#7a4a2a" });
  },
  juicebox: (p) => {
    clearCup(
      p,
      [
        [17, "#b23a5c"],
        [36, "#8f2a4a"],
      ],
      false,
      "#fffaf0",
    );
    p.shape(
      [
        [14, 13],
        [18, 5],
        [36, 5],
        [40, 13],
      ],
      { fill: "rgba(240,248,252,0.8)", w: 2.2 },
    );
    for (const [x, y] of [
      [22, 26],
      [30, 30],
      [25, 38],
      [32, 42],
    ] as Pt[])
      p.dot(x, y, 1.1, "#f3c6d2");
    p.circle(22, 7, 3.4, { fill: "#c0304f", w: 1.4 });
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
  cake: (p) => {
    p.ellipse(27, 45, 22, 6, { fill: "#fff", w: 2.4 });
    p.shape(
      [
        [9, 41],
        [10, 23],
        [44, 18],
        [45, 37],
      ],
      { fill: "#f2c46a", w: 2.8 },
    );
    for (const [x, y] of [
      [16, 31],
      [24, 34],
      [33, 28],
      [38, 34],
      [20, 26],
    ] as Pt[])
      p.dot(x, y, 1.2, "#d99a3a");
    // orange glaze + drips
    p.shape(
      [
        [9, 25],
        [10, 20],
        [44, 15],
        [45, 21],
        [40, 22],
        [39, 27],
        [35, 22],
        [24, 24],
        [22, 29],
        [19, 25],
      ],
      { fill: C.orange, w: 2.2 },
    );
    // candied orange slice
    p.circle(28, 13, 6, { fill: "#f7a33c", w: 2 });
    for (let a = 0; a < 6; a++) p.seg(28, 13, 28 + Math.cos(a) * 4.5, 13 + Math.sin(a) * 4.5, { w: 1, color: "#fff3d6" });
  },
  sourdough: (p) => sandwich(p, false),
  burnt: (p) => sandwich(p, true),
};

// ---------------------------------------------------------------------------
// Stations (origin bottom-centre sits on the back bar)
// ---------------------------------------------------------------------------
export const SW = 124;
export const SH = 92;

export const STATION_DRAW: Record<string, (p: Pen) => void> = {
  press: (p) => {
    p.ellipse(62, 87, 44, 4, { fill: "rgba(43,38,34,0.12)", w: 0 });
    p.rrect(22, 56, 80, 28, 6, { fill: "#c9cdd2", w: 3 });
    p.rrect(26, 46, 72, 12, 4, { fill: "#2f2a29", w: 2.4 }); // ridged plates
    for (let x = 32; x < 96; x += 8) p.seg(x, 48, x, 56, { w: 1.4, color: "#6e6660" });
    p.shape(
      [
        [22, 48],
        [26, 30],
        [98, 30],
        [102, 48],
      ],
      { fill: "#dfe3e7", w: 3 },
    );
    p.rrect(30, 20, 64, 9, 4, { fill: ink, w: 2 }); // handle
    p.circle(92, 70, 4.5, { fill: C.orange, w: 1.8 });
    p.seg(30, 66, 76, 66, { w: 1.4, color: "#fff" });
  },
  croissant: (p) => {
    p.ellipse(62, 87, 34, 4, { fill: "rgba(43,38,34,0.12)", w: 0 });
    p.shape(
      [
        [30, 60],
        [94, 60],
        [88, 86],
        [36, 86],
      ],
      { fill: "#d9a063", w: 3 },
    );
    for (let x = 40; x < 90; x += 8) p.seg(x, 62, x - 3, 84, { w: 1.3, color: "#9a5a24" });
    p.seg(33, 72, 91, 72, { w: 1.3, color: "#9a5a24" });
    const mini = (x: number, y: number) => {
      for (const [dx, dy, rx, ry] of [
        [-10, 4, 5, 6],
        [-5, -1, 6, 7],
        [3, -2, 6, 8],
        [10, 3, 5, 6],
      ])
        p.ellipse(x + dx, y + dy, rx, ry, { fill: "#e7a456", w: 2 });
    };
    mini(47, 54);
    mini(77, 54);
    mini(62, 42);
  },
  cake: (p) => {
    p.ellipse(62, 87, 30, 4, { fill: "rgba(43,38,34,0.12)", w: 0 });
    p.rrect(56, 72, 12, 14, 3, { fill: "#fff", w: 2.4 });
    p.ellipse(62, 70, 32, 6, { fill: "#fff", w: 2.6 });
    // orange loaf cake on the stand
    p.rrect(38, 46, 48, 22, 6, { fill: "#f2c46a", w: 2.6 });
    p.shape(
      [
        [38, 50],
        [40, 44],
        [84, 44],
        [86, 50],
        [80, 52],
        [76, 57],
        [72, 51],
        [56, 52],
        [52, 58],
        [48, 51],
      ],
      { fill: C.orange, w: 2.2 },
    );
    for (const x of [50, 62, 74]) p.circle(x, 42, 4, { fill: "#f7a33c", w: 1.6 });
    // glass dome
    p.shape(
      [
        [28, 70],
        [30, 40],
        [44, 22],
        [62, 17],
        [80, 22],
        [94, 40],
        [96, 70],
      ],
      { fill: "rgba(214,236,246,0.35)", w: 2.6 },
    );
    p.circle(62, 13, 4, { fill: C.orange, w: 2 });
    p.curve(
      [
        [36, 62],
        [35, 42],
        [46, 30],
      ],
      { w: 2.4, color: "rgba(255,255,255,0.9)" },
    );
  },
  blender: (p) => {
    p.ellipse(62, 87, 30, 4, { fill: "rgba(43,38,34,0.12)", w: 0 });
    p.rrect(42, 64, 40, 22, 6, { fill: "#3a3532", w: 3 });
    p.circle(62, 75, 4.5, { fill: C.orange, w: 1.8 });
    const jug: Pt[] = [
      [44, 16],
      [80, 16],
      [76, 64],
      [48, 64],
    ];
    p.poly(jug, { fill: "rgba(214,236,244,0.75)", w: 0 });
    p.poly(
      [
        [46.5, 38],
        [77.5, 38],
        [76, 62],
        [48, 62],
      ],
      { fill: "#a3304f", w: 0 },
    );
    for (const [x, y] of [
      [54, 46],
      [64, 50],
      [70, 44],
      [58, 56],
    ] as Pt[])
      p.circle(x, y, 3.2, { fill: "#c0304f", w: 1.2 });
    p.poly(jug, { fill: null, w: 3 });
    p.rrect(42, 10, 40, 8, 3, { fill: ink, w: 2 });
    p.curve(
      [
        [80, 22],
        [92, 26],
        [90, 50],
        [78, 54],
      ],
      { w: 3 },
    );
    p.seg(50, 22, 52, 58, { w: 1.8, color: "#fff" });
  },
  cups: (p) => {
    const stack = (x: number, y: number, rot: number, orange: boolean) => {
      for (let k = 0; k < 3; k++) {
        const top = 18 + y + k * 14;
        p.poly(
          [
            [x - 14 + rot * 40, top],
            [x + 14 + rot * 40, top],
            [x + 11, top + 26],
            [x - 11, top + 26],
          ],
          { fill: orange ? C.orange : "#fff", w: 2.6 },
        );
        p.seg(x - 12, top + 10, x + 12, top + 10, { w: 2.4, color: orange ? "#fffaf0" : C.orange });
      }
    };
    stack(40, 0, -0.06, false);
    stack(62, 4, 0.02, true);
    stack(84, 0, 0.07, false);
    p.ellipse(62, 86, 52, 5, { fill: "rgba(43,38,34,0.12)", w: 0 });
  },
  milk: (p) => {
    p.shape(
      [
        [24, 34],
        [52, 34],
        [56, 84],
        [20, 84],
      ],
      { fill: "#cfdbe3", w: 3 },
    );
    p.shape(
      [
        [24, 34],
        [15, 28],
        [28, 30],
      ],
      { fill: "#cfdbe3", w: 2.4 },
    );
    p.curve(
      [
        [54, 44],
        [64, 50],
        [56, 70],
      ],
      { w: 3 },
    );
    p.seg(28, 46, 31, 76, { w: 2, color: "#fff" });
    // milk carton (oat) with a sage label
    p.poly(
      [
        [72, 30],
        [102, 30],
        [102, 84],
        [72, 84],
      ],
      { fill: "#fffaf0", w: 2.8 },
    );
    p.poly(
      [
        [72, 30],
        [87, 18],
        [102, 30],
      ],
      { fill: "#efe8da", w: 2.4 },
    );
    p.rrect(76, 46, 22, 20, 4, { fill: C.sage, w: 1.8 });
    p.seg(80, 56, 94, 56, { w: 1.6, color: "#fffaf0" });
  },
  espresso: (p) => {
    // red and silver machine
    p.rrect(10, 16, 78, 64, 10, { fill: "#d8483a", w: 3 });
    p.rrect(6, 9, 86, 10, 4, { fill: "#d8d0c4", w: 2.6 });
    p.circle(28, 34, 9, { fill: "#fff", w: 2.4 });
    p.seg(28, 34, 33, 29, { w: 2 });
    p.rrect(40, 42, 18, 10, 3, { fill: "#6e6660", w: 2.2 });
    p.rrect(62, 42, 18, 10, 3, { fill: "#6e6660", w: 2.2 });
    p.seg(49, 52, 49, 58, { w: 3 });
    p.seg(71, 52, 71, 58, { w: 3 });
    p.rrect(24, 78, 62, 8, 3, { fill: "#6e6660", w: 2.4 });
    p.hatch(p.rrectPts(12, 60, 74, 18, 6), 5, -0.7, "rgba(43,38,34,0.25)");
    // black grinder with a bean hopper
    p.shape(
      [
        [96, 6],
        [118, 6],
        [114, 28],
        [100, 28],
      ],
      { fill: "rgba(214,236,244,0.6)", w: 2.4 },
    );
    for (const [x, y] of [
      [103, 20],
      [109, 22],
      [106, 15],
      [112, 17],
    ] as Pt[])
      p.ellipse(x, y, 2.4, 1.6, { fill: "#6b3d22", w: 0 });
    p.rrect(96, 28, 22, 58, 5, { fill: "#2f2a29", w: 2.6 });
    p.circle(107, 44, 4, { fill: "#6e6660", w: 1.4 });
  },
  cold: (p) => {
    // ice well
    p.rrect(14, 58, 96, 28, 5, { fill: "#c9cdd2", w: 3 });
    for (const [x, y] of [
      [28, 52],
      [42, 50],
      [56, 53],
      [70, 50],
      [84, 52],
      [98, 51],
    ] as Pt[])
      p.rrect(x - 6, y, 12, 11, 2.5, { fill: "#f4fbff", w: 1.8 });
    // pistachio + vanilla syrup bottles
    p.rrect(18, 18, 12, 34, 4, { fill: "#b8c98a", w: 2.4 });
    p.rrect(21, 10, 6, 9, 2, { fill: ink, w: 0 });
    p.rrect(34, 22, 12, 30, 4, { fill: "#f3e7c4", w: 2.4 });
    p.rrect(37, 14, 6, 9, 2, { fill: ink, w: 0 });
    // cold brew jug + coconut water carton
    p.shape(
      [
        [62, 18],
        [84, 18],
        [86, 52],
        [60, 52],
      ],
      { fill: "rgba(150,96,48,0.85)", w: 2.6 },
    );
    p.rrect(60, 12, 26, 7, 3, { fill: ink, w: 0 });
    p.poly(
      [
        [92, 26],
        [108, 26],
        [108, 52],
        [92, 52],
      ],
      { fill: "#fffaf0", w: 2.4 },
    );
    p.circle(100, 38, 4.5, { fill: "#7a4a2a", w: 1.4 });
    star(p, 112, 12, 5, "#fff");
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
  },
};
