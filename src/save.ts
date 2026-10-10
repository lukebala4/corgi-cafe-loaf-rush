import { ApronId, DecorId, UpgradeId } from "./config";
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
  };
}

function load(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults();
    const d = JSON.parse(raw) as Partial<SaveData>;
    const base = defaults();
    return {
      ...base,
      ...d,
      upgrades: { ...base.upgrades, ...(d.upgrades ?? {}) },
      settings: { ...base.settings, ...(d.settings ?? {}) },
      aprons: d.aprons?.length ? d.aprons : base.aprons,
      decor: d.decor ?? [],
      stars: d.stars ?? [],
    } as SaveData;
  } catch {
    return defaults();
  }
}

export const save: { data: SaveData; write(): void; reset(): void; hasProgress(): boolean; applyAudio(): void; newRun(): void } = {
  data: load(),
  write() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.data));
    } catch {
      /* storage may be unavailable (private mode) — the game still works */
    }
  },
  reset() {
    this.data = defaults(this.data.settings);
    this.write();
  },
  /** Replay after the finale: keep cosmetics + settings + wins, restart the week. */
  newRun() {
    const keep = { aprons: this.data.aprons, apron: this.data.apron, decor: this.data.decor, wins: this.data.wins, settings: this.data.settings };
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
