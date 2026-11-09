/* Formatting helpers shared across the company/jobs pages. */

/** ISO date → "10 Jun 2026"; null / invalid → "—". */
export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

/** annualCtc (e.g. 1800000) → "₹ 18 LPA"; falls back to "—" when unset. */
export function formatSalary(annualCtc: number | null, currency: string | null): string {
  if (annualCtc == null) return "—";
  const symbol = currency?.includes("$") ? "$" : currency?.includes("€") ? "€" : "₹";
  if (annualCtc >= 100000) {
    const lpa = annualCtc / 100000;
    return `${symbol} ${Number.isInteger(lpa) ? lpa : lpa.toFixed(1)} LPA`;
  }
  return `${symbol} ${annualCtc.toLocaleString("en-IN")}`;
}

/** "5 – 8 yrs" / "5 yrs" / "—" from the job's experience range. */
export function formatExperience(min: number | null, max: number | null): string {
  if (min == null && max == null) return "—";
  if (min != null && max != null) return `${min} – ${max} yrs`;
  return `${min ?? max} yrs`;
}
