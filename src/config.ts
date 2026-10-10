// Central tuning + data tables for Corgi Café: Loaf Rush.

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
  caramel: "#e39b4f",
  caramelDark: "#c47a33",
  coral: "#f2786b",
  mint: "#7fcfb0",
  mintDark: "#4fae8c",
  cream: "#fffaf0",
  white: "#ffffff",
  coffee: "#7a4a2a",
  tape: "rgba(236, 222, 170, 0.85)",
};
export const HEX = {
  ink: 0x2b2622,
  caramel: 0xe39b4f,
  coral: 0xf2786b,
  mint: 0x7fcfb0,
  paper: 0xfbf3df,
  white: 0xffffff,
};

export const FONT_HEAD = "Caveat Brush";
export const FONT_BODY = "Patrick Hand";

// ---------------------------------------------------------------------------
// Café layout (logical pixels). Notebook rules double as counters.
// ---------------------------------------------------------------------------
export const PLAY = { left: 100, right: 1200, top: 150, bottom: 700 };
export const BACK_COUNTER = { x: 100, y: 72, w: 1100, h: 78 }; // stations sit on it
export const PASS_Y = 240; // pass counter top
export const PASS_H = 22;
export const DOORWAYS: { x0: number; x1: number }[] = [
  { x0: 205, x1: 300 },
  { x0: 600, x1: 695 },
  { x0: 990, x1: 1085 },
];
export const DOOR = { x: 1240, y: 480 }; // customers enter here (outside the right wall)
export const DOOR_INSIDE = { x: 1170, y: 480 };

export const TABLES: { x: number; y: number }[] = [
  { x: 360, y: 370 },
  { x: 680, y: 370 },
  { x: 1000, y: 370 },
  { x: 360, y: 600 },
  { x: 680, y: 600 },
  { x: 1000, y: 600 },
];
export const TABLE_W = 112;
export const TABLE_H = 54;
export const SEATS = TABLES.map((t) => ({ x: t.x - 92, y: t.y + 2 }));
export const DACHS_SPOT = { x: 560, y: 484 }; // middle aisle
export const BIGLOAF_SPOT = { x: 1120, y: 610 };
export const PLAYER_START = { x: 650, y: 195 };
export const ASSISTANT_HOME = { x: 840, y: 300 };

// ---------------------------------------------------------------------------
// Items + recipes
// ---------------------------------------------------------------------------
export type ItemId =
  | "cup"
  | "coffee"
  | "latte"
  | "fancy"
  | "pupcup"
  | "iced"
  | "croissant"
  | "toast"
  | "burnt";

export const ITEM_INFO: Record<ItemId, { name: string; price: number; servable: boolean }> = {
  cup: { name: "empty cup", price: 0, servable: false },
  coffee: { name: "coffee", price: 5, servable: true },
  latte: { name: "corgi latte", price: 8, servable: true },
  fancy: { name: "fancy latte art", price: 12, servable: true },
  pupcup: { name: "puppuccino", price: 6, servable: true },
  iced: { name: "iced coffee", price: 8, servable: true },
  croissant: { name: "croissant", price: 4, servable: true },
  toast: { name: "sleepy corgi toast", price: 7, servable: true },
  burnt: { name: "charcoal toast", price: 0, servable: false },
};

export type StationId = "cups" | "espresso" | "milk" | "ice" | "pastry" | "toaster" | "trash" | "padA" | "padB";

export const STATION_DEFS: { id: StationId; x: number; y: number; label: string; unlock: ItemId | null }[] = [
  { id: "cups", x: 175, y: 112, label: "CUPS", unlock: null },
  { id: "espresso", x: 330, y: 112, label: "ESPRESSO", unlock: null },
  { id: "milk", x: 485, y: 112, label: "FOAM ART", unlock: "latte" },
  { id: "ice", x: 635, y: 112, label: "ICE", unlock: "iced" },
  { id: "pastry", x: 785, y: 112, label: "PASTRY", unlock: null },
  { id: "toaster", x: 945, y: 112, label: "TOASTER", unlock: "toast" },
  { id: "trash", x: 1115, y: 112, label: "TRASH", unlock: null },
  { id: "padA", x: 450, y: 251, label: "PASS", unlock: null },
  { id: "padB", x: 840, y: 251, label: "PASS", unlock: null },
];

