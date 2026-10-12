// Sticker book + achievement stickers (the nostalgia pack's collection layer).
// Discoveries are things the player has actually met; achievements are small goals.
// Neither one gates the main game, uses timers, or punishes time away.
import Phaser from "phaser";
import { APRONS, COLORS as C, DAYS, ITEM_INFO, ItemId, SERVABLE, W } from "./config";
import { audio } from "./audio";
import { save } from "./save";
import { txt } from "./ui";

// ------------------------------------------------------------------ achievements
export interface AchDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
}

export const ACHIEVEMENTS: AchDef[] = [
  { id: "first", name: "First pour", desc: "Serve your very first order.", icon: "item_americano" },
  { id: "combo5", name: "On a roll", desc: "Serve 5 orders in a row.", icon: "star" },
  { id: "combo10", name: "LOAF-TASTIC", desc: "Serve 10 orders in a row.", icon: "star_coral" },
  { id: "spotless", name: "Spotless shift", desc: "Finish a day with 6+ orders, no mix-ups and no walkouts.", icon: "star_mint" },
  { id: "three", name: "Three-star shift", desc: "Earn 3 stars on any day.", icon: "star" },
  { id: "special", name: "Chef's pick", desc: "Serve Today's Special.", icon: "icon_special" },
  { id: "golden", name: "Struck gold", desc: "Serve a golden guest.", icon: "coin" },
  { id: "bandits", name: "Bandit catcher", desc: "Catch 5 pastry bandits.", icon: "mask" },
  { id: "wakeup", name: "Gentle wake-up", desc: "Boop Mochi awake.", icon: "napcorgi_tri" },
  { id: "lastorders", name: "Last orders", desc: "Serve every guest after the last-orders bell.", icon: "icon_bell" },
  { id: "daytona", name: "Daytona driver", desc: "Serve a Brew Daytona.", icon: "item_daytona" },
  { id: "week", name: "Corgi of the week", desc: "Survive Sunday Brunch.", icon: "heart" },
  { id: "legend", name: "Brunch legend", desc: "Serve 30 orders in one Endless Brunch.", icon: "item_pally" },
  { id: "decked", name: "Fully decked out", desc: "Own every café decoration.", icon: "icon_stickers" },
  { id: "collector", name: "Sticker collector", desc: "Fill half of the sticker book.", icon: "icon_book" },
];
const ACH_BY_ID = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));

// ------------------------------------------------------------------ sticker book
export type BookCat = "guests" | "staff" | "menu" | "moments";
export interface BookEntry {
  key: string;
  cat: BookCat;
  name: string;
  hint: string;
  /** Texture key, or a corgi drawn from the rig. */
  icon?: string;
  corgi?: { coat: "red" | "tri"; apron: string; hat?: string };
  tint?: number;
}

const dayFor = (it: ItemId) => {
  const i = DAYS.findIndex((d) => d.menu.includes(it));
  return i <= 0 ? "On the menu from day one" : `On the menu from ${DAYS[i].name.split(" ")[0]}`;
};

