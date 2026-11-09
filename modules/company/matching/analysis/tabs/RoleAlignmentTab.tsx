"use client";

import { useState } from "react";
import { DecisionRail, TabLayout } from "../chrome";
import {
  AlertDot,
  BarsIcon,
  BriefcaseIcon,
  CheckDot,
  ChevronDown,
  ClipboardIcon,
  DocIcon,
  TargetIcon,
} from "../icons";
import { roleAlignment, type RequirementLine } from "../model";
import { Panel, Pill, RingGauge, ScoreBar, StatTile, TD, TH, TONE } from "../ui";
import type { TabProps } from "./types";

function share(met: number, total: number): number {
  return total === 0 ? 0 : Math.round((met / total) * 100);
}

export function RoleAlignmentTab(props: TabProps) {
  const { analysis, application, busy, onStatus } = props;
  const role = roleAlignment(analysis);
  const preferredMet = role.preferred.filter((line) => line.met).length;
  const mandatoryMet = role.mandatory.filter((line) => line.met).length;

  return (
    <TabLayout
      tab="role"
      main={
        <>
          <Panel
            id="role-alignment"
            title="Role Alignment"
            subtitle="Comparison of candidate's experience with the key responsibilities and expectations for this role."
            icon={<BarsIcon size={28} />}
            action={
              <span className="hidden lg:inline-flex items-center gap-2 rounded-full bg-brand-50 border border-brand-100 px-3 py-1.5 text-caption text-ink-700">
                <CheckDot size={18} className="text-brand-400" />
                Analysis based on resume and extracted experience
              </span>
            }
          >
            <div className="@container">
            <div className="grid gap-3 grid-cols-1 @md:grid-cols-2 @4xl:grid-cols-4">
              <div className="rounded-2xl border border-ink-100 bg-ink-50/50 p-4 flex items-center gap-4 min-w-0">
                <RingGauge
                  value={role.alignment ?? 0}
                  tone={role.alignmentTier?.tone === "danger" ? "brand" : role.alignmentTier?.tone ?? "neutral"}
                  size={92}
                  stroke={9}
                  label="Role alignment"
                >
                  <span className="font-display text-title-lg font-extrabold text-ink-900 tabular">
                    {role.alignment != null ? `${role.alignment}%` : "—"}
                  </span>
                </RingGauge>
                <div className="min-w-0">
                  <div className="text-body-sm font-medium text-ink-800">Role Alignment</div>
                  <div className={`font-display text-title-lg font-bold ${role.alignmentTier ? TONE[role.alignmentTier.tone].text : "text-ink-400"}`}>
                    {role.alignmentTier?.label ?? "Not assessable"}
                  </div>
                  <div className="mt-1 text-caption text-ink-500 leading-snug">Overall alignment with role expectations</div>
                </div>
              </div>
              <StatTile
                compact
                tone="brand"
                icon={<DocIcon size={24} />}
                value={role.rows.length ? `${role.responsibilitiesMatched} of ${role.rows.length}` : "—"}
                label="Key Responsibilities Matched"
                caption={role.rows.length ? "Core responsibilities with relevant experience" : "No responsibilities listed"}
              />
              <StatTile
                compact
                tone="brand"
                icon={<BriefcaseIcon size={24} />}
                value={role.preferred.length ? `${preferredMet} of ${role.preferred.length}` : "—"}
                label="Preferred Qualifications Met"
                caption={
                  role.preferred.length === 0
                    ? "No preferred criteria listed"
                    : preferredMet / role.preferred.length >= 0.5
                      ? "Meets most of the preferred criteria"
                      : "Meets few of the preferred criteria"
                }
              />
              <StatTile
                compact
                tone={role.careerFit?.tone ?? "neutral"}
                icon={<TargetIcon size={24} />}
                value={role.careerFit?.label ?? "—"}
                label="Career Fit"
                caption={role.careerFit ? "Career progression against this role" : "Current role not stated"}
              />
            </div>
            </div>
          </Panel>

          <Panel
            id="responsibilities"
            title="Key Responsibilities Alignment"
            subtitle="Comparison of job responsibilities with candidate's experience and evidence from resume."
            action={
              <ul className="hidden md:flex items-center gap-4 text-caption text-ink-700" aria-label="Legend">
                <li className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-success" />Strong Match</li>
                <li className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-warn" />Partial Match</li>
                <li className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-danger" />Not Matched</li>
              </ul>
            }
          >
            {role.rows.length === 0 ? (
              <p className="text-body-sm text-ink-500">This job does not list responsibilities to compare against.</p>
            ) : (
              <div className="@container -mx-5 sm:-mx-6">
                <table className="w-full table-fixed">
                  <thead className="hidden @[40rem]:table-header-group">
                    <tr className="bg-ink-50/80">
                      <th scope="col" className={`${TH} pl-5 sm:pl-6 w-12`}>#</th>
                      <th scope="col" className={TH}>Job Responsibility</th>
                      <th scope="col" className={`${TH} w-40`}>Match</th>
                      <th scope="col" className={TH}>Evidence from Candidate</th>
                      <th scope="col" className={`${TH} pr-5 sm:pr-6 w-30 text-center`}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {role.rows.map((row, index) => {
                      const evidence = row.evidence ? (
                        <span className="line-clamp-2 wrap-break-word" title={row.evidence}>{row.evidence}</span>
                      ) : (
                        <span className="italic text-ink-400">Not found in the available resume evidence</span>
                      );
                      const status = <Pill tone={row.status.tone} size="sm" className="min-w-21 justify-center">{row.status.label}</Pill>;
                      return (
                        <tr key={row.id} className="[&>td]:border-b [&>td]:border-ink-100 last:[&>td]:border-b-0">
                          <td className={`${TD} pl-5 sm:pl-6 text-ink-600 tabular align-top hidden @[40rem]:table-cell`}>{index + 1}</td>
                          <td className={`${TD} text-ink-900 wrap-break-word align-top pl-5 sm:pl-6 @[40rem]:pl-3`}>
                            <span className="@[40rem]:hidden text-ink-500 tabular">{index + 1}. </span>
                            {row.requirement}
                            {/* Narrow card: match, evidence and status sit under the responsibility. */}
                            <div className="@[40rem]:hidden mt-2 space-y-1.5 pr-5 sm:pr-6">
                              <div className="flex items-center gap-3">
                                <span className="w-10 font-bold text-ink-900 tabular">{row.score}%</span>
                                <ScoreBar value={row.score} tone={row.status.tone} className="flex-1 max-w-40" />
                                {status}
                              </div>
                              <div className="text-caption text-ink-600">{evidence}</div>
                            </div>
                          </td>
                          <td className={`${TD} align-top hidden @[40rem]:table-cell`}>
                            <span className="flex items-center gap-3">
                              <span className="w-10 shrink-0 font-bold text-ink-900 tabular">{row.score}%</span>
                              <ScoreBar value={row.score} tone={row.status.tone} label={`Responsibility ${index + 1} match`} className="flex-1" />
                            </span>
                          </td>
                          <td className={`${TD} text-caption text-ink-600 align-top hidden @[40rem]:table-cell`}>{evidence}</td>
                          <td className={`${TD} pr-5 sm:pr-6 text-center align-top hidden @[40rem]:table-cell`}>{status}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <Panel
            id="requirements-coverage"
            title="Role Requirements Coverage"
            subtitle="How well the candidate meets the mandatory and preferred requirements for this role."
          >
            <div className="divide-y divide-ink-100">
              <CoverageRow label="Mandatory Requirements" lines={role.mandatory} met={mandatoryMet} tone="info" />
              <CoverageRow label="Preferred Requirements" lines={role.preferred} met={preferredMet} tone="brand" />
            </div>
          </Panel>
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

function CoverageRow({
  label,
  lines,
  met,
  tone,
}: {
  label: string;
  lines: RequirementLine[];
  met: number;
  tone: "info" | "brand";
}) {
  const [open, setOpen] = useState(false);
  const pct = share(met, lines.length);
  const detailId = `coverage-${label.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="order-1 flex flex-1 min-w-0 items-center gap-3 sm:flex-none sm:w-56 text-body-sm font-medium text-ink-900">
          <ClipboardIcon size={18} className="text-brand-600" />
          {label}
        </span>
        <div className="order-3 basis-full sm:order-2 sm:basis-0 flex flex-1 items-center gap-4 min-w-0">
        {lines.length ? (
          <>
            <ScoreBar value={pct} tone={tone} label={`${label} coverage`} className="flex-1 min-w-16" />
            <span className="w-12 text-right text-body-sm font-bold text-ink-900 tabular">{pct}%</span>
            <span className="w-16 text-body-sm text-ink-600 tabular hidden sm:inline">{met} of {lines.length}</span>
          </>
        ) : (
          <span className="flex-1 text-body-sm text-ink-500">None listed on this job</span>
        )}
        </div>
        <button
          type="button"
          disabled={!lines.length}
          aria-expanded={open}
          aria-controls={detailId}
          aria-label={`${open ? "Hide" : "Show"} ${label.toLowerCase()}`}
          onClick={() => setOpen((value) => !value)}
          className={`order-2 sm:order-3 grid place-items-center w-8 h-8 rounded-lg text-ink-500 hover:bg-ink-100 disabled:opacity-40 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <ChevronDown size={18} />
        </button>
      </div>
      <ul id={detailId} hidden={!open} className="mt-3 space-y-2 rounded-xl bg-ink-50 p-4">
        {lines.map((line) => (
          <li key={line.id} className="flex items-start gap-2.5 text-body-sm">
            {line.met ? (
              <CheckDot size={18} className="text-success shrink-0 mt-px" />
            ) : (
              <AlertDot size={18} className="text-danger shrink-0 mt-px" />
            )}
            <span className="min-w-0">
              <span className="font-semibold text-ink-900">{line.label}</span>
              <span className="text-ink-500"> — {line.detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
