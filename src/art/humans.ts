// Human customers, drawn front-on in the same ballpoint style.
// Canvas 100 x 150, origin = bottom centre. Seated and walking share the same upper body
// so a person can walk in, sit on a chair and keep their silhouette.
import { Pen, Pt } from "./pen";
import { COLORS as C, Role } from "../config";

export const HW = 100;
export const HH = 150;

export type HPose = "sit" | "walkA" | "walkB";
export type HMood = "n" | "h" | "a";

type HairStyle = "short" | "buzz" | "bald" | "bun" | "long" | "wavy" | "curly" | "bob" | "ponytail" | "hijab" | "curtains" | "spacebuns" | "braids";
type TopStyle = "hoodie" | "jumper" | "shirt" | "coat" | "stripes" | "turtleneck" | "denim" | "cardigan" | "tee" | "puffer" | "varsity";
type Extra = "glasses" | "beard" | "moustache" | "cap" | "beanie" | "headphones" | "earrings" | "lanyard" | "scarf" | "airpods" | "freckles";
type Prop = "laptop" | "phone" | "tote" | "notebook" | "none";

export interface Look {
  id: string;
  skin: string;
  hair: HairStyle;
  hairColor: string;
  top: TopStyle;
  topColor: string;
  inner?: string;
  bottom: string;
  shoes?: string;
  extras: Extra[];
  prop: Prop;
  flat?: boolean; // neutral mouth is a flat line (sceptics)
}

const SK = ["#f6dcc6", "#eec3a0", "#d9a074", "#b47a52", "#8a5a3c", "#5e3d2b"];

