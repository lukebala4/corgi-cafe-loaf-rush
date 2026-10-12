import Phaser from "phaser";
import { COLORS as C, DAYS, W } from "../config";
import { buildTextures, boil, stickerTex } from "../art/textures";
import { makePaperBg } from "../art/background";
import { button, floatText, scrap, toggle, txt, wobble } from "../ui";
import { openMenuInfo } from "../share";
import { audio } from "../audio";
import { save } from "../save";
import { bookProgress } from "../meta";
import { bookOpen, openBook } from "../book";

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
    sub.add(boil(this, 0, 0, stickerTex(this, 300, 56, C.orange)));
    sub.add(txt(this, 0, -2, "LOAF RUSH", 44, "#fffaf0", true, { stroke: C.ink, strokeThickness: 4 }));
    wobble(this, sub, 1.5, 1800);

    // --- Shoreditch cue: a taped-in sketch of the orange double-bay shopfront at 74 Great Eastern Street
    this.storefront(196, 150);

    // --- signature mascot: the giant-eared corgi asleep in a cup, adapted from the supplied sketch
    // The cup, paws, upright ears and notebook ink are deliberately the visual anchor of the title screen.
    const cx = 340;
    const cy = 470;
    const heroScale = 1.08;
    // The cup body is drawn centred at x 150 of the 340 px cup texture (the handle fills the right side),
    // so everything printed on the mug is centred on the body, not on the texture.
    const mx = cx + (150 - 170) * heroScale;
    const cupBack = boil(this, cx, cy, "title_cup_back").setScale(heroScale);
    const corgi = boil(this, cx - 20, cy - 78, "title_corgi").setOrigin(0.5, 0.5).setScale(heroScale);
    const cupFront = boil(this, cx, cy, "title_cup_front").setScale(heroScale);
    void cupBack;
    void cupFront;
    corgi.setDepth(0);
    cupFront.setDepth(1);
    // the "Corgi / Cafe" lettering and heart are drawn into the cup art itself (title_cup_front)
    const mascotTag = txt(this, mx, cy - 168, "our signature loaf", 18, C.inkSoft, false, {
      backgroundColor: "#fffaf0",
      padding: { x: 8, y: 3 },
    }).setDepth(3).setAngle(-4);
    const restY = corgi.y;
    let popTween: Phaser.Tweens.Tween | undefined;
    const hero = this.add.container(0, 0).setDepth(3).setSize(340, 300).setInteractive({ useHandCursor: true });
    hero.setPosition(mx + 12, cy);
    hero.on("pointerdown", () => {
      audio.unlock();
      audio.play("bark");
      corgi.setTexture("title_corgi", 0);
      // always bounce from (and back to) the same resting spot, however fast it is tapped
      popTween?.stop();
      corgi.y = restY;
      popTween = this.tweens.add({ targets: corgi, y: restY - 12, duration: 100, yoyo: true, ease: "Back.out" });
      const hello = txt(this, cx + 70, cy - 150, "yip!", 28, C.coral, true, { stroke: "#fffaf0", strokeThickness: 4 }).setDepth(5);
      this.tweens.add({ targets: hello, y: hello.y - 28, alpha: 0, duration: 750, onComplete: () => hello.destroy() });
    });
    // sleepy breathing is a scale-only loop, so it never fights the tap bounce over position
    if (!save.data.settings.reducedMotion)
      this.tweens.add({ targets: corgi, scaleY: heroScale * 1.04, scaleX: heroScale * 0.985, duration: 1600, yoyo: true, repeat: -1, ease: "Sine.inOut" });
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
    const panel = scrap(this, 900, 474, 420, 420, 1.5, true);
    void panel;
    const d = save.data;
    const fresh = !save.hasProgress();
    const finished = d.day >= DAYS.length;
    const playLabel = fresh ? "Play" : finished ? "Play again" : `Continue · Day ${d.day + 1}`;
    const play = button(this, 900, 330, 300, 70, playLabel, C.mint, () => this.play(), playLabel.length > 10 ? 32 : 44);
    this.tweens.add({ targets: play, scale: 1.04, duration: 700, yoyo: true, repeat: -1, ease: "Sine.inOut" });
    button(this, 775, 408, 120, 46, "Tutorial", "#f6c453", () => this.scene.start("Game", { tutorial: true }), 22);
    button(this, 900, 408, 120, 46, "Menu", C.orangeSoft, () => openMenuInfo(this), 22);
    const reset = button(this, 1025, 408, 120, 46, "Reset", "#efe5cc", () => {
      if (!this.confirmReset) {
        this.confirmReset = true;
        reset.label.setText("Sure?");
        return;
      }
      save.reset();
      this.scene.restart();
    }, 22);
    if (fresh) reset.setEnabled(false);
    // the sticker book, and Endless Brunch once a full week has been survived
    const bp = bookProgress();
    button(this, 800, 462, 190, 46, `Stickers ${bp.seen}/${bp.total}`, "#fffaf0", () => openBook(this), 22);
    const unlocked = d.wins > 0;
    const endless = button(this, 1000, 462, 190, 46, unlocked ? "Endless Brunch" : "Endless: locked", unlocked ? C.coral : "#efe5cc", () => {
      if (!unlocked) {
        floatText(this, 1000, 430, "Survive Sunday Brunch to unlock", C.coral, 20, 24);
        return;
      }
      audio.unlock();
      this.scene.start("Game", { endless: true });
    }, unlocked ? 22 : 20);
    void endless;
    const s = save.data.settings;
    toggle(this, 900, 520, "Music", () => s.music, (v) => ((s.music = v), save.write(), save.applyAudio()), 280);
    toggle(this, 900, 566, "Sound effects", () => s.sfx, (v) => ((s.sfx = v), save.write(), save.applyAudio()), 280);
    toggle(this, 900, 612, "Reduced motion", () => s.reducedMotion, (v) => ((s.reducedMotion = v), save.write()), 280);
    const mute = button(this, W - 60, 40, 60, 40, s.muted ? "×♪" : "♪", "#fffaf0", () => {
      s.muted = !s.muted;
      save.write();
      save.applyAudio();
      mute.label.setText(s.muted ? "×♪" : "♪");
    }, 24);
    txt(this, 900, 650, "WASD/arrows move · SPACE use · SHIFT dash · Q swap · ESC pause", 17, C.inkSoft);
    if (d.wins > 0) txt(this, 900, 670, `Weeks completed: ${d.wins} ★`, 17, C.caramelDark, true);

    this.input.keyboard!.on("keydown-ENTER", () => {
      if (!bookOpen(this)) this.play();
    });
  }

  /** Small notebook sketch of the real shopfront (a drawn cue, not a photo). */
  private storefront(x: number, y: number) {
    const c = this.add.container(x, y).setAngle(-4);
    c.add(scrap(this, 0, 0, 232, 196, 0, false));
    c.add(boil(this, 0, -4, "title_storefront"));
    c.add(txt(this, -38, -66, "Corgi Cafe", 17, "#fffaf0", true));
    c.add(txt(this, 66, -66, "74", 17, "#fffaf0", true));
    c.add(txt(this, 0, 82, "74 Great Eastern St, Shoreditch", 15, C.inkSoft));
    wobble(this, c, 0.8, 2400);
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
