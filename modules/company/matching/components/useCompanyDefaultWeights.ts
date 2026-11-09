"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CATEGORY_DEFINITIONS,
  DEFAULT_WEIGHTS,
  isValidWeights,
  loadDefaultWeights,
  saveDefaultWeights,
  type MatchWeights,
} from "@/modules/company/matching";

export type WeightsSaveState = "idle" | "saving" | "saved" | "error";

/** True when two configurations allocate the same weight to every category. */
export function sameWeights(a: MatchWeights, b: MatchWeights): boolean {
  return CATEGORY_DEFINITIONS.every((category) => Math.round(a[category.id]) === Math.round(b[category.id]));
}

/**
 * Loads, edits and saves the company-wide default weights.
 *
 * Shared by the Matching Criteria page and the Settings → Matching tab so both
 * surfaces read and write exactly the same configuration.
 */
export function useCompanyDefaultWeights() {
  const [weights, setWeightsState] = useState<MatchWeights>({ ...DEFAULT_WEIGHTS });
  const [baseline, setBaseline] = useState<MatchWeights>({ ...DEFAULT_WEIGHTS });
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<WeightsSaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return; // guard React StrictMode double-invoke
    loadedRef.current = true;
    loadDefaultWeights()
      .then((stored) => {
        setWeightsState(stored);
        setBaseline(stored);
      })
      .catch(() => {
        /* falls back to the product defaults already in state */
      })
      .finally(() => setLoading(false));
  }, []);

  const setWeights = useCallback((next: MatchWeights) => {
    setWeightsState(next);
    setSaveState("idle");
    setError(null);
  }, []);

  const reset = useCallback(() => setWeights({ ...DEFAULT_WEIGHTS }), [setWeights]);

  const save = useCallback(async () => {
    if (!isValidWeights(weights)) {
      setSaveState("error");
      setError("Weights must total exactly 100% before they can be saved.");
      return;
    }
    setSaveState("saving");
    setError(null);
    try {
      await saveDefaultWeights(weights);
      setBaseline(weights);
      setSaveState("saved");
    } catch (err) {
      setSaveState("error");
      setError(err instanceof Error ? err.message : "Failed to save the matching criteria.");
    }
  }, [weights]);

  const valid = isValidWeights(weights);
  const dirty = !sameWeights(weights, baseline);

  return { weights, setWeights, loading, saveState, error, valid, dirty, save, reset };
}
