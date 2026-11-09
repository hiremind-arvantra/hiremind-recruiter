/* The recruiter-configurable scoring weights. Defaults come from the product spec;
 * nothing downstream assumes them — the engine always reads the supplied config. */

import type { CategoryId, MatchWeights } from "./types";

export interface CategoryDefinition {
  id: CategoryId;
  label: string;
  /** Recruiter-facing explanation shown on the configuration screens. */
  description: string;
  defaultWeight: number;
}

export const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  {
    id: "responsibilities",
    label: "Role & Responsibilities",
    description: "How much of the day-to-day work described in the job has the candidate actually done.",
    defaultWeight: 20,
  },
  {
    id: "experience",
    label: "Relevant Experience",
    description: "Years of experience in comparable work, not just total time in the industry.",
    defaultWeight: 15,
  },
  {
    id: "skills",
    label: "Technical / Functional Skills",
    description: "Evidence for the tools, technologies and functional skills the job asks for.",
    defaultWeight: 15,
  },
  {
    id: "qualifications",
    label: "Qualification & Certification",
    description: "Degree level, field of study and any certifications named in the job.",
    defaultWeight: 10,
  },
  {
    id: "industry",
    label: "Industry / Domain Experience",
    description: "Experience in the same or an adjacent domain to the one you are hiring for.",
    defaultWeight: 10,
  },
  {
    id: "achievements",
    label: "Achievement & Business Impact",
    description: "Measurable outcomes in the résumé — delivery, growth, savings, scale.",
    defaultWeight: 8,
  },
  {
    id: "leadership",
    label: "Leadership & Stakeholder Experience",
    description: "Leading people, owning outcomes and working with clients or stakeholders.",
    defaultWeight: 7,
  },
  {
    id: "career",
    label: "Career Progression & Role Alignment",
    description: "Whether the candidate's title, seniority and trajectory line up with this role.",
    defaultWeight: 5,
  },
  {
    id: "location",
    label: "Location / Work Mode / Availability",
    description: "Location, work mode and notice period against what the job needs.",
    defaultWeight: 5,
  },
  {
    id: "professional",
    label: "Professional Evidence",
    description: "Observable ways of working: mentoring, collaboration, ownership, communication.",
    defaultWeight: 5,
  },
];

export const CATEGORY_IDS: CategoryId[] = CATEGORY_DEFINITIONS.map((category) => category.id);

export const DEFAULT_WEIGHTS: MatchWeights = CATEGORY_DEFINITIONS.reduce((weights, category) => {
  weights[category.id] = category.defaultWeight;
  return weights;
}, {} as MatchWeights);

export function categoryDefinition(id: CategoryId): CategoryDefinition {
  return CATEGORY_DEFINITIONS.find((category) => category.id === id) ?? CATEGORY_DEFINITIONS[0];
}

export function totalWeight(weights: MatchWeights): number {
  return CATEGORY_IDS.reduce((sum, id) => sum + (Number(weights[id]) || 0), 0);
}

/** Valid when every weight is a non-negative integer and the total is exactly 100. */
export function isValidWeights(weights: MatchWeights): boolean {
  return (
    CATEGORY_IDS.every((id) => Number.isFinite(weights[id]) && weights[id] >= 0) &&
    Math.round(totalWeight(weights)) === 100
  );
}

/** Scales any configuration to 100 so scoring stays meaningful while the recruiter edits. */
export function normalizeWeights(weights: MatchWeights): MatchWeights {
  const total = totalWeight(weights);
  if (total <= 0) return { ...DEFAULT_WEIGHTS };
  const scaled = {} as MatchWeights;
  for (const id of CATEGORY_IDS) scaled[id] = ((Number(weights[id]) || 0) / total) * 100;
  return scaled;
}

/**
 * Sets one category and spreads the difference across the others in proportion to
 * their current values, so the total stays at 100 without the recruiter doing sums.
 * Categories already at 0 stay at 0 unless there is nowhere else to take from.
 */
export function rebalanceWeights(weights: MatchWeights, changed: CategoryId, nextValue: number): MatchWeights {
  const target = Math.max(0, Math.min(100, Math.round(nextValue)));
  const others = CATEGORY_IDS.filter((id) => id !== changed);
  const remaining = 100 - target;
  const othersTotal = others.reduce((sum, id) => sum + (Number(weights[id]) || 0), 0);

  const next = { ...weights, [changed]: target } as MatchWeights;
  if (othersTotal <= 0) {
    // Everything else was zero — spread the remainder evenly.
    const each = Math.floor(remaining / others.length);
    others.forEach((id, index) => {
      next[id] = each + (index < remaining - each * others.length ? 1 : 0);
    });
    return next;
  }

  /* Largest-remainder allocation: floor every share, then hand the leftover points to
     the largest fractional parts. Settling the drift on one category instead would
     drain the same (usually smallest) category on every repeated adjustment. */
  const exact = others.map((id) => ({
    id,
    value: (remaining * (Number(weights[id]) || 0)) / othersTotal,
  }));
  let allocated = 0;
  for (const share of exact) {
    next[share.id] = Math.floor(share.value);
    allocated += next[share.id];
  }
  const leftover = remaining - allocated;
  const byRemainder = [...exact].sort(
    (a, b) => (b.value - Math.floor(b.value)) - (a.value - Math.floor(a.value)),
  );
  for (let i = 0; i < leftover; i++) {
    const share = byRemainder[i % byRemainder.length];
    next[share.id] += 1;
  }
  return next;
}

/** Recruiter-facing importance label for a weight. */
export function importanceLabel(weight: number): "Critical" | "High" | "Medium" | "Low" {
  if (weight >= 18) return "Critical";
  if (weight >= 12) return "High";
  if (weight >= 6) return "Medium";
  return "Low";
}