// Recipes, shown in the order bubble tooltip and the tutorial notes.
export const RECIPE_HINTS: Partial<Record<ItemId, string>> = {
  coffee: "cup → espresso",
  latte: "coffee → foam art",
  fancy: "latte → foam art again",
  pupcup: "cup → foam art",
  iced: "coffee → ice",
  croissant: "pastry case",
  toast: "toaster → wait",
};

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------
export type Breed = "beagle" | "pug" | "shiba" | "retriever" | "poodle" | "cat" | "influencer" | "dachshund" | "bigloaf";

export interface BreedDef {
  name: string;
  patience: number; // multiplier
  tip: number; // multiplier
  lines: { order: string[]; happy: string[]; wrong: string[]; leave: string[] };
}

export const BREEDS: Record<Breed, BreedDef> = {
  beagle: {
    name: "Beagle",
    patience: 1,
    tip: 1,
    lines: {
      order: ["Aroo! One please!", "Smells AMAZING in here", "Hi hi hi"],
      happy: ["AROOOO!", "Best. Day.", "*happy sniffing*"],
      wrong: ["...I sniffed it. No.", "That is not my smell"],
      leave: ["AROO. (sad)", "I'll sniff elsewhere"],
    },
  },
  pug: {
    name: "Pug",
    patience: 1,
    tip: 1,
    lines: {
      order: ["*snort* hello", "Snrk. Treat me.", "*wheeze* order time"],
      happy: ["*happy snort*", "Snrk snrk!"],
      wrong: ["*confused snort*", "Is this a test?"],
      leave: ["*grumble snort*", "I'm going to nap angrily"],
    },
  },
  shiba: {
    name: "Shiba",
    patience: 0.9,
    tip: 1.1,
    lines: {
      order: ["Much order. Very wait.", "Wow. Café.", "Such hungry"],
      happy: ["Wow. Much yum.", "Very serve. 10/10"],
      wrong: ["Much wrong. Very no.", "Wow. Rude."],
      leave: ["*SHIBA SCREAM*", "Such slow. Bye."],
    },
  },
  retriever: {
    name: "Golden Retriever",
    patience: 1.4,
    tip: 1.3,
    lines: {
      order: ["HI!! I LOVE IT HERE", "Everything looks GREAT", "Oh wow a café!!"],
      happy: ["THIS IS THE BEST THING EVER", "I LOVE YOU", "WOW!!!"],
      wrong: ["A wrong thing?! I love it! (still want mine)", "Ooh! Not mine but WOW"],
      leave: ["Bye!! Still love you!!", "I'll come back!!"],
    },
  },
  poodle: {
    name: "Poodle",
    patience: 1.15,
    tip: 1.6,
    lines: {
      order: ["Latte art. Elaborate. Now.", "I require a masterpiece", "Make it gallery-worthy"],
      happy: ["Magnifique.", "Acceptable. Barely. (it's perfect)"],
      wrong: ["Is this... a joke?", "I am appalled."],
      leave: ["How pedestrian.", "Hmph! Amateurs."],
    },
  },
  cat: {
    name: "Grumpy Cat",
    patience: 0.8,
    tip: 1.7,
    lines: {
      order: ["Ugh. Dogs.", "Whatever. Fine.", "I'm only here ironically"],
      happy: ["...it's fine. *purrrr*", "Don't tell anyone I liked it", "*secret purr*"],
      wrong: ["Typical.", "I knew it."],
      leave: ["Ugh. Never again. (see you tomorrow)", "Hssss"],
    },
  },
  influencer: {
    name: "Corgi Influencer",
    patience: 0.95,
    tip: 1.25,
    lines: {
      order: ["Make it aesthetic pls", "Hi besties! Order time", "It's for the content"],
      happy: ["*CLICK* #loafgoals", "Posting this rn!!", "Smash that paw button"],
      wrong: ["Ew, not on-brand", "My followers would NOT"],
      leave: ["Unfollowed.", "This café is cancelled"],
    },
  },
  dachshund: {
    name: "Dachshund",
    patience: 1.2,
    tip: 1.3,
    lines: {
      order: ["I'll just... lie here", "Sorry, I'm long", "Mind the hotdog"],
      happy: ["*wiggles entire length*", "Long thanks!"],
      wrong: ["That's not it (from my front end)"],
      leave: ["*leaves in sections*", "Long sigh."],
    },
  },
  bigloaf: {
    name: "THE BIG LOAF",
    patience: 2.1,
    tip: 2.2,
    lines: {
      order: ["WE ARE MANY. WE ARE HUNGRY.", "ONE ORDER FOR THE WHOLE FLOOF"],
      happy: ["*GIANT FLUFFY APPROVAL*", "THE LOAF IS PLEASED"],
      wrong: ["THE LOAF DOES NOT WANT THIS"],
      leave: ["THE LOAF DEPARTS. SADLY."],
    },
  },
};

