import { useState } from "react";
import MapViewport from "./MapViewport";
import InfoPanel, { type InfoData } from "./InfoPanel";
import { ClimateDefs, ClimateLegend, Compass, INK, Label, LandBase, Mountain, Ocean, Tints, Tree, Vignette, OCEAN } from "./MapStyle";
import { INNER_SEA, LAKE_RUMARE, PROVINCES, TAM_CITIES, TAM_H, TAM_ISLANDS, TAM_MOUNTAINS, TAM_TINTS, TAM_W, VVARDENFELL } from "../data/tamriel";
import { roughPath, rng } from "../utils/geo";

const PROV_PATHS = PROVINCES.map((p) => ({ ...p, d: roughPath(p.pts, 5, 5, 0.05) }));
const ISLAND_PATHS = TAM_ISLANDS.map((i) => ({ ...i, d: roughPath(i.pts, 3, 4, 0.08) }));
const ALL_LAND = [...PROV_PATHS.map((p) => p.d), ...ISLAND_PATHS.map((i) => i.d)];
const INNER_SEA_D = roughPath(INNER_SEA, 5, 5, 0.06);
const VVARD_D = roughPath(VVARDENFELL, 4, 5, 0.07);
const RUMARE_D = roughPath(LAKE_RUMARE, 3, 4, 0.08);

const TREES = (() => {
  const R = rng(7);
  const out: { x: number; y: number; pine: boolean; color: string }[] = [];
  const area = (cx: number, cy: number, rx: number, ry: number, n: number, pine: boolean, color: string) => {
    for (let i = 0; i < n; i++) {
      const a = R() * Math.PI * 2;
      const r = Math.sqrt(R());
      out.push({ x: cx + Math.cos(a) * rx * r, y: cy + Math.sin(a) * ry * r, pine, color });
    }
  };
  area(470, 650, 70, 70, 34, false, "#4c6e37");
  area(600, 425, 40, 25, 10, false, "#6a8a4a");
  area(745, 470, 25, 40, 10, false, "#5a7d40");
  area(560, 215, 45, 18, 12, true, "#4a6a46");
  area(220, 240, 45, 25, 12, false, "#6a8a4a");
  area(950, 700, 80, 90, 26, false, "#56663a");
  area(700, 760, 35, 15, 8, false, "#3f6a35");
  area(190, 690, 60, 60, 12, false, "#7fa860");
  return out;
})();

