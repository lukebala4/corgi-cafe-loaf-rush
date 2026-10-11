// Pembroke Welsh Corgi, drawn in the notebook pen style.
// Side view facing right. Anatomy checklist (from photo references):
//   long body (~1.6x withers height), level topline, deep chest with a white bib,
//   very short sturdy legs with white socks, fluffy rump with white "pants",
//   fox-like wedge head with a defined stop, tapered white muzzle, white blaze,
//   large erect triangular ears set high, black nose.
import { Pen, Pt } from "./pen";
import { COLORS as C } from "../config";

export type Coat = "red" | "tri";
export type CorgiMood = "n" | "h" | "s"; // neutral, happy (tongue out), sleepy

// Canvas sizes used by the rig (origin = bottom centre of each canvas)
export const CB = { w: 140, h: 72 }; // body + head
export const CL = { w: 140, h: 26 }; // legs strip
export const CE = { w: 36, h: 46 }; // one ear
// Key points in body-canvas space
export const HEAD = { x: 106, y: 20 };
export const EAR_NEAR = { x: 104, y: 9 };
export const EAR_FAR = { x: 97, y: 10 };
export const THROAT = { x: 102, y: 38 };

interface Pal {
  coat: string;
  shade: string;
  white: string;
  saddle?: string;
  ear: string;
  inner: string;
}
export const PAL: Record<Coat, Pal> = {
  red: { coat: "#df8d45", shade: "rgba(165,92,36,0.42)", white: C.cream, ear: "#df8d45", inner: "#f4b8a4" },
  tri: { coat: "#d9954f", shade: "rgba(120,72,30,0.42)", white: C.cream, saddle: C.tri, ear: "#3a3330", inner: "#e9b29d" },
};

const INK = C.ink;

function torsoPts(): Pt[] {
  return [
    [12, 40],
    [13, 29],
    [22, 21],
    [46, 20],
    [72, 19],
    [84, 15],
    [94, 10],
    [102, 22],
    [104, 36],
    [104, 45],
    [98, 56],
    [86, 62],
    [66, 62],
    [48, 60],
    [32, 62],
    [18, 57],
    [11, 48],
  ];
}

function headPts(): Pt[] {
  return [
    [92, 15],
    [96, 7],
    [106, 4],
    [113, 8],
    [117, 14],
    [126, 20],
    [132, 24],
    [134.5, 28],
    [130, 32.5],
    [120, 35],
    [109, 35.5],
    [99, 31],
    [93, 24],
  ];
}

/** Body + head (no ears, no legs). */
export function corgiBody(p: Pen, coat: Coat = "red", mood: CorgiMood = "n") {
  const P = PAL[coat];
  const torso = torsoPts();
  // rump fluff (docked Pembroke: a fluffy tuft, not a long tail)
  p.ellipse(13, 30, 7, 6, { fill: P.white, w: 2.2 });
  p.shape(torso, { fill: P.coat, w: 0 });
  if (P.saddle) {
    p.shape(
      [
        [16, 30],
        [24, 22],
        [48, 20.5],
        [74, 19.5],
        [86, 16],
        [88, 24],
        [74, 30],
        [50, 33],
        [28, 37],
        [17, 40],
      ],
      { fill: P.saddle, w: 0 },
    );
  }
  // white bib + underbelly
  p.shape(
    [
      [102, 26],
      [104, 38],
      [103, 46],
      [97, 57],
      [86, 62.5],
      [66, 62.5],
      [50, 60.5],
      [56, 56],
      [72, 56],
      [86, 52],
      [93, 43],
      [95, 32],
    ],
    { fill: P.white, w: 0 },
  );
  // white "pants" on the back of the thigh
  p.shape(
    [
      [12, 42],
      [17, 47],
      [24, 55],
      [30, 61.5],
      [18, 57],
      [11, 49],
    ],
    { fill: P.white, w: 0 },
  );
  // soft hatch on the haunch and under the ribcage
  p.hatch(p.ellipsePts(32, 44, 13, 11), 5, -0.7, P.shade, 1.2);
  p.hatch(p.ellipsePts(70, 50, 14, 5), 5, -0.7, P.shade, 1.1);
  // outline
  p.shape(torso, { fill: null, w: 3 });
  // fur tufts: bib edge, haunch, rump
  p.curve(
    [
      [95, 33],
      [92, 38],
      [94, 42],
      [91, 46],
    ],
    { w: 1.6, color: "rgba(43,38,34,0.55)" },
  );
  p.curve(
    [
      [36, 40],
      [42, 45],
      [42, 53],
    ],
    { w: 1.8 },
  );
  for (const [x, y] of [
    [16, 52],
    [20, 56],
  ] as Pt[])
    p.seg(x, y, x + 3, y + 3, { w: 1.4 });
  // head
  const head = headPts();
  p.shape(head, { fill: coat === "tri" ? PAL.tri.coat : P.coat, w: 0 });
  if (coat === "tri") {
    // black cap on the skull for tricolours
    p.shape(
      [
        [94, 12],
        [98, 6],
        [106, 4.5],
        [109, 8],
        [104, 12],
        [98, 16],
      ],
      { fill: C.tri, w: 0 },
    );
  }
  // white muzzle + blaze up the forehead
  p.shape(
    [
      [115, 16],
      [126, 21.5],
      [132.5, 25.5],
      [133, 30],
      [129, 33],
      [119, 34.5],
      [112, 32],
      [113, 24],
    ],
    { fill: P.white, w: 0 },
  );
  p.shape(
    [
      [108, 6],
      [113, 9],
      [117, 15],
      [113, 17],
      [109, 12],
    ],
    { fill: P.white, w: 0 },
  );
  p.shape(head, { fill: null, w: 3 });
  // stop + cheek line
  p.curve(
    [
      [112, 21],
      [111, 27],
      [115, 33],
    ],
    { w: 1.6, color: "rgba(43,38,34,0.5)" },
  );
  // nose
  p.ellipse(132.4, 27.2, 3.4, 2.9, { fill: INK, w: 0 });
  p.dot(131.6, 26.2, 0.8, "#fff");
  // eye
  if (mood === "s") {
    p.curve(
      [
        [107, 17],
        [110.5, 19],
        [114, 17],
      ],
      { w: 2.2 },
    );
  } else if (mood === "h") {
    p.curve(
      [
        [107, 18.5],
        [110.5, 14.5],
        [114, 18.5],
      ],
      { w: 2.6 },
    );
  } else {
    p.ellipse(110.6, 16.5, 2.7, 2.9, { fill: INK, w: 0 });
    p.dot(111.5, 15.4, 0.95, "#fff");
    p.curve(
      [
        [106.5, 13],
        [110, 11.5],
        [114, 12.5],
      ],
      { w: 1.4, color: "rgba(43,38,34,0.6)" },
    );
  }
  if (coat === "tri" && mood !== "s") p.dot(108, 11.2, 1.6, "#e2a466"); // tan pip above the eye
  // blush
  p.ellipse(111, 26.5, 4.4, 2.6, { fill: "rgba(242,120,107,0.5)", w: 0 });
  // mouth
  if (mood === "h") {
    p.shape(
      [
        [130.5, 31],
        [123, 33.5],
        [119, 32.5],
        [121, 37.5],
        [127, 37.5],
      ],
      { fill: "#5a2a22", w: 1.8 },
    );
    p.ellipse(124.5, 38.5, 3.6, 4.2, { fill: C.coral, w: 1.6 });
  } else {
    p.curve(
      [
        [131, 31],
        [125, 33.6],
        [120.5, 32.2],
      ],
      { w: 2 },
    );
  }
}

