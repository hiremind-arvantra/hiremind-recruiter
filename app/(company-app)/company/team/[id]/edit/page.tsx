import type { Metadata } from "next";
import AddTeamMemberPage from "@/modules/company/team/AddTeamMemberPage";
import { decodeId } from "@/lib/urlId";

export const metadata: Metadata = { title: "Edit Team Member" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AddTeamMemberPage memberId={decodeId(id)} />;
}
