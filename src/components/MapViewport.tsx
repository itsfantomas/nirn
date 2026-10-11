import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

interface Props {
  width: number;
  height: number;
  minZoom?: number;
  maxZoom?: number;
  background?: ReactNode;
  defs?: ReactNode;
  children: (k: number) => ReactNode;
  className?: string;
}

interface View {
  x: number;
  y: number;
  k: number;
}

export default function MapViewport({ width, height, minZoom = 1, maxZoom = 8, defs, children, className }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [view, setView] = useState<View>({ x: 0, y: 0, k: 1 });
  const drag = useRef<{ sx: number; sy: number; vx: number; vy: number; moved: boolean; id: number } | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ d: number; k: number } | null>(null);
  const suppressClick = useRef(false);

  const clamp = useCallback(
    (v: View): View => {
      const k = Math.min(maxZoom, Math.max(minZoom, v.k));
      const minX = width - width * k;
      const minY = height - height * k;
      return { k, x: Math.min(0, Math.max(minX, v.x)), y: Math.min(0, Math.max(minY, v.y)) };
    },
    [width, height, minZoom, maxZoom],
  );

  const toSvg = (clientX: number, clientY: number) => {
    const svg = svgRef.current!;
    const r = svg.getBoundingClientRect();
    const scale = Math.max(width / r.width, height / r.height);
    const ox = (r.width * scale - width) / 2;
    const oy = (r.height * scale - height) / 2;
    return { x: (clientX - r.left) * scale - ox, y: (clientY - r.top) * scale - oy, scale };
  };

  const zoomAt = useCallback(
    (px: number, py: number, factor: number) => {
      setView((v) => {
        const k = Math.min(maxZoom, Math.max(minZoom, v.k * factor));
        const f = k / v.k;
        return clamp({ k, x: px - (px - v.x) * f, y: py - (py - v.y) * f });
      });
    },
    [clamp, minZoom, maxZoom],
  );

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const p = toSvg(e.clientX, e.clientY);
      zoomAt(p.x, p.y, e.deltaY < 0 ? 1.18 : 1 / 1.18);
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoomAt]);

  const onPointerDown = (e: React.PointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { d: Math.hypot(a.x - b.x, a.y - b.y), k: view.k };
      drag.current = null;
      return;
    }
    drag.current = { sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y, moved: false, id: e.pointerId };
    suppressClick.current = false;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch.current && pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const c = toSvg((a.x + b.x) / 2, (a.y + b.y) / 2);
      const target = pinch.current.k * (d / pinch.current.d);
      setView((v) => {
        const k = Math.min(maxZoom, Math.max(minZoom, target));
        const f = k / v.k;
        return clamp({ k, x: c.x - (c.x - v.x) * f, y: c.y - (c.y - v.y) * f });
      });
      suppressClick.current = true;
      return;
    }
    const dr = drag.current;
    if (!dr) return;
    const dx = e.clientX - dr.sx;
    const dy = e.clientY - dr.sy;
    if (!dr.moved && Math.hypot(dx, dy) > 5) {
      dr.moved = true;
      suppressClick.current = true;
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    }
    if (dr.moved) {
      const { scale } = toSvg(e.clientX, e.clientY);
      setView((v) => clamp({ ...v, x: dr.vx + dx * scale, y: dr.vy + dy * scale }));
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    drag.current = null;
  };

  const btn =
    "w-9 h-9 rounded-md bg-[#2a1d10]/85 border border-[#b08a4a]/60 text-[#f0dcae] text-lg leading-none hover:bg-[#4a3218] transition shadow-lg";

  return (
    <div className={"relative w-full h-full " + (className ?? "")}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="map-svg w-full h-full touch-none select-none"
        style={{ cursor: drag.current?.moved ? "grabbing" : "grab" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={(e) => {
          if (suppressClick.current) {
            e.stopPropagation();
            e.preventDefault();
            suppressClick.current = false;
          }
        }}
      >
        {defs && <defs>{defs}</defs>}
        <g transform={`translate(${view.x},${view.y}) scale(${view.k})`}>{children(view.k)}</g>
      </svg>
      <div className="absolute right-4 bottom-4 flex flex-col gap-2 z-10">
        <button className={btn} onClick={() => zoomAt(width / 2, height / 2, 1.4)} title="Приблизить">
          +
        </button>
        <button className={btn} onClick={() => zoomAt(width / 2, height / 2, 1 / 1.4)} title="Отдалить">
          −
        </button>
        <button className={btn + " text-sm"} onClick={() => setView({ x: 0, y: 0, k: 1 })} title="Сбросить">
          ⟲
        </button>
      </div>
      <div className="absolute left-4 bottom-4 text-[11px] font-hand text-[#3b2a14]/80 bg-[#e8d9b5]/70 rounded px-2 py-1 z-10 pointer-events-none">
        Масштаб ×{view.k.toFixed(1)} · колесо — зум, перетаскивание — сдвиг
      </div>
    </div>
  );
}
