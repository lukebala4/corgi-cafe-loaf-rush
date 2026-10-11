// Recipe strip: a row of small taped cards at the bottom of the screen, one per item currently
// ordered, showing the item's name, which stations make it, and the next step for what is in paw.
import Phaser from "phaser";
import { COLORS as C, ITEM_INFO, ItemId } from "../config";
import { scrap, txt } from "../ui";
import type { GameScene } from "../scenes/GameScene";

/** Station chain for each orderable item. Labels match the signs above the back-bar stations. */
const CHAINS: Partial<Record<ItemId, [string, ItemId][]>> = {
  americano: [
    ["CUPS", "cup"],
    ["ESPRESSO", "americano"],
  ],
  latte: [
    ["CUPS", "cup"],
    ["MILK", "milk"],
    ["ESPRESSO", "latte"],
  ],
  icedlatte: [
    ["CUPS", "cup"],
    ["MILK", "milk"],
    ["ESPRESSO", "latte"],
    ["COLD BAR", "icedlatte"],
  ],
  pally: [
    ["CUPS", "cup"],
    ["MILK", "milk"],
    ["ESPRESSO", "latte"],
    ["COLD BAR", "icedlatte"],
    ["COLD BAR", "pally"],
  ],
  daytona: [
    ["CUPS", "cup"],
    ["COLD BAR", "daytona"],
  ],
  juicebox: [
    ["CUPS", "cup"],
    ["BLENDER", "juicebox"],
  ],
  croissant: [["CROISSANTS", "croissant"]],
  cake: [["CAKE", "cake"]],
  sourdough: [["PRESS", "sourdough"]],
};

/** Short station path shown on the card. */
export const RECIPE_PATH: Partial<Record<ItemId, string>> = {
  americano: "CUPS → ESPRESSO",
  latte: "CUPS → MILK → ESPRESSO",
  icedlatte: "make a Latte → COLD BAR",
  pally: "make an Iced Latte → COLD BAR",
  daytona: "CUPS → COLD BAR",
  juicebox: "CUPS → BLENDER",
  croissant: "grab one at CROISSANTS",
  cake: "grab a slice at CAKE",
  sourdough: "PRESS, take it before it burns",
};

/** What to do next with the items in paw for this recipe. */
export function nextStep(item: ItemId, held: ItemId[]): string {
  const chain = CHAINS[item];
  if (!chain) return "";
  if (held.includes(item)) return "ready: serve it!";
  if (chain.length === 1) return "";
  let idx = -1;
  chain.forEach(([, out], i) => {
    if (held.includes(out)) idx = Math.max(idx, i);
  });
  return `next: ${chain[idx + 1][0]}`;
}

const CARD_H = 60;
const MAX_CARDS = 3;

export class RecipeStrip {
  g: GameScene;
  root: Phaser.GameObjects.Container;
  key = "";
  bounds = { x0: 0, x1: 0 };
  constructor(g: GameScene) {
    this.g = g;
    this.root = g.add.container(0, 0).setDepth(8200);
  }
  /** Items currently ordered, most urgent customer first. */
  private wanted(): ItemId[] {
    const cs = this.g.customers.filter((c) => c.waiting).sort((a, b) => a.patienceFrac - b.patienceFrac);
    const out: ItemId[] = [];
    for (const c of cs)
      c.order.forEach((it, i) => {
        if (!c.done[i] && CHAINS[it] && !out.includes(it)) out.push(it);
      });
    return out.slice(0, MAX_CARDS);
  }
  update() {
    const items = this.g.tutorialMode ? [] : this.wanted();
    const held = this.g.player.items;
    const key = items.map((it) => `${it}:${nextStep(it, held)}`).join("|");
    if (key !== this.key) {
      this.key = key;
      this.rebuild(items, held);
    }
    // fade out of the way when the barista walks underneath
    const p = this.g.player;
    const under = items.length > 0 && p.y > 610 && p.x > this.bounds.x0 - 30 && p.x < this.bounds.x1 + 30;
    const a = under ? 0.3 : 1;
    this.root.alpha += (a - this.root.alpha) * 0.2;
  }
  private rebuild(items: ItemId[], held: ItemId[]) {
    this.root.removeAll(true);
    if (!items.length) return;
    const g = this.g;
    const cards: { w: number; build: (x: number) => void }[] = [];
    for (const it of items) {
      const name = ITEM_INFO[it].name;
      const path = RECIPE_PATH[it] ?? "";
      const next = nextStep(it, held);
      const probe = [txt(g, 0, 0, name, 18, C.ink, true), txt(g, 0, 0, path, 15, C.inkSoft), txt(g, 0, 0, next, 15, C.orangeDark, true)];
      const w = Math.max(180, Math.ceil(Math.max(...probe.map((t) => t.width))) + 74);
      probe.forEach((t) => t.destroy());
      cards.push({
        w,
        build: (x: number) => {
          const y = 720 - CARD_H / 2 - 8;
          const card = scrap(g, x, y, w, CARD_H, Phaser.Math.Between(-1, 1), false);
          const icon = g.add.image(-w / 2 + 32, 2, `item_${it}`, 0).setScale(0.82);
          const tx = -w / 2 + 62;
          const t1 = txt(g, tx, -15, name, 18, C.ink, true).setOrigin(0, 0.5);
          const t2 = txt(g, tx, 4, path, 15, C.inkSoft).setOrigin(0, 0.5);
          const t3 = txt(g, tx, 21, next, 15, next.startsWith("ready") ? C.sageDark : C.orangeDark, true).setOrigin(0, 0.5);
          card.add([icon, t1, t2, t3]);
          this.root.add(card);
        },
      });
    }
    const gap = 12;
    const total = cards.reduce((s, c) => s + c.w, 0) + gap * (cards.length - 1);
    let x = 640 - total / 2;
    this.bounds = { x0: x, x1: x + total };
    for (const c of cards) {
      c.build(x + c.w / 2);
      x += c.w + gap;
    }
  }
}
