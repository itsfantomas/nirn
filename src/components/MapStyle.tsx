import type { ReactNode } from "react";

export const INK = "#3a2814";
export const LAND = "#e4d3a8";
export const OCEAN = "#86a3a3";

export const CLIMATE: Record<string, { color: string; name: string }> = {
  ice: { color: "#f4f8fb", name: "Ледяная пустошь" },
  snow: { color: "#e8eef2", name: "Снега и тундра" },
  tundra: { color: "#c3c7a6", name: "Холодная тундра" },
  taiga: { color: "#6f8a5e", name: "Хвойная тайга" },
  temperate: { color: "#a3b678", name: "Умеренный пояс" },
  forest: { color: "#5f8048", name: "Густые леса" },
  jungle: { color: "#45703a", name: "Тропические джунгли" },
  swamp: { color: "#5c6a3c", name: "Болота" },
  desert: { color: "#e6b66a", name: "Пустыня" },
  arid: { color: "#d49d58", name: "Засушливые степи" },
  savanna: { color: "#cdb466", name: "Саванна" },
  ash: { color: "#76696b", name: "Пепельные пустоши" },
  volcanic: { color: "#8a3d27", name: "Вулканические земли" },
  autumn: { color: "#cf8a3e", name: "Осенние леса" },
  rocky: { color: "#a4855e", name: "Скалистое нагорье" },
  lush: { color: "#a9c98a", name: "Цветущие земли" },
  marsh: { color: "#7f8f5f", name: "Топи и низины" },
};

export function ClimateDefs() {
  return (
    <>
      {Object.entries(CLIMATE).map(([k, v]) => (
        <radialGradient id={`cl-${k}`} key={k}>
          <stop offset="0%" stopColor={v.color} stopOpacity={0.92} />
          <stop offset="55%" stopColor={v.color} stopOpacity={0.7} />
          <stop offset="100%" stopColor={v.color} stopOpacity={0} />
        </radialGradient>
      ))}
      <pattern id="waves" width="60" height="34" patternUnits="userSpaceOnUse">
        <path d="M4 10 q6 -5 12 0 t12 0" fill="none" stroke="#e8f0ec" strokeOpacity="0.28" strokeWidth="1" />
        <path d="M34 27 q6 -5 12 0 t12 0" fill="none" stroke="#e8f0ec" strokeOpacity="0.22" strokeWidth="1" />
      </pattern>
      <pattern id="landgrain" width="8" height="8" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="3" r="0.5" fill={INK} opacity="0.12" />
        <circle cx="6" cy="7" r="0.4" fill={INK} opacity="0.1" />
      </pattern>
      <radialGradient id="ocean-vignette" cx="50%" cy="50%" r="75%">
        <stop offset="55%" stopColor="#000" stopOpacity="0" />
        <stop offset="100%" stopColor="#1b1408" stopOpacity="0.45" />
      </radialGradient>
      <radialGradient id="glow-gold">
        <stop offset="0%" stopColor="#fff3c4" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#ffcf6a" stopOpacity="0" />
      </radialGradient>
    </>
  );
}

export interface Tint {
  c: keyof typeof CLIMATE | string;
  x: number;
  y: number;
  rx: number;
  ry: number;
  rot?: number;
}

export function Tints({ tints }: { tints: Tint[] }) {
  return (
    <g>
      {tints.map((t, i) => (
        <ellipse
          key={i}
          cx={t.x}
          cy={t.y}
          rx={t.rx}
          ry={t.ry}
          fill={`url(#cl-${t.c})`}
          transform={t.rot ? `rotate(${t.rot} ${t.x} ${t.y})` : undefined}
        />
      ))}
    </g>
  );
}

export function Ocean({ w, h }: { w: number; h: number }) {
  return (
    <g>
      <rect x={-w} y={-h} width={w * 3} height={h * 3} fill={OCEAN} />
      <rect x={-w} y={-h} width={w * 3} height={h * 3} fill="url(#waves)" />
    </g>
  );
}

export function Vignette({ w, h }: { w: number; h: number }) {
  return <rect x={0} y={0} width={w} height={h} fill="url(#ocean-vignette)" pointerEvents="none" />;
}

/** Ripples + coast ink + parchment fill, all from same paths */
export function LandBase({ paths, scale = 1 }: { paths: string[]; scale?: number }) {
  return (
    <g>
      {[14, 9, 5].map((w, i) => (
        <g key={w} fill="none" stroke="#d9e6df" strokeOpacity={0.12 + i * 0.1} strokeWidth={w * scale} strokeLinejoin="round">
          {paths.map((d, j) => (
            <path key={j} d={d} />
          ))}
        </g>
      ))}
      <g fill="none" stroke={INK} strokeWidth={2.4 * scale} strokeLinejoin="round">
        {paths.map((d, j) => (
          <path key={j} d={d} />
        ))}
      </g>
      <g fill={LAND}>
        {paths.map((d, j) => (
          <path key={j} d={d} />
        ))}
      </g>
    </g>
  );
}

