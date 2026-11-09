import type { Metadata } from "next";
import { Suspense } from "react";
import CompareCandidatesPage from "@/modules/company/jobs/CompareCandidatesPage";
import { decodeId } from "@/lib/urlId";

export const metadata: Metadata = { title: "Compare Candidates" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // CompareCandidatesPage reads ?ids via useSearchParams — needs a Suspense boundary.
  return (
    <Suspense fallback={<div className="px-4 py-12 text-center text-ink-400 text-body-sm">Loading…</div>}>
      <CompareCandidatesPage jobId={decodeId(id)} />
    </Suspense>
  );
}