const TRAINER = "#fbf7ee"; // chunky white trainers
const DENIM = "#8fb0d6";
export const LOOKS: Look[] = [
  // relaxed regulars
  { id: "reg1", skin: SK[1], hair: "curtains", hairColor: "#5a3a26", top: "hoodie", topColor: C.sage, bottom: DENIM, shoes: TRAINER, extras: ["airpods"], prop: "none" },
  { id: "reg2", skin: SK[4], hair: "curly", hairColor: "#2b2622", top: "tee", topColor: "#e8b74a", bottom: "#3f4a5c", shoes: TRAINER, extras: ["earrings"], prop: "tote" },
  // first-time visitors
  { id: "new1", skin: SK[0], hair: "spacebuns", hairColor: "#e7c46d", top: "stripes", topColor: "#fffaf0", inner: "#3b5a8a", bottom: DENIM, shoes: TRAINER, extras: ["freckles"], prop: "tote" },
  { id: "new2", skin: SK[5], hair: "buzz", hairColor: "#2b2622", top: "puffer", topColor: "#2f3440", bottom: "#6b6a55", shoes: TRAINER, extras: ["beanie"], prop: "none" },
  // tech builders
  { id: "bld1", skin: SK[2], hair: "short", hairColor: "#3a2a20", top: "hoodie", topColor: "#3b4a66", bottom: "#2f3440", shoes: TRAINER, extras: ["glasses", "lanyard"], prop: "laptop" },
  { id: "bld2", skin: SK[3], hair: "hijab", hairColor: "#4f8a7f", top: "jumper", topColor: "#f3e7d4", bottom: "#3f4a5c", shoes: TRAINER, extras: [], prop: "laptop" },
  // coffee enthusiasts
  { id: "ent1", skin: SK[1], hair: "short", hairColor: "#6e4630", top: "tee", topColor: "#fffaf0", bottom: "#4a3d36", shoes: TRAINER, extras: ["cap"], prop: "notebook" },
  { id: "ent2", skin: SK[2], hair: "bob", hairColor: "#2b2622", top: "turtleneck", topColor: "#2f2a29", bottom: "#5b4a3f", extras: ["earrings", "glasses"], prop: "notebook" },
  // busy commuters (a little grumpy until the coffee lands)
  { id: "scp1", skin: SK[0], hair: "curtains", hairColor: "#7a5a40", top: "coat", topColor: "#4a4f57", inner: "#fffaf0", bottom: "#2f3440", shoes: TRAINER, extras: ["airpods"], prop: "none", flat: true },
  { id: "scp2", skin: SK[3], hair: "bob", hairColor: "#5a3a2a", top: "puffer", topColor: "#c9a77a", bottom: "#2f2a29", extras: ["headphones"], prop: "none", flat: true },
  // content creators
  { id: "cre1", skin: SK[2], hair: "wavy", hairColor: "#4a2e22", top: "jumper", topColor: "#f2a3b0", bottom: "#fffaf0", shoes: TRAINER, extras: ["earrings"], prop: "phone" },
  { id: "cre2", skin: SK[1], hair: "short", hairColor: "#f1e3a6", top: "hoodie", topColor: C.orange, bottom: "#3a3532", shoes: TRAINER, extras: ["airpods"], prop: "phone" },
  // extra faces for visiting groups (hackathon crowd)
  { id: "grp1", skin: SK[4], hair: "braids", hairColor: "#2b2622", top: "varsity", topColor: "#3b5a8a", inner: "#fffaf0", bottom: "#3f4a5c", shoes: TRAINER, extras: ["lanyard"], prop: "none" },
  { id: "grp2", skin: SK[0], hair: "long", hairColor: "#a0522d", top: "tee", topColor: "#a9c8e8", bottom: DENIM, shoes: TRAINER, extras: ["lanyard", "freckles"], prop: "none" },
  { id: "grp3", skin: SK[5], hair: "curly", hairColor: "#2b2622", top: "hoodie", topColor: "#c0854f", bottom: "#2f3440", shoes: TRAINER, extras: ["lanyard"], prop: "none" },
  // the crowd: people hanging out, vibe coding and visiting the corgis (they do not order)
  { id: "amb1", skin: SK[1], hair: "short", hairColor: "#2b2622", top: "hoodie", topColor: "#2f3440", bottom: "#2f3440", shoes: TRAINER, extras: ["headphones"], prop: "laptop" },
  { id: "amb2", skin: SK[3], hair: "braids", hairColor: "#2b2622", top: "tee", topColor: C.orangeSoft, bottom: DENIM, shoes: TRAINER, extras: ["earrings"], prop: "laptop" },
  { id: "amb3", skin: SK[0], hair: "bob", hairColor: "#c9673a", top: "varsity", topColor: C.sageDark, inner: "#fffaf0", bottom: "#2f3440", shoes: TRAINER, extras: ["freckles"], prop: "phone" },
  { id: "amb4", skin: SK[5], hair: "spacebuns", hairColor: "#2b2622", top: "puffer", topColor: "#f2c46a", bottom: "#3f4a5c", shoes: TRAINER, extras: [], prop: "laptop" },
  { id: "amb5", skin: SK[2], hair: "curtains", hairColor: "#3a2a20", top: "stripes", topColor: "#fffaf0", inner: C.orange, bottom: "#6b6a55", shoes: TRAINER, extras: ["airpods"], prop: "laptop" },
  { id: "amb6", skin: SK[4], hair: "buzz", hairColor: "#2b2622", top: "tee", topColor: "#3b5a8a", bottom: "#fffaf0", shoes: TRAINER, extras: ["cap"], prop: "phone" },
  { id: "amb7", skin: SK[1], hair: "ponytail", hairColor: "#5a3a26", top: "hoodie", topColor: "#f2a3b0", bottom: DENIM, shoes: TRAINER, extras: ["glasses"], prop: "laptop" },
  { id: "amb8", skin: SK[3], hair: "hijab", hairColor: "#2f3440", top: "jumper", topColor: C.sage, bottom: "#3f4a5c", shoes: TRAINER, extras: [], prop: "notebook" },
  { id: "amb9", skin: SK[0], hair: "wavy", hairColor: "#e7c46d", top: "tee", topColor: "#2f2a29", bottom: DENIM, shoes: TRAINER, extras: ["earrings"], prop: "tote" },
  { id: "amb10", skin: SK[2], hair: "curly", hairColor: "#3a2a20", top: "varsity", topColor: C.orange, inner: "#fffaf0", bottom: "#2f3440", shoes: TRAINER, extras: ["airpods"], prop: "laptop" },
  { id: "amb11", skin: SK[5], hair: "bun", hairColor: "#2b2622", top: "turtleneck", topColor: "#fffaf0", bottom: "#6b6a55", shoes: TRAINER, extras: ["glasses"], prop: "laptop" },
  { id: "amb12", skin: SK[1], hair: "curtains", hairColor: "#c9673a", top: "puffer", topColor: C.sageDark, bottom: "#2f3440", shoes: TRAINER, extras: ["beanie"], prop: "phone" },
];
/** Looks used by the non-paying crowd. */
export const CROWD_LOOKS = LOOKS.filter((l) => l.id.startsWith("amb")).map((l) => l.id);

