import type { Metadata } from "next";
import AddTeamMemberPage from "@/modules/company/team/AddTeamMemberPage";

export const metadata: Metadata = { title: "Add Team Member" };

export default function Page() {
  return <AddTeamMemberPage />;
}
