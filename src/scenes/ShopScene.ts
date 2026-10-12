import Phaser from "phaser";
import { APRONS, COLORS as C, DAYS, DECOR, TIER_DAY, UPGRADES } from "../config";
import { boil } from "../art/textures";
import { CorgiRig } from "../game/corgi";
import { burst, button, floatText, scrap, txt } from "../ui";
import { audio } from "../audio";
import { save } from "../save";
import { ACHIEVEMENTS, unlock } from "../meta";

export class ShopScene extends Phaser.Scene {
  private coinsT!: Phaser.GameObjects.Text;
  /** Decor panel page (kept across the restart after a purchase). */
  private decorPage = 0;
  /** Apron being tried on in the preview. */
  private apronSel: string = "classic";
  constructor() {
    super("Shop");
  }

  create(data: { decorPage?: number } = {}) {
    this.add.image(0, 0, "bg_paper").setOrigin(0);
    audio.music("title");
    const d = save.data;
    txt(this, 330, 52, "The Loaf Shop", 58, C.caramel, true, { stroke: C.ink, strokeThickness: 3 }).setAngle(-2);
    txt(this, 330, 101, "Fresh stock arrives after Tuesday and Thursday", 19, C.inkSoft).setAngle(-1);
    const cs = scrap(this, 1060, 52, 240, 50, 2, false);
    cs.add(this.add.image(-80, 0, "coin", 0));
    this.coinsT = txt(this, 14, 0, `${d.coins} coins`, 30, C.ink, true);
    cs.add(this.coinsT);

    // ---------------- functional upgrades (scattered taped cards)
    UPGRADES.forEach((u, i) => {
      const x = 170 + i * 235;
      const y = 245 + (i % 2 ? 14 : -6);
      const lvl = d.upgrades[u.id];
      const max = u.costs.length;
      const card = scrap(this, x, y, 210, 220, (i % 2 ? 1.5 : -1.5) * (1 + (i % 3) * 0.4), true);
      void card;
      txt(this, x, y - 78, u.name, 27, C.ink, true);
      for (let k = 0; k < max; k++) boil(this, x - ((max - 1) * 24) / 2 + k * 24, y - 46, k < lvl ? "star" : "star_empty").setScale(0.8);
      const desc = lvl >= max ? "Maxed out. Pure loaf power." : u.desc[lvl];
      txt(this, x, y + 2, desc, 19, C.inkSoft, false, { wordWrap: { width: 180 } });
      const cost = u.costs[lvl];
      // later levels restock through the week, so the shop always has something new
      const restock = lvl < max ? (TIER_DAY[lvl] ?? 0) : 0;
      const inStock = d.day >= restock;
      const label = lvl >= max ? "owned ✓" : !inStock ? `Restocks after ${DAYS[restock - 1].name.slice(0, 3)}` : `Buy · ${cost}`;
      const b = button(this, x, y + 74, 180, 44, label, lvl >= max ? "#efe5cc" : C.mint, () => {
        if (lvl >= max || !inStock || d.coins < cost) return;
        d.coins -= cost;
        d.upgrades[u.id] = lvl + 1;
        save.write();
        this.bought(x, y);
      }, !inStock && lvl < max ? 18 : 22);
      if (lvl >= max || !inStock || d.coins < cost) b.setEnabled(lvl >= max);
      if (lvl >= max || !inStock) b.disableInteractive();
      if (lvl > 0 && lvl < max && inStock && restock === d.day) {
        const tag = txt(this, x + 70, y - 104, "new stock!", 18, "#fffaf0", true, { backgroundColor: C.coral, padding: { x: 6, y: 2 } });
        tag.setAngle(8).setDepth(20);
        this.tweens.add({ targets: tag, scale: 1.08, yoyo: true, repeat: -1, duration: 600 });
      }
    });

    // ---------------- cosmetics: aprons (tap a swatch to try it on; three are earned from stickers)
    const ap = scrap(this, 360, 520, 600, 190, -0.8, false);
    void ap;
    txt(this, 400, 445, "Aprons", 30, C.ink, true);
    const preview = new CorgiRig(this, 135, 560, 1.1, d.apron);
    preview.setDepth(10);
    this.time.addEvent({ delay: 16, loop: true, callback: () => preview.animate(0.016, 0, 0, 1) });
    this.apronSel = d.apron;
    const rack = this.add.container(0, 0);
    const drawRack = () => {
      rack.removeAll(true);
      const sel = APRONS.find((a) => a.id === this.apronSel) ?? APRONS[0];
      preview.setApron(sel.id);
      APRONS.forEach((a, i) => {
        const x = 226 + i * 56;
        const y = 496;
        const owned = d.aprons.includes(a.id);
        const worn = d.apron === a.id;
        const picked = a.id === sel.id;
        if (picked) rack.add(this.add.circle(x, y, 27, 0xf6c453, 0.55));
        const sw = this.add.circle(x, y, 19, Phaser.Display.Color.HexStringToColor(a.color).color).setStrokeStyle(worn ? 5 : 3, worn ? 0x4fae8c : 0x2b2622);
        if (!owned && a.earn) sw.setAlpha(0.5);
        rack.add(sw);
        if (a.id === "polka") for (const [dx, dy] of [[-7, -5], [5, -2], [-2, 8]]) rack.add(this.add.circle(x + dx, y + dy, 2.6, 0xf2786b));
        if (a.id === "bowtie") rack.add(this.add.image(x, y, "bowtie", 0).setScale(0.85));
        if (a.earn) rack.add(this.add.image(x + 15, y - 15, owned ? "star" : "star_empty", 0).setScale(0.62));
        const hit = this.add.zone(x, y, 52, 56).setInteractive({ useHandCursor: true });
        hit.on("pointerdown", () => {
          audio.play("click");
          this.apronSel = a.id;
          drawRack();
        });
        rack.add(hit);
      });
      // details for the swatch being tried on
      const owned = d.aprons.includes(sel.id);
      const worn = d.apron === sel.id;
      const ach = sel.earn ? ACHIEVEMENTS.find((x) => x.id === sel.earn) : undefined;
      rack.add(txt(this, 214, 546, `${sel.name} apron`, 24, C.ink, true).setOrigin(0, 0.5));
      const status = worn ? "Wearing it now." : owned ? (ach ? `Earned: ${ach.name} sticker.` : "Yours to wear.") : ach ? `Earn it: ${ach.desc}` : `${sel.cost} coins.`;
      rack.add(txt(this, 214, 580, status, 16, ach && !owned ? C.coral : C.inkSoft, false, { wordWrap: { width: 300 } }).setOrigin(0, 0.5));
      const label = worn ? "worn" : owned ? "Wear" : ach ? "Locked" : `Buy · ${sel.cost}`;
      const b = button(this, 588, 560, 118, 42, label, worn ? "#efe5cc" : owned ? "#f6c453" : ach ? "#efe5cc" : C.mint, () => {
        if (worn) return;
        if (!owned) {
          if (ach || d.coins < sel.cost) return;
          d.coins -= sel.cost;
          d.aprons.push(sel.id);
        }
        d.apron = sel.id;
        save.write();
        this.bought(588, 520);
      }, 20);
      if ((!owned && (ach || d.coins < sel.cost)) || worn) b.setEnabled(worn);
      if (worn) b.disableInteractive();
      rack.add(b);
    };
    drawRack();
    // owning every decoration earns a sticker (checked here so the toast survives the shop refresh)
    if (DECOR.every((x) => d.decor.includes(x.id))) unlock(this, "decked");

    // ---------------- decorations (4 per page)
    const dp = scrap(this, 960, 520, 470, 190, 1.2, false);
    void dp;
    txt(this, 960, 445, "Café vibes  (+5% tips each)", 26, C.ink, true);
    const icons: Record<string, [string, number]> = {
      plant: ["deco_plant", 0.4],
      bunting: ["icon_polaroids", 0.85],
      lights: ["icon_lamp", 0.9],
      portrait: ["deco_portrait", 0.45],
      power: ["icon_power", 0.95],
      events: ["icon_chalk", 0.95],
      stickers: ["icon_stickers", 0.95],
      archie: ["icon_archie", 1],
    };
    const PER = 4;
    const pages = Math.ceil(DECOR.length / PER);
    const firstOpen = Math.floor(Math.max(0, DECOR.findIndex((x) => !d.decor.includes(x.id))) / PER);
    this.decorPage = Phaser.Math.Clamp(data.decorPage ?? firstOpen, 0, pages - 1);
    const box = this.add.container(0, 0);
    const pageT = txt(this, 1160, 447, "", 18, C.inkSoft);
    const drawDecor = () => {
      box.removeAll(true);
      pageT.setText(`${this.decorPage + 1}/${pages}`);
      DECOR.slice(this.decorPage * PER, this.decorPage * PER + PER).forEach((dc, i) => {
        const x = 815 + i * 98;
        const owned = d.decor.includes(dc.id);
        const [key, sc] = icons[dc.id];
        box.add(boil(this, x, 505, key).setScale(sc));
        box.add(txt(this, x, 548, dc.name, 14, C.inkSoft, false, { wordWrap: { width: 92 } }));
        const b = button(this, x, 586, 80, 34, owned ? "✓" : `${dc.cost}`, owned ? "#efe5cc" : C.mint, () => {
          if (owned || d.coins < dc.cost) return;
          d.coins -= dc.cost;
          d.decor.push(dc.id);
          save.write();
          this.bought(x, 505);
        }, 18);
        if (owned) b.disableInteractive();
        else if (d.coins < dc.cost) b.setEnabled(false);
        box.add(b);
      });
    };
    const flip = (dir: number) => {
      this.decorPage = (this.decorPage + dir + pages) % pages;
      audio.play("place");
      drawDecor();
    };
    button(this, 744, 540, 34, 44, "‹", "#fffaf0", () => flip(-1), 26);
    button(this, 1177, 540, 34, 44, "›", "#fffaf0", () => flip(1), 26);
    // bigger invisible finger targets around the small page arrows (they sit behind the item buttons)
    for (const [zx, dir] of [[742, -1], [1190, 1]] as const) {
      this.add
        .zone(zx, 540, 60, 130)
        .setDepth(-1)
        .setInteractive({ useHandCursor: true })
        .on("pointerup", () => flip(dir));
    }
    drawDecor();
    // ---------------- next day
    const next = Math.min(d.day, DAYS.length - 1);
    const nd = DAYS[next];
    const go = button(this, 1000, 668, 420, 60, `Open café · Day ${next + 1}: ${nd.name}`, C.coral, () => this.scene.start("Game", { day: next }), 26);
    this.tweens.add({ targets: go, scale: 1.03, yoyo: true, repeat: -1, duration: 700 });
    txt(this, 470, 668, nd.subtitle, 20, C.inkSoft).setAngle(-1);
    button(this, 110, 668, 130, 42, "‹ Title", "#fffaf0", () => this.scene.start("Title"), 22);
  }

  private bought(x: number, y: number) {
    audio.play("coin");
    audio.play("combo", 3);
    burst(this, x, y, ["star", "star_mint", "heart"], 10);
    floatText(this, x, y - 40, "yay!", C.mintDark, 28);
    this.time.delayedCall(350, () => this.scene.restart({ decorPage: this.decorPage }));
  }
}
