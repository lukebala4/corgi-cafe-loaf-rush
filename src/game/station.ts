import Phaser from "phaser";
import { BREW_TIME, COLORS as C, ITEM_INFO, ItemId, StationId } from "../config";
import { boil } from "../art/textures";
import { puff, txt } from "../ui";
import { audio } from "../audio";
import { save } from "../save";
import type { GameScene } from "../scenes/GameScene";

export interface Action {
  label: string;
  ok: boolean;
  run?: () => void;
}

type SState = "idle" | "busy" | "ready";

const TOAST_TIME = 4;
const BURN_TIME = 8;

export class Station {
  g: GameScene;
  id: StationId;
  x: number;
  y: number;
  ix: number;
  iy: number;
  radius: number;
  sprite: Phaser.GameObjects.Sprite;
  label?: Phaser.GameObjects.Text;
  locked = false;
  lockNote?: Phaser.GameObjects.Container;
  state: SState = "idle";
  out: ItemId | null = null; // item produced / stored
  t = 0;
  dur = 1;
  readyT = 0;
  progress: Phaser.GameObjects.Graphics;
  outSprite?: Phaser.GameObjects.Sprite;
  busySprite?: Phaser.GameObjects.Sprite;
  steamT = 0;

  constructor(g: GameScene, id: StationId, x: number, locked: boolean, padY?: number) {
    this.g = g;
    this.id = id;
    this.x = x;
    const isPad = id === "padA" || id === "padB";
    if (isPad) {
      this.y = padY!;
      this.ix = x;
      this.iy = padY!;
      this.radius = 62;
      this.sprite = boil(g, x, this.y, "st_pad").setDepth(this.y - 30);
    } else {
      this.y = 128;
      this.ix = x;
      this.iy = 180;
      this.radius = 72;
      this.sprite = boil(g, x, this.y, `st_${id}`).setOrigin(0.5, 1).setScale(0.86).setDepth(10);
      const names: Record<string, string> = {
        cups: "CUPS",
        espresso: "ESPRESSO",
        milk: "FOAM ART",
        ice: "ICE",
        pastry: "PASTRY",
        toaster: "TOASTER",
        trash: "TRASH",
      };
      this.label = txt(g, x, 140, names[id], 16, C.inkSoft, true).setDepth(11);
    }
    this.progress = g.add.graphics().setDepth(4500);
    this.locked = locked;
    if (locked) {
      const n = g.add.container(x, 92).setDepth(12).setAngle(Phaser.Math.Between(-6, 6));
      n.add(g.add.image(0, 0, "soon", 0));
      n.add(txt(g, 0, -8, "coming", 18, C.inkSoft, true));
      n.add(txt(g, 0, 12, "soon!", 20, C.coral, true));
      this.lockNote = n;
      this.sprite.setAlpha(0.35);
    }
  }

  private bounce() {
    if (save.data.settings.reducedMotion) return;
    const sy = this.sprite.scaleY;
    this.g.tweens.add({ targets: this.sprite, scaleY: sy * 0.9, scaleX: this.sprite.scaleX * 1.06, yoyo: true, duration: 80 });
  }

  private setOut(item: ItemId | null) {
    this.out = item;
    this.outSprite?.destroy();
    this.outSprite = undefined;
    if (item) {
      const isPad = this.id === "padA" || this.id === "padB";
      this.outSprite = boil(this.g, this.x + (isPad ? 0 : 0), isPad ? this.y - 10 : 64, `item_${item}`).setDepth(isPad ? this.y + 1 : 30);
      if (!isPad) {
        this.outSprite.setScale(0.95);
        this.g.tweens.add({ targets: this.outSprite, y: 56, yoyo: true, repeat: -1, duration: 420, ease: "Sine.inOut" });
      }
    }
  }

  private setBusyVisual(key: string | null, y = 106) {
    this.busySprite?.destroy();
    this.busySprite = undefined;
    if (key) this.busySprite = boil(this.g, this.x, y, key).setDepth(20).setScale(0.6);
  }

