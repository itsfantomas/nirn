import { useMemo, useState } from "react";
import { AEDRA, CONSTELLATIONS, CONSTELLATION_INFO, PRINCES, REGIONS } from "../data/cosmology";
import InfoPanel, { type InfoData } from "./InfoPanel";
import { rng } from "../utils/geo";

const C = 500;
const R_AETH_OUT = 470;
const R_AETH_IN = 400;
const R_OBL_MID = 330;
const R_MUNDUS = 260;

const rad = (a: number) => ((a - 90) * Math.PI) / 180;
const pos = (a: number, r: number) => [C + Math.cos(rad(a)) * r, C + Math.sin(rad(a)) * r] as const;

function wedge(r1: number, r2: number, a1: number, a2: number) {
  const [x1, y1] = pos(a1, r2);
  const [x2, y2] = pos(a2, r2);
  const [x3, y3] = pos(a2, r1);
  const [x4, y4] = pos(a1, r1);
  const large = a2 - a1 > 180 ? 1 : 0;
  return `M${x1},${y1} A${r2},${r2} 0 ${large} 1 ${x2},${y2} L${x3},${y3} A${r1},${r1} 0 ${large} 0 ${x4},${y4} Z`;
}

function ring(r1: number, r2: number) {
  return `M${C - r2},${C} a${r2},${r2} 0 1,0 ${r2 * 2},0 a${r2},${r2} 0 1,0 ${-r2 * 2},0 Z M${C - r1},${C} a${r1},${r1} 0 1,1 ${r1 * 2},0 a${r1},${r1} 0 1,1 ${-r1 * 2},0 Z`;
}

function tangentRot(a: number) {
  const n = ((a % 360) + 360) % 360;
  return n > 90 && n < 270 ? n + 180 : n;
}

