import Phaser from "phaser";
import {
  ASSISTANT_HOME,
  COLORS as C,
  DASH_COOLDOWN,
  DASH_TIME,
  DAYS,
  DAY_EVENTS,
  DAY_LENGTH,
  DECOR_TIP_BONUS,
  DayDef,
  H,
  ITEM_INFO,
  ItemId,
  PASS_Y,
  PATIENCE_MULT,
  PLAYER_START,
  ROLES,
  Role,
  SEATS,
  STATION_DEFS,
  STEP,
  TABLES,
  W,
  comboMult,
  enthusiastPick,
  opensOn,
} from "../config";
import { ROLE_LOOKS } from "../art/humans";
import { Crowd } from "../game/crowd";
import { RecipeStrip } from "../game/recipes";
import { openMenuInfo } from "../share";
import { makeCafeBg } from "../art/background";
import { boil } from "../art/textures";
import { World, Nav } from "../game/world";
import { Player } from "../game/corgi";
import { Customer } from "../game/customer";
import { Station } from "../game/station";
import { Assistant, EventDirector } from "../game/events";
import { Tutorial } from "../game/tutorial";
import { Controls } from "../input";
import { audio } from "../audio";
import { save } from "../save";
import { burst, button, floatText, puff, scrap, shake, toggle, txt } from "../ui";
import { confetti, inkStamp } from "../fx";
import { fitIcon, markSeen, unlock } from "../meta";
import { bookOpen, openBook } from "../book";

export interface DayStats {
  day: number;
  served: number;
  missed: number;
  mistakes: number;
  earned: number;
  tips: number;
  bestCombo: number;
  heists: number;
  goal: number;
  /** Today's Specials served. */
  specials: number;
  /** Golden guests served. */
  golden: number;
  /** The room was cleared after the last-orders bell. */
  finale: boolean;
  /** Endless Brunch run (no clock, three walkouts end it). */
  endless: boolean;
  /** Seconds played (Endless Brunch survival time). */
  time: number;
}

/** Combo milestones: an ink stamp slams down once per uninterrupted streak. */
const STAMPS: { at: number; text: string; tier: number }[] = [
  { at: 3, text: "Nice!", tier: 1 },
  { at: 5, text: "Pawsome!", tier: 2 },
  { at: 8, text: "LOAF-TASTIC!", tier: 3 },
  { at: 12, text: "UNSTOPPABLE LOAF!", tier: 4 },
];
const ENDLESS_LIVES = 3;
const COIN_HUD = { x: 514, y: 30 };

interface Target {
  label: string;
  ok: boolean;
  run?: () => void;
  x: number;
  y: number;
  score: number;
}

export class GameScene extends Phaser.Scene {
  dayIdx = 0;
  def!: DayDef;
  tutorialMode = false;
  world!: World;
  nav!: Nav;
  player!: Player;
  stations: Station[] = [];
  pads: Station[] = [];
  customers: Customer[] = [];
  assistant: Assistant | null = null;
  director!: EventDirector;
  controls!: Controls;
  tutorial?: Tutorial;
  crowd!: Crowd;
  recipes!: RecipeStrip;
  stats!: DayStats;
  combo = 0;
  dayT = 0;
  spawnT = 0;
  acc = 0;
  paused = false;
  ending = false;
  endT = 0;
  // ---- nostalgia pack state
  /** Endless Brunch: Sunday's menu with no clock; three walkouts end the run. */
  endless = false;
  lives = ENDLESS_LIVES;
  /** Today's Special (pays double). Null in the tutorial. */
  special: ItemId | null = null;
  private specialHud?: Phaser.GameObjects.Container;
  /** When (dayT) the next golden guest may walk in; -1 = none due. */
  private goldenAt = -1;
  private lastOrders = false;
  private bellMissed = 0;
  private finaleDone = false;
  /** Real-time countdowns for the final-customer flourish (not slowed by the slow-mo). */
  private slowT = 0;
  private finaleT = 0;
  /** Presentation slow-mo factor for the simulation (1 = normal). */
  private simScale = 1;
  /** The coin counter rolls up as flying coins land. */
  private shownCoins = 0;
  private hearts: Phaser.GameObjects.Sprite[] = [];
  private endlessBest = 0;
  private nextSpecialT = 0;
  /** Staff zoomies lap: around the communal tables, clear of the window bar and the column. */
  zoomLoop = [
    { x: 122, y: 300 },
    { x: 640, y: 300 },
    { x: 1108, y: 300 },
    { x: 1108, y: 480 },
    { x: 900, y: 480 },
    { x: 900, y: 662 },
    { x: 400, y: 668 },
    { x: 122, y: 660 },
    { x: 160, y: 480 },
  ];
  // HUD
  private hud!: {
    day: Phaser.GameObjects.Text;
    time: Phaser.GameObjects.Text;
    coins: Phaser.GameObjects.Text;
    goal: Phaser.GameObjects.Graphics;
    combo: Phaser.GameObjects.Container;
    comboT: Phaser.GameObjects.Text;
    clock: Phaser.GameObjects.Graphics;
    mute: ReturnType<typeof button>;
  };
  private prompt!: Phaser.GameObjects.Container;
  private promptBg!: Phaser.GameObjects.Graphics;
  private promptT!: Phaser.GameObjects.Text;
  private pauseLayer?: Phaser.GameObjects.Container;
  private pawFlip = 1;
  private lastTarget: Target | null = null;

  constructor() {
    super("Game");
  }

  init(data: { day?: number; tutorial?: boolean; endless?: boolean }) {
    this.tutorialMode = !!data.tutorial;
    this.endless = !this.tutorialMode && !!data.endless;
    this.dayIdx = this.endless ? DAYS.length - 1 : Phaser.Math.Clamp(data.day ?? 0, 0, DAYS.length - 1);
    this.def = DAYS[this.tutorialMode ? 0 : this.dayIdx];
    this.stations = [];
    this.pads = [];
    this.customers = [];
    this.assistant = null;
    this.tutorial = undefined;
    this.combo = 0;
    this.dayT = this.tutorialMode ? 0 : -2.5;
    this.spawnT = 2;
    this.acc = 0;
    this.paused = false;
    this.ending = false;
    this.endT = 0;
    this.pauseLayer = undefined;
    this.lastTarget = null;
    this.lives = ENDLESS_LIVES;
    this.special = null;
    this.specialHud = undefined;
    this.goldenAt = -1;
    this.lastOrders = false;
    this.bellMissed = 0;
    this.finaleDone = false;
    this.slowT = 0;
    this.finaleT = 0;
    this.simScale = 1;
    this.shownCoins = 0;
    this.hearts = [];
    this.endlessBest = save.data.endlessBest;
    this.nextSpecialT = 90;
    this.stats = {
      day: this.dayIdx,
      served: 0,
      missed: 0,
      mistakes: 0,
      earned: 0,
      tips: 0,
      bestCombo: 0,
      heists: 0,
      goal: this.def.goal,
      specials: 0,
      golden: 0,
      finale: false,
      endless: this.endless,
      time: 0,
    };
  }

