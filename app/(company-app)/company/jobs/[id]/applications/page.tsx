import type { Metadata } from "next";
import JobApplicationsPage from "@/modules/company/jobs/JobApplicationsPage";
import { decodeId } from "@/lib/urlId";

export const metadata: Metadata = { title: "View Applications" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <JobApplicationsPage jobId={decodeId(id)} />;
}
