import type { Metadata } from "next";
import { Suspense } from "react";
import CandidateMatchAnalysisPage from "@/modules/company/matching/CandidateMatchAnalysisPage";
import { decodeId } from "@/lib/urlId";

export const metadata: Metadata = { title: "Candidate Match Analysis" };

export default async function Page({ params }: { params: Promise<{ id: string; candidateId: string }> }) {
  const { id, candidateId } = await params;
  // The page keeps the active tab in ?tab= via useSearchParams — needs a Suspense boundary.
  return (
    <Suspense fallback={<div className="px-4 py-12 text-center text-ink-400 text-body-sm">Loading…</div>}>
      <CandidateMatchAnalysisPage jobId={decodeId(id)} candidateUserId={decodeId(candidateId)} />
    </Suspense>
  );
}
