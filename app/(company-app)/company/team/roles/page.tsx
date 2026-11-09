import type { Metadata } from "next";
import RolesPermissionsPage from "@/modules/company/team/RolesPermissionsPage";

export const metadata: Metadata = { title: "Roles & Permissions" };

export default function Page() {
  return <RolesPermissionsPage />;
}