export const BOOK: BookEntry[] = [
  // guests (every paying customer is a human)
  { key: "role:regular", cat: "guests", name: "Relaxed regular", hint: "Pops in every day", icon: "h_reg1_sit_h" },
  { key: "role:newcomer", cat: "guests", name: "First-time visitor", hint: "Pops in every day", icon: "h_new1_sit_h" },
  { key: "role:builder", cat: "guests", name: "Tech builder", hint: "Pops in every day", icon: "h_bld1_sit_h" },
  { key: "role:sceptic", cat: "guests", name: "Grumpy commuter", hint: "Arrives from Tuesday", icon: "h_scp1_sit_h" },
  { key: "role:enthusiast", cat: "guests", name: "Coffee enthusiast", hint: "Arrives from Wednesday", icon: "h_ent1_sit_h" },
  { key: "role:creator", cat: "guests", name: "Content creator", hint: "Arrives from Friday", icon: "h_cre1_sit_h" },
  { key: "role:group", cat: "guests", name: "Visiting group", hint: "A whole team, late in the week", icon: "h_grp1_sit_h" },
  { key: "role:golden", cat: "guests", name: "Golden guest", hint: "Rare. Roughly once a week", icon: "h_reg2_sit_h", tint: 0xf6cf5a },
  // corgi staff
  { key: "staff:you", cat: "staff", name: "You, the barista", hint: "Head of loaf operations", corgi: { coat: "red", apron: "classic" } },
  { key: "staff:greeter", cat: "staff", name: "Door greeter", hint: "Says hi to everyone", corgi: { coat: "tri", apron: "classic" } },
  { key: "staff:pudding", cat: "staff", name: "Pudding", hint: "Lounge corgi, loves a pat", corgi: { coat: "red", apron: "none" } },
  { key: "staff:biscuit", cat: "staff", name: "Biscuit", hint: "Hire an assistant in the shop", corgi: { coat: "tri", apron: "staff", hat: "cap" } },
  { key: "staff:mochi", cat: "staff", name: "Mochi", hint: "Very sleepy colleague", icon: "napcorgi_tri" },
  { key: "staff:zoomies", cat: "staff", name: "Pickle, Waffle & Nugget", hint: "Zoomies crew", corgi: { coat: "red", apron: "staff" } },
  { key: "staff:bandit", cat: "staff", name: "The pastry bandit", hint: "Off duty. Up to no good", corgi: { coat: "red", apron: "none", hat: "mask" } },
  { key: "staff:archie", cat: "staff", name: "Archie", hint: "Give him a cushion (shop)", corgi: { coat: "red", apron: "none" } },
  // the playable London menu
  ...SERVABLE.map((it): BookEntry => ({ key: `item:${it}`, cat: "menu", name: ITEM_INFO[it].name, hint: dayFor(it), icon: `item_${it}` })),
  // moments
  { key: "moment:special", cat: "moments", name: "Today's Special", hint: "Serve the special for double", icon: "icon_special" },
  { key: "moment:heist", cat: "moments", name: "Pastry heist", hint: "Tuesday onwards", icon: "mask" },
  { key: "moment:zoomies", cat: "moments", name: "Zoomies", hint: "Wednesday onwards", icon: "paw" },
  { key: "moment:nap", cat: "moments", name: "Nap attack", hint: "Thursday onwards", icon: "napcorgi_tri" },
  { key: "moment:group", cat: "moments", name: "The visiting group", hint: "Friday onwards", icon: "icon_polaroids" },
  { key: "moment:lastorders", cat: "moments", name: "Last orders", hint: "Clear the room after the bell", icon: "icon_bell" },
  { key: "moment:brunch", cat: "moments", name: "Sunday Brunch", hint: "The big finale day", icon: "item_juicebox" },
  { key: "moment:endless", cat: "moments", name: "Endless Brunch", hint: "Unlocks after a full week", icon: "icon_endless" },
];

export const BOOK_CATS: { id: BookCat; name: string }[] = [
  { id: "guests", name: "Guests" },
  { id: "staff", name: "Staff" },
  { id: "menu", name: "Menu" },
  { id: "moments", name: "Moments" },
];

export function bookProgress() {
  const seen = new Set(save.data.seen);
  return { seen: BOOK.filter((b) => seen.has(b.key)).length, total: BOOK.length, ach: save.data.ach.length, achTotal: ACHIEVEMENTS.length };
}

/** Record a discovery. Returns true the first time. Quietly emits "sticker-new" on the scene. */
export function markSeen(scene: Phaser.Scene | undefined, key: string) {
  const d = save.data;
  if (d.seen.includes(key)) return false;
  d.seen.push(key);
  save.write();
  scene?.events.emit("sticker-new", key);
  const p = bookProgress();
  if (p.seen >= Math.ceil(p.total / 2)) unlock(scene, "collector");
  return true;
}