// ---------------------------------------------------------------------------
// Days
// ---------------------------------------------------------------------------
export type EventId = "zoomies" | "nap" | "heist" | "bigloaf";

export interface DayDef {
  name: string;
  subtitle: string;
  menu: ItemId[];
  breeds: Breed[];
  spawn: [number, number];
  maxCustomers: number;
  patience: number; // seconds for one item order
  comboChance: number; // chance a customer orders 2 items
  events: { t: number; id: EventId }[]; // t = seconds since opening
  goal: number;
  newThing?: string;
}

export const DAY_LENGTH = 180;

export const DAYS: DayDef[] = [
  {
    name: "Monday",
    subtitle: "Soft opening. Very soft. Like a loaf.",
    menu: ["coffee", "croissant"],
    breeds: ["beagle", "pug", "retriever"],
    spawn: [12, 16],
    maxCustomers: 3,
    patience: 60,
    comboChance: 0,
    events: [],
    goal: 70,
    newThing: "Coffee & croissants",
  },
  {
    name: "Tuesday",
    subtitle: "Word is getting out. So is the cat.",
    menu: ["coffee", "croissant", "latte"],
    breeds: ["beagle", "pug", "retriever", "cat", "shiba"],
    spawn: [11, 14],
    maxCustomers: 4,
    patience: 54,
    comboChance: 0.1,
    events: [{ t: 95, id: "heist" }],
    goal: 110,
    newThing: "Corgi latte art + Croissant Heist",
  },
  {
    name: "Wednesday",
    subtitle: "Puppuccinos and poodle demands.",
    menu: ["coffee", "croissant", "latte", "pupcup"],
    breeds: ["beagle", "pug", "retriever", "cat", "shiba", "poodle"],
    spawn: [10, 13],
    maxCustomers: 4,
    patience: 50,
    comboChance: 0.15,
    events: [
      { t: 70, id: "zoomies" },
      { t: 130, id: "heist" },
    ],
    goal: 150,
    newThing: "Puppuccinos, picky poodles + ZOOMIES",
  },
  {
    name: "Thursday",
    subtitle: "Toast shaped like a sleeping corgi. Also a long dog.",
    menu: ["coffee", "croissant", "latte", "pupcup", "toast"],
    breeds: ["beagle", "pug", "retriever", "cat", "shiba", "poodle", "dachshund"],
    spawn: [9, 12.5],
    maxCustomers: 5,
    patience: 48,
    comboChance: 0.2,
    events: [
      { t: 55, id: "nap" },
      { t: 120, id: "zoomies" },
    ],
    goal: 190,
    newThing: "Corgi toast, dachshunds + NAP ATTACK",
  },
  {
    name: "Friday",
    subtitle: "Iced coffee season. Influencers have arrived.",
    menu: ["coffee", "croissant", "latte", "pupcup", "toast", "iced"],
    breeds: ["beagle", "pug", "retriever", "cat", "shiba", "poodle", "dachshund", "influencer"],
    spawn: [8.5, 12],
    maxCustomers: 5,
    patience: 46,
    comboChance: 0.25,
    events: [
      { t: 45, id: "bigloaf" },
      { t: 110, id: "heist" },
      { t: 150, id: "nap" },
    ],
    goal: 240,
    newThing: "Iced coffee, influencers + THE BIG LOAF",
  },
  {
    name: "Saturday",
    subtitle: "Combo orders. Everyone wants two things.",
    menu: ["coffee", "croissant", "latte", "pupcup", "toast", "iced"],
    breeds: ["beagle", "pug", "retriever", "cat", "shiba", "poodle", "dachshund", "influencer"],
    spawn: [8, 11],
    maxCustomers: 6,
    patience: 46,
    comboChance: 0.4,
    events: [
      { t: 40, id: "zoomies" },
      { t: 85, id: "bigloaf" },
      { t: 125, id: "nap" },
      { t: 155, id: "heist" },
    ],
    goal: 290,
    newThing: "Complicated combinations",
  },
  {
    name: "Sunday Brunch",
    subtitle: "The finale. Every loaf in town is coming.",
    menu: ["coffee", "croissant", "latte", "pupcup", "toast", "iced"],
    breeds: ["beagle", "pug", "retriever", "cat", "shiba", "poodle", "dachshund", "influencer"],
    spawn: [6.5, 9.5],
    maxCustomers: 6,
    patience: 46,
    comboChance: 0.5,
    events: [
      { t: 25, id: "zoomies" },
      { t: 55, id: "heist" },
      { t: 80, id: "bigloaf" },
      { t: 112, id: "nap" },
      { t: 138, id: "zoomies" },
      { t: 160, id: "heist" },
    ],
    goal: 360,
    newThing: "SUNDAY BRUNCH FINALE",
  },
];

