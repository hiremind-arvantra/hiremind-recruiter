import type { ClientSummaryResponse } from "../services/client.service";

export interface Client {
  id: string;
  name: string;
  industry: string;
  accountManager: string;
  openJobs: number;
  lastActivity: string;
  status: "Active" | "Inactive" | "Prospect";
}

export const STATUS_LABEL: Record<ClientSummaryResponse["status"], Client["status"]> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  PROSPECT: "Prospect",
};

export const COLUMNS = [
  "Client Name",
  "Industry",
  "Account Manager",
  "Open Jobs",
  "Last Activity",
  "Status",
  "Actions",
];

export const INDUSTRY_OPTIONS = [
  "All Industries",
  "Information Technology",
  "Finance & Banking",
  "Healthcare",
  "Manufacturing",
];
export const STATUS_OPTIONS = ["All", "Active", "Inactive", "Prospect"];

/** Default (unfiltered) selection — "Search" applies, "Reset" returns here. */
export const DEFAULT_FILTERS = { industry: "All Industries", status: "All", accountManager: "All" };

export function fmtDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function mapClient(raw: ClientSummaryResponse): Client {
  return {
    id: raw.id,
    name: raw.clientName,
    industry: raw.industry,
    accountManager: raw.accountManager?.trim() || "Unassigned",
    openJobs: raw.openJobs,
    lastActivity: fmtDate(raw.lastActivity),
    status: STATUS_LABEL[raw.status] ?? "Active",
  };
}