/** One large erect ear (base at the bottom centre of the canvas). */
export function corgiEar(p: Pen, coat: Coat = "red") {
  const P = PAL[coat];
  p.shape(
    [
      [6, 44],
      [9, 30],
      [14, 13],
      [18.5, 3],
      [23, 11],
      [28, 26],
      [31, 44],
    ],
    { fill: P.ear, w: 3 },
  );
  if (coat === "tri")
    p.shape(
      [
        [9, 42],
        [12, 30],
        [17, 14],
        [12, 34],
      ],
      { fill: PAL.tri.coat, w: 0 },
    );
  p.shape(
    [
      [12, 42],
      [17, 15],
      [25, 42],
    ],
    { fill: P.inner, w: 1.4 },
  );
  // inner fur tufts
  p.seg(14, 40, 17, 33, { w: 1.2, color: "#fffaf0" });
  p.seg(22, 40, 19, 32, { w: 1.2, color: "#fffaf0" });
}

/** Legs strip. phase: -1 / 0 / 1 swaps which diagonal pair is forward. */
export function corgiLegs(p: Pen, coat: Coat = "red", phase = 0) {
  const P = PAL[coat];
  const d = phase * 3.5;
  const far = { coat: coat === "tri" ? "#c98a4a" : "#c97a3a", white: "#ece2cf" };
  const leg = (x: number, off: number, hind: boolean, col: { coat: string; white: string }) => {
    const top = 0;
    const bx = x + off;
    const pts: Pt[] = hind
      ? [
          [x - 7, top],
          [x + 5, top],
          [x + 4 + off * 0.5, 9],
          [bx + 3.5, 18],
          [bx - 4, 18],
          [x - 5 + off * 0.5, 9],
        ]
      : [
          [x - 5.5, top],
          [x + 5.5, top],
          [bx + 5, 18],
          [bx - 5, 18],
        ];
    p.shape(pts, { fill: col.white, w: 0 });
    // coat colour on the upper leg, white sock below
    p.shape(
      hind
        ? [
            [x - 7, top],
            [x + 5, top],
            [x + 4 + off * 0.5, 8],
            [x - 5 + off * 0.5, 8],
          ]
        : [
            [x - 5.5, top],
            [x + 5.5, top],
            [x + 5.3 + off * 0.4, 7],
            [x - 5.3 + off * 0.4, 7],
          ],
      { fill: col.coat, w: 0 },
    );
    p.shape(pts, { fill: null, w: 2.5 });
    p.ellipse(bx + 1.5, 19.5, 6.6, 4, { fill: col.white, w: 2.4 });
    p.seg(bx + 2.5, 18.5, bx + 3, 22, { w: 1.1 });
    p.seg(bx + 5, 18.8, bx + 5.4, 21.6, { w: 1.1 });
  };
  // far side first (drawn darker), then near side
  leg(26, d, true, far);
  leg(84, -d, false, far);
  leg(35, -d, true, P);
  leg(93, d, false, P);
}

