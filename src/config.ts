// Central tuning + data tables for Corgi Café: Loaf Rush (London edition).

export const W = 1280;
export const H = 720;
export const STEP = 1 / 60; // fixed simulation step (seconds)

export const COLORS = {
  paper: "#fbf3df",
  paperDark: "#f1e6c8",
  ink: "#2b2622",
  inkSoft: "#5a514a",
  rule: "#a9c8e8",
  margin: "#ec9a9a",
  caramel: "#e39b4f", // corgi red coat
  caramelDark: "#c47a33",
  coral: "#f2786b",
  mint: "#7fcfb0",
  mintDark: "#4fae8c",
  cream: "#fffaf0",
  white: "#ffffff",
  coffee: "#7a4a2a",
  tape: "rgba(236, 222, 170, 0.85)",
  // London café palette (inferred from reference photos, not paint codes)
  orange: "#f0702a", // Corgi Cafe brand orange, drawn in marker
  orangeDark: "#c9561a",
  orangeSoft: "#f7a36c",
  brick: "#f5efe4",
  brickLine: "#dccfbc",
  subway: "#ffffff",
  sage: "#a3ae8f",
  sageDark: "#7d8a6c",
  copper: "#c0854f",
  table: "#e2bf8c",
  floor: "#ead2ab",
  chair: "#8a5f43",
  tri: "#2f2a29", // tricolour corgi black saddle
};
export const HEX = {
  ink: 0x2b2622,
  caramel: 0xe39b4f,
  coral: 0xf2786b,
  mint: 0x7fcfb0,
  paper: 0xfbf3df,
  white: 0xffffff,
  orange: 0xf0702a,
};

export const FONT_HEAD = "Caveat Brush";
export const FONT_BODY = "Patrick Hand";

export const GAME_URL = "https://lukebala4.github.io/corgi-cafe-loaf-rush/";

// ---------------------------------------------------------------------------
// Café layout (logical pixels). Notebook rules double as counters.
// Camera adaptation of the Shoreditch room (see docs/LONDON_ADAPTATION.md):
//   top = counter wall, right = street frontage + door, left = rear wall,
//   bottom = long mural wall (cut away; its art lives in the margin sketches).
// ---------------------------------------------------------------------------
export const PLAY = { left: 100, right: 1200, top: 150, bottom: 700 };
export const BACK_COUNTER = { x: 230, y: 72, w: 970, h: 78 }; // stations sit on it
export const STATION_BASE_Y = 128; // bottom of station drawings on the back bar
export const PASS_Y = 240; // pass counter top
export const PASS_H = 22;
export const PASS_X0 = 230; // the counter end opening runs from the rear wall to here
export const DOORWAYS: { x0: number; x1: number }[] = [
  { x0: 104, x1: 230 }, // open counter end by the rear wall
  { x0: 600, x1: 695 },
  { x0: 990, x1: 1085 },
];
export const DOOR = { x: 1240, y: 480 }; // customers enter here (outside the right wall)
export const DOOR_INSIDE = { x: 1170, y: 480 };

export interface TableDef {
  x: number;
  y: number;
  w: number;
}
export const TABLE_H = 50;
// Pale communal tables with thin dark legs; brown chairs at each end.
export const TABLES: TableDef[] = [
  { x: 390, y: 385, w: 200 },
  { x: 880, y: 385, w: 200 },
  { x: 630, y: 600, w: 280 },
];
export const SEATS: { x: number; y: number; side: -1 | 1 }[] = [
  { x: 254, y: 387, side: -1 },
  { x: 526, y: 387, side: 1 },
  { x: 744, y: 387, side: -1 },
  { x: 1016, y: 387, side: 1 },
  { x: 454, y: 602, side: -1 },
  { x: 806, y: 602, side: 1 },
];
export const COLUMN = { x: 640, y: 492, r: 9 }; // slim pale column mid-room
export const GROUP_SPOT = { x: 1105, y: 615 }; // window bar by the street
// Laptop lounge (bottom left): orange rug, sage sofa, beanbag and the café corgi's bed.
export const LOUNGE = { x: 140, y: 478, w: 200, h: 112 };
export const SOFA = { x: 156, y: 484, w: 146, h: 30 };
export const CORGI_BED = { x: 184, y: 566 };
// Merch shelf by the door (corduroy caps, mugs, totes).
export const MERCH = { x: 1146, y: 290, w: 54, h: 110 };
export const PLAYER_START = { x: 680, y: 195 };
export const ASSISTANT_HOME = { x: 640, y: 300 };

