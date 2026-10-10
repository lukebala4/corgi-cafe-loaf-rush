import Phaser from "phaser";
import { APRONS, COLORS as C, DAYS, DECOR, UPGRADES } from "../config";
import { boil } from "../art/textures";
import { CorgiRig } from "../game/corgi";
import { burst, button, floatText, scrap, txt } from "../ui";
import { audio } from "../audio";
import { save } from "../save";

export class ShopScene extends Phaser.Scene {
  private coinsT!: Phaser.GameObjects.Text;
  constructor() {
    super("Shop");
  }

  create() {
    this.add.image(0, 0, "bg_paper").setOrigin(0);
    audio.music("title");
    const d = save.data;
    txt(this, 330, 52, "The Loaf Shop", 58, C.caramel, true, { stroke: C.ink, strokeThickness: 3 }).setAngle(-2);
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
      const b = button(this, x, y + 74, 160, 44, lvl >= max ? "owned ✓" : `Buy · ${cost}`, lvl >= max ? "#efe5cc" : C.mint, () => {
        if (lvl >= max || d.coins < cost) return;
        d.coins -= cost;
        d.upgrades[u.id] = lvl + 1;
        save.write();
        this.bought(x, y);
      }, 22);
      if (lvl >= max || d.coins < cost) b.setEnabled(lvl >= max ? true : false);
      if (lvl >= max) b.disableInteractive();
    });

    // ---------------- cosmetics: aprons
    const ap = scrap(this, 360, 520, 600, 190, -0.8, false);
    void ap;
    txt(this, 360, 445, "Aprons", 30, C.ink, true);
    const preview = new CorgiRig(this, 135, 560, 1.1, d.apron);
    preview.setDepth(10);
    this.time.addEvent({ delay: 16, loop: true, callback: () => preview.animate(0.016, 0, 0, 1) });
    APRONS.forEach((a, i) => {
      const x = 270 + i * 92;
      const owned = d.aprons.includes(a.id);
      const worn = d.apron === a.id;
      const sw = this.add.circle(x, 510, 22, Phaser.Display.Color.HexStringToColor(a.color).color).setStrokeStyle(worn ? 5 : 3, worn ? 0x4fae8c : 0x2b2622);
      if (a.id === "polka") for (const [dx, dy] of [[-8, -6], [6, -2], [-2, 9]]) this.add.circle(x + dx, 510 + dy, 3, 0xf2786b);
      if (a.id === "bowtie") this.add.image(x, 510, "bowtie", 0);
      void sw;
      txt(this, x, 545, a.name, 15, C.inkSoft);
      const label = worn ? "worn" : owned ? "wear" : `${a.cost}`;
      const b = button(this, x, 582, 78, 34, label, worn ? "#efe5cc" : owned ? "#f6c453" : C.mint, () => {
        if (worn) return;
        if (!owned) {
          if (d.coins < a.cost) return;
          d.coins -= a.cost;
          d.aprons.push(a.id);
        }
        d.apron = a.id;
        save.write();
        this.bought(x, 510);
      }, 18);
      if (!owned && d.coins < a.cost) b.setEnabled(false);
    });

    // ---------------- decorations
    const dp = scrap(this, 960, 520, 470, 190, 1.2, false);
    void dp;
    txt(this, 960, 445, "Café décor  (+5% tips each)", 26, C.ink, true);
    const icons: Record<string, string> = { plant: "deco_plant", bunting: "heart", lights: "star", portrait: "deco_portrait" };
    DECOR.forEach((dc, i) => {
      const x = 815 + i * 98;
      const owned = d.decor.includes(dc.id);
      const ic = boil(this, x, 505, icons[dc.id]).setScale(dc.id === "plant" ? 0.4 : dc.id === "portrait" ? 0.45 : 1.6);
      void ic;
      txt(this, x, 548, dc.name, 14, C.inkSoft, false, { wordWrap: { width: 92 } });
      const b = button(this, x, 586, 80, 34, owned ? "✓" : `${dc.cost}`, owned ? "#efe5cc" : C.mint, () => {
        if (owned || d.coins < dc.cost) return;
        d.coins -= dc.cost;
        d.decor.push(dc.id);
        save.write();
        this.bought(x, 505);
      }, 18);
      if (owned) b.disableInteractive();
      else if (d.coins < dc.cost) b.setEnabled(false);
    });

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
    this.time.delayedCall(350, () => this.scene.restart());
  }
}
