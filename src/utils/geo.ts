export type Pt = [number, number];

function hash(x: number, y: number, seed: number) {
  let h = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h = h ^ (h >>> 16);
  return (h >>> 0) / 4294967295;
}

function smooth(t: number) {
  return t * t * (3 - 2 * t);
}

/** Value noise 2D in [0,1] */
export function noise2(x: number, y: number, seed = 1) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = smooth(x - xi);
  const yf = smooth(y - yi);
  const a = hash(xi, yi, seed);
  const b = hash(xi + 1, yi, seed);
  const c = hash(xi, yi + 1, seed);
  const d = hash(xi + 1, yi + 1, seed);
  return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
}

function fbm(x: number, y: number, seed: number) {
  return noise2(x, y, seed) * 0.6 + noise2(x * 2.3, y * 2.3, seed + 7) * 0.3 + noise2(x * 5.1, y * 5.1, seed + 13) * 0.1;
}

/**
 * Builds a rough, hand-drawn-like closed path. Displacement depends only on
 * absolute coordinates, so shared borders between neighbours coincide.
 */
export function roughPath(points: Pt[], amp = 4, step = 5, freq = 0.06, closed = true): string {
  const out: Pt[] = [];
  const n = points.length;
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % n];
    const len = Math.hypot(x2 - x1, y2 - y1);
    const parts = Math.max(1, Math.round(len / step));
    for (let j = 0; j < parts; j++) {
      const t = j / parts;
      const x = x1 + (x2 - x1) * t;
      const y = y1 + (y2 - y1) * t;
      if (j === 0) {
        out.push([x, y]);
      } else {
        const dx = (fbm(x * freq, y * freq, 11) - 0.5) * 2 * amp;
        const dy = (fbm(x * freq, y * freq, 29) - 0.5) * 2 * amp;
        out.push([x + dx, y + dy]);
      }
    }
  }
  if (!closed) out.push(points[n - 1]);
  return "M" + out.map((p) => p[0].toFixed(1) + "," + p[1].toFixed(1)).join("L") + (closed ? "Z" : "");
}

/** Smooth open curve via Catmull-Rom (for rivers, roads) */
export function smoothLine(points: Pt[]): string {
  if (points.length < 2) return "";
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0]},${p2[1]}`;
  }
  return d;
}

/** Seeded pseudo random generator */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Irregular blob polygon around center (for small islands) */
export function blob(cx: number, cy: number, r: number, seed: number, n = 9): Pt[] {
  const R = rng(seed);
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (0.6 + R() * 0.6);
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.8]);
  }
  return pts;
}
