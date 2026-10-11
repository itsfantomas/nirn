import { useState } from "react";
import MapViewport from "./MapViewport";
import InfoPanel, { type InfoData } from "./InfoPanel";
import { ClimateDefs, ClimateLegend, Compass, INK, Label, LandBase, Mountain, Ocean, OCEAN, Tints, Vignette } from "./MapStyle";
import { NIRN_H, NIRN_LANDS, NIRN_REGIONS, NIRN_TINTS, NIRN_W, TAM_S, TAM_TX, TAM_TY } from "../data/nirn";
import { INNER_SEA, PROVINCES, TAM_ISLANDS, TAM_MOUNTAINS, TAM_TINTS, VVARDENFELL, LAKE_RUMARE } from "../data/tamriel";
import { roughPath, rng } from "../utils/geo";

const LANDS = NIRN_LANDS.map((l) => ({ ...l, d: roughPath(l.pts, l.amp ?? 6, Math.max(4, (l.amp ?? 6) * 1.2), 0.03) }));
const TAM_LAND = [...PROVINCES.map((p) => roughPath(p.pts, 5, 5, 0.05)), ...TAM_ISLANDS.map((i) => roughPath(i.pts, 3, 4, 0.08))];
const TAM_INNER = roughPath(INNER_SEA, 5, 5, 0.06);
const TAM_VV = roughPath(VVARDENFELL, 4, 5, 0.07);
const TAM_RUM = roughPath(LAKE_RUMARE, 3, 4, 0.08);

const NIRN_MOUNTAINS = (() => {
  const R = rng(3);
  const m: { x: number; y: number; s: number; snow?: boolean }[] = [];
  for (let i = 0; i < 26; i++) m.push({ x: 700 + R() * 1300, y: 40 + R() * 200, s: 14 + R() * 8, snow: true });
  for (let i = 0; i < 10; i++) m.push({ x: 1700 + R() * 260, y: 520 + R() * 80, s: 14, snow: true });
  for (let i = 0; i < 6; i++) m.push({ x: 1560 + i * 40, y: 640 + Math.sin(i) * 20, s: 13 });
  for (let i = 0; i < 6; i++) m.push({ x: 1920 + Math.sin(i) * 20, y: 650 + i * 40, s: 12 });
  for (let i = 0; i < 8; i++) m.push({ x: 800 + R() * 500, y: 1380 + R() * 120, s: 14, snow: true });
  return m;
})();

const AKAVIR_ZONES = [
  { id: "kamal", x: 1820, y: 545, rx: 170, ry: 60 },
  { id: "tsaesci", x: 1480, y: 720, rx: 130, ry: 120 },
  { id: "kapotun", x: 1800, y: 820, rx: 180, ry: 150 },
  { id: "tangmo", x: 1650, y: 1130, rx: 290, ry: 140 },
];