export const ROLE_LOOKS: Record<Role, string[]> = {
  regular: ["reg1", "reg2"],
  newcomer: ["new1", "new2"],
  builder: ["bld1", "bld2"],
  enthusiast: ["ent1", "ent2"],
  sceptic: ["scp1", "scp2"],
  creator: ["cre1", "cre2"],
  group: ["grp1", "grp2", "grp3"],
};

const INK = C.ink;

function legs(p: Pen, L: Look, pose: HPose) {
  const shoe = L.shoes ?? "#2f2a29";
  if (pose === "sit") {
    // shins + shoes, then the lap (thighs foreshortened towards us)
    for (const x of [38, 62]) {
      p.rrect(x - 6.5, 118, 13, 25, 5, { fill: L.bottom, w: 2.6 });
      p.ellipse(x, 145, 9, 4.2, { fill: shoe, w: 2.2 });
    }
    p.rrect(29, 104, 42, 19, 9, { fill: L.bottom, w: 2.8 });
    p.seg(50, 108, 50, 121, { w: 1.6, color: "rgba(43,38,34,0.5)" });
  } else {
    const s = pose === "walkA" ? 1 : -1;
    const leg = (x: number, d: number, short: number) => {
      p.shape(
        [
          [x - 7, 102],
          [x + 7, 102],
          [x + 6 + d, 141 - short],
          [x - 6 + d, 141 - short],
        ],
        { fill: L.bottom, w: 2.6 },
      );
      p.ellipse(x + d, 143 - short, 9, 4.2, { fill: shoe, w: 2.2 });
    };
    leg(42, -3 * s, s > 0 ? 3 : 0);
    leg(58, 3 * s, s < 0 ? 3 : 0);
  }
}

function label1(p: Pen, ch: string, x: number, y: number, color: string) {
  const c = p.ctx;
  c.save();
  c.font = 'bold 13px "Caveat Brush", cursive';
  c.fillStyle = color;
  c.strokeStyle = "#2b2622";
  c.lineWidth = 2;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.strokeText(ch, x, y);
  c.fillText(ch, x, y);
  c.restore();
}

