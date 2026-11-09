import type { Metadata } from "next";
import EditJobPage from "@/modules/company/jobs/EditJobPage";
import { decodeId } from "@/lib/urlId";

export const metadata: Metadata = { title: "Edit Job" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditJobPage jobId={decodeId(id)} />;
}
