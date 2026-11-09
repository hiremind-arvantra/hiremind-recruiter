"use client";

import { useState } from "react";
import { CLASS_LABEL, CLASS_TONE } from "../../classify";
import { toPercent } from "../../classify";
import type { CategoryResult } from "../../types";
import { DecisionRail, TabLayout } from "../chrome";
import { CATEGORY_ICON, ChevronDown, ChevronUp, DocIcon, InfoIcon, ListIcon, ShieldCheckIcon } from "../icons";
import { barTone, fitTier, levelOf } from "../model";
import { Panel, Pill, RingGauge, ScoreBar, StatTile, TONE } from "../ui";
import type { TabProps } from "./types";

export function JobFitTab(props: TabProps) {
  const { analysis, application, busy, onStatus } = props;
  return (
    <TabLayout
      tab="fit"
      main={
        <>
          <OverallFit {...props} />
          <DetailedMatch categories={analysis.categories} />
        </>
      }
      rail={
        <DecisionRail
          overall={analysis.overall}
          highlights={analysis.highlights}
          gaps={analysis.gaps}
          application={application}
          busy={busy}
          onStatus={onStatus}
        />
      }
    />
  );
}

function OverallFit({ analysis, application }: TabProps) {
  const tier = fitTier(analysis.overall);
  const assessable = analysis.categories.filter((category) => category.assessable);
  const unassessable = analysis.categories.filter((category) => !category.assessable);
  const storedScore = application?.matchScore ?? null;
  const ringTone = tier.tone === "danger" ? "brand" : tier.tone;

  return (
    <Panel
      id="overall-fit"
      title="Overall Job Fit"
      subtitle="Based on analysis of your job requirements and candidate's profile."
    >
      <div className="flex flex-col md:flex-row gap-5 md:items-center">
        <div className="flex flex-col items-center gap-3 shrink-0 md:w-40">
          <RingGauge value={analysis.overall} tone={ringTone} label="Overall job fit" size={150}>
            <span className="font-display text-[40px] leading-none font-extrabold text-ink-900 tabular">
              {analysis.overall}%
            </span>
          </RingGauge>
          <Pill tone={tier.tone} size="lg">{tier.label}</Pill>
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <div className="rounded-2xl bg-brand-50/80 border border-brand-100/70 px-4 py-4 flex items-start gap-3">
            <span aria-hidden="true" className="grid place-items-center w-8 h-8 rounded-full bg-brand-200/70 text-brand-700 shrink-0">
              <InfoIcon size={16} />
            </span>
            <div className="min-w-0">
              <p className="text-body font-semibold text-ink-900">{analysis.verdict.split(/(?<=\.)\s+/)[0]}</p>
              <p className="mt-1 text-body-sm text-ink-600 leading-relaxed">
                Weighted across the {assessable.length} {assessable.length === 1 ? "category" : "categories"} that could
                be assessed from the available resume evidence
                {unassessable.length > 0
                  ? `; ${unassessable.length} could not be assessed and are left out rather than scored as zero.`
                  : "."}
              </p>
            </div>
          </div>

          <div className="@container">
          <div className="grid gap-3 grid-cols-1 @md:grid-cols-3">
            <StatTile
              compact
              tone="success"
              icon={<ShieldCheckIcon size={24} />}
              value={`${toPercent(analysis.confidence)}%`}
              label="Confidence"
              caption="Reliability of this assessment"
            />
            <StatTile
              compact
              tone="info"
              icon={<DocIcon size={24} />}
              value={`${toPercent(analysis.evidenceCoverage)}%`}
              label="Evidence Coverage"
              caption="Requirements with evidence"
            />
            <StatTile
              compact
              tone="brand"
              icon={<ListIcon size={24} />}
              value={`${assessable.length} of ${analysis.categories.length}`}
              label="Categories Assessed"
              caption={unassessable.length === 0 ? "All key areas evaluated" : `${unassessable.length} need validation`}
            />
          </div>
          </div>
        </div>
      </div>

      {storedScore != null && storedScore !== analysis.overall && (
        <p className="mt-4 text-caption text-ink-500">
          The applicants list shows {storedScore}% — the score stored with the application. The {analysis.overall}% here is
          this evidence breakdown, recomputed with the weighting configured for this job.
        </p>
      )}
    </Panel>
  );
}