// ---------------------------------------------------------------------------
// Items + recipes  (verified London menu rows; coins are game balance only)
// ---------------------------------------------------------------------------
export type ItemId =
  | "cup"
  | "milk"
  | "americano"
  | "latte"
  | "icedlatte"
  | "pally"
  | "daytona"
  | "juicebox"
  | "croissant"
  | "cake"
  | "sourdough"
  | "burnt";

export interface ItemInfo {
  name: string; // short name used in prompts
  price: number; // game coins
  servable: boolean;
  menuName?: string; // exact London menu spelling
  gbp?: string; // real London price (informational only)
  sourceId?: number; // product id on the London Town ordering menu
}

export const ITEM_INFO: Record<ItemId, ItemInfo> = {
  cup: { name: "empty cup", price: 0, servable: false },
  milk: { name: "steamed milk", price: 0, servable: false },
  americano: { name: "Americano", price: 5, servable: true, menuName: "Americano", gbp: "3.70", sourceId: 16037 },
  latte: { name: "Latte", price: 8, servable: true, menuName: "Latte", gbp: "4.30", sourceId: 16013 },
  icedlatte: { name: "Iced Latte", price: 9, servable: true, menuName: "Iced Latte", gbp: "4.30", sourceId: 16021 },
  pally: { name: "Pally Pick-Me-Up", price: 12, servable: true, menuName: "Pally Pick-Me-Up", gbp: "5.75", sourceId: 16122 },
  daytona: { name: "Brew Daytona", price: 7, servable: true, menuName: "Brew Daytona", gbp: "5.00", sourceId: 16032 },
  juicebox: { name: "The Juicebox", price: 9, servable: true, menuName: "The Juicebox", gbp: "9.75", sourceId: 16031 },
  croissant: { name: "Plain Croissant", price: 4, servable: true, menuName: "Plain Croissant", gbp: "3.50", sourceId: 16042 },
  cake: { name: "Corgi Orange Cake", price: 5, servable: true, menuName: "Corgi Orange Cake", gbp: "6.20", sourceId: 15022 },
  sourdough: { name: "Chicken sourdough", price: 7, servable: true, menuName: "Chicken sourdough", gbp: "11.55", sourceId: 16043 },
  burnt: { name: "burnt sourdough", price: 0, servable: false },
};

export const SERVABLE: ItemId[] = (Object.keys(ITEM_INFO) as ItemId[]).filter((k) => ITEM_INFO[k].servable);

export type StationId =
  | "press"
  | "croissant"
  | "cake"
  | "blender"
  | "cups"
  | "milk"
  | "espresso"
  | "cold"
  | "trash"
  | "padA"
  | "padB";

export interface StationDef {
  id: StationId;
  x: number;
  y: number; // bottom of the drawing (back bar) or pad centre (pass)
  label: string;
  unlock: ItemId | null; // the station appears once this item is on the menu
}

export const STATION_DEFS: StationDef[] = [
  { id: "press", x: 285, y: STATION_BASE_Y, label: "PRESS", unlock: "sourdough" },
  { id: "croissant", x: 392, y: STATION_BASE_Y, label: "CROISSANTS", unlock: null },
  { id: "cake", x: 470, y: STATION_BASE_Y, label: "CAKE", unlock: "cake" },
  { id: "blender", x: 573, y: STATION_BASE_Y, label: "BLENDER", unlock: "juicebox" },
  { id: "cups", x: 680, y: STATION_BASE_Y, label: "CUPS", unlock: null },
  { id: "milk", x: 790, y: STATION_BASE_Y, label: "MILK", unlock: "latte" },
  { id: "espresso", x: 902, y: STATION_BASE_Y, label: "ESPRESSO", unlock: null },
  { id: "cold", x: 1018, y: STATION_BASE_Y, label: "COLD BAR", unlock: "icedlatte" },
  { id: "trash", x: 1136, y: STATION_BASE_Y, label: "BIN", unlock: null },
  { id: "padA", x: 450, y: PASS_Y + 11, label: "PASS", unlock: null },
  { id: "padB", x: 840, y: PASS_Y + 11, label: "PASS", unlock: null },
];

