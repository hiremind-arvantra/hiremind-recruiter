"use client";

import Link from "next/link";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LoadingState } from "@/components/ui/Skeleton";
import { MatchWeightsEditor } from "./MatchWeightsEditor";
import { useCompanyDefaultWeights } from "./useCompanyDefaultWeights";

/* The company-default weights, edited inline from Settings → Matching.
 * Same configuration as /company/settings/matching — this is the short version. */
export function CompanyMatchingPanel() {
  const { weights, setWeights, loading, saveState, error, valid, dirty, save, reset } = useCompanyDefaultWeights();
  const saving = saveState === "saving";

  if (loading) return <LoadingState label="Loading matching criteria…" rows={3} />;

  return (
    <div className="space-y-6">
      <section className="card-elevated p-5 sm:p-7">
        <SectionHeader
          title="Candidate Matching Criteria"
          subtitle="How much each category counts when candidates are matched against your jobs. New jobs start from these weights."
          icon={<SlidersIcon />}
          action={
            <Link href="/company/settings/matching" className="btn btn-outline btn-sm">
              Open full page
            </Link>
          }
          className="mb-5"
        />
        <MatchWeightsEditor value={weights} onChange={setWeights} onReset={reset} disabled={saving} />
      </section>

      {saveState === "error" && error && (
        <div role="alert" className="alert alert-danger">
          <span>{error}</span>
        </div>
      )}
      {!valid && (
        <div role="alert" className="alert alert-warn">
          <span>Weights must total exactly 100% before you can save.</span>
        </div>
      )}

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-end gap-3 rounded-2xl border border-ink-100 glass shadow-elevated px-4 py-3">
        {saveState === "saved" && (
          <span role="status" className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-success">
            <CheckIcon /> Saved
          </span>
        )}
        <button type="button" onClick={save} disabled={saving || !dirty || !valid} className="btn btn-primary">
          {saving ? (
            <>
              <SpinnerIcon /> Saving…
            </>
          ) : (
            "Save Criteria"
          )}
        </button>
      </div>
    </div>
  );
}

export default CompanyMatchingPanel;

function SlidersIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M5 4v6M5 14v6M12 4v3M12 11v9M19 4v9M19 17v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="5" cy="12" r="2" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="9" r="2" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="19" cy="15" r="2" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0">
      <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function SpinnerIcon() {
  return (
    <svg aria-hidden="true" className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
