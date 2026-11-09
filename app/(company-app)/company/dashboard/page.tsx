import type { Metadata } from "next";
import CompanyDashboard from "@/modules/company/dashboard/CompanyDashboard";

export const metadata: Metadata = { title: "Dashboard" };

export default function CompanyDashboardPage() {
  return <CompanyDashboard />;
}