function torso(p: Pen, L: Look) {
  const body: Pt[] = [
    [30, 64],
    [40, 59],
    [60, 59],
    [70, 64],
    [72, 84],
    [69, 110],
    [31, 110],
    [28, 84],
  ];
  if (L.top === "hoodie") p.ellipse(50, 61, 17, 7, { fill: L.topColor, w: 2.4 }); // hood behind the neck
  p.shape(body, { fill: L.topColor, w: 3 });
  switch (L.top) {
    case "hoodie":
      p.seg(46, 64, 45, 78, { w: 1.6 });
      p.seg(54, 64, 55, 78, { w: 1.6 });
      p.rrect(38, 90, 24, 12, 4, { w: 1.8 });
      break;
    case "stripes":
      for (let y = 70; y < 108; y += 8) p.seg(31, y, 69, y, { w: 2.2, color: L.inner ?? "#3b5a8a" });
      break;
    case "coat":
      p.shape(
        [
          [44, 60],
          [56, 60],
          [50, 82],
        ],
        { fill: L.inner ?? "#fffaf0", w: 2 },
      );
      p.seg(50, 82, 50, 109, { w: 1.8 });
      p.seg(44, 60, 40, 76, { w: 1.8 });
      p.seg(56, 60, 60, 76, { w: 1.8 });
      p.dot(46, 90, 1.6);
      p.dot(46, 100, 1.6);
      break;
    case "turtleneck":
      p.rrect(42, 54, 16, 9, 4, { fill: L.topColor, w: 2.4 });
      break;
    case "denim":
      p.shape(
        [
          [42, 60],
          [50, 68],
          [58, 60],
          [50, 63],
        ],
        { fill: "#a9c8e8", w: 1.8 },
      );
      p.seg(50, 68, 50, 109, { w: 1.6 });
      p.rrect(35, 74, 9, 8, 2, { w: 1.5 });
      p.rrect(56, 74, 9, 8, 2, { w: 1.5 });
      break;
    case "cardigan":
      p.shape(
        [
          [43, 60],
          [57, 60],
          [55, 109],
          [45, 109],
        ],
        { fill: L.inner ?? "#fffaf0", w: 2 },
      );
      for (const y of [76, 88, 100]) p.dot(42, y, 1.6);
      break;
    case "shirt":
      p.shape(
        [
          [42, 59],
          [50, 66],
          [47, 69],
        ],
        { fill: "#fffaf0", w: 1.6 },
      );
      p.shape(
        [
          [58, 59],
          [50, 66],
          [53, 69],
        ],
        { fill: "#fffaf0", w: 1.6 },
      );
      p.seg(50, 66, 50, 109, { w: 1.4 });
      break;
    case "jumper":
      p.seg(31, 104, 69, 104, { w: 1.6 });
      break;
    case "tee":
      // oversized tee: crew neck and a little orange corgi print
      p.curve(
        [
          [43, 60],
          [50, 65],
          [57, 60],
        ],
        { w: 1.8 },
      );
      p.ellipse(50, 86, 7, 5.5, { fill: C.orange, w: 1.4 });
      p.shape(
        [
          [44.5, 83],
          [45.5, 76],
          [48.5, 81.5],
        ],
        { fill: C.orange, w: 1.1 },
      );
      p.shape(
        [
          [55.5, 83],
          [54.5, 76],
          [51.5, 81.5],
        ],
        { fill: C.orange, w: 1.1 },
      );
      p.ellipse(50, 88.5, 3.4, 2.2, { fill: "#fffaf0", w: 0 });
      break;
    case "puffer":
      for (let y = 70; y < 108; y += 9)
        p.curve(
          [
            [30, y],
            [50, y + 2],
            [70, y],
          ],
          { w: 1.6, color: "rgba(43,38,34,0.6)" },
        );
      p.rrect(40, 55, 20, 9, 4, { fill: L.topColor, w: 2.4 });
      p.seg(50, 62, 50, 109, { w: 1.4 });
      break;
    case "varsity":
      p.shape(
        [
          [43, 60],
          [50, 70],
          [57, 60],
        ],
        { fill: "#fffaf0", w: 1.8 },
      );
      p.seg(50, 70, 50, 109, { w: 1.6 });
      p.rrect(31, 104, 38, 6, 2, { fill: L.inner ?? "#fffaf0", w: 1.6 });
      label1(p, "C", 39, 82, C.orange);
      break;
  }
  if (L.extras.includes("lanyard")) {
    p.line(
      [
        [42, 60],
        [47, 80],
        [50, 84],
        [53, 80],
        [58, 60],
      ],
      { w: 1.8, color: C.orange },
    );
    p.rrect(45, 84, 10, 12, 2, { fill: "#fffaf0", w: 1.6 });
  }
  if (L.extras.includes("scarf")) {
    p.rrect(39, 56, 22, 10, 5, { fill: C.orangeDark, w: 2.2 });
    p.rrect(54, 62, 8, 20, 3, { fill: C.orangeDark, w: 2 });
  }
  p.hatch(
    [
      [56, 66],
      [70, 66],
      [70, 108],
      [60, 108],
    ],
    6,
    -0.8,
    "rgba(43,38,34,0.15)",
  );
}

