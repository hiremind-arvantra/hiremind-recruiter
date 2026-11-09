"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MatchScore } from "@/components/ui/MatchScore";
import type { MatchSummary } from "@/modules/company/matching";
import { fitTier } from "@/modules/company/matching/analysis/model";
import { ChevronDown, VerifiedTick, WarnIcon } from "../../shared/icons";
import type { AppStatus, Candidate } from "./data";

/* One applicant on View Applications. `CandidateRow` is the wide-screen table row and
 * `CandidateCard` the stacked layout for narrower screens; both share the pieces below
 * so the two can never disagree. */

const TIER_TEXT = { success: "text-success", warn: "text-warn", danger: "text-danger", brand: "text-brand-700", neutral: "text-ink-500" } as const;

const STATUS_STYLE: Record<AppStatus, string> = {
  Applied: "badge-info",
  Shortlisted: "badge-success",
  Interview: "badge-brand",
  Offered: "badge-warn",
  Rejected: "badge-danger",
};

const STATUS_OPTIONS: AppStatus[] = ["Applied", "Shortlisted", "Interview", "Offered", "Rejected"];

export interface CandidateItemProps {
  c: Candidate;
  /** Position in the match-ranked list. */
  rank?: number;
  selected: boolean;
  onToggle: () => void;
  onView?: () => void;
  onStatusChange?: (status: AppStatus) => void;
  /** Link to this candidate's match analysis for the job. */
  matchHref?: string;
  /** Strengths / gaps from the matching engine. */
  summary?: MatchSummary;
}

function initialsOf(name: string): string {
  return name.split(/\s+/).filter(Boolean).map((word) => word[0]).slice(0, 2).join("").toUpperCase();
}

/* ── Shared pieces ─────────────────────────────────────────────────────────── */

function RankChip({ rank }: { rank: number }) {
  const top = rank <= 3;
  return (
    <span
      className={`inline-grid place-items-center min-w-8 h-8 px-1.5 rounded-lg text-caption font-bold tabular ${
        top ? "bg-brand-50 text-brand-700 border border-brand-100" : "bg-ink-100 text-ink-500"
      }`}
    >
      <span className="sr-only">Rank </span>
      {rank}
    </span>
  );
}

function SelectBox({ c, selected, onToggle }: Pick<CandidateItemProps, "c" | "selected" | "onToggle">) {
  return (
    <label className="grid place-items-center w-10 h-10 -ml-2 cursor-pointer shrink-0">
      <input type="checkbox" checked={selected} onChange={onToggle} className="accent-brand-600 w-4 h-4" aria-label={`Select ${c.name}`} />
    </label>
  );
}

function Identity({ c, matchHref }: Pick<CandidateItemProps, "c" | "matchHref">) {
  const work = [c.companyRole, c.company !== "Not Specified" ? c.company : null].filter(Boolean).join(" · ");
  return (
    <div className="flex items-start gap-3 min-w-0">
      <span aria-hidden="true" className={`w-10 h-10 rounded-full ${c.avatarBg} text-ink-700 grid place-items-center text-caption font-bold shrink-0`}>
        {initialsOf(c.name)}
      </span>
      <div className="min-w-0 leading-snug">
        <div className="flex items-center gap-1.5 flex-wrap">
          {matchHref ? (
            <Link href={matchHref} className="font-semibold text-ink-900 hover:text-brand-700 transition-colors" title={`View the match analysis for ${c.name}`}>
              {c.name}
            </Link>
          ) : (
            <span className="font-semibold text-ink-900">{c.name}</span>
          )}
          {c.verified && <VerifiedTick />}
          {c.fake && (
            <span className="badge badge-danger h-5 px-2 text-nano">
              <WarnIcon /> Suspected Fake Profile
            </span>
          )}
        </div>
        <div className="text-caption text-ink-600 truncate" title={work || undefined}>
          {work || "Current role not specified"}
          {c.experience !== "—" && <span className="text-ink-500"> · {c.experience}</span>}
        </div>
        <div className="text-caption text-ink-500 truncate" title={c.email}>{c.email}</div>
        <div className="text-caption text-ink-500 tabular truncate">{c.phone}</div>
      </div>
    </div>
  );
}

function MatchCell({ c, summary, compact = false }: { c: Candidate; summary?: MatchSummary; compact?: boolean }) {
  const tier = fitTier(c.match);
  const gaps = summary?.gapAreas.slice(0, 2) ?? [];
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2.5">
        <MatchScore value={c.match} size="sm" label="Match score" />
        <div className="min-w-0 leading-tight">
          <div className={`text-caption font-semibold whitespace-nowrap ${TIER_TEXT[tier.tone]}`}>{tier.label}</div>
          {c.matchSource === "stored" && (
            <div className="text-nano text-ink-500" title="The full profile could not be loaded, so this is the score stored with the application.">
              Stored score
            </div>
          )}
        </div>
      </div>
      {summary && summary.strongAreas.length > 0 && (
        <div className={`mt-1.5 flex flex-wrap items-center gap-1 ${compact ? "" : "max-w-full"}`}>
          <span className="sr-only">Strong areas: </span>
          {summary.strongAreas.slice(0, 2).map((area) => (
            <span key={area} className="badge badge-success h-auto min-h-5 px-2 py-0.5 text-nano whitespace-normal text-left leading-tight">
              {area}
            </span>
          ))}
        </div>
      )}
      {gaps.length > 0 && (
        <p className="mt-1 text-caption text-ink-500 leading-snug line-clamp-2 wrap-break-word" title={`To validate: ${gaps.join(" · ")}`}>
          <span className="font-semibold text-warn">To validate: </span>
          {gaps.join(" · ")}
        </p>
      )}
    </div>
  );
}

