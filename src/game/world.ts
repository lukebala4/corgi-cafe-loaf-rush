import { BACK_COUNTER, DOORWAYS, PASS_H, PASS_Y, PLAY, TABLES, TABLE_H, TABLE_W } from "../config";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
  tag?: string;
}

/** Static + dynamic solid rectangles; circle-vs-rect resolution for the player. */
export class World {
  statics: Rect[] = [];
  dynamics = new Map<string, Rect>();

  constructor() {
    const bc = BACK_COUNTER;
    this.statics.push({ x: bc.x - 20, y: 0, w: bc.w + 40, h: bc.y + bc.h, tag: "counter" });
    let x0 = PLAY.left - 20;
    for (const d of DOORWAYS) {
      this.statics.push({ x: x0, y: PASS_Y, w: d.x0 - x0, h: PASS_H, tag: "pass" });
      x0 = d.x1;
    }
    this.statics.push({ x: x0, y: PASS_Y, w: PLAY.right + 20 - x0, h: PASS_H, tag: "pass" });
    for (const t of TABLES) this.statics.push({ x: t.x - TABLE_W / 2, y: t.y - TABLE_H / 2, w: TABLE_W, h: TABLE_H, tag: "table" });
  }

  setDynamic(id: string, r: Rect | null) {
    if (r) this.dynamics.set(id, r);
    else this.dynamics.delete(id);
  }

  all(): Rect[] {
    return [...this.statics, ...this.dynamics.values()];
  }

  /** Push a circle out of all solids and the room bounds. Returns true if any contact happened. */
  resolve(p: { x: number; y: number }, r: number): boolean {
    let hit = false;
    for (let iter = 0; iter < 3; iter++) {
      for (const b of this.all()) {
        const cx = Math.max(b.x, Math.min(p.x, b.x + b.w));
        const cy = Math.max(b.y, Math.min(p.y, b.y + b.h));
        let dx = p.x - cx;
        let dy = p.y - cy;
        const d2 = dx * dx + dy * dy;
        if (d2 >= r * r) continue;
        hit = true;
        if (d2 > 0.0001) {
          const d = Math.sqrt(d2);
          p.x += (dx / d) * (r - d);
          p.y += (dy / d) * (r - d);
        } else {
          // centre inside rect: push out along the shortest axis
          const left = p.x - b.x;
          const right = b.x + b.w - p.x;
          const up = p.y - b.y;
          const down = b.y + b.h - p.y;
          const m = Math.min(left, right, up, down);
          if (m === left) p.x = b.x - r;
          else if (m === right) p.x = b.x + b.w + r;
          else if (m === up) p.y = b.y - r;
          else p.y = b.y + b.h + r;
        }
      }
      p.x = Math.max(PLAY.left + r, Math.min(PLAY.right - r, p.x));
      p.y = Math.max(BACK_COUNTER.y + BACK_COUNTER.h + r, Math.min(PLAY.bottom - r, p.y));
    }
    return hit;
  }

  overlaps(p: { x: number; y: number }, r: number): boolean {
    for (const b of this.all()) {
      const cx = Math.max(b.x, Math.min(p.x, b.x + b.w));
      const cy = Math.max(b.y, Math.min(p.y, b.y + b.h));
      if ((p.x - cx) ** 2 + (p.y - cy) ** 2 < r * r - 1) return true;
    }
    return false;
  }
}

// ---------------------------------------------------------------------------
// Nav grid for NPCs (static obstacles only; NPCs are "soft")
// ---------------------------------------------------------------------------
const CELL = 20;
export class Nav {
  cols: number;
  rows: number;
  ox = PLAY.left;
  oy = BACK_COUNTER.y + BACK_COUNTER.h;
  blocked: Uint8Array;

  constructor(world: World, inflate = 14) {
    this.cols = Math.ceil((PLAY.right - PLAY.left) / CELL);
    this.rows = Math.ceil((PLAY.bottom - this.oy) / CELL);
    this.blocked = new Uint8Array(this.cols * this.rows);
    for (let r = 0; r < this.rows; r++)
      for (let c = 0; c < this.cols; c++) {
        const x = this.ox + c * CELL + CELL / 2;
        const y = this.oy + r * CELL + CELL / 2;
        let b = x < PLAY.left + inflate || x > PLAY.right - inflate || y > PLAY.bottom - inflate || y < this.oy + inflate;
        if (!b)
          for (const s of world.statics) {
            if (x > s.x - inflate && x < s.x + s.w + inflate && y > s.y - inflate && y < s.y + s.h + inflate) {
              b = true;
              break;
            }
          }
        this.blocked[r * this.cols + c] = b ? 1 : 0;
      }
  }