function arms(p: Pen, L: Look, pose: HPose) {
  const phone = L.prop === "phone";
  const skin = L.skin;
  const sleeve = L.top === "varsity" ? L.inner ?? "#fffaf0" : L.topColor;
  // left arm (screen left) always down
  const sitting = pose === "sit";
  const lHand: Pt = sitting ? [36, 108] : [27, 108 + (pose === "walkA" ? -2 : 2)];
  p.line(
    [
      [31, 66],
      [27, 86],
      lHand,
    ],
    { w: 10, color: INK },
  );
  p.line(
    [
      [31, 66],
      [27, 86],
      lHand,
    ],
    { w: 6.5, color: sleeve, j: 0.4 },
  );
  p.circle(lHand[0], lHand[1] + 2, 4.6, { fill: skin, w: 2 });
  if (phone) {
    // right arm raised, phone held up to film the barista
    p.line(
      [
        [69, 66],
        [80, 76],
        [79, 52],
      ],
      { w: 10, color: INK },
    );
    p.line(
      [
        [69, 66],
        [80, 76],
        [79, 52],
      ],
      { w: 6.5, color: sleeve, j: 0.4 },
    );
    p.circle(79, 50, 4.6, { fill: skin, w: 2 });
    p.rrect(72, 28, 14, 23, 3, { fill: "#2f2a29", w: 2.2 });
    p.rrect(74, 30, 10, 18, 2, { fill: "#a9c8e8", w: 0 });
    p.dot(79, 32, 1.2, "#fffaf0");
    return;
  }
  const rHand: Pt = sitting ? [64, 108] : [73, 108 + (pose === "walkA" ? 2 : -2)];
  p.line(
    [
      [69, 66],
      [73, 86],
      rHand,
    ],
    { w: 10, color: INK },
  );
  p.line(
    [
      [69, 66],
      [73, 86],
      rHand,
    ],
    { w: 6.5, color: sleeve, j: 0.4 },
  );
  p.circle(rHand[0], rHand[1] + 2, 4.6, { fill: skin, w: 2 });
}

function prop(p: Pen, L: Look, pose: HPose) {
  if (L.prop === "laptop") {
    if (pose === "sit") {
      p.rrect(31, 90, 38, 24, 3, { fill: "#c9cdd2", w: 2.6 });
      p.circle(50, 101, 4.5, { fill: C.orange, w: 1.4 }); // corgi sticker
      p.dot(48.5, 100, 0.9);
      p.dot(51.5, 100, 0.9);
    } else {
      p.rrect(70, 82, 7, 30, 2, { fill: "#c9cdd2", w: 2.2 });
    }
  } else if (L.prop === "tote") {
    p.curve(
      [
        [62, 62],
        [70, 72],
        [76, 88],
      ],
      { w: 2.2 },
    );
    p.rrect(68, 86, 18, 24, 3, { fill: "#f3e7d4", w: 2.4 });
    p.circle(77, 97, 3.4, { fill: C.orange, w: 1.2 });
  } else if (L.prop === "notebook") {
    p.rrect(54, 96, 15, 19, 2, { fill: "#fffaf0", w: 2.2 });
    p.seg(57, 101, 66, 101, { w: 1.1, color: C.rule });
    p.seg(57, 105, 66, 105, { w: 1.1, color: C.rule });
  }
}