  /** What would happen if the player interacted now? */
  action(held: ItemId[], capacity: number): Action | null {
    if (this.locked) return { label: "coming soon!", ok: false };
    const free = held.length < capacity;
    const has = (i: ItemId) => held.lastIndexOf(i);
    const g = this.g;
    const take = (verb: string): Action =>
      free
        ? {
            label: `${verb} ${ITEM_INFO[this.out!].name}`,
            ok: true,
            run: () => {
              g.giveItem(this.out!);
              this.state = "idle";
              this.setOut(null);
              this.setBusyVisual(null);
              this.bounce();
            },
          }
        : { label: "paws full!", ok: false };

    switch (this.id) {
      case "cups":
        return free ? { label: "grab a cup", ok: true, run: () => (g.giveItem("cup"), this.bounce()) } : { label: "paws full!", ok: false };
      case "pastry":
        return free
          ? { label: "grab a croissant", ok: true, run: () => (g.giveItem("croissant"), this.bounce()) }
          : { label: "paws full!", ok: false };
      case "trash": {
        if (!held.length) return { label: "trash (nothing to toss)", ok: false };
        const top = held[held.length - 1];
        return {
          label: `toss ${ITEM_INFO[top].name}`,
          ok: true,
          run: () => {
            g.takeItemAt(held.length - 1);
            audio.play("trash");
            puff(g, this.x, 90, 3);
            this.bounce();
          },
        };
      }
      case "espresso": {
        if (this.state === "ready") return take("take");
        if (this.state === "busy") return { label: "brewing…", ok: false };
        const ci = has("cup");
        if (ci < 0) return { label: "needs an empty cup", ok: false };
        return {
          label: "brew coffee",
          ok: true,
          run: () => {
            g.takeItemAt(ci);
            this.start(BREW_TIME[save.data.upgrades.espresso], "coffee");
            this.setBusyVisual("item_cup", 112);
            audio.play("brew");
          },
        };
      }
      case "milk": {
        if (this.state === "ready") return take("take");
        if (this.state === "busy") return { label: "drawing art…", ok: false };
        const menu = g.menu;
        const opts: { i: number; label: string; out: ItemId; dur: number }[] = [];
        const li = has("latte");
        if (li >= 0 && g.fancyAllowed) opts.push({ i: li, label: "make it FANCY", out: "fancy", dur: 1.6 });
        const co = has("coffee");
        if (co >= 0 && menu.includes("latte")) opts.push({ i: co, label: "draw corgi latte art", out: "latte", dur: 1.2 });
        const cu = has("cup");
        if (cu >= 0 && menu.includes("pupcup")) opts.push({ i: cu, label: "make puppuccino", out: "pupcup", dur: 1.0 });
        if (!opts.length) {
          const need = [menu.includes("latte") ? "coffee" : "", menu.includes("pupcup") ? "cup" : "", g.fancyAllowed ? "latte" : ""].filter(Boolean);
          return { label: `needs ${need.join(" / ")}`, ok: false };
        }
        // prefer the item on top of the stack
        opts.sort((a, b) => b.i - a.i);
        const o = opts[0];
        return {
          label: o.label,
          ok: true,
          run: () => {
            g.takeItemAt(o.i);
            this.start(o.dur, o.out);
            this.setBusyVisual(o.out === "fancy" ? "item_latte" : o.out === "pupcup" ? "item_cup" : "item_coffee", 100);
            audio.play("art");
          },
        };
      }
      case "ice": {
        const co = has("coffee");
        if (co < 0) return { label: "needs a hot coffee", ok: false };
        return {
          label: "ice it!",
          ok: true,
          run: () => {
            g.replaceItemAt(co, "iced");
            audio.play("pop");
            this.bounce();
          },
        };
      }
      case "toaster": {
        if (this.state === "ready") return take(this.out === "burnt" ? "rescue" : "take");
        if (this.state === "busy") return { label: "toasting…", ok: false };
        return {
          label: "toast bread",
          ok: true,
          run: () => {
            this.start(TOAST_TIME, "toast");
            this.setBusyVisual(null);
            audio.play("place");
            this.bounce();
          },
        };
      }
      case "padA":
      case "padB": {
        if (this.out && free)
          return {
            label: `pick up ${ITEM_INFO[this.out].name}`,
            ok: true,
            run: () => {
              g.giveItem(this.out!);
              this.setOut(null);
            },
          };
        if (!this.out && held.length) {
          const top = held[held.length - 1];
          return {
            label: g.assistant ? `pass ${ITEM_INFO[top].name} to Biscuit` : `set down ${ITEM_INFO[top].name}`,
            ok: true,
            run: () => {
              g.takeItemAt(held.length - 1);
              this.setOut(top);
              audio.play("place");
            },
          };
        }
        if (this.out) return { label: "paws full!", ok: false };
        return { label: g.assistant ? "pass counter (Biscuit delivers)" : "pass counter (set items here)", ok: false };
      }
    }
    return null;
  }

