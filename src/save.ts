import { APRONS, ApronId, DAYS, DECOR, DecorId, UPGRADES, UpgradeId } from "./config";
import { audio } from "./audio";

export interface Settings {
  music: boolean;
  sfx: boolean;
  muted: boolean;
  reducedMotion: boolean;
}

export interface SaveData {
  v: 1;
  day: number; // index of the next day to play (0..6); 7 = finished
  coins: number;
  totalEarned: number;
  upgrades: Record<UpgradeId, number>;
  aprons: ApronId[];
  apron: ApronId;
  decor: DecorId[];
  stars: number[];
  tutorialDone: boolean;
  wins: number;
  settings: Settings;
  // ---- collection + meta progress (added with the sticker book; all optional in older saves)
  /** Sticker book discoveries, e.g. "role:regular", "item:latte", "staff:mochi", "moment:zoomies". */
  seen: string[];
  /** Unlocked achievement sticker ids. */
  ach: string[];
  /** Best Endless Brunch score (coins). */
  endlessBest: number;
  /** Pastry bandits caught, all time (for the Bandit catcher sticker). */
  bandits: number;
  /** A golden guest already visited during this week (guarantees one late in the week otherwise). */
  goldenWeek: boolean;
}

const KEY = "corgicafe.save.v1";

function defaults(settings?: Settings): SaveData {
  const reduced = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  return {
    v: 1,
    day: 0,
    coins: 0,
    totalEarned: 0,
    upgrades: { espresso: 0, carry: 0, dash: 0, patience: 0, assistant: 0 },
    aprons: ["classic"],
    apron: "classic",
    decor: [],
    stars: [],
    tutorialDone: false,
    wins: 0,
    settings: settings ?? { music: true, sfx: true, muted: false, reducedMotion: reduced },
    seen: [],
    ach: [],
    endlessBest: 0,
    bandits: 0,
    goldenWeek: false,
  };
}

const num = (v: unknown, lo: number, hi: number, dflt: number) =>
  typeof v === "number" && Number.isFinite(v) ? Math.max(lo, Math.min(hi, Math.floor(v))) : dflt;
const strList = (v: unknown, max = 400) =>
  [...new Set((Array.isArray(v) ? v : []).filter((x): x is string => typeof x === "string" && x.length > 0 && x.length < 40))].slice(0, max);

/**
 * Load and migrate the save. Older V1 saves (dog-customer era) carry the same ids, so they load as-is;
 * anything unknown is dropped field by field instead of resetting the whole save. A save that cannot be
 * parsed at all is copied to a backup key before starting fresh, so progress is never silently destroyed.
 */
function load(): SaveData {
  const base = defaults();
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return base;
  }
  if (!raw) return base;
  let d: Partial<SaveData>;
  try {
    d = JSON.parse(raw) as Partial<SaveData>;
    if (!d || typeof d !== "object") throw new Error("not an object");
  } catch {
    try {
      localStorage.setItem(`${KEY}.backup`, raw);
    } catch {
      /* ignore */
    }
    console.warn("Corgi Cafe: save data was unreadable; a copy was kept under", `${KEY}.backup`);
    return base;
  }
  const apronIds = new Set<string>(APRONS.map((a) => a.id));
  const decorIds = new Set<string>(DECOR.map((x) => x.id));
  const upgrades = { ...base.upgrades };
  for (const u of UPGRADES) upgrades[u.id] = num(d.upgrades?.[u.id], 0, u.costs.length, 0);
  const aprons = (Array.isArray(d.aprons) ? d.aprons : []).filter((a): a is ApronId => apronIds.has(a));
  if (!aprons.includes("classic")) aprons.unshift("classic");
  const apron = d.apron && aprons.includes(d.apron) ? d.apron : "classic";
  const st = d.settings ?? ({} as Partial<Settings>);
  return {
    v: 1,
    day: num(d.day, 0, DAYS.length, 0),
    coins: num(d.coins, 0, 1e7, 0),
    totalEarned: num(d.totalEarned, 0, 1e8, 0),
    upgrades,
    aprons: [...new Set(aprons)],
    apron,
    decor: [...new Set((Array.isArray(d.decor) ? d.decor : []).filter((x): x is DecorId => decorIds.has(x)))],
    stars: (Array.isArray(d.stars) ? d.stars : []).slice(0, DAYS.length).map((x) => num(x, 0, 3, 0)),
    tutorialDone: d.tutorialDone === true,
    wins: num(d.wins, 0, 1e6, 0),
    settings: {
      music: typeof st.music === "boolean" ? st.music : base.settings.music,
      sfx: typeof st.sfx === "boolean" ? st.sfx : base.settings.sfx,
      muted: typeof st.muted === "boolean" ? st.muted : base.settings.muted,
      reducedMotion: typeof st.reducedMotion === "boolean" ? st.reducedMotion : base.settings.reducedMotion,
    },
    seen: strList(d.seen),
    ach: strList(d.ach),
    endlessBest: num(d.endlessBest, 0, 1e7, 0),
    bandits: num(d.bandits, 0, 1e6, 0),
    goldenWeek: d.goldenWeek === true,
  };
}

export const save: { data: SaveData; write(): void; reset(): void; hasProgress(): boolean; applyAudio(): void; newRun(): void } = {
  data: load(),
  write() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.data));
    } catch {
      /* storage may be unavailable (private mode); the game still works */
    }
  },
  reset() {
    this.data = defaults(this.data.settings);
    this.write();
  },
  /** Replay after the finale: keep cosmetics, settings, wins and the sticker book; restart the week. */
  newRun() {
    const dd = this.data;
    const keep = {
      aprons: dd.aprons,
      apron: dd.apron,
      decor: dd.decor,
      wins: dd.wins,
      settings: dd.settings,
      seen: dd.seen,
      ach: dd.ach,
      endlessBest: dd.endlessBest,
      bandits: dd.bandits,
    };
    this.data = { ...defaults(this.data.settings), ...keep, tutorialDone: true };
    this.write();
  },
  hasProgress() {
    return this.data.day > 0 || this.data.coins > 0;
  },
  applyAudio() {
    audio.configure(this.data.settings);
  },
};