export default function TamrielMap({ onOpenSkyrim }: { onOpenSkyrim: () => void }) {
  const [hover, setHover] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [info, setInfo] = useState<InfoData | null>(null);
  const [showCities, setShowCities] = useState(true);

  const openProvince = (id: string) => {
    const p = PROVINCES.find((x) => x.id === id)!;
    setSelected(id);
    setInfo({
      title: p.name,
      subtitle: p.subtitle,
      body: p.body,
      facts: p.facts,
      action: id === "skyrim" ? { label: "Открыть карту Скайрима →", onClick: onOpenSkyrim } : undefined,
    });
  };

  return (
    <div className="relative w-full h-full paper-bg">
      <MapViewport
        width={TAM_W}
        height={TAM_H}
        maxZoom={6}
        defs={
          <>
            <ClimateDefs />
            <clipPath id="tam-clip">
              {ALL_LAND.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </clipPath>
            <clipPath id="vv-clip">
              <path d={VVARD_D} />
            </clipPath>
          </>
        }
      >
        {(k) => (
          <>
            <Ocean w={TAM_W} h={TAM_H} />
            <LandBase paths={ALL_LAND} />
            <g clipPath="url(#tam-clip)">
              <Tints tints={TAM_TINTS} />
              <rect width={TAM_W} height={TAM_H} fill="url(#landgrain)" />
            </g>
            {/* inner waters */}
            <path d={INNER_SEA_D} fill={OCEAN} stroke={INK} strokeWidth={1.8} />
            <path d={INNER_SEA_D} fill="url(#waves)" />
            <LandBase paths={[VVARD_D]} />
            <g clipPath="url(#vv-clip)">
              <Tints
                tints={[
                  { c: "ash", x: 965, y: 215, rx: 110, ry: 110 },
                  { c: "volcanic", x: 965, y: 200, rx: 40, ry: 36 },
                  { c: "marsh", x: 900, y: 280, rx: 40, ry: 30 },
                ]}
              />
            </g>
            <path d={RUMARE_D} fill={OCEAN} stroke={INK} strokeWidth={1.4} />

            {/* rivers */}
            <g fill="none" stroke="#6f9196" strokeWidth={1.6} strokeLinecap="round">
              <path d="M700,440 Q650,470 610,500" />
              <path d="M690,340 Q660,300 650,272" />
              <path d="M690,190 Q720,150 740,112" />
              <path d="M540,60 Q560,100 600,120" />
            </g>

            {TREES.map((t, i) => (
              <Tree key={i} x={t.x} y={t.y} s={3.5} pine={t.pine} color={t.color} />
            ))}
            {TAM_MOUNTAINS.map((m, i) => (
              <Mountain key={i} x={m.x} y={m.y} s={m.s} snow={m.snow} />
            ))}

            {/* provinces interaction */}
            {PROV_PATHS.map((p) => {
              const on = hover === p.id || selected === p.id;
              return (
                <path
                  key={p.id}
                  d={p.d}
                  fill="#ffe08a"
                  fillOpacity={on ? 0.28 : 0}
                  stroke={on ? "#8a2b1c" : "none"}
                  strokeWidth={on ? 2.5 : 0}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={() => setHover(p.id)}
                  onMouseLeave={() => setHover((h) => (h === p.id ? null : h))}
                  onClick={() => openProvince(p.id)}
                />
              );
            })}
            {ISLAND_PATHS.filter((i) => i.prov).map((i) => (
              <path
                key={i.id}
                d={i.d}
                fill="#ffe08a"
                fillOpacity={hover === i.prov || selected === i.prov ? 0.28 : 0}
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHover(i.prov!)}
                onMouseLeave={() => setHover(null)}
                onClick={() => openProvince(i.prov!)}
              />
            ))}
            {/* borders */}
            <g fill="none" stroke="#8a2b1c" strokeWidth={1.3} strokeDasharray="6 4" strokeOpacity={0.6} pointerEvents="none">
              {PROV_PATHS.map((p) => (
                <path key={p.id} d={p.d} />
              ))}
            </g>

            {/* cities */}
            {showCities &&
              TAM_CITIES.map((c) => {
                const s = 1 / Math.pow(k, 0.55);
                return (
                  <g key={c.name} pointerEvents="none">
                    {c.capital ? (
                      <>
                        <circle cx={c.x} cy={c.y} r={5 * s} fill="#8a2b1c" stroke={INK} strokeWidth={1.2 * s} />
                        <circle cx={c.x} cy={c.y} r={2 * s} fill="#f3e3bb" />
                      </>
                    ) : (
                      <circle cx={c.x} cy={c.y} r={3.2 * s} fill={INK} />
                    )}
                    <Label x={c.x} y={c.y - 10 * s} size={(c.capital ? 13 : 11) * s} weight={c.capital ? 700 : 400}>
                      {c.name}
                    </Label>
                  </g>
                );
              })}

            {/* province labels */}
            {PROV_PATHS.map((p) => (
              <Label
                key={p.id}
                x={p.label[0]}
                y={p.label[1]}
                size={p.labelSize ?? 30}
                font="Cormorant SC"
                weight={700}
                spacing={2}
                color={hover === p.id ? "#6b1a0c" : "#2b1a0a"}
              >
                {p.name}
              </Label>
            ))}
            <Label x={905} y={95} size={13} italic>
              Солстхейм
            </Label>
            <Label x={965} y={160} size={14} italic font="Cormorant Garamond" weight={700}>
              Вварденфелл
            </Label>
            <Label x={150} y={480} size={12} italic>
              Строс М'Кай
            </Label>
            <Label x={640} y={14} size={18} italic font="Cormorant Garamond" color="#24403f" halo={false} spacing={4}>
              Море Призраков
            </Label>
            <Label x={160} y={500} size={16} italic font="Cormorant Garamond" color="#24403f" halo={false} spacing={3}>
              Абецейское море
            </Label>
            <Label x={1000} y={860} size={16} italic font="Cormorant Garamond" color="#24403f" halo={false} spacing={3}>
              Море Падомай
            </Label>
            <Label x={250} y={420} size={12} italic font="Cormorant Garamond" color="#24403f" halo={false}>
              Илиакский залив
            </Label>
            <Label x={800} y={740} size={12} italic font="Cormorant Garamond" color="#24403f" halo={false}>
              Топалский залив
            </Label>
            <Compass x={80} y={90} r={50} />
            <Vignette w={TAM_W} h={TAM_H} />
          </>
        )}
      </MapViewport>

      <div className="absolute left-4 top-20 z-10 flex flex-col gap-3 pointer-events-none">
        <div className="paper-bg rounded-lg border border-[#6b4a22]/60 shadow-xl px-4 py-2 text-[#2e200f] pointer-events-auto">
          <div className="font-title font-bold text-2xl leading-none">Тамриэль</div>
          <div className="italic text-sm">Девять провинций Империи</div>
          <label className="flex items-center gap-2 text-sm mt-1 font-hand cursor-pointer">
            <input type="checkbox" checked={showCities} onChange={(e) => setShowCities(e.target.checked)} className="accent-[#8a2b1c]" />
            Показывать города
          </label>
        </div>
        <div className="hidden md:block pointer-events-auto">
          <ClimateLegend keys={["snow", "tundra", "taiga", "temperate", "forest", "desert", "arid", "ash", "volcanic", "swamp", "jungle", "lush"]} />
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
