import type { Metadata } from "next";
import ViewPermissionsPage from "@/modules/company/team/ViewPermissionsPage";

export const metadata: Metadata = { title: "View Permissions" };

export default async function Page({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  return <ViewPermissionsPage roleSlug={role} />;
}
