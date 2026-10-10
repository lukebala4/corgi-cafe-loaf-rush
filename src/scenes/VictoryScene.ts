import Phaser from "phaser";
import { COLORS as C, DAYS, W } from "../config";
import { boil } from "../art/textures";
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
    txt(this, 640, 150, "Best Corgi Café in Town!", 64, C.caramel, true, { stroke: C.ink, strokeThickness: 4 });
    txt(this, 640, 215, "Sunday Brunch survived. Every loaf fed. Not one croissant unaccounted for (mostly).", 22, C.ink, false, { wordWrap: { width: 680 } });
    txt(this, 640, 280, `Coins earned this week: ${d.totalEarned}`, 32, C.ink, true);
    txt(this, 640, 330, `Stars: ${stars} / ${DAYS.length * 3}`, 30, C.mintDark, true);
    for (let i = 0; i < DAYS.length; i++) {
      const s = d.stars[i] ?? 0;
      txt(this, 380 + i * 87, 372, `${DAYS[i].name.slice(0, 3)} ${"★".repeat(s)}${"☆".repeat(3 - s)}`, 16, C.inkSoft);
    }

    // parade of loaves
    const breeds = ["retriever", "poodle", "cat", "influencer", "beagle", "pug", "shiba"];
    breeds.forEach((b, i) => {
      const s = boil(this, -100 - i * 150, 560, `${b}_h`).setOrigin(0.5, 1).setScale(0.8);
      this.tweens.add({ targets: s, x: W + 200, duration: 9000, delay: i * 200, repeat: -1 });
      this.tweens.add({ targets: s, y: 545, duration: 180, yoyo: true, repeat: -1 });
    });
    const hero = new CorgiRig(this, -200, 600, 1, d.apron);
    this.tweens.add({ targets: hero, x: W + 200, duration: 7000, repeat: -1, onUpdate: () => hero.animate(0.016, 250, 0, 300) });
    this.time.addEvent({
      delay: 600,
      loop: true,
      callback: () => burst(this, Phaser.Math.Between(150, 1130), Phaser.Math.Between(80, 420), ["star", "star_mint", "star_coral", "heart"], 10, 90),
    });
    button(this, 760, 670, 300, 56, "Play the week again", C.mint, () => {
      save.newRun();
      this.scene.start("Game", { day: 0 });
    }, 26);
    button(this, 480, 670, 180, 50, "Title", "#fffaf0", () => this.scene.start("Title"), 24);
  }
}
