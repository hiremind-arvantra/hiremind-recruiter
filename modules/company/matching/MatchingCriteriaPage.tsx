"use client";

import { PageHeader, Breadcrumbs } from "@/components/ui/PageHeader";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { AIInsight } from "@/components/ui/AIInsight";
import { LoadingState } from "@/components/ui/Skeleton";
import { MatchWeightsEditor } from "./components/MatchWeightsEditor";
import { useCompanyDefaultWeights } from "./components/useCompanyDefaultWeights";

/* ─────────────────────────────────────────────────────────────────────────────
 * Settings → Matching Criteria.
 *
 * The company-wide default weights: every new job starts from this configuration
 * and can then be tuned for that job while posting or editing it.
 * ───────────────────────────────────────────────────────────────────────────── */
export default function MatchingCriteriaPage() {
  const { weights, setWeights, loading, saveState, error, valid, dirty, save, reset } = useCompanyDefaultWeights();
  const saving = saveState === "saving";

  return (
    <div className="max-w-275">
      <PageHeader
        eyebrow={
          <Breadcrumbs items={[{ label: "Settings", href: "/company/settings" }, { label: "Matching Criteria" }]} />
        }
        title="Matching Criteria"
        subtitle="Set how much each category counts when candidates are matched against your jobs. These weights are the defaults applied to every new job you post."
        actions={
          <>
            <button type="button" onClick={reset} disabled={saving || loading} className="btn btn-outline">
              Reset to defaults
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving || loading || !dirty || !valid}
              className="btn btn-primary"
            >
              {saving ? (
                <>
                  <SpinnerIcon /> Saving…
                </>
              ) : (
                "Save Criteria"
              )}
            </button>
          </>
        }
      />

      <div className="space-y-6">
        {saveState === "error" && error && (
          <div role="alert" className="alert alert-danger">
            <span>{error}</span>
          </div>
        )}
        {saveState === "saved" && (
          <div role="status" className="alert alert-success">
            <span>Matching criteria saved. New jobs will start from these weights.</span>
          </div>
        )}
        {!valid && !loading && (
          <div role="alert" className="alert alert-warn">
            <span>Weights must total exactly 100% before you can save.</span>
          </div>
        )}

        <AIInsight title="Evidence-based scoring" label="How matching works">
          <div className="space-y-2 text-body-sm text-ink-700">
            <p>
              Each requirement in a job is compared against the evidence in a candidate&apos;s profile and résumé.
              Every comparison is scored on how well the evidence supports it, then grouped into the ten categories
              below.
            </p>
            <p>
              The weights here decide how much each category contributes to the final match score, so a job that
              lives or dies on hands-on responsibilities can be weighted differently from one that hinges on
              certifications. Categories with no evidence to judge are flagged for validation rather than scored as
              zero.
            </p>
          </div>
        </AIInsight>

        {loading ? (
          <LoadingState label="Loading matching criteria…" rows={4} />
        ) : (
          <section className="card-elevated p-5 sm:p-7">
            <SectionHeader
              title="Category Weights"
              subtitle="Ten categories, always adding up to 100%. Adjust one and the rest rebalance around it."
              icon={<SlidersIcon />}
              className="mb-5"
            />
            <MatchWeightsEditor value={weights} onChange={setWeights} onReset={reset} disabled={saving} />
          </section>
        )}
      </div>
    </div>
  );
}

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
function SpinnerIcon() {
  return (
    <svg aria-hidden="true" className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