  get menu(): ItemId[] {
    return this.def.menu;
  }
  get patienceFrozen() {
    return this.tutorialMode;
  }
  get decorMult() {
    return 1 + save.data.decor.length * DECOR_TIP_BONUS;
  }

  create() {
    save.applyAudio();
    this.add.image(0, 0, makeCafeBg(this)).setOrigin(0).setDepth(-10);
    this.world = new World();
    this.nav = new Nav(this.world);

    // furniture: pale communal tables with thin dark legs, brown chairs at each seat
    for (const t of TABLES) boil(this, t.x, t.y, `table_${t.w}`).setDepth(t.y + 20);
    for (const st of SEATS) boil(this, st.x, st.y + 8, "chair").setOrigin(0.5, 1).setScale(0.82).setDepth(st.y - 2).setFlipX(st.side > 0);
    // decorations
    const d = save.data.decor;
    if (d.includes("lights")) boil(this, 650, 152, "deco_lights").setOrigin(0.5, 0).setScale(1.08, 0.8).setDepth(3);
    if (d.includes("bunting")) boil(this, 650, 266, "deco_bunting").setOrigin(0.5, 0).setScale(1.08, 0.7).setDepth(4);
    if (d.includes("plant")) {
      boil(this, 1162, 700, "deco_plant").setOrigin(0.5, 1).setScale(0.62).setDepth(700);
      boil(this, 128, 700, "deco_plant").setOrigin(0.5, 1).setScale(0.55).setDepth(700).setFlipX(true);
    }
    if (d.includes("portrait")) boil(this, 930, 664, "deco_portrait").setScale(0.5).setDepth(2);
    // power strips and cables on every communal table (builders plug in and stay)
    if (d.includes("power"))
      TABLES.forEach((t, i) =>
        boil(this, t.x + t.w * (i % 2 ? -0.3 : 0.3), t.y - 14, "deco_power")
          .setOrigin(0.5, 0.15)
          .setDepth(t.y + 21),
      );
    // Tonight board on the back wall: tonight's after-hours event and tomorrow's
    if (d.includes("events")) {
      const bx = 164;
      const by = 102;
      boil(this, bx, by, "deco_chalk").setDepth(3).setAngle(-1.5);
      const chalk = "#f4f1ea";
      const di = Math.max(0, Math.min(this.dayIdx, DAY_EVENTS.length - 1));
      txt(this, bx, by - 30, "TONIGHT", 19, chalk, true).setDepth(4).setAngle(-1.5);
      txt(this, bx, by - 6, DAY_EVENTS[di], 16, chalk, false, { wordWrap: { width: 92 }, align: "center" })
        .setDepth(4)
        .setAngle(-1.5)
        .setLineSpacing(-4);
      const short = ["pub club", "pitch night", "demo night", "hackathon", "app roast", "paint club", "run club"];
      const tmrw = di + 1 < short.length ? `tmrw: ${short[di + 1]}` : "back Monday!";
      txt(this, bx, by + 26, tmrw, 13, "#f6c453", false).setDepth(4).setAngle(-1.5);
    }
    // laptop stickers along the pass, between the serving pads
    if (d.includes("stickers"))
      (
        [
          [4, 315, -4],
          [0, 548, 5],
          [2, 745, -3],
          [3, 938, 4],
          [1, 1142, -5],
        ] as [number, number, number][]
      ).forEach(([k, x, ang]) => boil(this, x, PASS_Y + 11, `sticker_${k}`).setScale(0.85).setAngle(ang).setDepth(PASS_Y + 12));

    // stations
    for (const sd of STATION_DEFS) {
      const isPad = sd.id === "padA" || sd.id === "padB";
      const locked = !this.tutorialMode && sd.unlock !== null && !this.def.menu.includes(sd.unlock);
      const lockedT = this.tutorialMode && sd.unlock !== null;
      const s = new Station(this, sd.id, sd.x, locked || lockedT, isPad ? PASS_Y + 11 : undefined, sd.unlock ? opensOn(sd.unlock) : -1);
      this.stations.push(s);
      if (isPad) this.pads.push(s);
    }

    this.player = new Player(this, PLAYER_START.x, PLAYER_START.y, save.data.apron);
    this.player.capacity = save.data.upgrades.carry > 0 ? 2 : 1;
    if (save.data.upgrades.assistant > 0 && !this.tutorialMode) this.assistant = new Assistant(this, ASSISTANT_HOME);

    this.director = new EventDirector(this, this.tutorialMode || this.endless ? [] : this.def.events);
    // the crowd: people hanging out, vibe coding and visiting the corgis (busier as the week goes on)
    const crowdCap = this.tutorialMode ? 3 : this.endless ? 9 : 5 + this.dayIdx;
    this.crowd = new Crowd(this, crowdCap, Math.ceil(crowdCap * 0.5));
    this.controls = new Controls(this);
    if (!this.tutorialMode) this.special = this.pickSpecial();
    this.planGolden();
    this.buildHud();
    this.recipes = new RecipeStrip(this);
    this.buildPrompt();

    if (this.tutorialMode) this.tutorial = new Tutorial(this);
    else this.dayIntro();

    audio.music(this.tutorialMode ? "title" : this.dayIdx === 6 ? "brunch" : "day");

    // sticker book: the staff you meet just by opening up
    this.events.on("sticker-new", () => this.stickerPing());
    markSeen(this, "staff:you");
    markSeen(this, "staff:greeter");
    markSeen(this, "staff:pudding");
    if (this.assistant) markSeen(this, "staff:biscuit");
    if (save.data.decor.includes("archie") && !this.tutorialMode) markSeen(this, "staff:archie");
    if (this.endless) markSeen(this, "moment:endless");
    else if (this.dayIdx === 6 && !this.tutorialMode) markSeen(this, "moment:brunch");

    // pause when the tab/window loses focus
    const onBlur = () => this.pause(true);
    this.game.events.on(Phaser.Core.Events.BLUR, onBlur);
    this.game.events.on(Phaser.Core.Events.HIDDEN, onBlur);
    this.events_cleanup = () => {
      this.game.events.off(Phaser.Core.Events.BLUR, onBlur);
      this.game.events.off(Phaser.Core.Events.HIDDEN, onBlur);
      this.events.off("sticker-new");
      this.tweens.timeScale = 1;
    };
    this.events_on_shutdown();
    (window as unknown as { __corgi: unknown }).__corgi = { scene: this };
  }

