import { useMemo, useState } from "react";
import MapViewport from "./MapViewport";
import InfoPanel, { type InfoData } from "./InfoPanel";
import { ClimateDefs, ClimateLegend, Compass, INK, Label, LandBase, Mountain, Ocean, OCEAN, Tints, Tree, Vignette } from "./MapStyle";
import {
  CATEGORIES,
  HOLDS,
  LOCATIONS,
  MOUNTAIN_RANGES,
  SKY_FORESTS,
  SKY_H,
  SKY_ISLANDS,
  SKY_LAKES,
  SKY_OUTLINE,
  SKY_RIVERS,
  SKY_ROADS,
  SKY_TINTS,
  SKY_W,
  type Loc,
} from "../data/skyrim";
import { roughPath, rng, smoothLine, type Pt } from "../utils/geo";

const CAT = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));
const OUTLINE_D = roughPath(SKY_OUTLINE, 4, 4, 0.06);
const ISLANDS_D = SKY_ISLANDS.map((p) => roughPath(p, 3, 3, 0.1));
const LAKES_D = SKY_LAKES.map((p) => roughPath(p, 3, 3, 0.1));
const LAND = [OUTLINE_D, ...ISLANDS_D];

function inPoly(x: number, y: number, poly: Pt[]) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

const SETTLEMENTS = LOCATIONS.filter((l) => l.cat === "city" || l.cat === "town");
const farFromTowns = (x: number, y: number, d: number) => SETTLEMENTS.every((s) => Math.hypot(s.x - x, s.y - y) > d);

const MOUNTAINS = (() => {
  const R = rng(17);
  const out: { x: number; y: number; s: number; snow: boolean }[] = [];
  MOUNTAIN_RANGES.forEach((r) => {
    for (let i = 0; i < r.n; i++) {
      const a = R() * Math.PI * 2;
      const d = Math.sqrt(R());
      const x = r.cx + Math.cos(a) * r.rx * d;
      const y = r.cy + Math.sin(a) * r.ry * d;
      if (!inPoly(x, y - 6, SKY_OUTLINE) || !inPoly(x, y + 4, SKY_OUTLINE) || !farFromTowns(x, y, 20)) continue;
      const big = Math.hypot(x - 600, y - 410) < 40;
      out.push({ x, y, s: big ? 13 + R() * 4 : 6 + R() * 4, snow: y < 200 || y > 580 || big || R() > 0.6 });
    }
  });
  return out.sort((a, b) => a.y - b.y);
})();

const TREES = (() => {
  const R = rng(23);
  const out: { x: number; y: number; pine: boolean; color: string }[] = [];
  Object.entries(SKY_FORESTS).forEach(([k, f]) => {
    for (let i = 0; i < f.n; i++) {
      const a = R() * Math.PI * 2;
      const d = Math.sqrt(R());
      const x = f.cx + Math.cos(a) * f.rx * d;
      const y = f.cy + Math.sin(a) * f.ry * d;
      if (!inPoly(x, y, SKY_OUTLINE) || !farFromTowns(x, y, 14)) continue;
      out.push({ x, y, pine: k !== "autumn", color: f.color });
    }
  });
  return out.sort((a, b) => a.y - b.y);
})();

const COLS = "ABCDEFGHIJKL";
const gridRef = (x: number, y: number) => `${COLS[Math.min(11, Math.floor(x / (SKY_W / 12)))]}${Math.min(8, Math.floor(y / (SKY_H / 8)) + 1)}`;

function Icon({ c, x, y, s, active }: { c: (typeof CATEGORIES)[number]; x: number; y: number; s: number; active: boolean }) {
  if (c.id === "city") {
    return (
      <g transform={`translate(${x},${y}) scale(${s * (active ? 2.6 : 2.2)})`}>
        <path d={c.glyph} fill="#c9651d" stroke={INK} strokeWidth={0.6} />
        <path d="M-2.2,-2.4 L2.2,-2.4 L2.2,0 Q2.2,2.4 0,3 Q-2.2,2.4 -2.2,0 Z" fill="none" stroke="#f6dfb0" strokeWidth={0.45} />
      </g>
    );
  }
  return (
    <g transform={`translate(${x},${y}) scale(${s * (active ? 1.35 : 1)})`}>
      <circle r={7} fill={c.color} stroke="#f3e3bb" strokeWidth={1.3} />
      <circle r={7.8} fill="none" stroke={INK} strokeWidth={0.6} />
      <g transform="scale(0.95)">
        {c.stroke ? <path d={c.glyph} fill="none" stroke="#fff3d6" strokeWidth={1.4} strokeLinecap="round" /> : <path d={c.glyph} fill="#fff3d6" />}
      </g>
    </g>
  );
}