/** Barista apron overlay in body-canvas space. */
export function corgiApron(p: Pen, fill: string, polka: boolean) {
  p.shape(
    [
      [83, 27],
      [102, 30],
      [106, 44],
      [101, 58],
      [87, 61],
      [79, 59],
      [77, 40],
    ],
    { fill, w: 2.6 },
  );
  if (polka)
    for (const [x, y] of [
      [85, 35],
      [96, 38],
      [84, 49],
      [95, 51],
    ] as Pt[])
      p.dot(x, y, 2.3, C.coral);
  p.rrect(84, 44, 13, 8, 3, { w: 1.5 }); // pocket
  // neck strap + waist tie with a little bow
  p.curve(
    [
      [85, 28],
      [93, 15],
      [103, 20],
      [102, 30],
    ],
    { w: 2 },
  );
  p.curve(
    [
      [78, 42],
      [67, 40],
      [60, 43],
    ],
    { w: 2 },
  );
  p.ellipse(61, 40, 4, 3, { w: 1.6 });
  p.ellipse(61, 46, 3.4, 2.6, { w: 1.4 });
}

/** Staff bandana (Corgi Cafe orange) tied at the throat. */
export function corgiBandana(p: Pen, fill: string = C.orange) {
  p.shape(
    [
      [88, 22],
      [100, 27],
      [104, 34],
      [99, 47],
      [93, 37],
      [86, 31],
    ],
    { fill, w: 2.4 },
  );
  p.dot(95, 34, 1.4, "#fff");
  p.dot(99, 39, 1.2, "#fff");
}

/** A corgi lying down asleep (sploot-ish), facing right. Canvas 140 x 70. */
export function napCorgi(p: Pen, coat: Coat = "tri") {
  const P = PAL[coat];
  const body: Pt[] = [
    [10, 50],
    [14, 38],
    [28, 30],
    [56, 29],
    [80, 30],
    [94, 36],
    [100, 50],
    [96, 62],
    [60, 64],
    [24, 63],
    [12, 59],
  ];
  p.ellipse(70, 66, 58, 5, { fill: "rgba(43,38,34,0.12)", w: 0 });
  p.ellipse(12, 42, 6, 5, { fill: P.white, w: 2 });
  p.shape(body, { fill: P.coat, w: 0 });
  if (P.saddle)
    p.shape(
      [
        [16, 40],
        [28, 31],
        [56, 30],
        [80, 31],
        [86, 38],
        [60, 41],
        [30, 44],
      ],
      { fill: P.saddle, w: 0 },
    );
  p.shape(
    [
      [96, 46],
      [98, 58],
      [80, 63.5],
      [58, 63],
      [64, 58],
      [84, 56],
    ],
    { fill: P.white, w: 0 },
  );
  p.hatch(p.ellipsePts(40, 50, 18, 9), 5, -0.7, P.shade, 1.2);
  p.shape(body, { fill: null, w: 3 });
  // tucked hind leg + front paws stretched forward
  p.curve(
    [
      [30, 48],
      [40, 56],
      [36, 62],
    ],
    { w: 2 },
  );
  p.ellipse(105, 62, 9, 4, { fill: P.white, w: 2.4 });
  p.ellipse(116, 63, 8, 3.6, { fill: P.white, w: 2.2 });
  // head resting on the paws
  const head: Pt[] = [
    [88, 40],
    [94, 31],
    [104, 29],
    [112, 33],
    [124, 41],
    [131, 47],
    [131, 53],
    [120, 57],
    [104, 58],
    [92, 54],
  ];
  p.shape(head, { fill: coat === "tri" ? PAL.tri.coat : P.coat, w: 0 });
  p.shape(
    [
      [112, 40],
      [124, 44],
      [130, 49],
      [129, 53],
      [118, 56],
      [108, 54],
      [109, 46],
    ],
    { fill: P.white, w: 0 },
  );
  p.shape(head, { fill: null, w: 3 });
  p.ellipse(130, 49, 3, 2.6, { fill: INK, w: 0 });
  p.curve(
    [
      [104, 41],
      [108, 43.5],
      [112, 41.5],
    ],
    { w: 2.2 },
  );
  p.ellipse(106, 49, 4, 2.4, { fill: "rgba(242,120,107,0.5)", w: 0 });
  // relaxed ears folded back
  const ear: Pt[] = [
    [94, 33],
    [80, 22],
    [76, 19],
    [84, 30],
    [92, 38],
  ];
  p.shape(ear, { fill: P.ear, w: 2.6 });
  p.shape(
    [
      [98, 30],
      [88, 17],
      [86, 14],
      [92, 26],
      [99, 34],
    ],
    { fill: P.ear, w: 2.6 },
  );
}
