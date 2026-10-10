import Phaser from "phaser";
import { COLORS as C, DOOR, DOOR_INSIDE, DOORWAYS, EventId, ItemId, PASS_H, PASS_Y, STATION_DEFS } from "../config";
import { boil } from "../art/textures";
import { CorgiRig } from "./corgi";
import { burst, puff, txt } from "../ui";
import { audio } from "../audio";
import type { GameScene } from "../scenes/GameScene";
import type { Customer } from "./customer";
import type { Station } from "./station";

type P = { x: number; y: number };

function walkTo(o: { x: number; y: number; path: P[] }, speed: number, dt: number): { done: boolean; vx: number; vy: number } {
  const t = o.path[0];
  if (!t) return { done: true, vx: 0, vy: 0 };
  const dx = t.x - o.x;
  const dy = t.y - o.y;
  const d = Math.hypot(dx, dy);
  const s = speed * dt;
  if (d <= s) {
    o.x = t.x;
    o.y = t.y;
    o.path.shift();
    return { done: o.path.length === 0, vx: (dx / Math.max(dt, 1e-4)) * 0.5, vy: (dy / Math.max(dt, 1e-4)) * 0.5 };
  }
  o.x += (dx / d) * s;
  o.y += (dy / d) * s;
  return { done: false, vx: (dx / d) * speed, vy: (dy / d) * speed };
}

// ---------------------------------------------------------------------------
// Biscuit, the assistant corgi: carries items left on the PASS counter to whoever ordered them.
// ---------------------------------------------------------------------------
export class Assistant {
  g: GameScene;
  rig: CorgiRig;
  x: number;
  y: number;
  path: P[] = [];
  state: "idle" | "toPad" | "toCust" | "home" = "idle";
  pad?: Station;
  item: ItemId | null = null;
  target?: Customer;
  carry?: Phaser.GameObjects.Sprite;
  home: P;
  speed = 210;
  thinkT = 0;

  constructor(g: GameScene, home: P) {
    this.g = g;
    this.home = home;
    this.x = home.x;
    this.y = home.y;
    this.rig = new CorgiRig(g, this.x, this.y, 0.7, "staff");
    this.rig.addHeadwear("cap", 0, -2);
    const tag = txt(g, 0, -86, "Biscuit", 16, C.inkSoft);
    this.rig.add(tag);
  }

  private setCarry(it: ItemId | null) {
    this.item = it;
    this.carry?.destroy();
    this.carry = it ? boil(this.g, this.x, this.y - 70, `item_${it}`).setScale(0.75) : undefined;
  }

  private findCustomerFor(it: ItemId): Customer | undefined {
    let best: Customer | undefined;
    let bf = Infinity;
    for (const c of this.g.customers) {
      if (!c.waiting || c.needs(it) < 0) continue;
      if (c.patienceFrac < bf) {
        bf = c.patienceFrac;
        best = c;
      }
    }
    return best;
  }

  update(dt: number) {
    this.thinkT -= dt;
    let mv = { done: false, vx: 0, vy: 0 };
    switch (this.state) {
      case "idle":
      case "home":
        if (this.state === "home") {
          mv = walkTo(this, this.speed, dt);
          if (mv.done) this.state = "idle";
        }
        if (this.thinkT <= 0) {
          this.thinkT = 0.3;
          for (const pad of this.g.pads) {
            if (!pad.out) continue;
            const c = this.findCustomerFor(pad.out);
            if (!c) continue;
            this.pad = pad;
            this.target = c;
            this.state = "toPad";
            this.path = this.g.nav.path(this, { x: pad.x, y: PASS_Y + PASS_H + 26 });
            break;
          }
        }
        break;
      case "toPad":
        mv = walkTo(this, this.speed, dt);
        if (mv.done) {
          const it = this.pad?.out ? this.pad.takeFromPad() : null;
          if (!it) {
            this.goHome();
            break;
          }
          this.setCarry(it);
          audio.play("pick");
          this.retarget();
        }
        break;
      case "toCust": {
        const c = this.target;
        if (!c || !c.waiting || c.needs(this.item!) < 0) {
          this.retarget();
          break;
        }
        mv = walkTo(this, this.speed, dt);
        if (c.distTo(this.x, this.y) < 70) {
          const it = this.item!;
          this.setCarry(null);
          this.g.serve(c, it, true);
          this.goHome();
        } else if (mv.done) this.path = this.g.nav.path(this, c.anchor);
        break;
      }
    }
    this.rig.setPosition(this.x, this.y);
    this.rig.animate(dt, mv.vx, mv.vy, this.speed);
    this.carry?.setPosition(this.x, this.y - 70 + this.rig.bodyGroup.y).setDepth(this.y + 0.5);
  }

