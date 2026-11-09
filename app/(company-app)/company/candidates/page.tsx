import type { Metadata } from "next";
import CandidatesPage from "@/modules/company/candidates/CandidatesPage";

export const metadata: Metadata = { title: "Candidates" };

export default function Page() {
  return <CandidatesPage />;
}
