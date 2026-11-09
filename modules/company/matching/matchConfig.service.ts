/* ─────────────────────────────────────────────────────────────────────────────
 * Matching configuration — the recruiter's category weights.
 *
 * Two levels: a company default (Settings → Matching Criteria) and an optional
 * per-job override (set during job creation / editing). A job with no override
 * scores with the company default.
 *
 * Storage goes through `MatchConfigStore`. The shipped implementation keeps the
 * configuration in browser storage; swapping in a server-backed store is a single
 * `setMatchConfigStore()` call once company_api exposes the endpoints (see
 * docs/candidate-matching.md for the proposed shape).
 * ───────────────────────────────────────────────────────────────────────────── */

import { getStoredJson, setStoredJson } from "@/lib/api/config";
import type { CategoryId, MatchWeights } from "./types";
import { CATEGORY_IDS, DEFAULT_WEIGHTS, isValidWeights } from "./weights";

const DEFAULTS_KEY = "hiremind_match_weights_default";
const jobKey = (jobId: string) => `hiremind_match_weights_job_${jobId}`;

export interface MatchConfigStore {
  loadDefaults(): Promise<MatchWeights | null>;
  saveDefaults(weights: MatchWeights): Promise<void>;
  loadForJob(jobId: string): Promise<MatchWeights | null>;
  saveForJob(jobId: string, weights: MatchWeights): Promise<void>;
}

/** Browser-storage store — no backend required. */
export const browserMatchConfigStore: MatchConfigStore = {
  async loadDefaults() {
    return sanitize(getStoredJson<Partial<MatchWeights>>(DEFAULTS_KEY));
  },
  async saveDefaults(weights) {
    setStoredJson(DEFAULTS_KEY, weights);
  },
  async loadForJob(jobId) {
    if (!jobId) return null;
    return sanitize(getStoredJson<Partial<MatchWeights>>(jobKey(jobId)));
  },
  async saveForJob(jobId, weights) {
    if (!jobId) return;
    setStoredJson(jobKey(jobId), weights);
  },
};

let store: MatchConfigStore = browserMatchConfigStore;

/** Point the configuration at a different store (e.g. a REST-backed one). */
export function setMatchConfigStore(next: MatchConfigStore): void {
  store = next;
}

/** The company-wide default weights, falling back to the product defaults. */
export async function loadDefaultWeights(): Promise<MatchWeights> {
  try {
    return (await store.loadDefaults()) ?? { ...DEFAULT_WEIGHTS };
  } catch {
    return { ...DEFAULT_WEIGHTS };
  }
}

export async function saveDefaultWeights(weights: MatchWeights): Promise<void> {
  await store.saveDefaults(weights);
}

export interface ResolvedWeights {
  weights: MatchWeights;
  /** "job" when this job overrides the company default. */
  source: "job" | "default";
}

/** Weights to score a given job with: its own override, else the company default. */
export async function loadJobWeights(jobId: string): Promise<ResolvedWeights> {
  try {
    const forJob = await store.loadForJob(jobId);
    if (forJob) return { weights: forJob, source: "job" };
  } catch {
    /* fall through to the default */
  }
  return { weights: await loadDefaultWeights(), source: "default" };
}

export async function saveJobWeights(jobId: string, weights: MatchWeights): Promise<void> {
  await store.saveForJob(jobId, weights);
}

/** Fills in any missing category and drops unknown keys, so stored data can't break scoring. */
function sanitize(value: Partial<MatchWeights> | null): MatchWeights | null {
  if (!value || typeof value !== "object") return null;
  const weights = {} as MatchWeights;
  let present = 0;
  for (const id of CATEGORY_IDS) {
    const raw = Number((value as Record<CategoryId, unknown>)[id]);
    if (Number.isFinite(raw) && raw >= 0) {
      weights[id] = Math.round(raw);
      present += 1;
    } else {
      weights[id] = DEFAULT_WEIGHTS[id];
    }
  }
  if (present === 0) return null;
  return isValidWeights(weights) ? weights : weights;
}