  private retarget() {
    const c = this.item ? this.findCustomerFor(this.item) : undefined;
    if (c) {
      this.target = c;
      this.state = "toCust";
      this.path = this.g.nav.path(this, c.anchor);
      return;
    }
    // nobody wants it any more: put it back on a free pad, otherwise drop it
    if (this.item) {
      const pad = this.g.pads.find((p) => !p.out);
      if (pad) pad.putOnPad(this.item);
      else puff(this.g, this.x, this.y - 40, 3);
      this.setCarry(null);
    }
    this.goHome();
  }

  private goHome() {
    this.state = "home";
    this.target = undefined;
    this.pad = undefined;
    this.path = this.g.nav.path(this, this.home);
  }

  reset() {
    this.setCarry(null);
    this.goHome();
  }
}

// ---------------------------------------------------------------------------
// Special events
// ---------------------------------------------------------------------------
interface Pup {
  rig: CorgiRig;
  x: number;
  y: number;
  path: P[];
  leaving: boolean;
}

export class EventDirector {
  g: GameScene;
  queue: { t: number; id: EventId }[];
  active: EventId | null = null;
  t = 0;
  // zoomies
  pups: Pup[] = [];
  // nap
  nap?: { s: Phaser.GameObjects.Sprite; x: number; y: number; boops: number; zT: number; door: number };
  // heist
  bandit?: { rig: CorgiRig; x: number; y: number; path: P[]; phase: "in" | "flee" | "out"; t: number; loot: Phaser.GameObjects.Sprite | null };

  constructor(g: GameScene, events: { t: number; id: EventId }[]) {
    this.g = g;
    this.queue = events.map((e) => ({ ...e })).sort((a, b) => a.t - b.t);
  }

  update(dt: number, dayT: number, allowNew: boolean) {
    if (allowNew && !this.active && this.queue.length && dayT >= this.queue[0].t) {
      const e = this.queue.shift()!;
      this.start(e.id);
    } else if (this.active && this.queue.length && dayT >= this.queue[0].t) {
      this.queue[0].t = dayT + 4; // delay while another event runs
    }
    if (!this.active) return;
    this.t += dt;
    if (this.active === "zoomies") this.updZoomies(dt);
    else if (this.active === "nap") this.updNap(dt);
    else if (this.active === "heist") this.updHeist(dt);
    else if (this.active === "bigloaf") this.active = null; // big loaf is a customer; the event is just its entrance
  }