export default function NirnMap({ onOpenTamriel }: { onOpenTamriel: () => void }) {
  const [hover, setHover] = useState<string | null>(null);
  const [info, setInfo] = useState<InfoData | null>(null);

  const open = (id: string) => {
    const r = NIRN_REGIONS[id];
    setInfo({
      title: r.name,
      subtitle: r.subtitle,
      body: r.body,
      facts: r.facts,
      action: id === "tamriel" ? { label: "Рассмотреть Тамриэль →", onClick: onOpenTamriel } : undefined,
    });
  };
  const hp = (id: string) => ({
    onMouseEnter: () => setHover(id),
    onMouseLeave: () => setHover((h) => (h === id ? null : h)),
    onClick: () => open(id),
    style: { cursor: "pointer" },
  });

  const hl = (id: string) => (hover === id ? 0.28 : 0);

  return (
    <div className="relative w-full h-full paper-bg">
      <MapViewport
        width={NIRN_W}
        height={NIRN_H}
        maxZoom={6}
        defs={
          <>
            <ClimateDefs />
            <clipPath id="nirn-clip">
              {LANDS.map((l) => (
                <path key={l.id} d={l.d} />
              ))}
            </clipPath>
            <clipPath id="nirn-tam-clip">
              {TAM_LAND.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </clipPath>
          </>
        }
      >
        {(k) => (
          <>
            <Ocean w={NIRN_W} h={NIRN_H} />
            <LandBase paths={LANDS.map((l) => l.d)} scale={1.4} />
            <g clipPath="url(#nirn-clip)">
              <Tints tints={NIRN_TINTS} />
              <rect width={NIRN_W} height={NIRN_H} fill="url(#landgrain)" />
            </g>
            {NIRN_MOUNTAINS.map((m, i) => (
              <Mountain key={i} {...m} />
            ))}

            {/* Tamriel */}
            <g transform={`translate(${TAM_TX},${TAM_TY}) scale(${TAM_S})`}>
              <LandBase paths={TAM_LAND} scale={1.5} />
              <g clipPath="url(#nirn-tam-clip)">
                <Tints tints={TAM_TINTS} />
              </g>
              <path d={TAM_INNER} fill={OCEAN} stroke={INK} strokeWidth={2} />
              <path d={TAM_VV} fill="#d9c9a0" stroke={INK} strokeWidth={2} />
              <ellipse cx={965} cy={210} rx={90} ry={80} fill="url(#cl-ash)" />
              <path d={TAM_RUM} fill={OCEAN} stroke={INK} strokeWidth={1.6} />
              {TAM_MOUNTAINS.filter((_, i) => i % 2 === 0).map((m, i) => (
                <Mountain key={i} x={m.x} y={m.y} s={m.s * 1.3} snow={m.snow} />
              ))}
              <g fill="none" stroke="#8a2b1c" strokeWidth={1.5} strokeDasharray="7 5" strokeOpacity={0.5}>
                {TAM_LAND.slice(0, PROVINCES.length).map((d, i) => (
                  <path key={i} d={d} />
                ))}
              </g>
              <g {...hp("tamriel")}>
                {TAM_LAND.map((d, i) => (
                  <path key={i} d={d} fill="#ffe08a" fillOpacity={hl("tamriel")} stroke={hover === "tamriel" ? "#8a2b1c" : "none"} strokeWidth={3} />
                ))}
              </g>
              {k > 1.6 &&
                PROVINCES.map((p) => (
                  <Label key={p.id} x={p.label[0]} y={p.label[1]} size={22} font="Cormorant SC" weight={700}>
                    {p.name}
                  </Label>
                ))}
            </g>

            {/* other lands interaction */}
            {LANDS.map((l) => (
              <path key={l.id} d={l.d} fill="#ffe08a" fillOpacity={hl(l.region)} {...hp(l.region)} />
            ))}
            {AKAVIR_ZONES.map((z) => (
              <ellipse
                key={z.id}
                cx={z.x}
                cy={z.y}
                rx={z.rx}
                ry={z.ry}
                fill="#ffe08a"
                fillOpacity={hover === z.id ? 0.18 : 0}
                stroke={hover === z.id ? "#8a2b1c" : "none"}
                strokeDasharray="8 6"
                strokeWidth={2}
                {...hp(z.id)}
              />
            ))}
            <g {...hp("aldmeris")}>
              <circle cx={1060} cy={1180} r={70} fill="#ffffff" fillOpacity={hover === "aldmeris" ? 0.15 : 0.03} stroke={INK} strokeOpacity={0.5} strokeDasharray="6 8" strokeWidth={2} />
            </g>

            {/* labels */}
            <Label x={1000} y={210} size={110} font="Cormorant SC" weight={700} spacing={18} color="#5c6b72" halo={false} opacity={0.85}>
              АТМОРА
            </Label>
            <Label x={720} y={510} size={96} font="Cormorant SC" weight={700} spacing={14} color="#4b5a5f" halo={false} opacity={0.85}>
              ТАМРИЭЛЬ
            </Label>
            <Label x={1650} y={1340} size={96} font="Cormorant SC" weight={700} spacing={14} color="#4b5a5f" halo={false} opacity={0.85}>
              АКАВИР
            </Label>
            <Label x={150} y={1050} size={46} font="Cormorant SC" weight={700} spacing={6} color="#4b5a5f" halo={false}>
              ЙОКУДА
            </Label>
            <Label x={550} y={1475} size={46} font="Cormorant SC" weight={700} spacing={6} color="#4b5a5f" halo={false}>
              ПИАНДОНЕЯ
            </Label>
            <Label x={1820} y={548} size={30} font="Cormorant SC" weight={700} spacing={6}>
              Камаль
            </Label>
            <Label x={1480} y={700} size={30} font="Cormorant SC" weight={700} spacing={6}>
              Цаэски
            </Label>
            <Label x={1790} y={820} size={30} font="Cormorant SC" weight={700} spacing={6}>
              Ка По Тун
            </Label>
            <Label x={1650} y={1080} size={30} font="Cormorant SC" weight={700} spacing={6}>
              Тан Мо
            </Label>
            <Label x={920} y={470} size={24}>
              Роскреа
            </Label>
            <Label x={300} y={890} size={22}>
              Трас
            </Label>
            <Label x={1300} y={760} size={20}>
              Эсрониет
            </Label>
            <Label x={1060} y={1180} size={22} italic font="Cormorant Garamond" color="#2a3a3c" halo={false}>
              Алдмерис?
            </Label>
            <Label x={1080} y={1480} size={30} font="Cormorant SC" color="#4b5a5f" halo={false} spacing={6}>
              Южные льды
            </Label>
            <Label x={1100} y={440} size={28} italic font="Cormorant Garamond" color="#24403f" halo={false} spacing={6}>
              Море Призраков
            </Label>
            <Label x={1160} y={1060} size={28} italic font="Cormorant Garamond" color="#24403f" halo={false} spacing={6}>
              Море Падомай
            </Label>
            <Label x={250} y={640} size={28} italic font="Cormorant Garamond" color="#24403f" halo={false} spacing={6}>
              Абецейское море
            </Label>
            <Label x={1300} y={600} size={26} italic font="Cormorant Garamond" color="#24403f" halo={false} spacing={6}>
              Восточное море
            </Label>
            <Compass x={150} y={1340} r={110} />
            <Vignette w={NIRN_W} h={NIRN_H} />
          </>
        )}
      </MapViewport>

      <div className="absolute left-4 top-20 z-10 flex flex-col gap-3 pointer-events-none">
        <div className="paper-bg rounded-lg border border-[#6b4a22]/60 shadow-xl px-4 py-2 text-[#2e200f] pointer-events-auto">
          <div className="font-title font-bold text-2xl leading-none">Нирн</div>
          <div className="italic text-sm">Континенты смертного мира</div>
          <div className="text-xs font-hand mt-1 text-[#6b4a22]">Нажмите на Тамриэль, чтобы приблизиться</div>
        </div>
        <div className="hidden md:block pointer-events-auto">
          <ClimateLegend keys={["ice", "snow", "temperate", "forest", "arid", "savanna", "desert", "jungle", "swamp", "ash"]} />
        </div>
      </div>
      <InfoPanel info={info} onClose={() => setInfo(null)} />
    </div>
  );
}