  private events_cleanup: () => void = () => {};
  private events_on_shutdown() {
    this.sys.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events_cleanup();
      this.tweens.killAll();
    });
  }

  // =================================================================== HUD
  private buildHud() {
    const depth = 9500;
    const dayS = scrap(this, 200, 28, 190, 40, -2, false).setDepth(depth);
    const day = txt(this, 0, 2, "", 22, C.ink, true);
    dayS.add(day);
    const clockS = scrap(this, 392, 28, 150, 40, 1.5, false).setDepth(depth);
    const clock = this.add.graphics();
    const time = txt(this, this.endless ? 40 : 18, 2, "", 26, C.ink, true);
    clockS.add([clock, time]);
    if (this.endless) {
      // three lives instead of a clock: each huffy walkout costs a heart
      for (let i = 0; i < ENDLESS_LIVES; i++) {
        const hrt = boil(this, -56 + i * 24, 2, "heart").setScale(0.85);
        clockS.add(hrt);
        this.hearts.push(hrt);
      }
    }
    const coinS = scrap(this, 604, 28, 230, 40, -1, false).setDepth(depth);
    const coinIcon = this.add.image(-90, 2, "coin", 0).setScale(0.9);
    const coins = txt(this, 10, 0, "", 24, C.ink, true);
    const goal = this.add.graphics();
    coinS.add([coinIcon, coins, goal]);
    const combo = this.add.container(822, 30).setDepth(depth);
    const comboBg = this.add.image(0, 0, "star", 0).setScale(2.2);
    const comboT = txt(this, 0, 2, "", 22, C.ink, true, { stroke: "#fff", strokeThickness: 5 });
    combo.add([comboBg, comboT]);
    combo.setVisible(false);
    const pauseB = button(this, 1130, 30, 60, 36, "II", "#fffaf0", () => this.pause(!this.paused), 24).setDepth(depth);
    pauseB.setName("pauseBtn");
    const mute = button(this, 1222, 30, 60, 36, save.data.settings.muted ? "×♪" : "♪", "#fffaf0", () => this.toggleMute(), 24).setDepth(depth);
    this.hud = { day, time, coins, goal, combo, comboT, clock, mute };
    if (this.tutorialMode) {
      day.setText("Training day");
      button(this, 1010, 30, 120, 36, "Skip ›", "#fffaf0", () => this.tutorial?.finish(), 22).setDepth(depth);
    } else day.setText(this.endless ? "Endless Brunch" : `Day ${this.dayIdx + 1} · ${this.def.name}`);
    if (day.width > 175) day.setScale(175 / day.width);
    if (this.special) this.buildSpecialHud(depth);
  }

  /** Today's Special sticker: the item, a gold x2 rosette and one word. No extra reading mid-rush. */
  private buildSpecialHud(depth: number) {
    const c = scrap(this, 978, 30, 168, 42, 2, false).setDepth(depth);
    const ros = boil(this, -58, 1, "icon_special").setScale(0.95);
    const icon = boil(this, -22, 0, `item_${this.special}`);
    fitIcon(icon, 34);
    const t = txt(this, 34, 1, "special", 21, C.caramelDark, true);
    c.add([ros, icon, t]);
    c.setName("specialHud");
    this.specialHud = c;
    if (!save.data.settings.reducedMotion) {
      c.setScale(0);
      this.tweens.add({ targets: c, scale: 1, delay: this.endless ? 300 : 2900, duration: 380, ease: "Back.out" });
      this.tweens.add({ targets: ros, angle: { from: -10, to: 10 }, yoyo: true, repeat: -1, duration: 900, ease: "Sine.inOut" });
    }
  }

  private pickSpecial(): ItemId {
    const menu = this.def.menu;
    const avoid = this.special;
    const pool = menu.length > 1 && avoid ? menu.filter((m) => m !== avoid) : menu;
    return Phaser.Utils.Array.GetRandom(pool);
  }

  /** Endless Brunch rotates the special every 90 seconds; orders already placed keep theirs. */
  private rotateSpecial() {
    this.special = this.pickSpecial();
    this.specialHud?.destroy();
    this.buildSpecialHud(9500);
    audio.play("pop");
    floatText(this, 978, 70, "new special!", C.caramelDark, 20, 20);
  }

  /**
   * Golden guests are rare: about one day in seven, never in the tutorial or on Monday,
   * and guaranteed by Sunday if the week has not had one yet. Endless Brunch gets one every few minutes.
   */
  private planGolden() {
    this.goldenAt = -1;
    if (this.tutorialMode) return;
    if (this.endless) {
      this.goldenAt = Phaser.Math.FloatBetween(70, 140);
      return;
    }
    if (this.dayIdx === 0 || save.data.goldenWeek) return;
    const force = this.dayIdx === 6 || (this.dayIdx === 5 && Math.random() < 0.5);
    if (force || Math.random() < 0.15) this.goldenAt = Phaser.Math.FloatBetween(35, 120);
  }

  /** Something new went into the sticker book: a quiet little book pops by the pause button. */
  private stickerPing() {
    if (this.children.getByName("stickerPing")) return;
    const b = boil(this, 1130, 78, "icon_book").setDepth(9500).setScale(0.2).setName("stickerPing");
    const plus = txt(this, 1156, 66, "+", 24, C.mintDark, true, { stroke: "#fffaf0", strokeThickness: 4 }).setDepth(9501);
    this.tweens.add({ targets: b, scale: 0.8, duration: 220, ease: "Back.out" });
    this.tweens.add({ targets: [b, plus], alpha: 0, delay: 1100, duration: 300, onComplete: () => (b.destroy(), plus.destroy()) });
  }

  toggleMute() {
    save.data.settings.muted = !save.data.settings.muted;
    save.write();
    save.applyAudio();
    this.hud.mute.label.setText(save.data.settings.muted ? "×♪" : "♪");
  }

  private updateHud() {
    const h = this.hud;
    if (this.shownCoins > this.stats.earned) this.shownCoins = this.stats.earned;
    const shown = this.shownCoins;
    if (this.endless) {
      const tt = Math.max(0, this.dayT);
      h.time.setText(`${Math.floor(tt / 60)}:${Math.floor(tt % 60).toString().padStart(2, "0")}`);
      h.time.setColor(this.lives <= 1 ? C.coral : C.ink);
      h.clock.clear();
      const best = this.endlessBest;
      h.coins.setText(best > 0 ? `${shown} · best ${best}` : `${shown}`);
      if (h.coins.width > 160) h.coins.setScale(160 / h.coins.width);
      const gg = h.goal;
      gg.clear();
      const f = best > 0 ? Math.min(1, shown / best) : 0;
      gg.fillStyle(0xefe5cc, 1).fillRoundedRect(-70, 13, 170, 6, 3);
      gg.fillStyle(f >= 1 ? 0x7fcfb0 : 0xf2786b, 1).fillRoundedRect(-70, 13, Math.max(4, 170 * f), 6, 3);
      h.combo.setVisible(this.combo >= 2);
      h.comboT.setText(`x${comboMult(this.combo).toFixed(2).replace(/0$/, "")}`);
      h.combo.angle = Math.sin(this.time.now / 300) * 6;
      this.controls.drawDashCooldown(this.player.dashCd / DASH_COOLDOWN[save.data.upgrades.dash]);
      return;
    }
    const left = this.tutorialMode ? DAY_LENGTH : Math.max(0, DAY_LENGTH - Math.max(0, this.dayT));
    const m = Math.floor(left / 60);
    const s = Math.floor(left % 60);
    h.time.setText(this.tutorialMode ? "∞" : `${m}:${s.toString().padStart(2, "0")}`);
    h.time.setColor(left < 20 && !this.tutorialMode ? C.coral : C.ink);
    const g = h.clock;
    g.clear();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(-44, 2, 14);
    g.fillStyle(left < 20 ? 0xf2786b : 0x7fcfb0, 1);
    g.slice(-44, 2, 14, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (left / DAY_LENGTH), false);
    g.fillPath();
    g.lineStyle(2.5, 0x2b2622, 1);
    g.strokeCircle(-44, 2, 14);
    h.coins.setText(this.tutorialMode ? `${shown}` : `${shown} / ${this.def.goal}`);
    const gg = h.goal;
    gg.clear();
    const f = Math.min(1, shown / this.def.goal);
    gg.fillStyle(0xefe5cc, 1).fillRoundedRect(-70, 13, 170, 6, 3);
    gg.fillStyle(f >= 1 ? 0x7fcfb0 : 0xe39b4f, 1).fillRoundedRect(-70, 13, Math.max(4, 170 * f), 6, 3);
    h.combo.setVisible(this.combo >= 2);
    h.comboT.setText(`x${comboMult(this.combo).toFixed(2).replace(/0$/, "")}`);
    h.combo.angle = Math.sin(this.time.now / 300) * 6;
    this.controls.drawDashCooldown(this.player.dashCd / DASH_COOLDOWN[save.data.upgrades.dash]);
  }

  private buildPrompt() {
    this.prompt = this.add.container(0, 0).setDepth(9000).setVisible(false);
    this.promptBg = this.add.graphics();
    this.promptT = txt(this, 0, 0, "", 19, C.ink);
    this.prompt.add([this.promptBg, this.promptT]);
  }

  private showPrompt(t: Target | null) {
    if (!t || this.ending) {
      this.prompt.setVisible(false);
      return;
    }
    const key = t.ok ? `[${this.controls.interactLabel}] ` : "";
    const str = key + t.label;
    if (this.promptT.text !== str || !this.prompt.visible) {
      this.promptT.setText(str);
      this.promptT.setColor(t.ok ? C.ink : C.inkSoft);
      const w = this.promptT.width + 22;
      const g = this.promptBg;
      g.clear();
      g.fillStyle(0xfffaf0, 0.96).fillRoundedRect(-w / 2, -16, w, 32, 10);
      g.lineStyle(2.5, t.ok ? 0x4fae8c : 0x9b8f86, 1).strokeRoundedRect(-w / 2, -16, w, 32, 10);
      this.prompt.setVisible(true);
      if (this.lastTarget?.label !== t.label) {
        this.prompt.setScale(0.85);
        this.tweens.add({ targets: this.prompt, scale: 1, duration: 120 });
      }
    }
    const w = this.promptT.width + 22;
    const clampX = (x: number) => Phaser.Math.Clamp(x, 110 + w / 2, 1190 - w / 2);
    let px = clampX(t.x);
    // Keep the bubble beside the barista, never on top of its head or body.
    const p = this.player;
    const bodyHalf = 72;
    const overlapsPlayer = (x: number) => Math.abs(x - p.x) < w / 2 + bodyHalf && t.y > p.y - 110 && t.y < p.y + 20;
    if (overlapsPlayer(px)) {
      const pref = t.x >= p.x ? 1 : -1;
      for (const side of [pref, -pref]) {
        const cand = clampX(p.x + side * (bodyHalf + w / 2 + 6));
        if (!overlapsPlayer(cand)) {
          px = cand;
          break;
        }
      }
    }
    this.prompt.setPosition(px, t.y);
  }

  // =================================================================== intro / banners
  private dayIntro() {
    const d = this.def;
    this.banner(`Day ${this.dayIdx + 1}: ${d.name}`, d.newThing ? `New: ${d.newThing}` : d.subtitle, this.dayIdx === 6 ? C.coral : C.caramel, 2600);
  }

  banner(title: string, sub: string, color: string, ms = 2300) {
    const c = scrap(this, W / 2, H / 2 - 40, 620, 150, -2, true).setDepth(9400);
    const t = txt(this, 0, -22, title, 54, color, true, { stroke: C.ink, strokeThickness: 3 });
    const s = txt(this, 0, 36, sub, 22, C.ink, false, { wordWrap: { width: 560 } });
    c.add([t, s]);
    c.setScale(0.4).setAlpha(0);
    this.tweens.add({ targets: c, scale: 1, alpha: 1, angle: 1, duration: 260, ease: "Back.out" });
    this.tweens.add({ targets: c, y: -120, alpha: 0, delay: ms, duration: 380, ease: "Quad.in", onComplete: () => c.destroy() });
  }

  floatAt(x: number, y: number, s: string, color: string = C.caramelDark) {
    floatText(this, x, y, s, color, 24, 40);
  }
  shakeSmall() {
    shake(this, 150, 0.004);
  }

  // =================================================================== pause
  pause(on: boolean) {
    if (on === this.paused || this.ending) return;
    if (on && this.tutorial?.finished) return;
    this.paused = on;
    this.controls.clear();
    if (on) {
      this.tweens.pauseAll();
      this.buildPauseLayer();
    } else {
      this.tweens.resumeAll();
      this.pauseLayer?.destroy();
      this.pauseLayer = undefined;
    }
  }

  private buildPauseLayer() {
    const L = this.add.container(0, 0).setDepth(20000);
    const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x2b2622, 0.35).setInteractive();
    const panel = scrap(this, W / 2, H / 2, 470, 500, -1.5, true);
    L.add([dim, panel]);
    const t = txt(this, W / 2, H / 2 - 200, "Paused", 60, C.caramel, true, { stroke: C.ink, strokeThickness: 3 });
    const sub = txt(this, W / 2, H / 2 - 152, "the loaves will wait. (they won't, but time is frozen)", 18, C.inkSoft);
    const resume = button(this, W / 2, H / 2 - 92, 260, 54, "Resume", C.mint, () => this.pause(false), 30);
    const restart = button(this, W / 2 - 98, H / 2 - 26, 186, 50, this.tutorialMode ? "Restart tutorial" : this.endless ? "Restart run" : "Restart day", "#f6c453", () => {
      this.scene.restart({ day: this.dayIdx, tutorial: this.tutorialMode, endless: this.endless });
    }, this.tutorialMode ? 20 : 24);
    const menuB = button(this, W / 2 + 98, H / 2 - 26, 186, 50, "Today's menu", C.orangeSoft, () => openMenuInfo(this, undefined, { items: this.def.menu, dayName: this.tutorialMode ? "Training day" : this.def.name }), 24);
    const s = save.data.settings;
    const music = toggle(this, W / 2, H / 2 + 34, "Music", () => s.music, (v) => ((s.music = v), save.write(), save.applyAudio()));
    const sfx = toggle(this, W / 2, H / 2 + 84, "Sound effects", () => s.sfx, (v) => ((s.sfx = v), save.write(), save.applyAudio()));
    const rm = toggle(this, W / 2, H / 2 + 134, "Reduced motion", () => s.reducedMotion, (v) => ((s.reducedMotion = v), save.write()));
    const quit = button(this, W / 2 + 98, H / 2 + 196, 186, 44, "Quit to title", C.coral, () => {
      audio.music("title");
      this.scene.start("Title");
    }, 22);
    const book = button(this, W / 2 - 98, H / 2 + 196, 186, 44, "Sticker book", "#fffaf0", () => {
      this.tweens.resumeAll(); // the book's own buttons animate; the simulation stays frozen
      openBook(this);
    }, 22);
    const keys = txt(this, W / 2, H / 2 + 232, this.controls.touchMode ? "drag to walk · PAW use · ZOOM dash · SWAP paws" : "WASD move · SPACE use · SHIFT dash · Q swap paws · ESC pause", 16, C.inkSoft);
    L.add([t, sub, resume, restart, menuB, music, sfx, rm, quit, book, keys]);
    // keep pause menu tweens alive while gameplay tweens are paused
    for (const o of [resume, restart, menuB, music, sfx, rm, quit, book]) {
      o.on("pointerover", () => this.tweens.resumeAll());
    }
    this.pauseLayer = L;
  }

  // =================================================================== loop
  update(_time: number, delta: number) {
    this.controls.update();
    // the sticker book sits over the pause menu: its keys must not unpause the game underneath
    if (bookOpen(this) || this.data.get("bookJustClosed")) {
      this.data.set("bookJustClosed", false);
      this.controls.takePause();
      this.controls.takeInteract();
      if (this.paused) return;
    }
    if (this.controls.takePause()) this.pause(!this.paused);
    if (this.paused) {
      // allow keyboard resume via SPACE as well
      if (this.controls.takeInteract()) this.pause(false);
      return;
    }
    const real = Math.min(delta / 1000, 0.1);
    // final-customer flourish: a brief slow-mo, then close up (counted in real time)
    if (this.slowT > 0) {
      this.slowT -= real;
      if (this.slowT <= 0) {
        this.simScale = 1;
        this.tweens.timeScale = 1;
      }
    }
    if (this.finaleT > 0) {
      this.finaleT -= real;
      if (this.finaleT <= 0) this.endDay(true);
    }
    this.acc += real * this.simScale;
    let n = 0;
    while (this.acc >= STEP && n < 8) {
      this.step(STEP);
      this.acc -= STEP;
      n++;
    }
    // presentation
    this.player.sync();
    this.controls.setSwapAvailable(this.player.items.length > 1);
    const held = new Set(this.player.items);
    for (const c of this.customers) c.setHighlight(held);
    const t = this.ending ? null : this.findTarget();
    this.showPrompt(t);
    this.lastTarget = t;
    this.updateHud();
    this.recipes.update();
    this.tutorial?.update();
  }

  private step(dt: number) {
    if (this.ending) {
      this.endT += dt;
      for (const c of this.customers) c.update(dt);
      this.crowd.update(dt, false);
      this.movePlayer(dt);
      if (this.endT > 2.8) this.finishDay();
      return;
    }
    if (!this.tutorialMode) this.dayT += dt;
    this.stats.time = Math.max(0, this.dayT);

    // spawns
    const open = this.endless || this.dayT < DAY_LENGTH - 20;
    if (!this.tutorialMode && this.dayT > 0 && open) {
      this.spawnT -= dt;
      if (this.spawnT <= 0) {
        if (this.trySpawn()) this.spawnT = this.nextSpawnGap();
        else this.spawnT = 1.5;
      }
    }
    if (this.endless) {
      // a fresh event every 30-45 seconds, drawn from Sunday's whole repertoire
      if (!this.director.queue.length && this.dayT > 10)
        this.director.queue.push({ t: this.dayT + Phaser.Math.FloatBetween(30, 45), id: Phaser.Utils.Array.GetRandom(["zoomies", "nap", "heist", "group"]) });
      if (this.dayT >= this.nextSpecialT) {
        this.nextSpecialT += 90;
        this.rotateSpecial();
      }
    }
    // last orders: the pub bell rings twenty seconds before closing and the door stops opening
    if (!this.tutorialMode && !this.endless && !this.lastOrders && this.dayT >= DAY_LENGTH - 20) {
      this.lastOrders = true;
      audio.play("bell");
      this.banner("LAST ORDERS!", "Serve everyone who is still waiting.", C.orange, 1300);
    }
    this.director.update(dt, this.dayT, this.endless || this.dayT < DAY_LENGTH - 15);
    this.movePlayer(dt);

    if (this.controls.takeSwap()) this.swapPaws();
    if (this.controls.takeInteract()) {
      const t = this.findTarget();
      if (t?.ok && t.run) {
        t.run();
      } else if (t && !t.ok) {
        audio.play("wrong");
        this.tweens.add({ targets: this.prompt, x: this.prompt.x + 5, yoyo: true, repeat: 2, duration: 40 });
      }
    }

    for (const c of this.customers) {
      c.update(dt);
      this.world.setDynamic(`c${c.id}`, c.solidRect());
    }
    for (const c of this.customers.filter((c) => c.state === "gone")) {
      this.world.setDynamic(`c${c.id}`, null);
      c.destroy();
    }
    this.customers = this.customers.filter((c) => c.state !== "gone");
    for (const s of this.stations) s.update(dt);
    this.assistant?.update(dt);
    this.crowd.update(dt, this.tutorialMode || this.endless || this.dayT < DAY_LENGTH - 20);

    // everyone served after last orders (and nobody walked out since the bell): the finale flourish
    if (this.lastOrders && !this.finaleDone && !this.bellMissed && this.stats.served > 0 && !this.customers.some((c) => c.state === "wait" || c.state === "enter"))
      this.finale();

    if (!this.tutorialMode && !this.endless && this.dayT >= DAY_LENGTH) this.endDay();
  }

  /** Spawn gap: the day's own pacing, or Endless Brunch's slow ramp from relaxed to hectic over five minutes. */
  private nextSpawnGap() {
    const [a, b] = this.def.spawn;
    if (!this.endless) return Phaser.Math.FloatBetween(a, b);
    const ramp = Math.min(1, Math.max(0, this.dayT) / 300);
    const k = Phaser.Math.Linear(1.35, 0.6, ramp);
    return Phaser.Math.FloatBetween(a * k, b * k);
  }

  /** How many single customers may be in at once (Endless Brunch grows from 3 to 6). */
  private get maxNow() {
    if (!this.endless) return this.def.maxCustomers;
    return Math.min(6, 3 + Math.floor(Math.max(0, this.dayT) / 75));
  }

  /** The last loaf of the day: a short slow-mo, confetti, a flourish and a tidy-close bonus. */
  private finale() {
    this.finaleDone = true;
    this.stats.finale = true;
    const reduce = save.data.settings.reducedMotion;
    const bonus = Math.max(5, Math.round(this.def.goal * 0.1));
    audio.play("finale");
    if (!reduce) {
      this.simScale = 0.3;
      this.tweens.timeScale = 0.5;
      this.slowT = 0.9;
    }
    confetti(this, 46);
    inkStamp(this, W / 2, 300, "LAST LOAF SERVED!", 4, `tidy close bonus +${bonus}`);
    this.player.rig.celebrate(1.2);
    this.addCoins(bonus, this.player.x, this.player.y - 120);
    markSeen(this, "moment:lastorders");
    unlock(this, "lastorders");
    this.finaleT = 2.3;
  }

  private movePlayer(dt: number) {
    const p = this.player;
    const lvl = save.data.upgrades.dash;
    const mv = this.ending ? new Phaser.Math.Vector2() : this.controls.move;
    p.dashCd = Math.max(0, p.dashCd - dt);
    if (p.stunT > 0) p.stunT -= dt;
    if (!this.ending && this.controls.takeDash()) {
      if (p.dashCd <= 0 && p.stunT <= 0) {
        p.dashT = DASH_TIME[lvl];
        p.dashCd = DASH_COOLDOWN[lvl];
        if (mv.lengthSq() > 0.01) p.dashDir.copy(mv).normalize();
        else p.dashDir.set(p.rig.facing, 0);
        audio.play("dash");
        if (this.tutorial) this.tutorial.dashSeen = true;
      }
    }
    if (p.dashT > 0) {
      p.dashT -= dt;
      p.vx = p.dashDir.x * 800;
      p.vy = p.dashDir.y * 800;
      p.pawT -= dt;
      if (p.pawT <= 0) {
        p.pawT = 0.045;
        this.pawPrint(p.x, p.y, p.dashDir);
      }
    } else if (p.stunT > 0) {
      p.vx *= Math.pow(0.02, dt);
      p.vy *= Math.pow(0.02, dt);
    } else {
      const k = Math.min(1, dt * 18);
      p.vx += (mv.x * p.speed - p.vx) * k;
      p.vy += (mv.y * p.speed - p.vy) * k;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    this.world.resolve(p, p.r);
    // anti-trap: if squeezed inside something (e.g. the visiting group or a napping corgi), pop to the nearest free spot
    if (this.world.overlaps(p, p.r)) {
      p.stuckT += dt;
      if (p.stuckT > 0.35) {
        const f = this.nav.nearestFree(p.x, p.y, (q) => this.world.overlaps(q, p.r + 2));
        p.x = f.x;
        p.y = f.y;
        p.stuckT = 0;
        puff(this, p.x, p.y, 3);
      }
    } else p.stuckT = 0;
    p.rig.animate(dt, p.vx, p.vy, p.speed, p.dashing);
  }

  private pawPrint(x: number, y: number, dir: Phaser.Math.Vector2) {
    this.pawFlip *= -1;
    const nx = -dir.y * 8 * this.pawFlip;
    const ny = dir.x * 8 * this.pawFlip;
    const s = this.add.image(x + nx, y + ny, "paw", 0).setDepth(1).setRotation(Math.atan2(dir.y, dir.x) + Math.PI / 2);
    this.tweens.add({ targets: s, alpha: 0, duration: 900, delay: 200, onComplete: () => s.destroy() });
  }

  // =================================================================== interaction
  findTarget(): Target | null {
    const p = this.player;
    const cands: Target[] = [];
    const held = p.items;
    for (const c of this.customers) {
      if (!c.waiting) continue;
      const d = c.distTo(p.x, p.y);
      if (d > 78) continue;
      const a = c.anchor;
      const px = a.x;
      const py = c.kind === "group" ? a.y + 30 : a.y + 34;
      let match = -1;
      for (let i = held.length - 1; i >= 0; i--)
        if (c.needs(held[i]) >= 0) {
          match = i;
          break;
        }
      if (match >= 0) {
        const it = held[match];
        cands.push({ label: `serve ${ITEM_INFO[it].name}`, ok: true, run: () => this.serveFromPlayer(c, match), x: px, y: py, score: d - 40 });
      } else if (held.length) {
        const it = held[held.length - 1];
        cands.push({ label: `give ${ITEM_INFO[it].name}…?`, ok: true, run: () => this.wrongGive(c, held.length - 1), x: px, y: py, score: d + 15 });
      } else {
        const names = [...new Set(c.remaining)].map((i) => ITEM_INFO[i].name).join(" + ");
        cands.push({ label: `wants: ${names}`, ok: false, x: px, y: py, score: d + 30 });
      }
    }
    for (const s of this.stations) {
      const d = Math.hypot(p.x - s.ix, p.y - s.iy);
      if (d > s.radius) continue;
      const a = s.action(held, p.capacity);
      if (!a) continue;
      const isPad = s.id === "padA" || s.id === "padB";
      cands.push({ ...a, x: s.x, y: isPad ? s.y - 36 : 140, score: d });
    }
    const nap = this.director.napTarget;
    if (nap) {
      const d = Math.hypot(p.x - nap.x, p.y - nap.y);
      if (d < 90) cands.push({ label: `boop Mochi awake (${nap.boops}/3)`, ok: true, run: () => this.director.boop(), x: nap.x, y: nap.y - 56, score: d - 20 });
    }
    if (!cands.length) return null;
    cands.sort((a, b) => (a.ok === b.ok ? a.score - b.score : a.ok ? -1 : 1));
    const best = cands[0];
    // two items carried: say which one is in the active (front) paw, and how to switch
    if (held.length > 1 && best.ok) return { ...best, label: `${best.label}   (${this.controls.swapLabel}: swap paws)` };
    return best;
  }

  /** Rotate which carried item is in the front paw (used first by stations and the pass). */
  swapPaws() {
    const p = this.player;
    if (p.items.length < 2) return;
    p.swap(this);
    audio.play("pick");
    floatText(this, p.x, p.y - 118, `front paw: ${ITEM_INFO[p.items[p.items.length - 1]].name}`, C.inkSoft, 18, 24);
  }

  giveItem(it: ItemId, silent = false) {
    const p = this.player;
    if (p.items.length >= p.capacity) return false;
    p.items.push(it);
    p.refreshCarry(this);
    p.rig.pop();
    if (!silent) audio.play("pick");
    return true;
  }
  takeItemAt(i: number): ItemId | undefined {
    const p = this.player;
    const [it] = p.items.splice(i, 1);
    p.refreshCarry(this);
    return it;
  }
  replaceItemAt(i: number, it: ItemId) {
    this.player.items[i] = it;
    this.player.refreshCarry(this);
    this.player.rig.pop();
  }

  stationReady(s: Station) {
    floatText(this, s.x, 46, "ready!", C.mintDark, 20, 20);
  }

  private serveFromPlayer(c: Customer, heldIdx: number) {
    const it = this.takeItemAt(heldIdx)!;
    this.serve(c, it, false);
  }

  /** Deliver an item to a customer (from the player or from Biscuit). */
  serve(c: Customer, it: ItemId, byAssistant: boolean) {
    const idx = c.needs(it);
    if (idx < 0) return;
    audio.play("place");
    const complete = c.deliver(idx);
    if (byAssistant) floatText(this, c.x, c.y - 120, "Biscuit delivered!", C.mintDark, 18, 30);
    if (!complete) return;
    // success beat: ear perk + butt wiggle on the corgi who served it
    if (byAssistant) this.assistant?.rig.celebrate();
    else this.player.rig.celebrate();
    // Today's Special pays double for that item (its share of the tip grows with it)
    const base = c.order.reduce((s, o) => s + ITEM_INFO[o].price * (o === c.special ? 2 : 1), 0);
    const tip = base * 0.6 * c.patienceFrac;
    const mult = comboMult(this.combo);
    let total = Math.max(1, Math.round((base + tip) * c.def.tip * mult * this.decorMult));
    if (c.golden) total = Math.round(total * 2.5);
    const tipPart = total - base;
    this.combo++;
    this.stats.bestCombo = Math.max(this.stats.bestCombo, this.combo);
    this.stats.served++;
    this.stats.tips += Math.max(0, tipPart);
    this.addCoins(total, c.anchor.x, c.anchor.y - (c.kind === "group" ? 200 : 110), false, c.golden);
    burst(this, c.anchor.x, c.anchor.y - 80, ["heart", "star", "star_mint"], c.kind === "group" ? 14 : 6);
    // one bell note per order, climbing the scale while the streak lasts
    audio.play("note", this.combo);
    const stamp = STAMPS.find((s) => s.at === this.combo) ?? (this.combo > 12 && (this.combo - 12) % 5 === 0 ? { text: "LEGENDARY LOAF!", tier: 4 } : null);
    const nextMult = comboMult(this.combo).toFixed(2).replace(/0$/, "");
    if (stamp) {
      audio.play("stamp", stamp.tier);
      inkStamp(this, W / 2, 300, stamp.text, stamp.tier, `tips x${nextMult}`);
      burst(this, 822, 30, ["star", "star_coral", "star_mint"], 10, 60);
    } else if (this.combo === 2) {
      floatText(this, c.anchor.x, c.anchor.y - 170, `COMBO x${nextMult}!`, C.coral, 28, 50);
    }
    if (c.special) {
      this.stats.specials++;
      floatText(this, c.anchor.x, c.anchor.y - 205, "special x2!", C.caramelDark, 22, 30);
      markSeen(this, "moment:special");
      unlock(this, "special");
    }
    if (c.golden) {
      this.stats.golden++;
      audio.play("golden");
      floatText(this, c.anchor.x, c.anchor.y - 240, "GOLDEN TIP!", C.caramelDark, 32, 40);
      burst(this, c.anchor.x, c.anchor.y - 120, ["star", "star", "coin"], 16, 110);
      unlock(this, "golden");
    }
    // sticker book + achievements
    for (const it of new Set(c.order)) markSeen(this, `item:${it}`);
    unlock(this, "first");
    if (this.combo >= 5) unlock(this, "combo5");
    if (this.combo >= 10) unlock(this, "combo10");
    if (c.order.includes("daytona")) unlock(this, "daytona");
    if (this.endless && this.stats.served >= 30) unlock(this, "legend");
  }

  /**
   * Coins pop out of the moment, arc up into the counter, and the total rolls up as each one lands,
   * finishing on a cha-ching. Reduced motion: one coin, straight line.
   */
  addCoins(n: number, x: number, y: number, small = true, golden = false) {
    this.stats.earned += n;
    floatText(this, x, y, `+${n}`, C.caramelDark, small ? 24 : 34, 60);
    const reduce = save.data.settings.reducedMotion;
    const k = reduce ? 1 : Math.min(golden ? 12 : 7, Math.max(1, Math.ceil(n / 5)));
    const per = Math.floor(n / k);
    for (let i = 0; i < k; i++) {
      const amt = i === k - 1 ? n - per * (k - 1) : per;
      const s = this.add.image(x, y, "coin", 0).setDepth(9600).setScale(0.7);
      const tx = COIN_HUD.x + Phaser.Math.Between(-6, 6);
      const curve = new Phaser.Curves.QuadraticBezier(
        new Phaser.Math.Vector2(x, y),
        new Phaser.Math.Vector2(reduce ? (x + tx) / 2 : x + Phaser.Math.Between(-110, 110), reduce ? (y + COIN_HUD.y) / 2 : Math.min(y, COIN_HUD.y) - Phaser.Math.Between(40, 140)),
        new Phaser.Math.Vector2(tx, COIN_HUD.y),
      );
      const pt = new Phaser.Math.Vector2();
      this.tweens.addCounter({
        from: 0,
        to: 1,
        delay: i * 45,
        duration: 560 + i * 40,
        ease: "Sine.in",
        onUpdate: (tw) => {
          const v = tw.getValue() ?? 0;
          curve.getPoint(v, pt);
          s.setPosition(pt.x, pt.y).setScale(0.75 - 0.25 * v);
        },
        onComplete: () => {
          s.destroy();
          this.coinLanded(amt, i, i === k - 1);
        },
      });
    }
  }

  private coinLanded(amt: number, i: number, last: boolean) {
    if (!this.sys.isActive()) return;
    this.shownCoins = Math.min(this.stats.earned, this.shownCoins + amt);
    if (last) {
      audio.play("chaching");
      this.tweens.add({ targets: this.hud.coins, scale: 1.25, yoyo: true, duration: 90 });
    } else audio.play("tick", i * 3);
  }

  private wrongGive(c: Customer, heldIdx: number) {
    const it = this.player.items[heldIdx];
    c.wrong(it);
    audio.play("wrong");
    this.stats.mistakes++;
    if (!c.forgiving) {
      if (this.combo >= 2) this.floatAt(this.player.x, this.player.y - 130, "combo dropped!", C.coral);
      this.combo = 0;
    }
  }

  customerTimedOut(c: Customer) {
    c.leave(true);
    this.stats.missed++;
    if (this.lastOrders) this.bellMissed++;
    if (this.combo >= 2) this.floatAt(c.x, c.y - 150, "combo lost!", C.coral);
    this.combo = 0;
    shake(this, 140, 0.003);
    if (this.endless) this.loseLife();
  }

  /** Endless Brunch: a walkout cracks one heart. The third ends the run. */
  private loseLife() {
    if (this.ending || this.lives <= 0) return;
    this.lives--;
    audio.play("lifelost");
    const h = this.hearts[this.lives];
    if (h) {
      h.setTint(0x9b8f86);
      if (!save.data.settings.reducedMotion) this.tweens.add({ targets: h, scale: 1.4, angle: 20, yoyo: true, duration: 140 });
      h.setAlpha(0.45);
    }
    if (this.lives <= 0) this.endDay();
  }

  /** A content creator photographs the corgi barista: a flash on the corgi, a polaroid, a small bonus. */
  creatorPhoto(c: Customer) {
    audio.play("camera");
    const p = this.player;
    const cam = boil(this, c.x + 30, c.y - 70, "camera").setDepth(4900);
    const fl = this.add.image(p.x, p.y - 40, "flash", 0).setDepth(4901).setScale(0.3);
    this.tweens.add({ targets: fl, scale: 2.2, alpha: 0, duration: 380, onComplete: () => fl.destroy() });
    this.tweens.add({ targets: cam, alpha: 0, delay: 900, duration: 300, onComplete: () => cam.destroy() });
    p.rig.celebrate(0.7);
    const bonus = 6 + Math.round(this.combo * 1.5);
    this.addCoins(bonus, c.x, c.y - 160);
    floatText(this, c.x, c.y - 196, `#corgibarista · +${bonus} likes`, C.coral, 18, 30);
  }

  pupContact(x: number, y: number) {
    const p = this.player;
    if (p.dashing || p.stunT > 0) return;
    const d = Math.hypot(p.x - x, p.y - y);
    if (d > 34) return;
    const nx = (p.x - x) / (d || 1);
    const ny = (p.y - y) / (d || 1);
    p.vx = nx * 420;
    p.vy = ny * 420;
    p.stunT = 0.35;
    audio.play("bump");
    shake(this, 120, 0.005);
    floatText(this, p.x, p.y - 110, "bonk!", C.coral, 22, 30);
  }

  // =================================================================== spawning
  private freeSeats(): number[] {
    const used = new Set(this.customers.filter((c) => c.kind === "seat").map((c) => c.seat));
    const out: number[] = [];
    SEATS.forEach((s, i) => {
      if (used.has(i)) return;
      // don't spawn a customer on top of the player
      if (Math.hypot(s.x - this.player.x, s.y - this.player.y) < 40) return;
      out.push(i);
    });
    return out;
  }

  private pickOrderItem(exclude: ItemId[] = []): ItemId {
    const menu = this.def.menu.filter((m) => !exclude.includes(m));
    if (!menu.length) return this.def.menu[0];
    const prev = this.dayIdx > 0 ? DAYS[this.dayIdx - 1].menu : [];
    const weights = menu.map((m) => (prev.includes(m) ? 1 : 2.4));
    let r = Math.random() * weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < menu.length; i++) {
      r -= weights[i];
      if (r <= 0) return menu[i];
    }
    return menu[0];
  }

  private makeOrder(role: Role): ItemId[] {
    if (role === "group") {
      // a group shares one order of three: generous coins without burying the bar
      const n = 3;
      const out: ItemId[] = [];
      for (let i = 0; i < n; i++) out.push(this.pickOrderItem(out.length < this.def.menu.length - 1 ? out : []));
      return out;
    }
    const first: ItemId = role === "enthusiast" ? enthusiastPick(this.def.menu) : this.pickOrderItem();
    const order: ItemId[] = [first];
    if (Math.random() < this.def.comboChance) order.push(this.pickOrderItem([first]));
    if (this.dayIdx >= 5 && role !== "enthusiast" && Math.random() < 0.05) order.push(this.pickOrderItem(order));
    return order;
  }

  private patienceFor(role: Role, order: ItemId[]) {
    const lvl = save.data.upgrades.patience;
    const extra = order.reduce(
      (s, o) => s + (o === "pally" ? 0.4 : o === "sourdough" ? 0.25 : o === "latte" || o === "icedlatte" ? 0.15 : o === "juicebox" ? 0.1 : 0),
      0,
    );
    return this.def.patience * ROLES[role].patience * PATIENCE_MULT[lvl] * (1 + 0.55 * (order.length - 1) + extra);
  }

  /** Pick an outfit for a role that is not already in the room, so two identical people never sit side by side. */
  private freshLook(role: Role): string | undefined {
    const used = new Set(this.customers.flatMap((c) => c.members.map((m) => m.look)));
    const opts = ROLE_LOOKS[role].filter((l) => !used.has(l));
    return opts.length ? Phaser.Utils.Array.GetRandom(opts) : undefined;
  }

  private trySpawn(): boolean {
    const active = this.customers.filter((c) => c.state !== "leave" && c.state !== "gone" && c.kind !== "group").length;
    if (active >= this.maxNow) return false;
    const pool = this.def.roles.filter((r) => {
      if (r === "group") return false;
      // one content creator at a time is plenty
      if (r === "creator") return !this.customers.some((c) => c.role === "creator" && c.state !== "gone");
      return true;
    });
    const role = Phaser.Utils.Array.GetRandom(pool) as Role;
    const seats = this.freeSeats();
    if (!seats.length) return false;
    const seat = Phaser.Utils.Array.GetRandom(seats);
    const order = this.makeOrder(role);
    const c = new Customer(this, role, order, seat, this.patienceFor(role, order), this.freshLook(role));
    this.customers.push(c);
    if (this.goldenAt >= 0 && this.dayT >= this.goldenAt && role !== "creator") {
      c.makeGolden();
      if (this.endless) this.goldenAt = this.dayT + Phaser.Math.FloatBetween(150, 240);
      else {
        this.goldenAt = -1;
        save.data.goldenWeek = true;
        save.write();
      }
    }
    return true;
  }

  /** The visiting group: three humans at the window bar with one shared order. */
  spawnGroup(): boolean {
    if (this.customers.some((c) => c.kind === "group")) return false;
    const order = this.makeOrder("group");
    this.customers.push(new Customer(this, "group", order, -1, this.patienceFor("group", order)));
    return true;
  }

  spawnScripted(role: Role, order: ItemId[], seat: number) {
    const c = new Customer(this, role, order, seat, 999, this.freshLook(role));
    this.customers.push(c);
    return c;
  }

  // =================================================================== day end
  private endDay(early = false) {
    if (this.ending) return;
    this.ending = true;
    this.endT = 0;
    this.simScale = 1;
    this.tweens.timeScale = 1;
    this.slowT = 0;
    this.finaleT = 0;
    if (this.endless) {
      this.banner("That's brunch!", `${this.stats.served} orders served. Score: ${this.stats.earned}.`, C.coral, 2200);
      audio.play("lifelost");
    } else {
      this.banner(early ? "All served!" : "Closing time!", early ? "Not a single loaf left waiting. Flip the sign." : "Flip the sign. Count the coins. Pet a loaf.", C.mint, 2200);
      audio.play("win");
    }
    for (const c of this.customers) if (c.state === "wait" || c.state === "enter") c.leave(false);
    this.director.forceEnd();
    this.assistant?.reset();
    for (const s of this.stations) s.clear();
  }

  private finishDay() {
    if (!this.scene.isActive()) return;
    const st = this.stats;
    const d = save.data;
    if (this.endless) {
      // a score run: coins are the score and are not banked; the week's progress is untouched
      const prevBest = d.endlessBest;
      const newBest = st.earned > prevBest;
      if (newBest) d.endlessBest = st.earned;
      save.write();
      this.scene.start("Results", { ...st, stars: 0, prevStars: 0, best: Math.max(prevBest, st.earned), prevBest, newBest });
      return;
    }
    d.coins += st.earned;
    d.totalEarned += st.earned;
    const stars = st.earned >= st.goal * 1.4 ? 3 : st.earned >= st.goal ? 2 : st.earned >= st.goal * 0.5 ? 1 : 0;
    const prevStars = d.stars[this.dayIdx] ?? 0;
    d.stars[this.dayIdx] = Math.max(d.stars[this.dayIdx] ?? 0, stars);
    d.day = Math.max(d.day, this.dayIdx + 1);
    save.write();
    this.scene.start("Results", { ...st, stars, prevStars });
  }
}