// ---------------------------------------------------------------------------
// Upgrades + cosmetics
// ---------------------------------------------------------------------------
export type UpgradeId = "espresso" | "carry" | "dash" | "patience" | "assistant";

export const UPGRADES: { id: UpgradeId; name: string; desc: string[]; costs: number[] }[] = [
  { id: "espresso", name: "Turbo Espresso", desc: ["Brews 35% faster", "Brews in a blink"], costs: [60, 130] },
  { id: "carry", name: "Second Paw Slot", desc: ["Carry TWO items at once"], costs: [150] },
  { id: "dash", name: "Longer Zoomies", desc: ["Longer dash, shorter cooldown", "Maximum zoom"], costs: [50, 110] },
  { id: "patience", name: "Comfy Cushions", desc: ["Customers wait 25% longer", "Customers wait 50% longer"], costs: [70, 150] },
  { id: "assistant", name: "Hire Biscuit", desc: ["Assistant corgi delivers items left on the PASS counter"], costs: [200] },
];

export const BREW_TIME = [3.6, 2.4, 1.4];
export const DASH_TIME = [0.15, 0.21, 0.27];
export const DASH_COOLDOWN = [1.5, 1.1, 0.75];
export const PATIENCE_MULT = [1, 1.25, 1.5];

export type ApronId = "classic" | "mint" | "coral" | "polka" | "bowtie";
export const APRONS: { id: ApronId; name: string; cost: number; color: string }[] = [
  { id: "classic", name: "Classic", cost: 0, color: "#ffffff" },
  { id: "mint", name: "Mint Fresh", cost: 30, color: "#7fcfb0" },
  { id: "coral", name: "Coral Crush", cost: 30, color: "#f2786b" },
  { id: "polka", name: "Polka Loaf", cost: 45, color: "#fff2c2" },
  { id: "bowtie", name: "Fancy Bowtie", cost: 45, color: "#3b5a8a" },
];

export type DecorId = "plant" | "bunting" | "lights" | "portrait";
export const DECOR: { id: DecorId; name: string; cost: number }[] = [
  { id: "plant", name: "Potted Monstera", cost: 40 },
  { id: "bunting", name: "Paper Bunting", cost: 50 },
  { id: "lights", name: "Fairy Lights", cost: 60 },
  { id: "portrait", name: "Royal Corgi Portrait", cost: 60 },
];
export const DECOR_TIP_BONUS = 0.05;

export const comboMult = (combo: number) => 1 + Math.min(combo, 8) * 0.25;
