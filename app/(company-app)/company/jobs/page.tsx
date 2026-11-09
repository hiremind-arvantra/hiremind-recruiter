import type { Metadata } from "next";
import JobsList from "@/modules/company/jobs/JobsList";

export const metadata: Metadata = { title: "My Jobs" };

export default function JobsPage() {
  return <JobsList />;
}
