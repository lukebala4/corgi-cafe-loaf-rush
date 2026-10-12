import Phaser from "phaser";
import { BLEND_TIME, BREW_TIME, COLORS as C, DAYS, ITEM_INFO, ItemId, STATION_BASE_Y, StationId } from "../config";
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

export const PRESS_TIME = 4;
export const BURN_TIME = 8;
const STEAM_TIME = 1.2;

/** A recipe step a station can perform on the item in the corgi's paws. */
interface Step {
  from: ItemId;
  to: ItemId;
  label: string;
  dur: number;
  menu: ItemId; // only offered when this item is on today's menu
}

const NAMES: Partial<Record<StationId, string>> = {
  press: "PRESS",
  croissant: "CROISSANTS",
  cake: "CAKE",
  blender: "BLENDER",
  cups: "CUPS",
  milk: "MILK",
  espresso: "ESPRESSO",
  cold: "COLD BAR",
  trash: "BIN",
};

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

  /** Prompt shown when walking up to a locked station. */
  private lockLabel = "Locked";

  /** `opens` is the index of the day this station unlocks (-1 if unknown). */
  constructor(g: GameScene, id: StationId, x: number, locked: boolean, padY?: number, opens = -1) {
    this.g = g;
    this.id = id;
    this.x = x;
    if (this.isPad) {
      this.y = padY!;
      this.ix = x;
      this.iy = padY!;
      this.radius = 62;
      this.sprite = boil(g, x, this.y, "st_pad").setDepth(this.y - 30);
    } else {
      this.y = STATION_BASE_Y;
      this.ix = x;
      this.iy = 180;
      this.radius = id === "croissant" || id === "cake" ? 50 : 64;
      this.sprite = boil(g, x, this.y, `st_${id}`).setOrigin(0.5, 1).setScale(0.86).setDepth(10);
      this.label = txt(g, x, 140, NAMES[id] ?? id, 16, C.inkSoft, true).setDepth(11);
      if (this.label.width > 92) this.label.setScale(92 / this.label.width);
    }
    this.progress = g.add.graphics().setDepth(4500);
    this.locked = locked;
    if (locked) {
      // a locked station, not an unfinished feature: padlock + the day it opens
      const day = opens >= 0 ? DAYS[opens].name : "";
      const n = g.add.container(x, 92).setDepth(12).setAngle(Phaser.Math.Between(-6, 6));
      n.add(g.add.image(0, 0, "soon", 0));
      n.add(g.add.image(-27, -10, "padlock", 0).setScale(0.82));
      n.add(txt(g, 9, -10, "Locked", 20, C.ink, true));
      n.add(txt(g, 0, 13, day ? `opens ${day.slice(0, 3)}` : "not today", 18, C.orangeDark, true));
      this.lockLabel = day ? `Locked: opens ${day}` : "Locked today";
      this.lockNote = n;
      this.sprite.setAlpha(0.35);
    }
  }

  get isPad() {
    return this.id === "padA" || this.id === "padB";
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
      this.outSprite = boil(this.g, this.x, this.isPad ? this.y - 10 : 64, `item_${item}`).setDepth(this.isPad ? this.y + 1 : 30);
      if (!this.isPad) {
        this.outSprite.setScale(0.95);
        if (!save.data.settings.reducedMotion)
          this.g.tweens.add({ targets: this.outSprite, y: 56, yoyo: true, repeat: -1, duration: 420, ease: "Sine.inOut" });
      }
    }
  }

  private setBusyVisual(key: string | null, y = 106, scale = 0.6) {
    this.busySprite?.destroy();
    this.busySprite = undefined;
    if (key) this.busySprite = boil(this.g, this.x, y, key).setDepth(20).setScale(scale);
  }

  /** Recipe steps this station offers today. */
  private steps(): Step[] {
    const brew = BREW_TIME[save.data.upgrades.espresso];
    switch (this.id) {
      case "espresso":
        return [
          { from: "cup", to: "americano", label: "brew an Americano", dur: brew, menu: "americano" },
          { from: "milk", to: "latte", label: "pour espresso: Latte", dur: brew, menu: "latte" },
        ];
      case "milk":
        return [{ from: "cup", to: "milk", label: "steam milk into the cup", dur: STEAM_TIME, menu: "latte" }];
      case "cold":
        return [
          { from: "latte", to: "icedlatte", label: "pour over ice: Iced Latte", dur: 0.8, menu: "icedlatte" },
          { from: "icedlatte", to: "pally", label: "pistachio foam: Pally Pick-Me-Up", dur: 1.4, menu: "pally" },
          { from: "cup", to: "daytona", label: "cold brew + coconut: Brew Daytona", dur: 1.2, menu: "daytona" },
        ];
      case "blender":
        return [{ from: "cup", to: "juicebox", label: "blend berries: The Juicebox", dur: BLEND_TIME[save.data.upgrades.espresso], menu: "juicebox" }];
    }
    return [];
  }

  /** What would happen if the player interacted now? Uses the item in the corgi's paw first (top slot). */
  action(held: ItemId[], capacity: number): Action | null {
    if (this.locked) return { label: this.lockLabel, ok: false };
    const free = held.length < capacity;
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
    const grab = (it: ItemId, verb: string): Action =>
      free ? { label: `${verb}`, ok: true, run: () => (g.giveItem(it), this.bounce()) } : { label: "paws full!", ok: false };

    switch (this.id) {
      case "cups":
        return grab("cup", "grab a Corgi Cafe cup");
      case "croissant":
        return grab("croissant", "grab a Plain Croissant");
      case "cake":
        return grab("cake", "slice Corgi Orange Cake");
      case "trash": {
        if (!held.length) return { label: "bin (nothing to toss)", ok: false };
        const top = held[held.length - 1];
        return {
          label: `bin the ${ITEM_INFO[top].name}`,
          ok: true,
          run: () => {
            g.takeItemAt(held.length - 1);
            audio.play("trash");
            puff(g, this.x, 90, 3);
            this.bounce();
          },
        };
      }
      case "press": {
        if (this.state === "ready") return take(this.out === "burnt" ? "rescue the" : "take");
        if (this.state === "busy") return { label: "pressing...", ok: false };
        return {
          label: "press a Chicken sourdough",
          ok: true,
          run: () => {
            this.start(PRESS_TIME, "sourdough");
            this.setBusyVisual(null);
            audio.play("place");
            this.bounce();
          },
        };
      }
      case "espresso":
      case "milk":
      case "cold":
      case "blender": {
        if (this.state === "ready") return take("take");
        if (this.state === "busy") return { label: this.id === "blender" ? "blending..." : this.id === "milk" ? "steaming..." : "brewing...", ok: false };
        const steps = this.steps().filter((s) => g.menu.includes(s.menu));
        // The item in the paw (top slot) decides; the other slot is used only if the paw item fits nothing.
        for (let i = held.length - 1; i >= 0; i--) {
          const st = steps.find((s) => s.from === held[i]);
          if (!st) continue;
          return {
            label: st.label,
            ok: true,
            run: () => {
              g.takeItemAt(i);
              this.start(st.dur, st.to);
              this.setBusyVisual(this.id === "blender" ? null : `item_${st.from}`, this.id === "cold" ? 104 : 108);
              audio.play(this.id === "milk" ? "art" : this.id === "cold" ? "pop" : "brew");
            },
          };
        }
        const needs = [...new Set(steps.map((s) => ITEM_INFO[s.from].name))];
        return { label: needs.length ? `needs ${needs.join(" or ")}` : "not on today's menu", ok: false };
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
        return { label: g.assistant ? "pass (Biscuit delivers)" : "pass (set items here)", ok: false };
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
      if (this.steamT <= 0 && this.id !== "cold") {
        this.steamT = 0.35;
        const s = this.g.add.image(this.x + Phaser.Math.Between(-14, 14), 70, "steam", 0).setDepth(25).setScale(0.4).setAlpha(0.7);
        this.g.tweens.add({ targets: s, y: 30, alpha: 0, duration: 800, onComplete: () => s.destroy() });
      }
      if (!save.data.settings.reducedMotion) {
        if (this.id === "milk" && this.busySprite) this.busySprite.angle = Math.sin(this.t * 20) * 8;
        if (this.id === "blender") this.sprite.x = this.x + Math.sin(this.t * 60) * 1.6;
        if (this.id === "press") this.sprite.y = this.y + Math.abs(Math.sin(this.t * 3)) * 1.5;
      }
      const f = Math.min(1, this.t / this.dur);
      g.fillStyle(0xffffff, 0.95);
      g.fillCircle(this.x + 46, 52, 15);
      g.lineStyle(5, 0xf0702a, 1);
      g.beginPath();
      g.arc(this.x + 46, 52, 11, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * f);
      g.strokePath();
      g.lineStyle(2, 0x2b2622, 1);
      g.strokeCircle(this.x + 46, 52, 15);
      if (this.t >= this.dur) {
        this.state = "ready";
        this.readyT = 0;
        this.sprite.x = this.x;
        this.sprite.y = this.y;
        const it = this.out!;
        this.setBusyVisual(this.id === "press" ? "press_hot" : null, 40, 1);
        this.setOut(it);
        audio.play(this.id === "press" ? "pop" : "ding");
        this.g.stationReady(this);
      }
    } else if (this.state === "ready" && this.id === "press") {
      this.readyT += dt;
      if (this.out === "sourdough") {
        const warn = this.readyT / BURN_TIME;
        if (warn > 0.5) {
          g.fillStyle(0xf2786b, 0.25 + 0.25 * Math.sin(this.readyT * 14));
          g.fillCircle(this.x, 92, 40);
        }
        if (this.readyT >= BURN_TIME) {
          this.setOut("burnt");
          this.setBusyVisual(null);
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
    this.sprite.x = this.x;
    this.sprite.y = this.y;
    this.progress.clear();
  }
}