  /** Used by the assistant. */
  takeFromPad(): ItemId | null {
    const it = this.out;
    this.setOut(null);
    return it;
  }
  putOnPad(it: ItemId) {
    this.setOut(it);
  }

  private start(dur: number, out: ItemId) {
    this.state = "busy";
    this.t = 0;
    this.dur = dur;
    this.out = out;
    this.bounce();
  }

  update(dt: number) {
    const g = this.progress;
    g.clear();
    if (this.state === "busy") {
      this.t += dt;
      this.steamT -= dt;
      if (this.steamT <= 0 && this.id !== "milk") {
        this.steamT = 0.35;
        const s = this.g.add.image(this.x + Phaser.Math.Between(-14, 14), 70, "steam", 0).setDepth(25).setScale(0.4).setAlpha(0.7);
        this.g.tweens.add({ targets: s, y: 30, alpha: 0, duration: 800, onComplete: () => s.destroy() });
      }
      if (this.id === "milk" && this.busySprite) this.busySprite.angle = Math.sin(this.t * 20) * 8;
      const f = Math.min(1, this.t / this.dur);
      g.fillStyle(0xffffff, 0.95);
      g.fillCircle(this.x + 46, 52, 15);
      g.lineStyle(5, 0x7fcfb0, 1);
      g.beginPath();
      g.arc(this.x + 46, 52, 11, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * f);
      g.strokePath();
      g.lineStyle(2, 0x2b2622, 1);
      g.strokeCircle(this.x + 46, 52, 15);
      if (this.t >= this.dur) {
        this.state = "ready";
        this.readyT = 0;
        const it = this.out!;
        this.setBusyVisual(this.id === "toaster" ? "toast_up" : null, 76);
        this.setOut(it);
        audio.play(this.id === "toaster" ? "pop" : "ding");
        this.g.stationReady(this);
      }
    } else if (this.state === "ready" && this.id === "toaster") {
      this.readyT += dt;
      if (this.out === "toast") {
        const warn = this.readyT / BURN_TIME;
        if (warn > 0.5) {
          g.fillStyle(0xf2786b, 0.25 + 0.25 * Math.sin(this.readyT * 14));
          g.fillCircle(this.x, 92, 40);
        }
        if (this.readyT >= BURN_TIME) {
          this.setOut("burnt");
          audio.play("burn");
          puff(this.g, this.x, 70, 6);
          this.g.floatAt(this.x, 60, "burnt! (oops)", C.coral);
        }
      } else if (Math.random() < dt * 3) puff(this.g, this.x + Phaser.Math.Between(-20, 20), 70, 1);
    }
  }

  /** Reset on day end / interrupted interaction. */
  clear() {
    this.state = "idle";
    this.setOut(null);
    this.setBusyVisual(null);
    this.progress.clear();
  }
}