function hairBack(p: Pen, L: Look) {
  const c = L.hairColor;
  if (L.hair === "long") p.rrect(31, 22, 38, 56, 14, { fill: c, w: 2.6 });
  else if (L.hair === "wavy")
    p.shape(
      [
        [32, 26],
        [29, 46],
        [32, 62],
        [29, 76],
        [40, 80],
        [50, 74],
        [60, 80],
        [71, 76],
        [68, 62],
        [71, 46],
        [68, 26],
        [50, 16],
      ],
      { fill: c, w: 2.6 },
    );
  else if (L.hair === "bob") p.rrect(31, 22, 38, 34, 12, { fill: c, w: 2.6 });
  else if (L.hair === "hijab")
    p.shape(
      [
        [50, 13],
        [68, 20],
        [73, 40],
        [74, 62],
        [64, 70],
        [36, 70],
        [26, 62],
        [27, 40],
        [32, 20],
      ],
      { fill: c, w: 3 },
    );
  else if (L.hair === "braids")
    for (const x of [33, 39, 61, 67]) {
      p.rrect(x - 3, 26, 6, 52, 3, { fill: c, w: 2 });
      for (let y = 34; y < 76; y += 7) p.seg(x - 2.5, y, x + 2.5, y + 2, { w: 1, color: "rgba(255,255,255,0.25)" });
    }
  else if (L.hair === "ponytail")
    p.shape(
      [
        [62, 22],
        [74, 28],
        [78, 44],
        [72, 56],
        [70, 40],
        [64, 30],
      ],
      { fill: c, w: 2.4 },
    );
}

function hairFront(p: Pen, L: Look) {
  const c = L.hairColor;
  switch (L.hair) {
    case "curtains":
      // middle-parted curtain fringe
      p.shape(
        [
          [33, 38],
          [33, 24],
          [41, 16],
          [50, 15],
          [59, 16],
          [67, 24],
          [67, 38],
          [62, 28],
          [54, 23],
          [50, 21],
          [46, 23],
          [38, 28],
        ],
        { fill: c, w: 2.4 },
      );
      break;
    case "spacebuns":
      p.circle(36, 14, 7.5, { fill: c, w: 2.4 });
      p.circle(64, 14, 7.5, { fill: c, w: 2.4 });
      p.shape(
        [
          [33, 34],
          [33, 24],
          [40, 17],
          [50, 15],
          [61, 17],
          [67, 24],
          [67, 34],
          [62, 26],
          [52, 24],
          [42, 26],
        ],
        { fill: c, w: 2.4 },
      );
      break;
    case "braids":
    case "short":
    case "ponytail":
    case "bun":
      p.shape(
        [
          [33, 34],
          [33, 24],
          [40, 17],
          [50, 15],
          [61, 17],
          [67, 24],
          [67, 34],
          [62, 26],
          [52, 24],
          [42, 26],
        ],
        { fill: c, w: 2.4 },
      );
      if (L.hair === "bun") p.circle(50, 12, 7, { fill: c, w: 2.4 });
      break;
    case "buzz":
      p.shape(
        [
          [34, 30],
          [36, 22],
          [44, 17],
          [56, 17],
          [64, 22],
          [66, 30],
          [56, 24],
          [44, 24],
        ],
        { fill: c, w: 1.6, alpha: 0.9 },
      );
      break;
    case "curly":
      for (const [x, y, r] of [
        [36, 28, 7],
        [40, 19, 8],
        [50, 15, 8],
        [60, 19, 8],
        [64, 28, 7],
        [33, 37, 5],
        [67, 37, 5],
      ] as [number, number, number][])
        p.circle(x, y, r, { fill: c, w: 2.2 });
      break;
    case "long":
    case "wavy":
    case "bob":
      p.shape(
        [
          [33, 38],
          [33, 24],
          [42, 16],
          [52, 15],
          [62, 18],
          [67, 26],
          [67, 38],
          [60, 25],
          [46, 27],
          [38, 30],
        ],
        { fill: c, w: 2.4 },
      );
      break;
    case "hijab":
      p.curve(
        [
          [36, 26],
          [50, 21],
          [64, 26],
        ],
        { w: 1.6, color: "rgba(43,38,34,0.5)" },
      );
      break;
    case "bald":
      p.curve(
        [
          [40, 22],
          [44, 20],
        ],
        { w: 2, color: "#fffaf0" },
      );
      break;
  }
}

