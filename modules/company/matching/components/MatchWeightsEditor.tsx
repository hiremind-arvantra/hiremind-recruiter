"use client";

import { useId } from "react";
import {
  CATEGORY_DEFINITIONS,
  DEFAULT_WEIGHTS,
  importanceLabel,
  isValidWeights,
  totalWeight,
  rebalanceWeights,
  type CategoryId,
  type MatchWeights,
} from "@/modules/company/matching";

/* ─────────────────────────────────────────────────────────────────────────────
 * The one editor for the ten matching category weights.
 *
 * Used by Settings → Matching Criteria (company defaults), the Settings
 * "Matching" tab, and the per-job sections in the job wizard / Edit Job.
 *
 * Every change goes through `rebalanceWeights()`, so the configuration is always
 * exactly 100 and a recruiter can never save a set that would distort scoring.
 * Presentation only — the caller owns the value and decides where it is stored.
 * ───────────────────────────────────────────────────────────────────────────── */

export interface MatchWeightsEditorProps {
  value: MatchWeights;
  onChange: (next: MatchWeights) => void;
  /** "full" — descriptions and generous rows. "compact" — dense rows for the job forms. */
  variant?: "full" | "compact";
  disabled?: boolean;
  /** Overrides the built-in "Reset to default" behaviour (which restores DEFAULT_WEIGHTS). */
  onReset?: () => void;
}

const IMPORTANCE_BADGE: Record<ReturnType<typeof importanceLabel>, string> = {
  Critical: "badge-brand",
  High: "badge-cobalt",
  Medium: "badge-neutral",
  Low: "badge-neutral",
};

export function MatchWeightsEditor({
  value,
  onChange,
  variant = "full",
  disabled = false,
  onReset,
}: MatchWeightsEditorProps) {
  const uid = useId();
  const compact = variant === "compact";
  const total = Math.round(totalWeight(value));
  const valid = isValidWeights(value);

  const setWeight = (id: CategoryId, next: number) => {
    if (disabled || !Number.isFinite(next)) return;
    onChange(rebalanceWeights(value, id, next));
  };

  const reset = () => {
    if (disabled) return;
    if (onReset) onReset();
    else onChange({ ...DEFAULT_WEIGHTS });
  };

  return (
    <div className="min-w-0">
      {/* Live total — the one number that has to stay right. */}
      <div
        className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 rounded-2xl border ${
          valid ? "surface-muted" : "alert alert-danger"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            aria-hidden="true"
            className={`icon-tile icon-tile-sm ${valid ? "bg-brand-50 text-brand-600" : "bg-danger/10 text-danger"}`}
          >
            {valid ? <BalanceIcon /> : <AlertIcon />}
          </span>
          <div className="min-w-0">
            <p className="text-body-sm font-semibold text-ink-800">Total weight</p>
            <p aria-live="polite" className={`text-caption ${valid ? "text-ink-500" : "text-danger"}`}>
              {valid
                ? `${total}% allocated across ${CATEGORY_DEFINITIONS.length} categories`
                : `${total}% allocated — weights must total exactly 100% before saving`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`font-display font-extrabold tabular ${compact ? "text-title-sm" : "text-heading"} ${
              valid ? "text-ink-900" : "text-danger"
            }`}
          >
            {total}%
          </span>
          <button type="button" onClick={reset} disabled={disabled} className="btn btn-ghost btn-sm">
            <ResetIcon /> Reset to default
          </button>
        </div>
      </div>

      <ul className={`mt-1 divide-y divide-ink-100 ${compact ? "" : "mt-2"}`}>
        {CATEGORY_DEFINITIONS.map((category) => {
          const weight = Math.round(Number(value[category.id]) || 0);
          const importance = importanceLabel(weight);
          const rangeId = `${uid}-${category.id}-range`;
          const numberId = `${uid}-${category.id}-number`;
          return (
            <li
              key={category.id}
              className={`grid gap-x-5 gap-y-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,300px)] ${
                compact ? "py-2.5 sm:items-center" : "py-4 sm:items-start"
              }`}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <label
                    htmlFor={rangeId}
                    className={`font-semibold text-ink-900 ${compact ? "text-body-sm" : "text-body"}`}
                  >
                    {category.label}
                  </label>
                  <span className={`badge ${IMPORTANCE_BADGE[importance]}`}>{importance}</span>
                </div>
                {!compact && <p className="mt-1 text-caption text-ink-500 max-w-[68ch]">{category.description}</p>}
              </div>

              <div className="flex items-center gap-3 min-w-0">
                <input
                  id={rangeId}
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={weight}
                  disabled={disabled}
                  aria-valuetext={`${weight} percent — ${importance} importance`}
                  onChange={(event) => setWeight(category.id, Number(event.target.value))}
                  className="flex-1 min-w-0 h-5 accent-brand-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                />
                <div className="flex items-center gap-1 shrink-0">
                  <label htmlFor={numberId} className="sr-only">
                    {category.label} weight percentage
                  </label>
                  <input
                    id={numberId}
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={weight}
                    disabled={disabled}
                    onChange={(event) => setWeight(category.id, Number(event.target.value))}
                    className={`field-input tabular text-center px-1.5 w-16 ${compact ? "h-9" : "h-10"}`}
                  />
                  <span aria-hidden="true" className="text-body-sm text-ink-500">
                    %
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <p className={`text-caption text-ink-500 ${compact ? "mt-3" : "mt-4"}`}>
        Raising one category lowers the others proportionally, so the total always stays at 100%.
      </p>
    </div>
  );
}

export default MatchWeightsEditor;

/* ── Icons ────────────────────────────────────────────────────────────── */
function BalanceIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M12 4v16M5 8h14M7 20h10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M5 8l-2.5 5a2.5 2.5 0 0 0 5 0zM19 8l-2.5 5a2.5 2.5 0 0 0 5 0z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
function AlertIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7.5v5.5M12 16.5h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function ResetIcon() {
  return (
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M4 12a8 8 0 1 0 2.5-5.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 4v4h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
