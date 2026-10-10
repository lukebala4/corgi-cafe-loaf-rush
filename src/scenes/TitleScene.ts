import Phaser from "phaser";
import { COLORS as C, DAYS, W } from "../config";
import { buildTextures, boil, stickerTex } from "../art/textures";
import { makePaperBg } from "../art/background";
import { button, scrap, toggle, txt, wobble } from "../ui";
import { audio } from "../audio";
import { save } from "../save";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }
  create() {
    buildTextures(this);
    makePaperBg(this);
    document.getElementById("loading")?.remove();
    this.scene.start("Title");
  }
}

export class TitleScene extends Phaser.Scene {
  private confirmReset = false;
  constructor() {
    super("Title");
  }

  create() {
    save.applyAudio();
    this.confirmReset = false;
    this.add.image(0, 0, "bg_paper").setOrigin(0);
    audio.music("title");

    // --- clean handwritten wordmark; the mascot carries the character identity below
    const y0 = 118;
    const style = { stroke: C.ink, strokeThickness: 4 };
    const wordmark = txt(this, 640, 111, "Corgi Café", 104, C.caramel, false, {
      ...style,
      fontFamily: '"Patrick Hand", "Comic Sans MS", cursive',
    });
    wordmark.setLetterSpacing(1);
    const sub = this.add.container(640, 212).setAngle(-3);
    sub.add(boil(this, 0, 0, stickerTex(this, 300, 56, C.coral)));
    sub.add(txt(this, 0, -2, "LOAF RUSH", 44, "#fffaf0", true, { stroke: C.ink, strokeThickness: 4 }));
    wobble(this, sub, 1.5, 1800);

    // --- signature mascot: the giant-eared Corgi Latte, adapted from the supplied sketch
    // The cup, paws, upright ears and notebook ink are deliberately the visual anchor of the title screen.
    const cx = 340;
    const cy = 470;
    const heroScale = 1.08;
    const cupBack = boil(this, cx, cy, "title_cup_back").setScale(heroScale);
    const corgi = boil(this, cx - 20, cy - 78, "title_corgi").setOrigin(0.5, 0.5).setScale(heroScale);
    const cupFront = boil(this, cx, cy, "title_cup_front").setScale(heroScale);
    void cupBack;
    void cupFront;
    corgi.setDepth(0);
    cupFront.setDepth(1);
    // Match the handwritten lettering in the reference drawing without baking text into the texture.
    const cupName = txt(this, cx, cy + 14, "Corgi\nLatte", 22, C.ink, false, {
      lineSpacing: -4,
      stroke: "#fffaf0",
      strokeThickness: 2,
    }).setDepth(2).setAngle(-1);
    const cupHeart = txt(this, cx, cy + 55, "♡", 28, C.coral, true, { stroke: "#fffaf0", strokeThickness: 2 }).setDepth(2);
    const mascotTag = txt(this, cx, cy - 168, "our signature loaf", 18, C.inkSoft, false, {
      backgroundColor: "#fffaf0",
      padding: { x: 8, y: 3 },
    }).setDepth(3).setAngle(-4);
    const hero = this.add.container(0, 0).setDepth(3).setSize(340, 300).setInteractive({ useHandCursor: true });
    hero.setPosition(cx, cy);
    hero.on("pointerdown", () => {
      audio.unlock();
      audio.play("bark");
      corgi.setTexture("title_corgi", 0);
      this.tweens.add({ targets: [corgi, cupHeart], y: "-=12", duration: 100, yoyo: true, ease: "Back.out" });
      const hello = txt(this, cx + 70, cy - 150, "yip!", 28, C.coral, true, { stroke: "#fffaf0", strokeThickness: 4 }).setDepth(5);
      this.tweens.add({ targets: hello, y: hello.y - 28, alpha: 0, duration: 750, onComplete: () => hello.destroy() });
    });
    hero.on("pointerover", () => this.tweens.add({ targets: [corgi, cupHeart], scale: heroScale * 1.04, duration: 120 }));
    hero.on("pointerout", () => this.tweens.add({ targets: [corgi, cupHeart], scale: heroScale, duration: 120 }));
    if (!save.data.settings.reducedMotion)
      this.tweens.add({ targets: corgi, scaleY: heroScale * 1.04, scaleX: heroScale * 0.985, y: corgi.y - 3, duration: 1600, yoyo: true, repeat: -1, ease: "Sine.inOut" });
    this.time.addEvent({
      delay: 900,
      loop: true,
      callback: () => {
        const z = txt(this, cx + 40, cy - 110, "z", 26 + Math.random() * 14, C.inkSoft, true).setDepth(3);
        this.tweens.add({ targets: z, x: z.x + 50 + Math.random() * 30, y: z.y - 90, alpha: 0, angle: 20, duration: 2200, onComplete: () => z.destroy() });
        const s = this.add.image(cx - 110 + Math.random() * 60, cy - 90, "steam", 0).setAlpha(0.6).setDepth(-1);
        this.tweens.add({ targets: s, y: s.y - 60, alpha: 0, duration: 2000, onComplete: () => s.destroy() });
      },
    });
    txt(this, cx - 10, cy + 150, "shh… the barista is loafing", 20, C.inkSoft).setAngle(-2);

    // --- menu scrap
    const panel = scrap(this, 900, 470, 420, 400, 1.5, true);
    void panel;
    const d = save.data;
    const fresh = !save.hasProgress();
    const finished = d.day >= DAYS.length;
    const playLabel = fresh ? "Play" : finished ? "Play again" : `Continue · Day ${d.day + 1}`;
    const play = button(this, 900, 330, 300, 70, playLabel, C.mint, () => this.play(), playLabel.length > 10 ? 32 : 44);
    this.tweens.add({ targets: play, scale: 1.04, duration: 700, yoyo: true, repeat: -1, ease: "Sine.inOut" });
    button(this, 820, 412, 150, 46, "Tutorial", "#f6c453", () => this.scene.start("Game", { tutorial: true }), 24);
    const reset = button(this, 985, 412, 150, 46, "Reset", "#efe5cc", () => {
      if (!this.confirmReset) {
        this.confirmReset = true;
        reset.label.setText("Sure? tap");
        return;
      }
      save.reset();
      this.scene.restart();
    }, 22);
    if (fresh) reset.setEnabled(false);
    const s = save.data.settings;
    toggle(this, 900, 472, "Music", () => s.music, (v) => ((s.music = v), save.write(), save.applyAudio()), 280);
    toggle(this, 900, 522, "Sound effects", () => s.sfx, (v) => ((s.sfx = v), save.write(), save.applyAudio()), 280);
    toggle(this, 900, 572, "Reduced motion", () => s.reducedMotion, (v) => ((s.reducedMotion = v), save.write()), 280);
    const mute = button(this, W - 60, 40, 60, 40, s.muted ? "×♪" : "♪", "#fffaf0", () => {
      s.muted = !s.muted;
      save.write();
      save.applyAudio();
      mute.label.setText(s.muted ? "×♪" : "♪");
    }, 24);
    txt(this, 900, 630, "WASD/arrows move · SPACE interact · SHIFT dash · ESC pause", 17, C.inkSoft);
    if (d.wins > 0) txt(this, 900, 655, `Weeks completed: ${d.wins} ★`, 18, C.caramelDark, true);

    this.input.keyboard!.once("keydown-ENTER", () => this.play());
  }

  private play() {
    audio.unlock();
    const d = save.data;
    if (d.day >= DAYS.length) {
      save.newRun();
      this.scene.start("Game", { day: 0 });
    } else if (!d.tutorialDone) this.scene.start("Game", { tutorial: true });
    else if (d.day === 0) this.scene.start("Game", { day: 0 });
    else this.scene.start("Shop");
  }
}