export default function SkyrimMap() {
  const [enabled, setEnabled] = useState<Set<string>>(() => new Set(["city"]));
  const [labels, setLabels] = useState<"auto" | "always" | "never">("auto");
  const [showHolds, setShowHolds] = useState(true);
  const [showRoads, setShowRoads] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [search, setSearch] = useState("");
  const [hover, setHover] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [info, setInfo] = useState<InfoData | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    LOCATIONS.forEach((l) => (m[l.cat] = (m[l.cat] ?? 0) + 1));
    return m;
  }, []);

  const visible = useMemo(() => LOCATIONS.filter((l) => enabled.has(l.cat)).sort((a, b) => (a.cat === "city" ? 1 : 0) - (b.cat === "city" ? 1 : 0)), [enabled]);

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q.length < 2) return [];
    return LOCATIONS.filter((l) => l.name.toLowerCase().includes(q)).slice(0, 8);
  }, [search]);

  const toggle = (id: string) =>
    setEnabled((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const openLoc = (l: Loc) => {
    const c = CAT[l.cat];
    setSelected(l.name);
    setEnabled((s) => (s.has(l.cat) ? s : new Set([...s, l.cat])));
    setInfo({
      title: l.name,
      subtitle: `${c.name.replace(/и$/, "")} · ${l.hold}`,
      body: l.d ?? c.desc,
      color: l.cat === "city" ? "#c9651d" : c.color,
      facts: [
        ["Тип", c.name],
        ["Владение", l.hold],
        ["Квадрат карты", gridRef(l.x, l.y)],
      ],
    });
  };

  const openHold = (h: (typeof HOLDS)[number]) => {
    const cap = LOCATIONS.find((l) => l.cat === "city" && l.hold === h.name);
    const n = LOCATIONS.filter((l) => l.hold === h.name).length;
    setSelected(null);
    setInfo({
      title: `Владение ${h.name}`,
      subtitle: "Одно из девяти ярлств Скайрима",
      body: h.info,
      facts: [
        ["Столица", cap?.name ?? "—"],
        ["Отмечено мест", String(n)],
      ],
    });
  };

  return (
    <div className="relative w-full h-full paper-bg">
      <MapViewport
        width={SKY_W}
        height={SKY_H}
        maxZoom={7}
        defs={
          <>
            <ClimateDefs />
            <clipPath id="sky-clip">
              {LAND.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </clipPath>
          </>
        }
      >
        {(k) => {
          const s = 1 / Math.pow(k, 0.6);
          const showSmallLabels = labels === "always" || (labels === "auto" && k >= 2.2);
          return (
            <>
              <Ocean w={SKY_W} h={SKY_H} />
              <LandBase paths={LAND} scale={0.8} />
              <g clipPath="url(#sky-clip)">
                <Tints tints={SKY_TINTS} />
                <rect width={SKY_W} height={SKY_H} fill="url(#landgrain)" />
              </g>
              {/* water */}
              <g fill="none" stroke="#6f9196" strokeLinecap="round" strokeLinejoin="round">
                {SKY_RIVERS.map((r, i) => (
                  <path key={i} d={smoothLine(r)} strokeWidth={2.2} />
                ))}
              </g>
              {LAKES_D.map((d, i) => (
                <path key={i} d={d} fill={OCEAN} stroke={INK} strokeWidth={1} />
              ))}
              {showRoads && (
                <g fill="none" stroke="#7a2a18" strokeWidth={1.2} strokeDasharray="4 3" strokeOpacity={0.7}>
                  {SKY_ROADS.map((r, i) => (
                    <path key={i} d={smoothLine(r)} />
                  ))}
                </g>
              )}
              {TREES.map((t, i) => (
                <Tree key={i} x={t.x} y={t.y} s={2.6} pine={t.pine} color={t.color} />
              ))}
              {MOUNTAINS.map((m, i) => (
                <Mountain key={i} x={m.x} y={m.y} s={m.s} snow={m.snow} />
              ))}

              {showGrid && (
                <g stroke={INK} strokeOpacity={0.25} strokeWidth={0.6}>
                  {Array.from({ length: 11 }, (_, i) => (
                    <line key={"v" + i} x1={((i + 1) * SKY_W) / 12} y1={0} x2={((i + 1) * SKY_W) / 12} y2={SKY_H} />
                  ))}
                  {Array.from({ length: 7 }, (_, i) => (
                    <line key={"h" + i} x1={0} y1={((i + 1) * SKY_H) / 8} x2={SKY_W} y2={((i + 1) * SKY_H) / 8} />
                  ))}
                  {COLS.split("").map((c, i) => (
                    <text key={c} x={(i + 0.5) * (SKY_W / 12)} y={14} textAnchor="middle" fontFamily="Cormorant SC" fontSize={14} fill={INK} fillOpacity={0.7} stroke="none">
                      {c}
                    </text>
                  ))}
                  {Array.from({ length: 8 }, (_, i) => (
                    <text key={i} x={10} y={(i + 0.5) * (SKY_H / 8)} textAnchor="middle" fontFamily="Cormorant SC" fontSize={14} fill={INK} fillOpacity={0.7} stroke="none">
                      {i + 1}
                    </text>
                  ))}
                </g>
              )}

              {showHolds &&
                HOLDS.map((h) => (
                  <g key={h.name} onClick={() => openHold(h)} style={{ cursor: "pointer" }}>
                    <text
                      x={h.x}
                      y={h.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontFamily="Cormorant SC"
                      fontWeight={700}
                      fontSize={22 * Math.max(0.55, s)}
                      letterSpacing={4}
                      fill="#5a2a14"
                      fillOpacity={0.55}
                      stroke="#f1e5c4"
                      strokeWidth={3 * s}
                      strokeOpacity={0.5}
                      paintOrder="stroke"
                      style={{ pointerEvents: "all" }}
                    >
                      {h.name.toUpperCase()}
                    </text>
                  </g>
                ))}

              {/* locations */}
              {visible.map((l) => {
                const c = CAT[l.cat];
                const act = hover === l.name || selected === l.name;
                const isCity = l.cat === "city";
                const showLabel = labels !== "never" && (isCity || showSmallLabels) || act;
                return (
                  <g
                    key={l.name}
                    style={{ cursor: "pointer" }}
                    onMouseEnter={() => setHover(l.name)}
                    onMouseLeave={() => setHover((h) => (h === l.name ? null : h))}
                    onClick={() => openLoc(l)}
                  >
                    {selected === l.name && <circle cx={l.x} cy={l.y} r={18 * s} fill="url(#glow-gold)" />}
                    <Icon c={c} x={l.x} y={l.y} s={s} active={act} />
                    {showLabel && (
                      <Label x={l.x} y={l.y + (isCity ? 17 : 13) * s} size={(isCity ? 14 : 9.5) * s} weight={isCity ? 700 : 400} color={isCity ? "#5a2008" : INK}>
                        {l.name}
                      </Label>
                    )}
                  </g>
                );
              })}

              <Label x={500} y={22} size={20} italic font="Cormorant Garamond" color="#24403f" halo={false} spacing={6}>
                Море Призраков
              </Label>
              <Compass x={945} y={110} r={42} />
              <Vignette w={SKY_W} h={SKY_H} />
            </>
          );
        }}
      </MapViewport>

      {/* filter panel */}
      <div className="absolute left-4 top-20 z-10 flex flex-col gap-3 max-h-[calc(100%-7rem)]">
        <div className="paper-bg rounded-lg border-2 border-[#6b4a22]/70 shadow-2xl text-[#2e200f] w-[270px] flex flex-col max-h-full">
          <button className="flex items-center justify-between px-4 pt-3 pb-2 text-left" onClick={() => setPanelOpen((o) => !o)}>
            <div>
              <div className="font-title font-bold text-2xl leading-none">Скайрим</div>
              <div className="italic text-sm">Имперская провинция</div>
            </div>
            <span className="text-lg">{panelOpen ? "▾" : "▸"}</span>
          </button>
          {panelOpen && (
            <div className="px-4 pb-4 overflow-y-auto scroll-thin">
              <div className="relative">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Поиск локации…"
                  className="w-full rounded-md bg-[#f6ecd2] border border-[#6b4a22]/50 px-3 py-1.5 text-[15px] outline-none focus:border-[#8a2b1c] placeholder:text-[#8a6a3e]"
                />
                {results.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-[#f6ecd2] border border-[#6b4a22]/50 rounded-md shadow-xl z-20 overflow-hidden">
                    {results.map((r) => (
                      <button
                        key={r.name}
                        className="w-full text-left px-3 py-1 text-sm hover:bg-[#e2cfa0] flex items-center gap-2"
                        onClick={() => {
                          openLoc(r);
                          setSearch("");
                        }}
                      >
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CAT[r.cat].color }} />
                        <span className="truncate">{r.name}</span>
                        <span className="ml-auto text-xs text-[#6b4a22] shrink-0">{r.hold}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-1.5 mt-3">
                <button className="flex-1 text-xs py-1 rounded bg-[#6b2a17] text-[#f6e7c4] hover:bg-[#8a3820]" onClick={() => setEnabled(new Set(["city"]))}>
                  Только города
                </button>
                <button className="flex-1 text-xs py-1 rounded bg-[#3a2814]/15 hover:bg-[#3a2814]/30" onClick={() => setEnabled(new Set(CATEGORIES.map((c) => c.id)))}>
                  Все
                </button>
                <button className="flex-1 text-xs py-1 rounded bg-[#3a2814]/15 hover:bg-[#3a2814]/30" onClick={() => setEnabled(new Set())}>
                  Скрыть
                </button>
              </div>

              <div className="font-title font-bold mt-3 mb-1">Фильтр локаций</div>
              <div className="flex flex-col gap-0.5">
                {CATEGORIES.map((c) => {
                  const on = enabled.has(c.id);
                  return (
                    <label key={c.id} className={"flex items-center gap-2 text-[15px] cursor-pointer rounded px-1 py-0.5 hover:bg-[#3a2814]/10 " + (on ? "" : "opacity-60")}>
                      <input type="checkbox" checked={on} onChange={() => toggle(c.id)} className="accent-[#8a2b1c]" />
                      <svg width="18" height="18" viewBox="-9 -9 18 18" className="shrink-0">
                        {c.id === "city" ? (
                          <path d={c.glyph} transform="scale(1.6)" fill="#c9651d" stroke={INK} strokeWidth={0.6} />
                        ) : (
                          <>
                            <circle r={7.5} fill={c.color} stroke={INK} strokeWidth={0.8} />
                            {c.stroke ? <path d={c.glyph} fill="none" stroke="#fff3d6" strokeWidth={1.4} /> : <path d={c.glyph} fill="#fff3d6" />}
                          </>
                        )}
                      </svg>
                      <span className="flex-1">{c.name}</span>
                      <span className="text-xs text-[#6b4a22]">{counts[c.id] ?? 0}</span>
                    </label>
                  );
                })}
              </div>

              <div className="font-title font-bold mt-3 mb-1">Слои</div>
              <div className="flex flex-col gap-0.5 text-[15px]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={showHolds} onChange={(e) => setShowHolds(e.target.checked)} className="accent-[#8a2b1c]" /> Владения
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={showRoads} onChange={(e) => setShowRoads(e.target.checked)} className="accent-[#8a2b1c]" /> Дороги
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} className="accent-[#8a2b1c]" /> Сетка квадратов
                </label>
              </div>
              <div className="font-title font-bold mt-3 mb-1">Подписи</div>
              <div className="flex rounded-md overflow-hidden border border-[#6b4a22]/50 text-xs">
                {(
                  [
                    ["auto", "Авто"],
                    ["always", "Все"],
                    ["never", "Нет"],
                  ] as const
                ).map(([v, t]) => (
                  <button key={v} onClick={() => setLabels(v)} className={"flex-1 py-1 " + (labels === v ? "bg-[#6b2a17] text-[#f6e7c4]" : "hover:bg-[#3a2814]/15")}>
                    {t}
                  </button>
                ))}
              </div>
              <div className="text-xs italic text-[#6b4a22] mt-2">«Авто» — мелкие подписи появляются при приближении. Показано: {visible.length} из {LOCATIONS.length}.</div>
              <div className="mt-3">
                <ClimateLegend keys={["snow", "tundra", "rocky", "marsh", "ash", "taiga", "autumn"]} />
              </div>
            </div>
          )}
        </div>
      </div>

      <InfoPanel
        info={info}
        onClose={() => {
          setInfo(null);
          setSelected(null);
        }}
      />
    </div>
  );
}