  start(id: EventId) {
    this.t = 0;
    const g = this.g;
    if (id === "bigloaf") {
      if (!g.spawnBigLoaf()) return;
      g.banner("THE BIG LOAF", "A giant floof with a group order. Big tips!", C.caramel);
      this.active = "bigloaf";
      return;
    }
    this.active = id;
    if (id === "zoomies") {
      g.banner("ZOOMIES!", "Everyone's doing laps! Dash through the pups to dodge.", C.coral);
      for (const c of g.customers) c.startZoom();
      for (let i = 0; i < 3; i++) {
        const rig = new CorgiRig(g, DOOR.x, DOOR.y, 0.55, "none");
        const loop = g.zoomLoop;
        const p: Pup = { rig, x: DOOR.x + i * 30, y: DOOR.y + (i - 1) * 20, path: [DOOR_INSIDE, loop[(i * 2) % loop.length]], leaving: false };
        this.pups.push(p);
      }
    } else if (id === "nap") {
      // nap in the doorway nearest to the player: that's the useful one
      let di = 0;
      let bd = Infinity;
      DOORWAYS.forEach((d, i) => {
        const dd = Math.abs((d.x0 + d.x1) / 2 - g.player.x);
        if (dd < bd) {
          bd = dd;
          di = i;
        }
      });
      const d = DOORWAYS[di];
      const x = (d.x0 + d.x1) / 2;
      const y = PASS_Y + PASS_H / 2 + 4;
      const s = boil(g, x, y + 22, "napcorgi").setOrigin(0.5, 1).setScale(0.8).setDepth(y + 10);
      puff(g, x, y, 5);
      this.nap = { s, x, y, boops: 0, zT: 0, door: di };
      g.world.setDynamic("nap", { x: d.x0 - 4, y: PASS_Y - 8, w: d.x1 - d.x0 + 8, h: PASS_H + 16 });
      g.banner("NAP ATTACK", "Mochi fell asleep in a doorway. Boop 3× to wake, or go around.", "#9fc3e6");
    } else if (id === "heist") {
      const rig = new CorgiRig(g, DOOR.x, DOOR.y, 0.66, "none");
      rig.addHeadwear("mask", 6, 22);
      const pastry = STATION_DEFS.find((s) => s.id === "pastry")!;
      this.bandit = { rig, x: DOOR.x, y: DOOR.y, path: [DOOR_INSIDE, ...g.nav.path(DOOR_INSIDE, { x: pastry.x, y: 182 })], phase: "in", t: 0, loot: null };
      g.banner("CROISSANT HEIST!", "A cheeky corgi is after the pastries. Catch it for a bonus!", C.mint);
    }
    audio.play("event");
  }

  // -------------------------------------------------------------- zoomies
  private updZoomies(dt: number) {
    const g = this.g;
    const loop = g.zoomLoop;
    for (const p of this.pups) {
      const mv = walkTo(p, p.leaving ? 300 : 380, dt);
      if (mv.done) {
        if (p.leaving) {
          p.rig.setVisible(false);
        } else {
          const r = loop[Phaser.Math.Between(0, loop.length - 1)];
          p.path = [{ x: r.x + Phaser.Math.Between(-60, 60), y: r.y + Phaser.Math.Between(-30, 30) }];
        }
      }
      p.rig.setPosition(p.x, p.y);
      p.rig.animate(dt, mv.vx, mv.vy, 380, true);
      if (!p.leaving) g.pupContact(p.x, p.y);
    }
    if (this.t > 7 && !this.pups.every((p) => p.leaving)) {
      for (const c of g.customers) c.endZoom();
      for (const p of this.pups) {
        p.leaving = true;
        p.path = [...g.nav.path(p, DOOR_INSIDE), { x: DOOR.x + 40, y: DOOR.y }];
      }
    }
    if (this.t > 7 && this.pups.every((p) => !p.rig.visible)) this.endZoomies();
  }

  private endZoomies() {
    for (const p of this.pups) p.rig.destroy();
    this.pups = [];
    for (const c of this.g.customers) c.endZoom();
    this.active = null;
  }

  // -------------------------------------------------------------- nap
  get napTarget(): { x: number; y: number; boops: number } | null {
    return this.nap ? this.nap : null;
  }

  boop() {
    const n = this.nap;
    if (!n) return;
    n.boops++;
    audio.play("boop");
    this.g.tweens.add({ targets: n.s, scaleY: 0.7, scaleX: 0.88, duration: 70, yoyo: true });
    this.g.floatAt(n.x, n.y - 40, n.boops >= 3 ? "awake! (+5)" : `boop ${n.boops}/3`, C.mintDark);
    if (n.boops >= 3) {
      this.g.addCoins(5, n.x, n.y - 60);
      this.endNap();
    }
  }