function face(p: Pen, L: Look, mood: HMood) {
  const brow = L.hair === "bald" || L.hair === "hijab" ? INK : L.hairColor;
  if (mood === "h") {
    for (const x of [43, 57])
      p.curve(
        [
          [x - 3.5, 39.5],
          [x, 36],
          [x + 3.5, 39.5],
        ],
        { w: 2.4 },
      );
    p.shape(
      [
        [43, 47],
        [50, 48.5],
        [57, 47],
        [54.5, 53.5],
        [50, 55],
        [45.5, 53.5],
      ],
      { fill: "#7a3a2e", w: 2 },
    );
    p.rrect(45.5, 47.4, 9, 2.6, 1, { fill: "#fffaf0", w: 0 });
    p.ellipse(38.5, 45, 3.6, 2.2, { fill: "rgba(242,120,107,0.55)", w: 0 });
    p.ellipse(61.5, 45, 3.6, 2.2, { fill: "rgba(242,120,107,0.55)", w: 0 });
  } else {
    p.dot(43, 38.5, 2.2);
    p.dot(57, 38.5, 2.2);
    p.dot(43.7, 37.7, 0.7, "#fff");
    p.dot(57.7, 37.7, 0.7, "#fff");
    if (mood === "a") {
      p.seg(38.5, 31.5, 46, 34.5, { w: 2.4, color: brow });
      p.seg(61.5, 31.5, 54, 34.5, { w: 2.4, color: brow });
      p.curve(
        [
          [44.5, 52],
          [50, 48.5],
          [55.5, 52],
        ],
        { w: 2.2 },
      );
      p.seg(66, 26, 69, 22, { w: 1.6 });
      p.seg(68, 30, 72, 28, { w: 1.6 });
    } else {
      p.seg(39.5, 33, 46, 32.5, { w: 2, color: brow });
      p.seg(54, 32.5, 60.5, 33, { w: 2, color: brow });
      if (L.flat) p.seg(45.5, 50, 54.5, 50, { w: 2.2 });
      else
        p.curve(
          [
            [44.5, 48.5],
            [50, 51.5],
            [55.5, 48.5],
          ],
          { w: 2.2 },
        );
    }
  }
  // nose
  p.curve(
    [
      [50.5, 40.5],
      [52, 44.5],
      [49.5, 45.2],
    ],
    { w: 1.6, color: "rgba(43,38,34,0.7)" },
  );
}