  cellOf(x: number, y: number): [number, number] {
    return [
      Math.max(0, Math.min(this.cols - 1, Math.floor((x - this.ox) / CELL))),
      Math.max(0, Math.min(this.rows - 1, Math.floor((y - this.oy) / CELL))),
    ];
  }
  center(c: number, r: number): { x: number; y: number } {
    return { x: this.ox + c * CELL + CELL / 2, y: this.oy + r * CELL + CELL / 2 };
  }
  free(c: number, r: number) {
    return c >= 0 && r >= 0 && c < this.cols && r < this.rows && !this.blocked[r * this.cols + c];
  }

  nearestFree(x: number, y: number, extraBlocked?: (p: { x: number; y: number }) => boolean): { x: number; y: number } {
    const [c0, r0] = this.cellOf(x, y);
    for (let rad = 0; rad < 40; rad++) {
      let best: { x: number; y: number } | null = null;
      let bd = Infinity;
      for (let dr = -rad; dr <= rad; dr++)
        for (let dc = -rad; dc <= rad; dc++) {
          if (Math.max(Math.abs(dr), Math.abs(dc)) !== rad) continue;
          const c = c0 + dc;
          const r = r0 + dr;
          if (!this.free(c, r)) continue;
          const p = this.center(c, r);
          if (extraBlocked?.(p)) continue;
          const d = (p.x - x) ** 2 + (p.y - y) ** 2;
          if (d < bd) {
            bd = d;
            best = p;
          }
        }
      if (best) return best;
    }
    return { x, y };
  }

  private los(a: { x: number; y: number }, b: { x: number; y: number }) {
    const d = Math.hypot(b.x - a.x, b.y - a.y);
    const n = Math.ceil(d / (CELL / 2));
    for (let i = 1; i < n; i++) {
      const [c, r] = this.cellOf(a.x + ((b.x - a.x) * i) / n, a.y + ((b.y - a.y) * i) / n);
      if (!this.free(c, r)) return false;
    }
    return true;
  }

  /** A* with 8-connectivity, string-pulled. Returns waypoints excluding start, ending exactly at goal. */
  path(from: { x: number; y: number }, to: { x: number; y: number }): { x: number; y: number }[] {
    let [sc, sr] = this.cellOf(from.x, from.y);
    let [gc, gr] = this.cellOf(to.x, to.y);
    if (!this.free(sc, sr)) [sc, sr] = this.cellOf(...(Object.values(this.nearestFree(from.x, from.y)) as [number, number]));
    if (!this.free(gc, gr)) [gc, gr] = this.cellOf(...(Object.values(this.nearestFree(to.x, to.y)) as [number, number]));
    const N = this.cols * this.rows;
    const g = new Float32Array(N).fill(Infinity);
    const came = new Int32Array(N).fill(-1);
    const closed = new Uint8Array(N);
    const open: number[] = [];
    const fScore = new Float32Array(N).fill(Infinity);
    const s = sr * this.cols + sc;
    const goal = gr * this.cols + gc;
    const h = (i: number) => {
      const c = i % this.cols;
      const r = (i / this.cols) | 0;
      const dx = Math.abs(c - gc);
      const dy = Math.abs(r - gr);
      return dx + dy + (Math.SQRT2 - 2) * Math.min(dx, dy);
    };
    g[s] = 0;
    fScore[s] = h(s);
    open.push(s);
    while (open.length) {
      let bi = 0;
      for (let i = 1; i < open.length; i++) if (fScore[open[i]] < fScore[open[bi]]) bi = i;
      const cur = open[bi];
      open.splice(bi, 1);
      if (cur === goal) break;
      if (closed[cur]) continue;
      closed[cur] = 1;
      const cc = cur % this.cols;
      const cr = (cur / this.cols) | 0;
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue;
          const nc = cc + dc;
          const nr = cr + dr;
          if (!this.free(nc, nr)) continue;
          if (dr && dc && (!this.free(cc + dc, cr) || !this.free(cc, cr + dr))) continue;
          const ni = nr * this.cols + nc;
          const ng = g[cur] + (dr && dc ? Math.SQRT2 : 1);
          if (ng < g[ni]) {
            g[ni] = ng;
            came[ni] = cur;
            fScore[ni] = ng + h(ni);
            open.push(ni);
          }
        }
    }
    if (came[goal] === -1 && goal !== s) return [to];
    const cells: { x: number; y: number }[] = [];
    for (let i = goal; i !== -1 && i !== s; i = came[i]) cells.push(this.center(i % this.cols, (i / this.cols) | 0));
    cells.reverse();
    // string-pull
    const out: { x: number; y: number }[] = [];
    let anchor = from;
    for (let i = 0; i < cells.length; i++) {
      const next = cells[i + 1] ?? to;
      if (!this.los(anchor, next)) {
        out.push(cells[i]);
        anchor = cells[i];
      }
    }
    out.push(to);
    return out;
  }
}