/*
 * A table only where the card is wide enough for one (container ≥ 46rem); otherwise each
 * category stacks. Either way the content wraps inside the card — nothing scrolls sideways.
 */
const ROW_GRID =
  "@[46rem]:grid @[46rem]:grid-cols-[minmax(0,1.35fr)_3.25rem_minmax(8.5rem,1fr)_5.75rem_minmax(0,1.3fr)_2.25rem] @[46rem]:items-center @[46rem]:gap-x-4";

function DetailedMatch({ categories }: { categories: CategoryResult[] }) {
  const [sectionOpen, setSectionOpen] = useState(true);
  const [openRows, setOpenRows] = useState<Record<string, boolean>>({});

  return (
    <Panel
      id="detailed-match"
      title="Detailed Match Analysis"
      subtitle="Each category is evaluated and weighted based on job requirements."
      action={
        <div className="flex flex-wrap items-center justify-end gap-x-5 gap-y-1 text-body-sm">
          <span className="hidden sm:inline text-ink-600">Total Categories: {categories.length}</span>
          <button
            type="button"
            aria-expanded={sectionOpen}
            aria-controls="detailed-match-list"
            onClick={() => setSectionOpen((open) => !open)}
            className="inline-flex items-center gap-1.5 font-medium text-cobalt-600 hover:text-brand-700"
          >
            {sectionOpen ? "Collapse All" : "Expand All"}
            {sectionOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      }
    >
      <div id="detailed-match-list" hidden={!sectionOpen} className="@container -mx-5 sm:-mx-6">
        <div role="table" aria-label="Category breakdown">
          <div role="rowgroup" className="hidden @[46rem]:block">
            <div role="row" className={`${ROW_GRID} bg-ink-50/80 px-5 sm:px-6 py-2.5 text-caption font-medium text-ink-500`}>
              <span role="columnheader">Category</span>
              <span role="columnheader">Weight</span>
              <span role="columnheader">Candidate Score</span>
              <span role="columnheader" className="text-center">Match Level</span>
              <span role="columnheader">Key Insights</span>
              <span role="columnheader"><span className="sr-only">Details</span></span>
            </div>
          </div>
          <div role="rowgroup" className="divide-y divide-ink-100 border-y border-ink-100 @[46rem]:border-t-0">
            {categories.map((category) => (
              <CategoryLine
                key={category.id}
                category={category}
                expanded={Boolean(openRows[category.id])}
                onToggle={() => setOpenRows((prev) => ({ ...prev, [category.id]: !prev[category.id] }))}
              />
            ))}
          </div>
        </div>
      </div>
      {!sectionOpen && (
        <p className="text-body-sm text-ink-500">
          {categories.length} categories hidden. Use Expand All to show the breakdown.
        </p>
      )}
    </Panel>
  );
}

function CategoryLine({
  category,
  expanded,
  onToggle,
}: {
  category: CategoryResult;
  expanded: boolean;
  onToggle: () => void;
}) {
  const Icon = CATEGORY_ICON[category.id];
  const level = category.assessable ? levelOf(category.score) : null;
  const detailId = `category-detail-${category.id}`;
  const insight = category.assessable ? category.summary : `Not assessable from available evidence. ${category.summary}`;

  const score = (
    <span className="flex items-center gap-3 min-w-0">
      <ScoreBar
        value={category.assessable ? category.score : 0}
        tone={category.assessable ? barTone(category.score) : "neutral"}
        label={category.assessable ? `${category.label} score` : undefined}
        className="flex-1 min-w-16 max-w-36"
      />
      <span className={`w-11 shrink-0 font-bold tabular ${category.assessable ? "text-ink-900" : "text-ink-400"}`}>
        {category.assessable ? `${category.score}%` : "—"}
      </span>
    </span>
  );
  const pill = level ? (
    <Pill tone={level.tone} className="min-w-17 justify-center">{level.label}</Pill>
  ) : (
    <Pill tone="neutral" size="sm" className="justify-center">Not assessable</Pill>
  );
  const toggle = (
    <button
      type="button"
      aria-expanded={expanded}
      aria-controls={detailId}
      aria-label={`${expanded ? "Hide" : "Show"} ${category.label} requirement details`}
      onClick={onToggle}
      className={`grid place-items-center w-8 h-8 rounded-lg text-ink-500 hover:bg-ink-100 transition-transform ${expanded ? "rotate-180" : ""}`}
    >
      <ChevronDown size={18} />
    </button>
  );

  return (
    <div>
      <div role="row" className={`${ROW_GRID} px-5 sm:px-6 py-3 text-body-sm`}>
        {/* Wide: one cell per column. */}
        <span role="cell" className="hidden @[46rem]:flex items-center gap-3 font-medium text-ink-900 min-w-0">
          <span className="text-cobalt-600 shrink-0"><Icon size={19} /></span>
          <span className="leading-snug">{category.label}</span>
        </span>
        <span role="cell" className="hidden @[46rem]:block text-ink-600 tabular">{category.weight}%</span>
        <span role="cell" className="hidden @[46rem]:block">{score}</span>
        <span role="cell" className="hidden @[46rem]:flex justify-center">{pill}</span>
        <span role="cell" className="hidden @[46rem]:block text-caption text-ink-600 leading-snug min-w-0">
          <span className="line-clamp-2 wrap-break-word" title={insight}>{insight}</span>
        </span>
        <span role="cell" className="hidden @[46rem]:flex justify-end">{toggle}</span>

        {/* Narrow: the same content, stacked. */}
        <div className="@[46rem]:hidden space-y-2" role="cell">
          <div className="flex items-start gap-3">
            <span className="text-cobalt-600 shrink-0 mt-0.5"><Icon size={19} /></span>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-ink-900 leading-snug">{category.label}</div>
              <div className="text-caption text-ink-500">Weight {category.weight}%</div>
            </div>
            <div className="shrink-0">{pill}</div>
            <div className="shrink-0 -mr-1.5">{toggle}</div>
          </div>
          <div className="pl-8">{score}</div>
          <p className="pl-8 text-caption text-ink-600 leading-snug line-clamp-3 wrap-break-word" title={insight}>{insight}</p>
        </div>
      </div>
      <div id={detailId} hidden={!expanded} className="px-5 sm:px-6 py-3 bg-ink-50/60 border-t border-ink-100">
        <RequirementDetail category={category} />
      </div>
    </div>
  );
}

/** Requirement → evidence → relationship, stacked so long text wraps instead of widening the card. */
function RequirementDetail({ category }: { category: CategoryResult }) {
  if (category.matches.length === 0) {
    return <p className="text-caption text-ink-500 py-1">{category.description}</p>;
  }
  return (
    <ul className="divide-y divide-ink-100">
      {category.matches.map((match) => (
        <li key={match.id} className="py-2.5 first:pt-0 last:pb-0">
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
            <div className="min-w-0 flex-1 text-caption font-semibold text-ink-900 wrap-break-word">
              {match.requirement}
              {match.qualifier && <span className="ml-1.5 font-normal text-ink-500">({match.qualifier})</span>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`inline-flex rounded-full border px-2 py-0.5 text-micro font-semibold ${TONE[CLASS_TONE[match.matchClass]].pill}`}>
                {CLASS_LABEL[match.matchClass]}
              </span>
              <span className="text-caption text-ink-700 tabular">{toPercent(match.score)}%</span>
              <span className="text-caption text-ink-500 tabular">· confidence {toPercent(match.confidence)}%</span>
            </div>
          </div>
          <dl className="mt-1 grid gap-x-3 gap-y-0.5 text-caption @[40rem]:grid-cols-[7.5rem_minmax(0,1fr)]">
            <dt className="text-ink-500">Candidate evidence</dt>
            <dd className="text-ink-700 wrap-break-word">
              {match.evidence ?? <span className="italic text-ink-400">Not found in the available resume evidence</span>}
            </dd>
            <dt className="text-ink-500">Relationship</dt>
            <dd className="text-ink-600 wrap-break-word">{match.relationship}</dd>
          </dl>
        </li>
      ))}
    </ul>
  );
}