// Recipes, shown in the order bubble tooltip, the recipe card and the tutorial.
export const RECIPE_HINTS: Partial<Record<ItemId, string>> = {
  americano: "cup from CUPS → ESPRESSO",
  latte: "cup from CUPS → MILK → ESPRESSO (the corgi foam art pours itself)",
  icedlatte: "make a Latte → COLD BAR (over ice)",
  pally: "make an Iced Latte → COLD BAR again (pistachio + vanilla foam)",
  daytona: "cup from CUPS → COLD BAR (cold brew + coconut water)",
  juicebox: "cup from CUPS → BLENDER (berries)",
  croissant: "grab one at CROISSANTS",
  cake: "grab a slice at CAKE",
  sourdough: "PRESS, then take it before it burns",
};

// ---------------------------------------------------------------------------
// Customers: every paying customer is a human. Corgis run the café.
// ---------------------------------------------------------------------------
export type Role = "regular" | "newcomer" | "builder" | "enthusiast" | "sceptic" | "creator" | "group";

export interface RoleDef {
  name: string;
  patience: number; // multiplier
  tip: number; // multiplier
  lines: { order: string[]; happy: string[]; wrong: string[]; leave: string[]; zoom: string[] };
}

export const ROLES: Record<Role, RoleDef> = {
  regular: {
    name: "Relaxed regular",
    patience: 1.4,
    tip: 1.3,
    lines: {
      order: ["The usual, please!", "Morning, team!", "Hiya, tiny baristas!"],
      happy: ["Perfect, as always.", "You lot are the best.", "Ten out of ten, tiny legs."],
      wrong: ["Ha! Close. Mine's different.", "Not mine, but no stress!"],
      leave: ["Sorry pups, got to dash.", "See you tomorrow!"],
      zoom: ["Ha! Every morning!", "Go on, Mochi!"],
    },
  },
  newcomer: {
    name: "First-time visitor",
    patience: 1,
    tip: 1,
    lines: {
      order: ["Wait... the baristas are CORGIS?", "First time here! Um, hi!", "Is that corgi making coffee?!"],
      happy: ["I'm telling everyone.", "Best first visit ever!", "It wiggled at me!"],
      wrong: ["Oh! I didn't order this one.", "Cute, but not mine!"],
      leave: ["Aw, I have to catch my train.", "Maybe next time..."],
      zoom: ["Is this normal?!", "I LOVE IT HERE"],
    },
  },
  builder: {
    name: "Tech builder",
    patience: 1,
    tip: 1.05,
    lines: {
      order: ["Quick one between commits!", "Fuel for the demo, please.", "Shipping today. Need caffeine."],
      happy: ["Merged! Thank you!", "This unblocks me.", "Deploying happiness."],
      wrong: ["That's a bug, not my order.", "Wrong build!"],
      leave: ["Standup's starting, gotta run.", "Out of time, sorry!"],
      zoom: ["Hold on, filming this.", "Okay, that's a feature."],
    },
  },
  enthusiast: {
    name: "Coffee enthusiast",
    patience: 1.15,
    tip: 1.6,
    lines: {
      order: ["Your best coffee, please.", "I'll know if you rush the milk.", "What's the espresso today?"],
      happy: ["Silky. Balanced. Corgi-approved.", "Genuinely excellent.", "Look at that latte art!"],
      wrong: ["That's... not what I ordered.", "I asked for something else."],
      leave: ["Disappointing.", "I'll try again another day."],
      zoom: ["Respect the hustle.", "Mind my cup!"],
    },
  },
  sceptic: {
    name: "Grumpy commuter",
    patience: 0.8,
    tip: 1.7,
    lines: {
      order: ["I'm only here for the wifi.", "Dogs. Making coffee. Sure.", "Fine. Quickly, please."],
      happy: ["...okay, that's adorable.", "Don't tell anyone I smiled.", "I'll be back. Ironically."],
      wrong: ["Typical.", "Knew it."],
      leave: ["Unbelievable. (see you tomorrow)", "I'm leaving. Fondly."],
      zoom: ["...okay that's funny.", "Who allowed this. (me)"],
    },
  },
  creator: {
    name: "Content creator",
    patience: 0.95,
    tip: 1.25,
    lines: {
      order: ["Can I film the barista?", "Hi chat! We're ordering!", "It's for the content!"],
      happy: ["*click* #corgibarista", "Chat, he WIGGLED.", "Posting this right now!"],
      wrong: ["Not quite on-brand!", "Chat, that's not mine."],
      leave: ["Lost the light, bye!", "Ending the stream..."],
      zoom: ["CHAT. CHAT. ZOOMIES.", "Recording!!"],
    },
  },
  group: {
    name: "Visiting group",
    patience: 2.1,
    tip: 2.2,
    lines: {
      order: ["One order for the whole team!", "Group order, please!"],
      happy: ["Team photo with the barista!", "Best offsite ever!"],
      wrong: ["That's not on our list!"],
      leave: ["We have to head off, sorry!"],
      zoom: ["Team-building!"],
    },
  },
};