/** The status badge doubles as the "Move to" menu trigger. */
function StatusMenu({ c, onStatusChange }: Pick<CandidateItemProps, "c" | "onStatusChange">) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  // position:fixed so the menu escapes any clipping ancestor.
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  function toggle() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) setPosition({ top: rect.bottom + 4, left: Math.max(8, Math.min(rect.left, window.innerWidth - 200)) });
    setOpen((value) => !value);
  }

  useEffect(() => {
    if (!open) return;
    function close(event: MouseEvent) {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    const onScroll = () => setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  async function pick(status: AppStatus) {
    setOpen(false);
    if (status === c.status || !onStatusChange) return;
    setBusy(true);
    try {
      await onStatusChange(status);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        disabled={busy || !onStatusChange}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Status: ${c.status}. Change status`}
        className={`badge ${STATUS_STYLE[c.status]} gap-1 cursor-pointer hover:brightness-95 disabled:cursor-default ${busy ? "opacity-50" : ""}`}
      >
        {c.status}
        <ChevronDown />
      </button>
      {open && position && (
        <div
          ref={menuRef}
          role="menu"
          style={{ position: "fixed", top: position.top, left: position.left, zIndex: 50 }}
          className="w-48 rounded-2xl border border-ink-200 bg-white shadow-elevated p-1.5 text-left animate-scale-in"
        >
          <div className="px-2.5 pt-1 pb-1.5 text-micro font-semibold text-ink-500 uppercase tracking-wider">Move to</div>
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              type="button"
              role="menuitem"
              onClick={() => pick(status)}
              aria-current={status === c.status ? "true" : undefined}
              className={`w-full h-10 flex items-center justify-between gap-2 px-2.5 rounded-lg text-body-sm transition-colors hover:bg-ink-100 ${
                status === c.status ? "font-semibold text-brand-700" : "text-ink-700"
              }`}
            >
              <span>{status}</span>
              {status === c.status && <span aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

function Actions({ c, onView, matchHref, stacked }: Pick<CandidateItemProps, "c" | "onView" | "matchHref"> & { stacked: boolean }) {
  return (
    <div className={stacked ? "flex flex-col gap-1.5" : "flex flex-wrap gap-2"}>
      {matchHref && (
        <Link href={matchHref} className={`btn btn-outline btn-sm whitespace-nowrap ${stacked ? "w-full" : ""}`} aria-label={`View match analysis for ${c.name}`}>
          View Match
        </Link>
      )}
      <button type="button" onClick={onView} className={`btn btn-ghost btn-sm whitespace-nowrap ${stacked ? "w-full" : ""}`} aria-label={`View profile of ${c.name}`}>
        View Profile
      </button>
    </div>
  );
}

/* ── Wide screens: a table row ─────────────────────────────────────────────── */

export function CandidateRow(props: CandidateItemProps) {
  const { c, rank, selected, summary } = props;
  return (
    <tr className={selected ? "bg-brand-50/40" : undefined}>
      <td className="pr-0 align-top pt-4">
        <SelectBox {...props} />
      </td>
      <td className="px-1 align-top pt-4">{rank !== undefined && <RankChip rank={rank} />}</td>
      <td className="align-top">
        <Identity {...props} />
      </td>
      <td className="align-top leading-snug">
        <div className="text-ink-800 tabular whitespace-nowrap">{c.appliedDate}</div>
        <div className="text-caption text-ink-500 tabular">{c.appliedTime}</div>
      </td>
      <td className="align-top">
        <MatchCell c={c} summary={summary} />
      </td>
      <td className="align-top">
        <StatusMenu {...props} />
      </td>
      <td className="align-top">
        <Actions {...props} stacked />
      </td>
    </tr>
  );
}

/* ── Narrower screens: a card ──────────────────────────────────────────────── */

export function CandidateCard(props: CandidateItemProps) {
  const { c, rank, selected, summary } = props;
  return (
    <li className={`p-4 sm:p-5 ${selected ? "bg-brand-50/40" : ""}`}>
      <div className="flex items-start gap-2 sm:gap-3">
        <SelectBox {...props} />
        {rank !== undefined && <div className="pt-1"><RankChip rank={rank} /></div>}
        <div className="min-w-0 flex-1">
          <Identity {...props} />
        </div>
        <div className="shrink-0 pt-1">
          <StatusMenu {...props} />
        </div>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:pl-12">
        <div className="min-w-0">
          <MatchCell c={c} summary={summary} compact />
          <div className="mt-2 text-caption text-ink-500 tabular">
            Applied {c.appliedDate}
            {c.appliedTime ? ` · ${c.appliedTime}` : ""}
          </div>
        </div>
        <Actions {...props} stacked={false} />
      </div>
    </li>
  );
}
