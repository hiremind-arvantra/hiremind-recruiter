"use client";

import { tabId, tabPanelId } from "../chrome";
import {
  AlertDot,
  BulbIcon,
  CATEGORY_ICON,
  ChartUpIcon,
  CheckDot,
  InfoIcon,
  SparkleIcon,
  TargetIcon,
  ThumbIcon,
} from "../icons";
import { barTone, fitProfile, recommendationFor, summaryText } from "../model";
import { Panel, ScoreBar, StatusList, TONE } from "../ui";
import type { TabProps } from "./types";

export function InsightsTab({ analysis, job, applicant, candidateName }: TabProps) {
  const recommendation = recommendationFor(analysis.overall);
  const summary = summaryText(candidateName, applicant, job, analysis);
  const fit = fitProfile(analysis);
  const focus = analysis.interviewFocus[0] ?? null;

  const takeaways = [
    ...analysis.highlights.slice(0, 3).map((item) => ({ key: `h-${item.title}`, ok: true as const, title: item.title })),
    ...analysis.gaps.slice(0, 3).map((gap) => ({ key: `g-${gap.title}`, ok: false as const, title: gap.title })),
  ];

  const RecGlyph = recommendation.tone === "success" ? CheckDot : AlertDot;

  return (
    <div
      role="tabpanel"
      id={tabPanelId("insights")}
      aria-labelledby={tabId("insights")}
      className="grid gap-5 lg:grid-cols-2 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_360px] items-start"
    >
      <Panel
        id="ai-summary"
        title="AI Summary"
        subtitle="A quick overview of the candidate's fit for this role based on resume analysis."
        icon={<SparkleIcon size={26} />}
        className="h-full"
      >
        <p className="rounded-xl bg-ink-50 border border-ink-100 p-4 text-body-sm text-ink-700 leading-relaxed">{summary}</p>
      </Panel>

      <section
        aria-labelledby="overall-recommendation-title"
        className={`card overflow-hidden h-full border ${TONE[recommendation.tone].tile}`}
      >
        <div className="flex items-center gap-3 px-5 sm:px-6 pt-5">
          <span className={`grid place-items-center w-6 h-6 rounded-md text-white ${TONE[recommendation.tone].bar}`}>
            <CheckDot size={14} className="text-transparent" />
          </span>
          <h2 id="overall-recommendation-title" className="font-display text-title font-bold text-ink-900">
            Overall Recommendation
          </h2>
        </div>
        <div className="px-5 sm:px-6 pb-6 pt-4">
          <div className={`flex items-center gap-3 rounded-xl border bg-white/70 px-4 py-3.5 ${TONE[recommendation.tone].pill}`}>
            <RecGlyph size={26} className={`${TONE[recommendation.tone].text} shrink-0`} />
            <span className="text-body-lg font-semibold">{recommendation.label}</span>
          </div>
          <p className="mt-5 text-body text-ink-700 leading-relaxed">{recommendation.detail}</p>
          <p className="mt-3 text-body-sm text-ink-500">
            Overall match {analysis.overall}% · confidence {Math.round(analysis.confidence * 100)}%
          </p>
        </div>
      </section>

      <Panel id="key-takeaways" title="Key Takeaways" icon={<BulbIcon size={24} />} iconClass="text-warn" className="h-full lg:col-span-2 xl:col-span-1">
        <StatusList clamp items={takeaways} empty="Nothing stands out either way in the available evidence." />
      </Panel>

      <Panel id="top-strengths" title="Top Strengths" icon={<ThumbIcon size={26} />} iconClass="text-success" className="h-full">
        <StatusList
          clamp
          items={analysis.highlights.slice(0, 4).map((item) => ({
            key: item.title,
            ok: true,
            title: item.title,
            detail: item.detail,
          }))}
          empty="No standout strengths were evidenced in the available resume material."
        />
      </Panel>

      <Panel id="key-gaps-detail" title="Key Gaps" icon={<AlertDot size={26} />} iconClass="text-danger" className="h-full">
        <StatusList
          clamp
          items={analysis.gaps.slice(0, 4).map((gap) => ({
            key: gap.title,
            ok: gap.severity === "low" ? "warn" : false,
            title: gap.title,
            detail: gap.detail,
          }))}
          empty="Every requirement found evidence in the profile."
        />
      </Panel>

      <Panel id="fit-profile" title="Fit Profile" icon={<ChartUpIcon size={26} />} iconClass="text-cobalt-600" className="h-full lg:col-span-2 xl:col-span-1">
        <dl className="space-y-3.5">
          {fit.map((bar) => (
            <div key={bar.label} className="grid grid-cols-[110px_minmax(0,1fr)_44px] items-center gap-3">
              <dt className="text-body-sm text-ink-700">{bar.label}</dt>
              <dd className="contents">
                <ScoreBar value={bar.value ?? 0} tone={bar.value == null ? "neutral" : bar.tone} label={bar.label} />
                <span className="text-right text-caption font-bold text-ink-900 tabular">
                  {bar.value != null ? `${bar.value}%` : "—"}
                </span>
              </dd>
            </div>
          ))}
        </dl>
        <div className="mt-5 flex items-start gap-3 rounded-xl bg-cobalt-50 border border-cobalt-100 px-4 py-3.5">
          <InfoIcon size={20} className="text-cobalt-600 shrink-0" />
          <p className="text-body-sm text-ink-700 leading-relaxed">
            {focus
              ? `Worth validating in the interview: ${focus.title}. ${focus.reason}`
              : "No open questions were raised by the available evidence."}
          </p>
        </div>
      </Panel>

      <Panel
        id="summary-by-category"
        title="Summary by Category"
        subtitle="Quick view of how the candidate performed across key evaluation areas."
        icon={<TargetIcon size={28} />}
        iconClass="text-cobalt-600"
        className="lg:col-span-2 xl:col-span-3"
      >
        <ul className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
          {analysis.categories.map((category) => {
            const Icon = CATEGORY_ICON[category.id];
            const tone = category.assessable ? barTone(category.score) : "neutral";
            return (
              <li key={category.id} className="flex items-start gap-3 rounded-xl border border-ink-100 bg-ink-50/50 px-4 py-3.5 min-w-0">
                <span aria-hidden="true" className={`mt-0.5 shrink-0 ${TONE[tone].text}`}>
                  <Icon size={22} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className={`font-display text-title-lg font-bold tabular ${TONE[tone].strong}`}>
                    {category.assessable ? `${category.score}%` : "—"}
                  </div>
                  <div className="text-caption text-ink-700 leading-snug line-clamp-2 min-h-8" title={category.label}>{category.label}</div>
                  <ScoreBar value={category.assessable ? category.score : 0} tone={tone} className="mt-2" />
                </div>
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}