// ---------------------------------------------------------------------------
// Days
// ---------------------------------------------------------------------------
export type EventId = "zoomies" | "nap" | "heist" | "group";

export interface DayDef {
  name: string;
  subtitle: string;
  menu: ItemId[];
  roles: Role[];
  spawn: [number, number];
  maxCustomers: number;
  patience: number; // seconds for one item order
  comboChance: number; // chance a customer orders 2 items
  events: { t: number; id: EventId }[]; // t = seconds since opening
  goal: number;
  newThing?: string;
}

export const DAY_LENGTH = 180;

const BASE_ROLES: Role[] = ["regular", "newcomer", "builder"];
const ALL_DRINKS_FOOD: ItemId[] = ["americano", "croissant", "latte", "cake", "sourdough", "icedlatte", "daytona", "pally", "juicebox"];

export const DAYS: DayDef[] = [
  {
    name: "Monday",
    subtitle: "Soft opening on Great Eastern Street. Very soft. Like a loaf.",
    menu: ["americano", "croissant"],
    roles: BASE_ROLES,
    spawn: [12, 16],
    maxCustomers: 3,
    patience: 60,
    comboChance: 0,
    events: [],
    goal: 70,
    newThing: "Americanos & croissants",
  },
  {
    name: "Tuesday",
    subtitle: "Word is getting out around Shoreditch.",
    menu: ["americano", "croissant", "latte"],
    roles: [...BASE_ROLES, "sceptic"],
    spawn: [11, 14],
    maxCustomers: 4,
    patience: 54,
    comboChance: 0.1,
    events: [{ t: 95, id: "heist" }],
    goal: 110,
    newThing: "Lattes + the Croissant Heist",
  },
  {
    name: "Wednesday",
    subtitle: "The orange cake is out. So are the zoomies.",
    menu: ["americano", "croissant", "latte", "cake"],
    roles: [...BASE_ROLES, "sceptic", "enthusiast"],
    spawn: [10, 13],
    maxCustomers: 4,
    patience: 50,
    comboChance: 0.15,
    events: [
      { t: 70, id: "zoomies" },
      { t: 130, id: "heist" },
    ],
    goal: 150,
    newThing: "Corgi Orange Cake, coffee enthusiasts + ZOOMIES",
  },
  {
    name: "Thursday",
    subtitle: "Warm sourdough. A very sleepy colleague.",
    menu: ["americano", "croissant", "latte", "cake", "sourdough"],
    roles: [...BASE_ROLES, "sceptic", "enthusiast"],
    spawn: [9, 12.5],
    maxCustomers: 5,
    patience: 48,
    comboChance: 0.2,
    events: [
      { t: 55, id: "nap" },
      { t: 120, id: "zoomies" },
    ],
    goal: 190,
    newThing: "Chicken sourdough + NAP ATTACK",
  },
  {
    name: "Friday",
    subtitle: "Cold bar open. Phones out. A whole team walks in.",
    menu: ["americano", "croissant", "latte", "cake", "sourdough", "icedlatte", "daytona"],
    roles: [...BASE_ROLES, "sceptic", "enthusiast", "creator"],
    spawn: [8.5, 12],
    maxCustomers: 5,
    patience: 46,
    comboChance: 0.25,
    events: [
      { t: 45, id: "group" },
      { t: 110, id: "heist" },
      { t: 150, id: "nap" },
    ],
    goal: 240,
    newThing: "Iced Latte, Brew Daytona, creators + a VISITING GROUP",
  },
  {
    name: "Saturday",
    subtitle: "Weekend combos. Everyone wants two things.",
    menu: ALL_DRINKS_FOOD,
    roles: [...BASE_ROLES, "sceptic", "enthusiast", "creator"],
    spawn: [8, 11],
    maxCustomers: 6,
    patience: 46,
    comboChance: 0.4,
    events: [
      { t: 40, id: "zoomies" },
      { t: 85, id: "group" },
      { t: 125, id: "nap" },
      { t: 155, id: "heist" },
    ],
    goal: 290,
    newThing: "Pally Pick-Me-Up, The Juicebox + combos",
  },
  {
    name: "Sunday Brunch",
    subtitle: "The finale. All of Shoreditch is coming.",
    menu: ALL_DRINKS_FOOD,
    roles: [...BASE_ROLES, "sceptic", "enthusiast", "creator"],
    spawn: [6.5, 9.5],
    maxCustomers: 6,
    patience: 46,
    comboChance: 0.5,
    events: [
      { t: 25, id: "zoomies" },
      { t: 55, id: "heist" },
      { t: 80, id: "group" },
      { t: 112, id: "nap" },
      { t: 138, id: "zoomies" },
      { t: 160, id: "heist" },
    ],
    goal: 360,
    newThing: "SUNDAY BRUNCH FINALE",
  },
];