export default function Cosmology({ onEnterNirn }: { onEnterNirn: () => void }) {
  const [info, setInfo] = useState<InfoData | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  const stars = useMemo(() => {
    const R = rng(42);
    return Array.from({ length: 260 }, () => {
      const a = R() * 360;
      const r = R_AETH_IN + 4 + R() * (R_AETH_OUT - R_AETH_IN - 8);
      const [x, y] = pos(a, r);
      return { x, y, s: R() * 1.3 + 0.3, o: R() * 0.7 + 0.3 };
    });
  }, []);

  const constellationStars = useMemo(
    () =>
      CONSTELLATIONS.map((c, i) => {
        const R = rng(100 + i);
        return Array.from({ length: 5 }, () => pos(c.angle + (R() - 0.5) * 9, 437 + (R() - 0.5) * 34));
      }),
    [],
  );

  const show = (title: string, data: Omit<InfoData, "title">) => setInfo({ title, ...data });
  const hp = (id: string) => ({
    onMouseEnter: () => setHover(id),
    onMouseLeave: () => setHover((h) => (h === id ? null : h)),
    style: { cursor: "pointer" },
  });

  return (
    <div className="relative w-full h-full stars bg-[#05040b] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#1a1640_0%,#05040b_70%)] opacity-80" />
      <div className="absolute inset-0 flex items-center justify-center p-2 pt-16">
        <div className="relative aspect-square h-full max-w-full">
          {/* Aetherius conic ring */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "conic-gradient(from 0deg, #f1efd8 0deg, #63d8c5 35deg, #2bb3a8 70deg, #2a86c2 115deg, #3050d4 150deg, #6a3fd0 185deg, #a83f9a 220deg, #c4404f 255deg, #c25b3c 290deg, #b9906c 330deg, #f1efd8 360deg)",
              WebkitMask: "radial-gradient(circle closest-side, transparent 79%, #000 81.5%, #000 92.5%, transparent 95%)",
              mask: "radial-gradient(circle closest-side, transparent 79%, #000 81.5%, #000 92.5%, transparent 95%)",
              opacity: 0.85,
            }}
          />
          <div
            className="absolute inset-0 rounded-full blur-2xl pulse-glow"
            style={{
              background:
                "conic-gradient(from 0deg, #f1efd8, #2bb3a8, #2a86c2, #3050d4, #6a3fd0, #c4404f, #c25b3c, #f1efd8)",
              WebkitMask: "radial-gradient(circle closest-side, transparent 85%, #000 92%, transparent 100%)",
              mask: "radial-gradient(circle closest-side, transparent 85%, #000 92%, transparent 100%)",
              opacity: 0.45,
            }}
          />
          <svg viewBox="0 0 1000 1000" className="map-svg absolute inset-0 w-full h-full">
            <defs>
              <radialGradient id="nirnGrad" cx="38%" cy="35%">
                <stop offset="0%" stopColor="#9fd8ff" />
                <stop offset="45%" stopColor="#2f78c8" />
                <stop offset="100%" stopColor="#0d2350" />
              </radialGradient>
              <radialGradient id="nirnHalo">
                <stop offset="40%" stopColor="#bfe6ff" stopOpacity="0.9" />
                <stop offset="70%" stopColor="#4aa3ff" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#4aa3ff" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="magnusGrad">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="45%" stopColor="#fff6cc" />
                <stop offset="100%" stopColor="#ffd36a" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="mundusGrad">
                <stop offset="0%" stopColor="#1b2a5a" stopOpacity="0.9" />
                <stop offset="70%" stopColor="#0b0f24" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#090a18" stopOpacity="1" />
              </radialGradient>
              {AEDRA.map((p) => (
                <radialGradient key={p.id} id={`pl-${p.id}`} cx="35%" cy="32%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
                  <stop offset="25%" stopColor={p.glow} />
                  <stop offset="100%" stopColor={p.color} stopOpacity="1" />
                </radialGradient>
              ))}
              <filter id="softglow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="nebula" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="22" />
              </filter>
            </defs>

            {/* Aetherius clickable ring */}
            <path
              d={ring(R_AETH_IN, R_AETH_OUT)}
              fillRule="evenodd"
              fill={hover === "aetherius" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.001)"}
              {...hp("aetherius")}
              onClick={() => show("Этериус", REGIONS.aetherius)}
            />
            {stars.map((s, i) => (
              <circle key={i} cx={s.x} cy={s.y} r={s.s} fill="#fff" opacity={s.o} pointerEvents="none" />
            ))}

            {/* constellations */}
            {CONSTELLATIONS.map((c, i) => {
              const pts = constellationStars[i];
              const [lx, ly] = pos(c.angle, 412);
              const id = "const-" + i;
              return (
                <g key={c.name} {...hp(id)} onClick={() => show(`Созвездие «${c.name}»`, CONSTELLATION_INFO)}>
                  <polyline
                    points={pts.map((p) => p.join(",")).join(" ")}
                    fill="none"
                    stroke="#fff"
                    strokeOpacity={hover === id ? 0.9 : 0.35}
                    strokeWidth={0.8}
                  />
                  {pts.map((p, j) => (
                    <circle key={j} cx={p[0]} cy={p[1]} r={hover === id ? 2.4 : 1.6} fill="#fff" />
                  ))}
                  <circle cx={pts[2][0]} cy={pts[2][1]} r={22} fill="transparent" />
                  <text
                    x={lx}
                    y={ly}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontFamily="Cormorant Garamond"
                    fontStyle="italic"
                    fontSize={13}
                    fill="#f4f1ff"
                    opacity={hover === id ? 1 : 0.7}
                    transform={`rotate(${tangentRot(c.angle)} ${lx} ${ly})`}
                  >
                    {c.name}
                  </text>
                </g>
              );
            })}

            {/* Oblivion ring */}
            <path d={ring(R_MUNDUS, R_AETH_IN)} fillRule="evenodd" fill="#07070f" opacity={0.92} />
            <g filter="url(#nebula)" opacity={0.35} pointerEvents="none">
              <ellipse cx={300} cy={760} rx={140} ry={60} fill="#7a2fd0" />
              <ellipse cx={760} cy={300} rx={120} ry={60} fill="#1f8fa8" />
              <ellipse cx={240} cy={330} rx={110} ry={50} fill="#a83a3a" />
              <ellipse cx={740} cy={740} rx={120} ry={50} fill="#3050d4" />
            </g>
            {PRINCES.map((p) => {
              const r1 = p.ring === "outer" ? R_OBL_MID : R_MUNDUS;
              const r2 = p.ring === "outer" ? R_AETH_IN : R_OBL_MID;
              const rm = (r1 + r2) / 2;
              const [x, y] = pos(p.angle, rm);
              const active = hover === p.id;
              return (
                <g key={p.id} {...hp(p.id)} onClick={() => show(p.name, p.info)}>
                  <path
                    d={wedge(r1 + 1, r2 - 1, p.angle - 22.2, p.angle + 22.2)}
                    fill={active ? (p.info.color ?? "#fff") : "transparent"}
                    fillOpacity={active ? 0.22 : 0}
                  />
                  <text
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontFamily="Cormorant Garamond"
                    fontWeight={700}
                    fontSize={p.name.length > 14 ? 15 : 19}
                    fill={active ? "#fff" : "#e6e2f5"}
                    style={{ filter: active ? `drop-shadow(0 0 6px ${p.info.color})` : undefined }}
                    transform={`rotate(${tangentRot(p.angle)} ${x} ${y})`}
                  >
                    {p.name}
                  </text>
                </g>
              );
            })}
            {/* dividers */}
            <g stroke="#e9e6ff" strokeOpacity={0.55} strokeWidth={1.2} pointerEvents="none">
              {Array.from({ length: 8 }, (_, i) => {
                const a = i * 45 + 22.5;
                const [x1, y1] = pos(a, R_MUNDUS);
                const [x2, y2] = pos(a, R_AETH_IN + 8);
                return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
              })}
              <circle cx={C} cy={C} r={R_AETH_IN} fill="none" />
              <circle cx={C} cy={C} r={R_OBL_MID} fill="none" strokeDasharray="3 5" strokeOpacity={0.35} />
              <circle cx={C} cy={C} r={R_MUNDUS} fill="none" />
            </g>

            {/* Mundus */}
            <circle
              cx={C}
              cy={C}
              r={R_MUNDUS - 1}
              fill="url(#mundusGrad)"
              {...hp("mundus")}
              onClick={() => show("Мундус", REGIONS.mundus)}
            />
            {hover === "mundus" && <circle cx={C} cy={C} r={R_MUNDUS - 2} fill="none" stroke="#7fb6ff" strokeOpacity={0.6} strokeWidth={2} />}
            <circle cx={C} cy={C} r={190} fill="none" stroke="#c6d4ff" strokeOpacity={0.25} strokeDasharray="2 6" pointerEvents="none" />
            <circle cx={C} cy={C} r={118} fill="none" stroke="#c6d4ff" strokeOpacity={0.2} strokeDasharray="2 6" pointerEvents="none" />
            <g className="cosmo-spin-rev" pointerEvents="none" opacity={0.5}>
              {Array.from({ length: 24 }, (_, i) => {
                const [x, y] = pos(i * 15, 150 + (i % 3) * 8);
                return <circle key={i} cx={x} cy={y} r={0.9} fill="#bcd" />;
              })}
            </g>

            {/* spokes from Nirn to Aedra */}
            <g stroke="#dfe6ff" strokeOpacity={0.35} strokeWidth={1} pointerEvents="none">
              {AEDRA.map((p) => {
                const [x1, y1] = pos(p.angle, 78);
                const [x2, y2] = pos(p.angle, 160);
                return <line key={p.id} x1={x1} y1={y1} x2={x2} y2={y2} />;
              })}
            </g>

            {/* Aedra planets */}
            {AEDRA.map((p) => {
              const [x, y] = pos(p.angle, 190);
              const active = hover === p.id;
              return (
                <g key={p.id} {...hp(p.id)} onClick={() => show(p.name, { ...p.info, color: p.color })}>
                  <circle cx={x} cy={y} r={active ? 44 : 38} fill={p.glow} opacity={0.18} filter="url(#softglow)" />
                  <circle cx={x} cy={y} r={active ? 31 : 28} fill={`url(#pl-${p.id})`} stroke="#fff" strokeOpacity={0.6} strokeWidth={1.5} />
                  <text
                    x={x}
                    y={y + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontFamily="Cormorant Garamond"
                    fontWeight={700}
                    fontSize={13}
                    fill="#fff"
                    style={{ textShadow: "0 0 4px #000" }}
                    stroke="#000"
                    strokeOpacity={0.35}
                    strokeWidth={2}
                    paintOrder="stroke"
                  >
                    {p.name}
                  </text>
                </g>
              );
            })}

            {/* Moons */}
            {(() => {
              const [mx, my] = pos(212, 112);
              const [sx, sy] = pos(168, 116);
              const [nx, ny] = pos(312, 116);
              return (
                <>
                  <g {...hp("masser")} onClick={() => show("Массер", REGIONS.masser)}>
                    <circle cx={mx} cy={my} r={hover === "masser" ? 12 : 10} fill="#c9433a" stroke="#ffb0a0" strokeWidth={1} />
                    <text x={mx} y={my + 20} textAnchor="middle" fontSize={11} fill="#ffd8d0" fontFamily="Cormorant Garamond">
                      Массер
                    </text>
                  </g>
                  <g {...hp("secunda")} onClick={() => show("Секунда", REGIONS.secunda)}>
                    <circle cx={sx} cy={sy} r={hover === "secunda" ? 9 : 7} fill="#dfe3ea" stroke="#fff" strokeWidth={1} />
                    <text x={sx} y={sy + 18} textAnchor="middle" fontSize={11} fill="#eef" fontFamily="Cormorant Garamond">
                      Секунда
                    </text>
                  </g>
                  <g {...hp("necro")} onClick={() => show("Луна Некроманта", REGIONS.necromancer)}>
                    <circle cx={nx} cy={ny} r={hover === "necro" ? 8 : 6} fill="#2a1a3a" stroke="#b58aff" strokeWidth={1.2} />
                    <text x={nx} y={ny + 17} textAnchor="middle" fontSize={10} fill="#d8c4ff" fontFamily="Cormorant Garamond">
                      Луна Некроманта
                    </text>
                  </g>
                </>
              );
            })()}

            {/* Nirn */}
            <g {...hp("nirn")} onClick={onEnterNirn}>
              <circle cx={C} cy={C} r={hover === "nirn" ? 120 : 108} fill="url(#nirnHalo)" className="pulse-glow" />
              <g className="cosmo-spin">
                <circle cx={C} cy={C} r={70} fill="url(#nirnGrad)" stroke="#d6efff" strokeWidth={2} />
                <path d="M462,478 q14,-18 34,-10 q14,8 28,2 q10,10 -4,22 q-18,6 -30,18 q-14,-6 -22,-14 q-12,-6 -6,-18Z" fill="#3fa36b" opacity={0.6} />
                <path d="M530,515 q12,-8 22,2 q4,16 -10,24 q-14,-4 -12,-26Z" fill="#3fa36b" opacity={0.5} />
                <path d="M470,448 q20,-10 50,-4 q-10,8 -30,10 q-12,0 -20,-6Z" fill="#e8f4ff" opacity={0.6} />
              </g>
              <text
                x={C}
                y={C + 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="Cormorant SC"
                fontWeight={700}
                fontSize={30}
                letterSpacing={3}
                fill="#fff"
                stroke="#0a2a5a"
                strokeWidth={3}
                paintOrder="stroke"
              >
                НИРН
              </text>
              {hover === "nirn" && (
                <text x={C} y={C + 92} textAnchor="middle" fontSize={13} fill="#cfe6ff" fontFamily="Cormorant Garamond" fontStyle="italic">
                  нажмите, чтобы спуститься на Нирн
                </text>
              )}
            </g>

            {/* Magnus */}
            {(() => {
              const [x, y] = pos(0, 436);
              return (
                <>
                  <g {...hp("magnus")} onClick={() => show("Магнус", REGIONS.magnus)}>
                    <circle cx={x} cy={y} r={hover === "magnus" ? 62 : 54} fill="url(#magnusGrad)" className="pulse-glow" />
                    <circle cx={x} cy={y} r={27} fill="#fffdf0" stroke="#fff" strokeWidth={2} />
                    <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle" fontSize={14} fontWeight={700} fill="#6a5520" fontFamily="Cormorant Garamond">
                      Магнус
                    </text>
                  </g>
                  <g {...hp("magnage")} onClick={() => show("Маги-ге", REGIONS.magnage)}>
                    {["#ffd04a", "#c04acf", "#4a8fff", "#e85a5a", "#5ad08a"].map((c, i) => (
                      <circle key={c} cx={x + 38 + i * 9} cy={y - 8 + i * 3} r={3.6} fill={c} stroke="#fff" strokeWidth={0.6} />
                    ))}
                    <text x={x + 62} y={y + 20} textAnchor="middle" fontSize={11} fill="#fff" fontFamily="Cormorant Garamond" fontStyle="italic">
                      Маги-ге
                    </text>
                    <rect x={x + 30} y={y - 16} width={56} height={44} fill="transparent" />
                  </g>
                </>
              );
            })()}

            {/* Sovngarde & Soul Cairn */}
            {(() => {
              const [sx, sy] = pos(98, 448);
              const [cx, cy] = pos(244, 388);
              return (
                <>
                  <g {...hp("sovn")} onClick={() => show("Совнгард", REGIONS.sovngarde)}>
                    <circle cx={sx} cy={sy} r={hover === "sovn" ? 7 : 5} fill="#cffff0" stroke="#fff" filter="url(#softglow)" />
                    <text x={sx - 12} y={sy + 2} textAnchor="end" fontSize={12} fill="#dffff6" fontFamily="Cormorant Garamond" dominantBaseline="middle">
                      Совнгард
                    </text>
                  </g>
                  <g {...hp("cairn")} onClick={() => show("Каирн Душ", REGIONS.soulcairn)}>
                    <circle cx={cx} cy={cy} r={hover === "cairn" ? 6.5 : 5} fill="#9aa0ff" stroke="#fff" strokeWidth={0.8} />
                    <text x={cx + 10} y={cy + 2} fontSize={11} fill="#d6d8ff" fontFamily="Cormorant Garamond" dominantBaseline="middle">
                      Каирн Душ
                    </text>
                  </g>
                </>
              );
            })()}

            {/* Region titles */}
            {[
              { id: "aurbis", t: "АУРБИС", a: -52, r: 488 },
              { id: "aetherius", t: "ЭТЕРИУС", a: 58, r: 488 },
              { id: "oblivion", t: "ОБЛИВИОН", a: 180, r: 488 },
            ].map((l) => {
              const [x, y] = pos(l.a, l.r);
              return (
                <g key={l.id} {...hp("t-" + l.id)} onClick={() => show(l.t[0] + l.t.slice(1).toLowerCase(), REGIONS[l.id])}>
                  <text
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontFamily="Cormorant SC"
                    fontWeight={700}
                    fontSize={22}
                    letterSpacing={4}
                    fill={hover === "t-" + l.id ? "#fff" : "#e8e4ff"}
                    stroke="#05040b"
                    strokeWidth={5}
                    paintOrder="stroke"
                    transform={`rotate(${tangentRot(l.a)} ${x} ${y})`}
                    style={{ pointerEvents: "all" }}
                  >
                    {l.t}
                  </text>
                </g>
              );
            })}
            <text
              x={C}
              y={C - R_MUNDUS + 22}
              textAnchor="middle"
              fontFamily="Cormorant SC"
              fontWeight={700}
              fontSize={18}
              letterSpacing={4}
              fill="#fff"
              style={{ pointerEvents: "all", cursor: "pointer" }}
              onClick={() => show("Мундус", REGIONS.mundus)}
            >
              МУНДУС
            </text>
            {/* Oblivion label within ring */}
            <text
              x={C}
              y={C + R_AETH_IN - 12}
              textAnchor="middle"
              fontFamily="Cormorant SC"
              fontWeight={700}
              fontSize={15}
              letterSpacing={4}
              fill="#d7c8ff"
              opacity={0.85}
              style={{ pointerEvents: "all", cursor: "pointer" }}
              onClick={() => show("Обливион", REGIONS.oblivion)}
            >
              ОБЛИВИОН · ПЛАНЫ ДАЭДРА
            </text>
          </svg>
        </div>
      </div>

      {/* Corner: Anu / Padomay / Sithis */}
      <button
        className="absolute top-20 left-4 w-36 h-36 opacity-70 hover:opacity-100 transition hidden md:block"
        onClick={() => show("Ану, Падомай и Сита", REGIONS.sithis)}
        title="Ану и Падомай"
      >
        <svg viewBox="0 0 140 140" className="w-full h-full">
          <ellipse cx="70" cy="70" rx="55" ry="34" fill="none" stroke="#cfd2ff" strokeWidth="1" />
          <circle cx="70" cy="70" r="24" fill="none" stroke="#cfd2ff" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx="70" cy="70" r="12" fill="none" stroke="#cfd2ff" strokeWidth="1" />
          <circle cx="70" cy="70" r="3" fill="#fff" />
          <line x1="20" y1="125" x2="120" y2="15" stroke="#cfd2ff" strokeWidth="1" />
          <circle cx="120" cy="15" r="4" fill="none" stroke="#fff" />
          <circle cx="20" cy="125" r="4" fill="none" stroke="#fff" />
          <text x="100" y="40" fill="#e7e8ff" fontSize="11" fontFamily="Cormorant Garamond" fontStyle="italic">Сита</text>
          <text x="20" y="100" fill="#e7e8ff" fontSize="11" fontFamily="Cormorant Garamond" fontStyle="italic">Ану</text>
          <text x="60" y="12" fill="#e7e8ff" fontSize="10" fontFamily="Cormorant Garamond" fontStyle="italic">Башня 1</text>
        </svg>
      </button>

      <div className="absolute bottom-4 left-4 max-w-xs text-sm text-[#c9cdf5]/80 italic hidden md:block">
        Нажимайте на планеты, принцев даэдра, созвездия и области, чтобы узнать их значение. Нажмите на <b className="text-white not-italic">Нирн</b>, чтобы перейти к карте мира.
      </div>

      <InfoPanel info={info} onClose={() => setInfo(null)} variant="cosmic" />
    </div>
  );
}
