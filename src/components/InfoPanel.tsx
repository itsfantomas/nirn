export interface InfoData {
  title: string;
  subtitle?: string;
  body: string;
  facts?: [string, string][];
  color?: string;
  action?: { label: string; onClick: () => void };
}

export default function InfoPanel({
  info,
  onClose,
  variant = "paper",
}: {
  info: InfoData | null;
  onClose: () => void;
  variant?: "paper" | "cosmic";
}) {
  if (!info) return null;
  const cosmic = variant === "cosmic";
  return (
    <div
      key={info.title}
      className={
        "view-enter absolute z-20 top-20 right-4 w-[340px] max-w-[calc(100%-2rem)] max-h-[calc(100%-7rem)] overflow-y-auto scroll-thin rounded-xl shadow-2xl " +
        (cosmic
          ? "bg-[#0d0b1d]/90 backdrop-blur border border-[#7f8cff]/40 text-[#e3e6ff]"
          : "paper-bg border-2 border-[#6b4a22]/70 text-[#2b1d0c]")
      }
    >
      <div className="p-5">
        <button
          onClick={onClose}
          className={
            "absolute top-3 right-3 w-7 h-7 rounded-full text-sm " +
            (cosmic ? "bg-white/10 hover:bg-white/20" : "bg-[#3a2814]/10 hover:bg-[#3a2814]/25")
          }
          aria-label="Закрыть"
        >
          ✕
        </button>
        <div className="flex items-center gap-3 pr-8">
          {info.color && (
            <span
              className="w-5 h-5 rounded-full shrink-0 border"
              style={{ background: info.color, boxShadow: cosmic ? `0 0 14px ${info.color}` : undefined, borderColor: cosmic ? "#fff6" : "#3a281499" }}
            />
          )}
          <h2 className="font-title font-bold text-2xl leading-tight">{info.title}</h2>
        </div>
        {info.subtitle && (
          <div className={"italic text-sm mt-1 " + (cosmic ? "text-[#a9b1ff]" : "text-[#6b4a22]")}>{info.subtitle}</div>
        )}
        <div className={"my-3 h-px " + (cosmic ? "bg-gradient-to-r from-transparent via-[#9aa4ff]/60 to-transparent" : "bg-[#6b4a22]/40")} />
        <p className="text-[17px] leading-snug whitespace-pre-line">{info.body}</p>
        {info.facts && info.facts.length > 0 && (
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[15px]">
            {info.facts.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className={"font-bold " + (cosmic ? "text-[#b8bfff]" : "text-[#5a3c18]")}>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        )}
        {info.action && (
          <button
            onClick={info.action.onClick}
            className={
              "mt-4 w-full py-2 rounded-lg font-title font-bold text-lg tracking-wide transition " +
              (cosmic
                ? "bg-gradient-to-r from-[#3b4bd8] to-[#7b3bd8] hover:brightness-125 text-white shadow-[0_0_20px_#5a6bff80]"
                : "bg-[#6b2a17] hover:bg-[#8a3820] text-[#f6e7c4] shadow-md")
            }
          >
            {info.action.label}
          </button>
        )}
      </div>
    </div>
  );
}
