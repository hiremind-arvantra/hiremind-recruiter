/* Visual building blocks for the match analysis screens. Presentation only. */

import type { Tone } from "./model";
import { AlertDot, CheckDot } from "./icons";

export type UiTone = Tone | "info";

/* Full class strings (no concatenation) so Tailwind can see every one of them. */
export const TONE = {
  success: {
    bar: "bg-success",
    text: "text-success",
    strong: "text-[#15803d]",
    pill: "bg-success/10 text-[#15803d] border-success/20",
    tile: "bg-success/6 border-success/10",
    icon: "bg-success/15 text-success",
    ring: "#16a34a",
  },
  brand: {
    bar: "bg-brand-600",
    text: "text-brand-600",
    strong: "text-brand-700",
    pill: "bg-brand-50 text-brand-700 border-brand-100",
    tile: "bg-brand-50/70 border-brand-100/60",
    icon: "bg-brand-100 text-brand-600",
    ring: "#5b34f0",
  },
  info: {
    bar: "bg-cobalt-500",
    text: "text-cobalt-500",
    strong: "text-cobalt-700",
    pill: "bg-cobalt-50 text-cobalt-700 border-cobalt-100",
    tile: "bg-cobalt-50/70 border-cobalt-100/60",
    icon: "bg-cobalt-100 text-cobalt-600",
    ring: "#3a56d6",
  },
  warn: {
    bar: "bg-warn",
    text: "text-warn",
    strong: "text-[#b45309]",
    pill: "bg-warn/10 text-[#b45309] border-warn/20",
    tile: "bg-warn/7 border-warn/10",
    icon: "bg-warn/15 text-warn",
    ring: "#e8872b",
  },
  danger: {
    bar: "bg-danger",
    text: "text-danger",
    strong: "text-[#c02b31]",
    pill: "bg-danger/10 text-[#c02b31] border-danger/20",
    tile: "bg-danger/6 border-danger/10",
    icon: "bg-danger/15 text-danger",
    ring: "#e5484d",
  },
  neutral: {
    bar: "bg-ink-300",
    text: "text-ink-500",
    strong: "text-ink-700",
    pill: "bg-ink-100 text-ink-600 border-ink-200",
    tile: "bg-ink-50 border-ink-100",
    icon: "bg-ink-100 text-ink-500",
    ring: "#9e9db4",
  },
} satisfies Record<UiTone, Record<string, string>>;

