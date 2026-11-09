"use client";

import { useEffect, useState } from "react";
import { fetchApplicantDetail, type ApplicantDetail } from "../jobs/services/applications.service";
import { fetchJobFull, type JobFullDetail } from "../jobs/services/job.service";
import { getMatchSummary, type MatchSummary } from "./matchAnalysis.service";

/* ─────────────────────────────────────────────────────────────────────────────
 * The match score for a list of applications — the same figure the Candidate
 * Match Analysis page shows, so a list and the screen it links to never disagree.
 *
 * Scores are computed per row from the job and the candidate profile, and cached
 * for the session: a job, a candidate profile and an analysis are each fetched
 * once however many lists ask for them. A row whose profile cannot be loaded
 * keeps the score stored with the application, marked as such.
 * ───────────────────────────────────────────────────────────────────────────── */

export interface ScoredRow {
  /** Row identity — the application id. */
  key: string;
  jobId: string;
  candidateUserId: string | null | undefined;
  storedScore: number | null;
}

export interface AnalysisScore {
  score: number;
  source: "analysis" | "stored";
  summary?: MatchSummary;
}

const jobs = new Map<string, Promise<JobFullDetail | null>>();
const applicants = new Map<string, Promise<ApplicantDetail | null>>();
const analyses = new Map<string, Promise<MatchSummary | null>>();

function job(jobId: string): Promise<JobFullDetail | null> {
  if (!jobs.has(jobId)) jobs.set(jobId, fetchJobFull(jobId).catch(() => null));
  return jobs.get(jobId)!;
}

function applicant(candidateUserId: string): Promise<ApplicantDetail | null> {
  if (!applicants.has(candidateUserId)) {
    applicants.set(candidateUserId, fetchApplicantDetail(candidateUserId).catch(() => null));
  }
  return applicants.get(candidateUserId)!;
}

function analyse(jobId: string, candidateUserId: string): Promise<MatchSummary | null> {
  const id = `${jobId}:${candidateUserId}`;
  if (!analyses.has(id)) {
    analyses.set(
      id,
      (async () => {
        const [jobDetail, profile] = await Promise.all([job(jobId), applicant(candidateUserId)]);
        if (!jobDetail || !profile) return null;
        return getMatchSummary(jobDetail, profile).catch(() => null);
      })(),
    );
  }
  return analyses.get(id)!;
}

/**
 * Scores for the given rows. `ready` is true once every row has a score, so a list
 * can hold off ranking until the figures are final.
 */
export function useAnalysisScores(rows: ScoredRow[]): { scores: Map<string, AnalysisScore>; ready: boolean } {
  const [scores, setScores] = useState<Map<string, AnalysisScore>>(new Map());
  // The rows a caller passes are rebuilt on every render; key the effect on their identity.
  const identity = rows.map((row) => `${row.key}|${row.jobId}|${row.candidateUserId ?? ""}`).join(",");

  useEffect(() => {
    let active = true;
    (async () => {
      const results = await Promise.all(
        rows.map(async (row): Promise<[string, AnalysisScore]> => {
          const summary = row.candidateUserId ? await analyse(row.jobId, row.candidateUserId) : null;
          return summary
            ? [row.key, { score: summary.overall, source: "analysis", summary }]
            : [row.key, { score: row.storedScore ?? 0, source: "stored" }];
        }),
      );
      if (!active) return;
      setScores((previous) => {
        const next = new Map(previous);
        for (const [key, value] of results) next.set(key, value);
        return next;
      });
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity]);

  return { scores, ready: rows.every((row) => scores.has(row.key)) };
}
