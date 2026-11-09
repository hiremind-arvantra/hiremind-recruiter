import type { Metadata } from "next";
import JobPostingWizard from "@/modules/company/jobs/JobPostingWizard";

export const metadata: Metadata = { title: "Post a New Job" };

export default function NewJobPage() {
  return <JobPostingWizard />;
}
