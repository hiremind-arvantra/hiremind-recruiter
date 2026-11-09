import type { Metadata } from "next";
import MatchingCriteriaPage from "@/modules/company/matching/MatchingCriteriaPage";

export const metadata: Metadata = { title: "Matching Criteria" };

export default function Page() {
  return <MatchingCriteriaPage />;
}
