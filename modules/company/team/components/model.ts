import type { TeamMemberSummaryResponse } from "../services/team.service";

export type Role = "Admin" | "Manager" | "Recruiter" | "Viewer";
export type Status = "Active" | "Invited" | "Inactive";
export type TeamTab = "Team Members" | "Roles & Permissions" | "Activity Log";

export interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  accessScope: string;
  status: Status;
  lastActive: string;
}

export interface Activity {
  id: string;
  who: string;
  what: string;
  when: string;
}

export const TABS: TeamTab[] = ["Team Members", "Roles & Permissions", "Activity Log"];

export const STATUS_LABEL: Record<TeamMemberSummaryResponse["status"], Status> = {
  ACTIVE: "Active",
  INVITED: "Invited",
  INACTIVE: "Inactive",
};

/** Backend stores the radio code; show a friendly label. */
export const ACCESS_SCOPE_LABEL: Record<string, string> = {
  all: "All Clients & Jobs",
  clients: "Specific Clients",
  department: "Specific Department",
};

export const KNOWN_ROLES: Role[] = ["Admin", "Manager", "Recruiter", "Viewer"];

export function fmtLastActive(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function mapMember(raw: TeamMemberSummaryResponse): Member {
  const role = (KNOWN_ROLES.includes(raw.role as Role) ? raw.role : "Recruiter") as Role;
  return {
    id: raw.id,
    name: raw.fullName,
    email: raw.email,
    role,
    department: raw.department?.trim() || "—",
    accessScope: raw.accessScope ? (ACCESS_SCOPE_LABEL[raw.accessScope] ?? raw.accessScope) : "—",
    status: STATUS_LABEL[raw.status] ?? "Active",
    lastActive: fmtLastActive(raw.lastActivity),
  };
}

// Activity domain doesn't exist yet — Recent Activity renders its empty state.
export const ACTIVITY: Activity[] = [];

export const PAGE_SIZE_DEFAULT = 10;
export const ROLE_OPTIONS = ["All Roles", "Admin", "Manager", "Recruiter", "Viewer"];
export const STATUS_OPTIONS = ["All Status", "Active", "Invited", "Inactive"];

export const ROLE_BADGE: Record<Role, string> = {
  Admin: "bg-brand-50 text-brand-700",
  Manager: "bg-blue-50 text-blue-700",
  Recruiter: "bg-green-50 text-green-700",
  Viewer: "bg-ink-100 text-ink-600",
};
export const STATUS_BADGE: Record<Status, string> = {
  Active: "bg-green-50 text-green-700",
  Invited: "bg-blue-50 text-blue-700",
  Inactive: "bg-red-50 text-red-600",
};

const AVATAR_COLORS = [
  "bg-brand-100 text-brand-700",
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-orange-100 text-orange-700",
  "bg-pink-100 text-pink-700",
];
export const avatarColor = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
export const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
