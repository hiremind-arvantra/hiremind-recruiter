import type { Metadata } from "next";
import CompanySettingsPage from "@/modules/company/settings/CompanySettingsPage";

export const metadata: Metadata = { title: "Settings" };

export default function Page() {
  return <CompanySettingsPage />;
}