function extrasHead(p: Pen, L: Look) {
  const e = L.extras;
  if (e.includes("beard"))
    p.shape(
      [
        [34, 40],
        [38, 52],
        [50, 58],
        [62, 52],
        [66, 40],
        [60, 47],
        [50, 50],
        [40, 47],
      ],
      { fill: L.hairColor, w: 2 },
    );
  if (e.includes("moustache"))
    p.shape(
      [
        [43, 46.5],
        [50, 45],
        [57, 46.5],
        [54, 48.5],
        [50, 47.5],
        [46, 48.5],
      ],
      { fill: L.hairColor, w: 1.4 },
    );
  if (e.includes("glasses")) {
    p.circle(43, 38.5, 5.6, { w: 2 });
    p.circle(57, 38.5, 5.6, { w: 2 });
    p.seg(48.6, 38, 51.4, 38, { w: 1.8 });
  }
  if (e.includes("earrings")) {
    p.dot(32.5, 47, 1.8, "#e7c46d");
    p.dot(67.5, 47, 1.8, "#e7c46d");
  }
  if (e.includes("airpods")) {
    p.rrect(30.5, 42, 3.4, 7, 1.5, { fill: "#ffffff", w: 1.2 });
    p.rrect(66.1, 42, 3.4, 7, 1.5, { fill: "#ffffff", w: 1.2 });
  }
  if (e.includes("freckles"))
    for (const [x, y] of [
      [39, 43],
      [41.5, 45],
      [38, 46],
      [61, 43],
      [58.5, 45],
      [62, 46],
    ] as Pt[])
      p.dot(x, y, 0.8, "rgba(140,80,50,0.7)");
  if (e.includes("cap")) {
    // brown corduroy cap with a little orange corgi stitched on (Corgi Cafe merch)
    p.shape(
      [
        [32, 30],
        [33, 18],
        [42, 11],
        [58, 11],
        [67, 18],
        [68, 30],
      ],
      { fill: "#7a5236", w: 2.6 },
    );
    p.rrect(28, 27, 44, 6, 3, { fill: "#6a4630", w: 2.2 });
    for (let x = 38; x < 64; x += 5) p.seg(x, 14, x, 26, { w: 0.9, color: "rgba(43,38,34,0.35)" });
    p.ellipse(50, 20, 5, 3.5, { fill: C.orange, w: 1.2 });
  }
  if (e.includes("beanie")) {
    p.shape(
      [
        [32, 30],
        [34, 16],
        [44, 9],
        [56, 9],
        [66, 16],
        [68, 30],
      ],
      { fill: C.orange, w: 2.6 },
    );
    p.rrect(31, 25, 38, 8, 3, { fill: C.orangeDark, w: 2.2 });
    p.circle(50, 7, 4, { fill: C.orangeSoft, w: 1.8 });
  }
  if (e.includes("headphones")) {
    p.curve(
      [
        [32, 36],
        [33, 18],
        [50, 10],
        [67, 18],
        [68, 36],
      ],
      { w: 3 },
    );
    p.rrect(28, 32, 8, 13, 3, { fill: "#2f2a29", w: 2 });
    p.rrect(64, 32, 8, 13, 3, { fill: "#2f2a29", w: 2 });
  }
}

/** Draw one person. */
export function drawHuman(p: Pen, L: Look, pose: HPose, mood: HMood) {
  legs(p, L, pose);
  hairBack(p, L);
  torso(p, L);
  // neck + head
  p.rrect(44, 50, 12, 13, 4, { fill: L.skin, w: 2.4 });
  if (L.hair !== "hijab") {
    p.ellipse(33, 40, 3.5, 5, { fill: L.skin, w: 2 });
    p.ellipse(67, 40, 3.5, 5, { fill: L.skin, w: 2 });
  }
  if (L.hair === "hijab") p.ellipse(50, 38, 14, 16, { fill: L.skin, w: 2.4 });
  else p.ellipse(50, 36, 17, 19, { fill: L.skin, w: 3 });
  hairFront(p, L);
  face(p, L, mood);
  extrasHead(p, L);
  arms(p, L, pose);
  prop(p, L, pose);
}

/** Brown leather chair with thin dark legs, seen from the front (canvas 70 x 96). */
export function drawChair(p: Pen) {
  p.rrect(10, 8, 50, 50, 12, { fill: C.chair, w: 3 });
  p.hatch(p.rrectPts(12, 10, 46, 46, 11), 6, -0.8, "rgba(43,38,34,0.22)");
  p.rrect(7, 56, 56, 12, 5, { fill: "#9a6c4d", w: 2.8 });
  for (const x of [13, 57]) p.seg(x, 68, x + (x < 35 ? -2 : 2), 94, { w: 3.2 });
}