/** The most elaborate coffee on today's menu (what the enthusiast always orders). */
export function enthusiastPick(menu: ItemId[]): ItemId {
  for (const it of ["pally", "icedlatte", "latte"] as ItemId[]) if (menu.includes(it)) return it;
  return "americano";
}

// ---------------------------------------------------------------------------
// Upgrades + cosmetics (ids are unchanged from v1 so old saves carry over)
// ---------------------------------------------------------------------------
export type UpgradeId = "espresso" | "carry" | "dash" | "patience" | "assistant";

export const UPGRADES: { id: UpgradeId; name: string; desc: string[]; costs: number[] }[] = [
  { id: "espresso", name: "Turbo Espresso", desc: ["Espresso & blender 35% faster", "Brews in a blink"], costs: [60, 130] },
  { id: "carry", name: "Second Paw Slot", desc: ["Carry TWO items at once"], costs: [150] },
  { id: "dash", name: "Longer Zoomies", desc: ["Longer dash, shorter cooldown", "Maximum zoom"], costs: [50, 110] },
  { id: "patience", name: "Comfy Cushions", desc: ["Customers wait 25% longer", "Customers wait 50% longer"], costs: [70, 150] },
  { id: "assistant", name: "Hire Biscuit", desc: ["Biscuit the corgi delivers items left on the PASS"], costs: [200] },
];

export const BREW_TIME = [3.6, 2.4, 1.4];
export const BLEND_TIME = [2.6, 1.8, 1.2];
export const DASH_TIME = [0.15, 0.21, 0.27];
export const DASH_COOLDOWN = [1.5, 1.1, 0.75];
export const PATIENCE_MULT = [1, 1.25, 1.5];

export type ApronId = "classic" | "mint" | "coral" | "polka" | "bowtie";
export const APRONS: { id: ApronId; name: string; cost: number; color: string }[] = [
  { id: "classic", name: "Classic", cost: 0, color: "#ffffff" },
  { id: "mint", name: "Sage", cost: 30, color: "#a3ae8f" },
  { id: "coral", name: "Corgi Orange", cost: 30, color: "#f0702a" },
  { id: "polka", name: "Polka Loaf", cost: 45, color: "#fff2c2" },
  { id: "bowtie", name: "Fancy Bowtie", cost: 45, color: "#3b5a8a" },
];

export type DecorId = "plant" | "bunting" | "lights" | "portrait";
export const DECOR: { id: DecorId; name: string; cost: number }[] = [
  { id: "plant", name: "Orange flower pots", cost: 40 },
  { id: "bunting", name: "Polaroid string", cost: 50 },
  { id: "lights", name: "Extra copper lamps", cost: 60 },
  { id: "portrait", name: "Renaissance corgi", cost: 60 },
];
export const DECOR_TIP_BONUS = 0.05;

export const comboMult = (combo: number) => 1 + Math.min(combo, 8) * 0.25;
