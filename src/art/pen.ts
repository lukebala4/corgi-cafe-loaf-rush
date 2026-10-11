// A tiny "ballpoint pen" for Canvas2D: every stroke is jittered so shapes look hand-inked.
// Each texture is drawn several times with different seeds to create line-boil frames.

export type RNG = () => number;
export type Pt = [number, number];

export function mulberry(seed: number): RNG {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface Ink {
  w?: number; // stroke width (0 = no stroke)
  color?: string; // stroke colour
  fill?: string | null;
  j?: number; // jitter amplitude
  alpha?: number;
  double?: boolean; // second, lighter overdraw pass
}

const INK = "#2b2622";

export class Pen {
  ctx: CanvasRenderingContext2D;
  rng: RNG;

  constructor(ctx: CanvasRenderingContext2D, seed: number) {
    this.ctx = ctx;
    this.rng = mulberry(seed);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }

  r(a = 1) {
    return (this.rng() * 2 - 1) * a;
  }

  private wob(pts: Pt[], j: number): Pt[] {
    return pts.map(([x, y]) => [x + this.r(j), y + this.r(j)] as Pt);
  }

  private trace(pts: Pt[], close: boolean) {
    const c = this.ctx;
    c.beginPath();
    if (pts.length < 2) return;
    if (pts.length === 2) {
      c.moveTo(pts[0][0], pts[0][1]);
      c.lineTo(pts[1][0], pts[1][1]);
      return;
    }
    if (close) {
      const n = pts.length;
      const mid = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      let m = mid(pts[n - 1], pts[0]);
      c.moveTo(m[0], m[1]);
      for (let i = 0; i < n; i++) {
        const p = pts[i];
        const q = pts[(i + 1) % n];
        m = mid(p, q);
        c.quadraticCurveTo(p[0], p[1], m[0], m[1]);
      }
      c.closePath();
    } else {
      c.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length - 1; i++) {
        const p = pts[i];
        const q = pts[i + 1];
        c.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
      }
      const l = pts[pts.length - 1];
      c.lineTo(l[0], l[1]);
    }
  }

  /** Closed shape: wobbly fill + inked outline with a little overshoot. */
  shape(pts: Pt[], o: Ink = {}) {
    const c = this.ctx;
    const j = o.j ?? 1.2;
    const w = o.w ?? 3;
    c.save();
    c.globalAlpha = o.alpha ?? 1;
    if (o.fill) {
      this.trace(this.wob(pts, j * 0.4), true);
      c.fillStyle = o.fill;
      c.fill();
    }
    if (w > 0) {
      c.strokeStyle = o.color ?? INK;
      c.lineWidth = w;
      // outline as an open path with overshoot so the "pen" overlaps where it started
      const ring = this.wob(pts, j);
      if (ring.length < 3) {
        this.trace(ring, true);
      } else {
        // Start on the smoothed curve (midpoint of the closing edge) and finish a little past the
        // start along the next edge, so the overlap follows the outline instead of leaving a tail.
        const n = ring.length;
        const mid = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        const start = mid(ring[n - 1], ring[0]);
        const e0: Pt = [ring[0][0] + this.r(j * 0.5), ring[0][1] + this.r(j * 0.5)];
        const end = mid(e0, ring[1]);
        this.trace([start, ...ring, e0, end], false);
      }
      c.stroke();
      if (o.double) {
        c.globalAlpha = (o.alpha ?? 1) * 0.35;
        c.lineWidth = Math.max(1, w * 0.5);
        this.trace(this.wob(pts, j * 1.6), true);
        c.stroke();
      }
    }
    c.restore();
  }

  ellipsePts(cx: number, cy: number, rx: number, ry: number, n?: number, rough = 0.03, a0 = 0): Pt[] {
    const count = n ?? Math.max(10, Math.round((rx + ry) / 3.2));
    const pts: Pt[] = [];
    for (let i = 0; i < count; i++) {
      const a = a0 + (i / count) * Math.PI * 2;
      const k = 1 + this.r(rough);
      pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
    }
    return pts;
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, o: Ink = {}) {
    this.shape(this.ellipsePts(cx, cy, rx, ry), o);
  }

  circle(cx: number, cy: number, r: number, o: Ink = {}) {
    this.ellipse(cx, cy, r, r, o);
  }

  rrectPts(x: number, y: number, w: number, h: number, r: number): Pt[] {
    r = Math.min(r, w / 2, h / 2);
    const pts: Pt[] = [];
    const seg = (x0: number, y0: number, x1: number, y1: number) => {
      const len = Math.hypot(x1 - x0, y1 - y0);
      const n = Math.max(1, Math.round(len / 14));
      for (let i = 0; i < n; i++) pts.push([x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n]);
    };
    const arc = (cx: number, cy: number, a0: number) => {
      for (let i = 0; i < 4; i++) {
        const a = a0 + (i / 4) * (Math.PI / 2);
        pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
      }
    };
    seg(x + r, y, x + w - r, y);
    arc(x + w - r, y + r, -Math.PI / 2);
    seg(x + w, y + r, x + w, y + h - r);
    arc(x + w - r, y + h - r, 0);
    seg(x + w - r, y + h, x + r, y + h);
    arc(x + r, y + h - r, Math.PI / 2);
    seg(x, y + h - r, x, y + r);
    arc(x + r, y + r, Math.PI);
    return pts;
  }

  rrect(x: number, y: number, w: number, h: number, r: number, o: Ink = {}) {
    this.shape(this.rrectPts(x, y, w, h, r), o);
  }

  poly(pts: Pt[], o: Ink = {}) {
    // subdivide straight edges a bit so jitter reads as hand drawn
    const out: Pt[] = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      const n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 16));
      for (let k = 0; k < n; k++) out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
    }
    this.shapeSharp(out, o);
  }

  /** Like shape() but with straight segments (keeps corners crisp). */
  shapeSharp(pts: Pt[], o: Ink = {}) {
    const c = this.ctx;
    const j = o.j ?? 1;
    c.save();
    c.globalAlpha = o.alpha ?? 1;
    const path = (p: Pt[], close: boolean) => {
      c.beginPath();
      c.moveTo(p[0][0], p[0][1]);
      for (let i = 1; i < p.length; i++) c.lineTo(p[i][0], p[i][1]);
      if (close) c.closePath();
    };
    if (o.fill) {
      path(this.wob(pts, j * 0.3), true);
      c.fillStyle = o.fill;
      c.fill();
    }
    if ((o.w ?? 3) > 0) {
      c.strokeStyle = o.color ?? INK;
      c.lineWidth = o.w ?? 3;
      const ring = this.wob(pts, j);
      path([...ring, [ring[0][0] + this.r(j), ring[0][1] + this.r(j)]], false);
      c.stroke();
    }
    c.restore();
  }

  /** Open wobbly line through points. */
  line(pts: Pt[], o: Ink = {}) {
    const c = this.ctx;
    const dense: Pt[] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 12));
      for (let k = 0; k < n; k++) dense.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
    }
    dense.push(pts[pts.length - 1]);
    c.save();
    c.globalAlpha = o.alpha ?? 1;
    c.strokeStyle = o.color ?? INK;
    c.lineWidth = o.w ?? 3;
    this.trace(this.wob(dense, o.j ?? 0.9), false);
    c.stroke();
    c.restore();
  }

  seg(x0: number, y0: number, x1: number, y1: number, o: Ink = {}) {
    this.line(
      [
        [x0, y0],
        [x1, y1],
      ],
      o,
    );
  }

  /** Smooth curve (no subdivision jitter). */
  curve(pts: Pt[], o: Ink = {}) {
    const c = this.ctx;
    c.save();
    c.globalAlpha = o.alpha ?? 1;
    c.strokeStyle = o.color ?? INK;
    c.lineWidth = o.w ?? 3;
    this.trace(this.wob(pts, o.j ?? 0.6), false);
    c.stroke();
    c.restore();
  }

  dot(x: number, y: number, r: number, color = INK) {
    const c = this.ctx;
    c.save();
    c.fillStyle = color;
    c.beginPath();
    c.ellipse(x + this.r(0.3), y + this.r(0.3), r * (1 + this.r(0.08)), r * (1 + this.r(0.08)), 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  /** Scribbled hatch shadow clipped to a closed path. */
  hatch(clip: Pt[], spacing = 6, angle = -0.8, color = "rgba(43,38,34,0.28)", w = 1.4) {
    const c = this.ctx;
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const [x, y] of clip) {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
    c.save();
    c.beginPath();
    c.moveTo(clip[0][0], clip[0][1]);
    for (const [x, y] of clip) c.lineTo(x, y);
    c.closePath();
    c.clip();
    c.strokeStyle = color;
    c.lineWidth = w;
    const diag = Math.hypot(maxX - minX, maxY - minY);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    for (let s = -diag; s < diag; s += spacing) {
      const ox = cx - dy * s;
      const oy = cy + dx * s;
      c.beginPath();
      c.moveTo(ox - dx * diag + this.r(1.5), oy - dy * diag + this.r(1.5));
      c.lineTo(ox + dx * diag + this.r(1.5), oy + dy * diag + this.r(1.5));
      c.stroke();
    }
    c.restore();
  }
}