  private updNap(dt: number) {
    const n = this.nap!;
    n.zT -= dt;
    if (n.zT <= 0) {
      n.zT = 1.1;
      const z = txt(this.g, n.x + 30, n.y - 40, "z", 22 + Math.random() * 8, C.inkSoft, true).setDepth(4600);
      this.g.tweens.add({ targets: z, x: z.x + 24, y: z.y - 40, alpha: 0, duration: 1400, onComplete: () => z.destroy() });
      if (Math.random() < 0.4) audio.play("snore");
    }
    if (this.t > 16) this.endNap();
  }

  private endNap() {
    const n = this.nap;
    if (!n) return;
    puff(this.g, n.x, n.y, 5);
    n.s.destroy();
    this.nap = undefined;
    this.g.world.setDynamic("nap", null);
    this.active = null;
  }

  // -------------------------------------------------------------- heist
  private updHeist(dt: number) {
    const g = this.g;
    const b = this.bandit!;
    b.t += dt;
    const speed = b.phase === "flee" ? 225 : b.phase === "out" ? 300 : 260;
    const mv = walkTo(b, speed, dt);
    if (b.phase === "in" && mv.done) {
      b.phase = "flee";
      b.t = 0;
      b.loot = boil(g, b.x, b.y, "item_croissant").setScale(0.6);
      audio.play("bark");
      g.floatAt(b.x, 120, "yoink!", C.coral);
      b.path = [];
    }
    if (b.phase === "flee") {
      if (mv.done || !b.path.length) {
        // run somewhere away from the player
        let best: P = { x: b.x, y: b.y };
        let bd = -1;
        for (let i = 0; i < 8; i++) {
          const cand = g.nav.nearestFree(Phaser.Math.Between(140, 1160), Phaser.Math.Between(190, 670));
          const d = Math.hypot(cand.x - g.player.x, cand.y - g.player.y) + Math.random() * 120;
          if (d > bd) {
            bd = d;
            best = cand;
          }
        }
        b.path = g.nav.path(b, best);
      }
      if (Math.hypot(b.x - g.player.x, b.y - g.player.y) < 44) {
        audio.play("catch");
        burst(g, b.x, b.y - 30);
        g.floatAt(b.x, b.y - 70, "CAUGHT! +15", C.mintDark);
        g.addCoins(15, b.x, b.y - 40);
        if (g.player.items.length < g.player.capacity) g.giveItem("croissant", true);
        b.loot?.destroy();
        b.loot = null;
        b.phase = "out";
        b.path = [...g.nav.path(b, DOOR_INSIDE), { x: DOOR.x + 60, y: DOOR.y }];
      } else if (b.t > 14) {
        g.floatAt(b.x, b.y - 70, "got away! ✿", C.coral);
        b.phase = "out";
        b.path = [...g.nav.path(b, DOOR_INSIDE), { x: DOOR.x + 60, y: DOOR.y }];
      }
    }
    if (b.phase === "out" && mv.done) {
      this.endHeist();
      return;
    }
    b.rig.setPosition(b.x, b.y);
    b.rig.animate(dt, mv.vx, mv.vy, speed, b.phase === "flee");
    b.loot?.setPosition(b.x + b.rig.facing * 34, b.y - 40).setDepth(b.y + 1);
  }

  private endHeist() {
    const b = this.bandit;
    if (!b) return;
    b.rig.destroy();
    b.loot?.destroy();
    this.bandit = undefined;
    this.active = null;
  }

  /** Clean up everything (day end / restart). */
  forceEnd() {
    if (this.pups.length) this.endZoomies();
    this.endNap();
    this.endHeist();
    this.queue = [];
    this.active = null;
  }
}
