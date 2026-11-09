/* Turns a 0–1 similarity into an explainable classification, and estimates how much
 * the available evidence supports it. Never boolean. */

import type { MatchClass } from "./taxonomy";

/** Score bands, per the matching specification. */
export const CLASS_BANDS: { matchClass: MatchClass; min: number; label: string }[] = [
  { matchClass: "EXACT", min: 0.97, label: "Exact" },
  { matchClass: "STRONG_SEMANTIC", min: 0.85, label: "Strong" },
  { matchClass: "RELATED", min: 0.65, label: "Related" },
  { matchClass: "PARTIAL", min: 0.4, label: "Partial" },
  { matchClass: "WEAK", min: 0.15, label: "Weak" },
  { matchClass: "NO_EVIDENCE", min: 0, label: "No evidence" },
];

export function classify(score: number): MatchClass {
  if (!Number.isFinite(score) || score <= 0.05) return "NO_EVIDENCE";
  for (const band of CLASS_BANDS) {
    if (score >= band.min) return band.matchClass;
  }
  return "NO_EVIDENCE";
}

export const CLASS_LABEL: Record<MatchClass, string> = {
  EXACT: "Exact",
  STRONG_SEMANTIC: "Strong",
  RELATED: "Related",
  PARTIAL: "Partial",
  WEAK: "Weak",
  NO_EVIDENCE: "No evidence",
};

/** Badge tone for the UI — mapped to the design system's badge variants. */
export const CLASS_TONE: Record<MatchClass, "success" | "brand" | "info" | "warn" | "neutral"> = {
  EXACT: "success",
  STRONG_SEMANTIC: "success",
  RELATED: "brand",
  PARTIAL: "warn",
  WEAK: "warn",
  NO_EVIDENCE: "neutral",
};

/**
 * Confidence reflects the *quality of the evidence*, not the size of the score.
 *
 * - decisiveness: scores sitting on a band edge are less certain than clear ones
 * - evidenceCount: more corroborating items → more confidence
 * - dataQuality:  how complete the candidate profile was overall
 */
export function estimateConfidence(options: {
  score: number;
  evidenceCount: number;
  dataQuality: number;
  /** True when the requirement itself was explicit in the JD rather than inferred. */
  explicitRequirement?: boolean;
}): number {
  const { score, evidenceCount, dataQuality, explicitRequirement = true } = options;
  if (score <= 0.05) {
    // "Nothing found" is itself a confident statement only when the profile is rich.
    return clamp(0.35 + dataQuality * 0.35);
  }
  const nearestEdge = CLASS_BANDS.map((band) => Math.abs(score - band.min)).reduce((a, b) => Math.min(a, b), 1);
  const decisiveness = clamp(0.55 + Math.min(nearestEdge, 0.15) / 0.15 * 0.3);
  const corroboration = clamp(0.6 + Math.min(evidenceCount, 4) * 0.1);
  const explicitness = explicitRequirement ? 1 : 0.88;
  return clamp(decisiveness * 0.45 + corroboration * 0.25 + dataQuality * 0.3) * explicitness;
}

export function clamp(value: number, min = 0, max = 1): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function toPercent(value: number): number {
  return Math.round(clamp(value) * 100);
}