export function Mountain({ x, y, s = 8, snow = false }: { x: number; y: number; s?: number; snow?: boolean }) {
  const h = s * 1.25;
  return (
    <g>
      <path d={`M${x},${y - h} L${x + s},${y} L${x + s * 0.15},${y} Z`} fill="#7a5a35" opacity={0.55} />
      {snow && <path d={`M${x},${y - h} L${x - s * 0.33},${y - h * 0.62} L${x},${y - h * 0.7} L${x + s * 0.36},${y - h * 0.6} Z`} fill="#fbfdff" />}
      <path
        d={`M${x - s},${y} L${x},${y - h} L${x + s},${y}`}
        fill="none"
        stroke={INK}
        strokeWidth={Math.max(0.6, s * 0.12)}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </g>
  );
}

export function Tree({ x, y, s = 4, pine = false, color = "#4f6b3a" }: { x: number; y: number; s?: number; pine?: boolean; color?: string }) {
  if (pine)
    return (
      <path
        d={`M${x},${y - s * 2} L${x + s * 0.8},${y} L${x - s * 0.8},${y} Z`}
        fill={color}
        stroke={INK}
        strokeWidth={s * 0.15}
        strokeLinejoin="round"
        opacity={0.85}
      />
    );
  return (
    <g opacity={0.85}>
      <line x1={x} y1={y} x2={x} y2={y - s} stroke={INK} strokeWidth={s * 0.18} />
      <circle cx={x} cy={y - s * 1.3} r={s * 0.75} fill={color} stroke={INK} strokeWidth={s * 0.15} />
    </g>
  );
}

export function Compass({ x, y, r = 50 }: { x: number; y: number; r?: number }) {
  const pts = (rot: number, long: number, short: number) => {
    const a = (rot * Math.PI) / 180;
    const b = a + Math.PI / 2;
    const c = a - Math.PI / 2;
    return `${x + Math.sin(a) * long},${y - Math.cos(a) * long} ${x + Math.sin(b) * short},${y - Math.cos(b) * short} ${x},${y} ${x + Math.sin(c) * short},${y - Math.cos(c) * short}`;
  };
  return (
    <g opacity={0.85} pointerEvents="none">
      <circle cx={x} cy={y} r={r * 0.62} fill="none" stroke={INK} strokeWidth={r * 0.02} />
      <circle cx={x} cy={y} r={r * 0.55} fill="none" stroke={INK} strokeWidth={r * 0.01} strokeDasharray={`${r * 0.03} ${r * 0.03}`} />
      {[45, 135, 225, 315].map((a) => (
        <polygon key={a} points={pts(a, r * 0.6, r * 0.08)} fill="#c7b285" stroke={INK} strokeWidth={r * 0.015} />
      ))}
      {[0, 90, 180, 270].map((a) => (
        <polygon key={a} points={pts(a, r, r * 0.13)} fill={a === 0 ? "#8a2b1c" : "#efe2bf"} stroke={INK} strokeWidth={r * 0.02} />
      ))}
      <circle cx={x} cy={y} r={r * 0.06} fill={INK} />
      <text x={x} y={y - r - r * 0.12} textAnchor="middle" fontFamily="Cormorant SC" fontWeight={700} fontSize={r * 0.32} fill={INK}>
        С
      </text>
    </g>
  );
}

export function Label({
  x,
  y,
  children,
  size = 14,
  color = INK,
  italic = false,
  spacing = 0,
  font = "Kurale",
  weight = 400,
  halo = true,
  rotate = 0,
  opacity = 1,
}: {
  x: number;
  y: number;
  children: ReactNode;
  size?: number;
  color?: string;
  italic?: boolean;
  spacing?: number;
  font?: string;
  weight?: number;
  halo?: boolean;
  rotate?: number;
  opacity?: number;
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="middle"
      fontFamily={font}
      fontSize={size}
      fontStyle={italic ? "italic" : undefined}
      fontWeight={weight}
      letterSpacing={spacing}
      fill={color}
      opacity={opacity}
      stroke={halo ? "#f1e5c4" : undefined}
      strokeWidth={halo ? size * 0.18 : undefined}
      strokeOpacity={0.75}
      paintOrder="stroke"
      transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined}
    >
      {children}
    </text>
  );
}

export function ClimateLegend({ keys }: { keys: string[] }) {
  return (
    <div className="paper-bg rounded-lg border border-[#6b4a22]/60 shadow-xl px-3 py-2 text-[#2e200f] max-w-[220px]">
      <div className="font-title font-bold text-sm tracking-wide mb-1">Климатические зоны</div>
      <div className="grid grid-cols-1 gap-0.5">
        {keys.map((k) => (
          <div key={k} className="flex items-center gap-2 text-xs font-hand">
            <span className="w-3.5 h-3.5 rounded-full border border-[#3a2814]/60" style={{ background: CLIMATE[k].color }} />
            {CLIMATE[k].name}
          </div>
        ))}
      </div>
    </div>
  );
}