/** Unlock an achievement sticker (once). Shows a small toast and grants any apron reward. */
export function unlock(scene: Phaser.Scene | undefined, id: string) {
  const d = save.data;
  const a = ACH_BY_ID.get(id);
  if (!a || d.ach.includes(id)) return false;
  d.ach.push(id);
  const apron = APRONS.find((x) => x.earn === id);
  if (apron && !d.aprons.includes(apron.id)) d.aprons.push(apron.id);
  save.write();
  if (scene && scene.sys.isActive()) queueToast(scene, a, apron?.name);
  return true;
}

export const hasAch = (id: string) => save.data.ach.includes(id);

/** Scale an image so its frame fits inside a square of `size`. */
export function fitIcon(img: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite, size: number) {
  const f = img.frame;
  img.setScale(Math.min(1.6, size / Math.max(f.width, f.height)));
  return img;
}

// ------------------------------------------------------------------ toast
const busyUntil = new WeakMap<Phaser.Scene, number>();
const TOAST_MS = 2600;

function queueToast(scene: Phaser.Scene, a: AchDef, apronName?: string) {
  const now = scene.time.now;
  const start = Math.max(now, busyUntil.get(scene) ?? 0);
  busyUntil.set(scene, start + TOAST_MS + 150);
  if (start <= now) showToast(scene, a, apronName);
  else scene.time.delayedCall(start - now, () => showToast(scene, a, apronName));
}

/** A small Xbox-style sticker that drops in under the HUD, then peels away. */
function showToast(scene: Phaser.Scene, a: AchDef, apronName?: string) {
  if (!scene.sys.isActive()) return;
  audio.play("unlock");
  const reduce = save.data.settings.reducedMotion;
  const w = 370;
  const h = apronName ? 74 : 62;
  // under the HUD in a shift; tucked at the very top of menus and result pages
  const ty = scene.scene.key === "Game" ? 86 : h / 2 + 6;
  const c = scene.add.container(W / 2, ty).setDepth(30000);
  const g = scene.add.graphics();
  g.fillStyle(0x2b2622, 0.18).fillRoundedRect(-w / 2 + 4, -h / 2 + 5, w, h, 16);
  g.fillStyle(0xfffaf0, 1).fillRoundedRect(-w / 2, -h / 2, w, h, 16);
  g.lineStyle(3, 0x2b2622, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, 16);
  g.fillStyle(0xf6c453, 1).fillCircle(-w / 2 + 38, 0, 26);
  g.lineStyle(2.5, 0x2b2622, 1).strokeCircle(-w / 2 + 38, 0, 26);
  const icon = scene.add.image(-w / 2 + 38, 0, a.icon, 0);
  fitIcon(icon, 38);
  const tag = txt(scene, -w / 2 + 76, -h / 2 + 16, "STICKER UNLOCKED", 15, C.inkSoft, false).setOrigin(0, 0.5);
  const name = txt(scene, -w / 2 + 76, apronName ? -2 : 8, a.name, 26, C.ink, true).setOrigin(0, 0.5);
  const parts: Phaser.GameObjects.GameObject[] = [g, icon, tag, name];
  if (apronName) parts.push(txt(scene, -w / 2 + 76, h / 2 - 15, `New apron: ${apronName}`, 16, C.mintDark, true).setOrigin(0, 0.5));
  c.add(parts);
  c.setAngle(-1.5);
  if (reduce) {
    c.setAlpha(0);
    scene.tweens.add({ targets: c, alpha: 1, duration: 200 });
  } else {
    c.setY(-60);
    scene.tweens.add({ targets: c, y: ty, duration: 320, ease: "Back.out" });
    scene.tweens.add({ targets: icon, angle: { from: -25, to: 0 }, scale: { from: icon.scale * 1.6, to: icon.scale }, duration: 380, delay: 140, ease: "Back.out" });
  }
  scene.tweens.add({ targets: c, alpha: 0, y: reduce ? ty : ty - 46, delay: TOAST_MS - 400, duration: 360, ease: "Quad.in", onComplete: () => c.destroy() });
}
