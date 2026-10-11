import { useState } from "react";
import Cosmology from "./components/Cosmology";
import NirnMap from "./components/NirnMap";
import TamrielMap from "./components/TamrielMap";
import SkyrimMap from "./components/SkyrimMap";

type View = "cosmos" | "nirn" | "tamriel" | "skyrim";

const LEVELS: { id: View; name: string; icon: string }[] = [
  { id: "cosmos", name: "Космология", icon: "✦" },
  { id: "nirn", name: "Нирн", icon: "◍" },
  { id: "tamriel", name: "Тамриэль", icon: "⛰" },
  { id: "skyrim", name: "Скайрим", icon: "❄" },
];

export default function App() {
  const [view, setViewRaw] = useState<View>("cosmos");
  const [maxIdx, setMaxIdx] = useState(0);
  const idx = LEVELS.findIndex((l) => l.id === view);
  const setView = (v: View) => {
    setViewRaw(v);
    setMaxIdx((m) => Math.max(m, LEVELS.findIndex((l) => l.id === v)));
  };
  const cosmic = view === "cosmos";

  return (
    <div className="relative w-full h-full overflow-hidden">
      <header
        className={
          "absolute top-0 left-0 right-0 z-30 h-16 flex items-center gap-4 px-4 " +
          (cosmic
            ? "bg-gradient-to-b from-[#05040b] to-transparent text-[#e6e8ff]"
            : "bg-gradient-to-b from-[#1e140a] via-[#2a1c0e]/90 to-transparent text-[#f2e2bb]")
        }
      >
        <div className="shrink-0 leading-none">
          <div className="text-[10px] tracking-[0.35em] uppercase opacity-70">The Elder Scrolls</div>
          <div className="font-title font-bold text-2xl tracking-wider">Атлас Нирна</div>
        </div>
        <nav className="flex items-center gap-1 overflow-x-auto">
          {LEVELS.map((l, i) => {
            const reachable = i <= maxIdx;
            const active = i === idx;
            return (
              <div key={l.id} className="flex items-center gap-1 shrink-0">
                {i > 0 && <span className="opacity-40 px-0.5">›</span>}
                <button
                  disabled={!reachable}
                  onClick={() => setView(l.id)}
                  className={
                    "px-3 py-1 rounded-full text-[15px] font-bold transition flex items-center gap-1.5 " +
                    (active
                      ? cosmic
                        ? "bg-[#5a6bff]/30 border border-[#9aa4ff]/60"
                        : "bg-[#b08a4a]/30 border border-[#e0c080]/60"
                      : reachable
                        ? "hover:bg-white/10 border border-transparent"
                        : "opacity-30 border border-transparent cursor-not-allowed")
                  }
                >
                  <span className="text-sm">{l.icon}</span>
                  {l.name}
                </button>
              </div>
            );
          })}
        </nav>
        {idx > 0 && (
          <button
            onClick={() => setView(LEVELS[idx - 1].id)}
            className="ml-auto shrink-0 px-3 py-1 rounded-md border border-current/40 text-sm hover:bg-white/10 hidden sm:block"
          >
            ← Назад
          </button>
        )}
      </header>

      <main key={view} className="view-enter absolute inset-0">
        {view === "cosmos" && <Cosmology onEnterNirn={() => setView("nirn")} />}
        {view === "nirn" && <NirnMap onOpenTamriel={() => setView("tamriel")} />}
        {view === "tamriel" && <TamrielMap onOpenSkyrim={() => setView("skyrim")} />}
        {view === "skyrim" && <SkyrimMap />}
      </main>
    </div>
  );
}