/** A circular gauge that fills clockwise from 12 o'clock. */
export function RingGauge({
  value,
  tone,
  size = 150,
  stroke = 12,
  label,
  children,
}: {
  value: number;
  tone: UiTone;
  size?: number;
  stroke?: number;
  label: string;
  children?: React.ReactNode;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className="relative shrink-0"
      style={{ width: size, height: size }}
    >
      <svg aria-hidden="true" width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#ececf5" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={TONE[tone].ring}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped / 100)}
          className="motion-safe:transition-[stroke-dashoffset] motion-safe:duration-700"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

/** A white card with an optional icon + title row. */
export function Panel({
  title,
  subtitle,
  icon,
  iconClass = "text-brand-600",
  action,
  children,
  className = "",
  id,
}: {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  iconClass?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const headingId = id ? `${id}-title` : undefined;
  return (
    <section aria-labelledby={headingId} className={`card p-5 sm:p-6 min-w-0 ${className}`}>
      {title && (
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-3 min-w-0">
            {icon && <span className={`mt-0.5 shrink-0 ${iconClass}`}>{icon}</span>}
            <div className="min-w-0">
              <h2 id={headingId} className="font-display text-title font-bold text-ink-900 leading-tight">
                {title}
              </h2>
              {subtitle && <p className="mt-1 text-body-sm text-ink-500 leading-snug">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

/** A soft tinted tile: icon, big value, label and caption. */
export function StatTile({
  icon,
  tone,
  value,
  label,
  caption,
  compact = false,
}: {
  icon: React.ReactNode;
  tone: UiTone;
  value: React.ReactNode;
  label: React.ReactNode;
  caption?: React.ReactNode;
  /** Tighter padding and a smaller icon, for tiles sharing a row with a gauge. */
  compact?: boolean;
}) {
  return (
    <div className={`rounded-2xl border flex items-start min-w-0 ${compact ? "p-3.5 gap-2.5" : "p-4 gap-3"} ${TONE[tone].tile}`}>
      <span
        aria-hidden="true"
        className={`grid place-items-center rounded-xl shrink-0 ${compact ? "w-9 h-9" : "w-11 h-11"} ${TONE[tone].icon}`}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <div className={`font-display font-extrabold text-ink-900 leading-none tabular ${compact ? "text-heading" : "text-heading-lg"}`}>
          {value}
        </div>
        <div className="mt-1.5 text-body-sm font-medium text-ink-800 leading-tight">{label}</div>
        {caption && <div className="mt-0.5 text-caption text-ink-500 leading-snug">{caption}</div>}
      </div>
    </div>
  );
}

/** Thin horizontal score bar. */
export function ScoreBar({
  value,
  tone,
  label,
  className = "",
}: {
  value: number;
  tone: UiTone;
  label?: string;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      role={label ? "meter" : undefined}
      aria-label={label}
      aria-valuenow={label ? clamped : undefined}
      aria-valuemin={label ? 0 : undefined}
      aria-valuemax={label ? 100 : undefined}
      aria-hidden={label ? undefined : true}
      className={`h-2 rounded-full bg-ink-100 overflow-hidden ${className}`}
    >
      <div
        className={`h-full rounded-full ${TONE[tone].bar} motion-safe:transition-[width] motion-safe:duration-500`}
        style={{ width: `${Math.max(clamped, clamped > 0 ? 3 : 0)}%` }}
      />
    </div>
  );
}

export function Pill({
  tone,
  children,
  size = "md",
  className = "",
}: {
  tone: UiTone;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizing =
    size === "sm"
      ? "px-2 py-0.5 text-micro"
      : size === "lg"
        ? "px-4 py-1.5 text-body-sm"
        : "px-3 py-1 text-caption";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-semibold whitespace-nowrap ${sizing} ${TONE[tone].pill} ${className}`}>
      {children}
    </span>
  );
}

/** Tick / alert bullet list used by strengths, gaps and takeaways. */
export function StatusList({
  items,
  empty,
  dense = false,
  clamp = false,
}: {
  items: { key: string; ok: boolean | "warn"; title: React.ReactNode; detail?: React.ReactNode }[];
  empty: string;
  dense?: boolean;
  /** Cap each line at two rows; the full text stays in the title tooltip. */
  clamp?: boolean;
}) {
  if (items.length === 0) return <p className="text-body-sm text-ink-500">{empty}</p>;
  return (
    <ul className={dense ? "space-y-2.5" : "space-y-3.5"}>
      {items.map((item) => (
        <li key={item.key} className="flex items-start gap-3 min-w-0">
          {item.ok === true ? (
            <CheckDot size={20} className="text-success shrink-0 mt-px" />
          ) : (
            <AlertDot size={20} className={`${item.ok === "warn" ? "text-warn" : "text-danger"} shrink-0 mt-px`} />
          )}
          <span className="sr-only">{item.ok === true ? "Strength: " : "Gap: "}</span>
          <div className="min-w-0 text-body-sm leading-snug">
            <div
              className={`${item.detail ? "font-semibold text-ink-900" : "text-ink-700"} ${clamp ? "line-clamp-2" : ""}`}
              title={clamp && typeof item.title === "string" ? item.title : undefined}
            >
              {item.title}
            </div>
            {item.detail && (
              <div className={`mt-0.5 text-ink-500 wrap-break-word ${clamp ? "line-clamp-3" : ""}`} title={clamp && typeof item.detail === "string" ? item.detail : undefined}>
                {item.detail}
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function initials(name: string | null | undefined): string {
  const parts = (name?.trim() || "?").split(/\s+/).filter(Boolean);
  return parts.map((part) => part[0]).slice(0, 2).join("").toUpperCase();
}

/** A table header cell in the mockups' small grey style. */
export const TH = "px-3 py-2.5 text-left text-caption font-medium text-ink-500 whitespace-nowrap";
export const TD = "px-3 py-2.5 text-body-sm text-ink-800 align-middle";
