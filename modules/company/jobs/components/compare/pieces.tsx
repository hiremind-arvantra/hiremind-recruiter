import { GRID } from "./data";

/* Layout primitives for the comparison grid. */

export function CompareRow({
  label,
  sub,
  icon,
  last,
  children,
}: {
  label: string;
  sub?: string;
  icon: React.ReactNode;
  last?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`${GRID} ${last ? "" : "border-b border-ink-100"}`}>
      <div className="px-5 py-4 flex items-start gap-2.5">
        <span className="text-brand-600 mt-0.5">{icon}</span>
        <div>
          <div className="font-display font-bold text-[0.8125rem] text-ink-900">{label}</div>
          {sub && <div className="text-[0.6875rem] text-ink-400">{sub}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}

export function Cell({ children }: { children: React.ReactNode }) {
  return <div className="px-4 py-4 border-l border-ink-100">{children}</div>;
}

export function ExpLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-ink-500">{label}</span>
      <span className="font-semibold text-ink-800 text-right">{value}</span>
    </div>
  );
}

export function Ring({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="relative w-12 h-12 shrink-0">
      <div
        className="w-full h-full rounded-full"
        style={{ background: `conic-gradient(${color} ${pct}%, #e5e7eb ${pct}%)` }}
      />
      <div className="absolute inset-[5px] rounded-full bg-white" />
    </div>
  );
}

export function QuickAction({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <li>
      <button className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-[0.8125rem] text-ink-700 hover:bg-ink-100 transition-colors text-left">
        <span className="text-brand-600">{icon}</span>
        <span className="flex-1">{label}</span>
      </button>
    </li>
  );
}

export function Dot({ color }: { color: string }) {
  return <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />;
}
