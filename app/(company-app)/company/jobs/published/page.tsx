import type { Metadata } from "next";
import PublishSuccess from "@/modules/company/jobs/PublishSuccess";
import { decodeId } from "@/lib/urlId";

export const metadata: Metadata = { title: "Job Published" };

export default async function PublishedPage({ searchParams }: { searchParams: Promise<{ jobId?: string }> }) {
  const { jobId } = await searchParams;
  return <PublishSuccess jobId={jobId ? decodeId(jobId) : undefined} />;
}
