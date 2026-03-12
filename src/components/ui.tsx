import React, { useState } from "react";

export const UI = {
  box: { border: "1px solid var(--border)", borderRadius: 16, padding: 12, background: "var(--surface)", boxShadow: "var(--shadow-card)" },
  btn: { padding: "8px 10px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontWeight: 600 }
} as const;

export const Card = ({ t, r, c }: { t: string; r?: React.ReactNode; c: React.ReactNode }) => (
  <div style={UI.box} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="text-[0.95rem] font-extrabold tracking-tight text-[var(--section-title)]">{t}</div>
      {r || null}
    </div>
    <div className="mt-2.5">{c}</div>
  </div>
);

export const Field = ({ l, children }: { l: React.ReactNode; children: React.ReactNode }) => (
  <label className="block">
    <div className="mb-1 text-xs font-medium text-[var(--text-muted)]">{l}</div>
    {children}
  </label>
);

export const InfoTip = ({ text }: { text: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <span
      style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span
        tabIndex={0}
        aria-label="Info"
        style={{
          width: 16,
          height: 16,
          borderRadius: "50%",
          border: "1px solid #cbd5e1",
          color: "#64748b",
          fontSize: 11,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "help",
          marginLeft: 6,
          userSelect: "none"
        }}
      >
        i
      </span>
      {open ? (
        <span
          style={{
            position: "absolute",
            top: "120%",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#0f172a",
            color: "#fff",
            fontSize: 12,
            padding: "6px 8px",
            borderRadius: 8,
            whiteSpace: "normal",
            zIndex: 1000,
            boxShadow: "0 8px 20px rgba(15, 23, 42, 0.25)",
            width: 450,
            maxWidth: "90vw"
          }}
        >
          {text.split("\n").map((line, i, arr) => (
            <div
              key={i}
              style={{
                marginBottom: i === arr.length - 1 ? 0 : 4,
                lineHeight: 1.3
              }}
            >
              {line.includes(":") ? (
                <>
                  <b>{line.split(":")[0]}:</b>
                  {line.slice(line.indexOf(":") + 1)}
                </>
              ) : (
                line
              )}
            </div>
          ))}
        </span>
      ) : null}
    </span>
  );
};

export const Btn = ({ on, children, active }: { on: () => void; children: React.ReactNode; active?: boolean }) => {
  const [h, setH] = useState(false);
  const onv = active || h;
  return (
    <button
      onClick={on}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      className="rounded-xl border px-2.5 py-2 text-sm font-semibold tracking-tight"
      style={{
        ...UI.btn,
        cursor: "pointer",
        background: onv ? "var(--accent)" : "var(--surface)",
        color: onv ? "var(--accent-contrast)" : "var(--text)",
        borderColor: onv ? "var(--accent)" : "var(--border)",
        boxShadow: onv ? "0 7px 18px rgba(39, 59, 110, 0.24)" : "none"
      }}
    >
      {children}
    </button>
  );
};

export const Sel = ({ v, set, children }: { v: any; set: (x: any) => void; children: React.ReactNode }) => (
  <select className="control-input w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2.5 py-2 text-sm text-[var(--text)]" value={v} onChange={(e) => set(e.target.value)}>
    {children}
  </select>
);

export const Num = ({ v, set, step = 1, min, disabled = false }: { v: any; set: (x: number) => void; step?: number; min?: number; disabled?: boolean }) => (
  <input
    className="control-input w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2.5 py-2 text-sm text-[var(--text)]"
    type="number"
    value={Number.isFinite(v) ? v : 0}
    step={step}
    min={min}
    disabled={disabled}
    onChange={(e) => set(Number(e.target.value))}
  />
);
