import Phaser from "phaser";
import { COLORS as C, DAYS, W } from "../config";
import { boil, setBoil } from "../art/textures";
import { openShare } from "../share";
import { burst, button, scrap, txt } from "../ui";
import { CorgiRig } from "../game/corgi";
import { audio } from "../audio";
import { save } from "../save";

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super("Victory");
  }

  create() {
    this.add.image(0, 0, "bg_paper").setOrigin(0);
    audio.music("victory");
    audio.play("win");
    const d = save.data;
    d.wins += 1;
    save.write();
    const stars = DAYS.reduce((s, _, i) => s + (d.stars[i] ?? 0), 0);
    scrap(this, 640, 250, 760, 300, -1, true);
    txt(this, 640, 150, "Best Corgi Cafe in Shoreditch!", 60, C.caramel, true, { stroke: C.ink, strokeThickness: 4 });
    txt(this, 640, 215, "Sunday Brunch survived. Every human fed, every corgi napped. Not one croissant unaccounted for (mostly).", 22, C.ink, false, { wordWrap: { width: 680 }, align: "center" });
    txt(this, 640, 280, `Coins earned this week: ${d.totalEarned}`, 32, C.ink, true);
    txt(this, 640, 330, `Stars: ${stars} / ${DAYS.length * 3}`, 30, C.mintDark, true);
    for (let i = 0; i < DAYS.length; i++) {
      const s = d.stars[i] ?? 0;
      txt(this, 380 + i * 87, 372, `${DAYS[i].name.slice(0, 3)} ${"★".repeat(s)}${"☆".repeat(3 - s)}`, 16, C.inkSoft);
    }

    // closing parade: the week's humans stroll out happy, the staff corgis trot alongside
    const people = ["reg2", "new1", "bld2", "ent1", "scp2", "cre1", "grp2"];
    const walkers: { s: Phaser.GameObjects.Sprite; look: string }[] = [];
    people.forEach((look, i) => {
      const key = this.textures.exists(`h_${look}_walkA`) ? look : "reg1";
      const s = boil(this, -120 - i * 190, 650, `h_${key}_walkA`).setOrigin(0.5, 1).setScale(0.92);
      walkers.push({ s, look: key });
      this.tweens.add({ targets: s, x: W + 220, duration: 10500, delay: i * 120, repeat: -1 });
    });
    let step = 0;
    this.time.addEvent({
      delay: 260,
      loop: true,
      callback: () => {
        step ^= 1;
        for (const w of walkers) setBoil(w.s, `h_${w.look}_${step ? "walkB" : "walkH"}`);
      },
    });
    const crew: CorgiRig[] = [new CorgiRig(this, -200, 656, 0.8, d.apron, "red"), new CorgiRig(this, -420, 660, 0.72, "staff", "tri"), new CorgiRig(this, -640, 656, 0.72, "staff", "red")];
    crew.forEach((c, i) => {
      c.setMood("h");
      c.setDepth(10);
      this.tweens.add({ targets: c, x: W + 220, duration: 7600 + i * 400, delay: i * 300, repeat: -1, onUpdate: () => c.animate(0.016, 250, 0, 300) });
    });
    this.time.addEvent({
      delay: 600,
      loop: true,
      callback: () => burst(this, Phaser.Math.Between(150, 1130), Phaser.Math.Between(80, 420), ["star", "star_mint", "star_coral", "heart"], 10, 90),
    });
    button(this, 860, 690, 300, 52, "Play the week again", C.mint, () => {
      save.newRun();
      this.scene.start("Game", { day: 0 });
    }, 26);
    button(this, 400, 690, 160, 48, "Title", "#fffaf0", () => this.scene.start("Title"), 24);
    const share = button(this, 600, 690, 180, 50, "Share", C.orange, () => {
      share.setEnabled(false);
      void openShare(
        this,
        {
          headline: "Week complete!",
          stats: [
            ["Coins this week", `${d.totalEarned}`],
            ["Stars", `${stars} / ${DAYS.length * 3}`],
            ["Weeks completed", `${d.wins}`],
          ],
          stars: Math.min(3, Math.floor(stars / 6)),
          maxStars: 3,
          caption: "I came for one coffee and stayed a whole week of tiny chaotic loaves.",
          file: "corgi-cafe-week-complete.png",
          shareText: `I survived Sunday Brunch at Corgi Café: Loaf Rush with ${stars} of ${DAYS.length * 3} stars. Your turn behind the counter.`,
        },
        () => share.setEnabled(true),
      );
    }, 24);
  }
}
