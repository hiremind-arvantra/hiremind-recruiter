/** Shared mock role/permission data — used by the Roles & Permissions list and
 *  the View Permissions page so their counts stay consistent. Swap for a real
 *  `/company/team/roles` API when the domain exists. */

export type RoleStatus = "Active" | "Inactive";
export type ModuleKey =
  "jobs" | "candidates" | "clients" | "applications" | "interviews" | "reports" | "settings";

export interface PermissionModule {
  key: ModuleKey;
  module: string;
  iconBg: string;
  permissions: string[];
}

export interface RoleDef {
  id: string;
  name: string;
  description: string;
  members: number;
  status: RoleStatus;
  updatedOn: string;
  updatedBy: string;
  modules: PermissionModule[];
}

export const ROLES: RoleDef[] = [
  {
    id: "manager",
    name: "Manager",
    description: "Oversees team activities, manages clients and candidates, and makes hiring decisions.",
    members: 3,
    status: "Active",
    updatedOn: "May 12, 2024",
    updatedBy: "Ananya Singh",
    modules: [
      {
        key: "jobs",
        module: "Jobs",
        iconBg: "bg-brand-50 text-brand-600",
        permissions: ["Create Jobs", "Edit Jobs", "Delete Jobs", "View Jobs", "Publish Jobs"],
      },
      {
        key: "candidates",
        module: "Candidates",
        iconBg: "bg-green-50 text-green-600",
        permissions: ["View Candidates", "Edit Candidates", "Move Stage", "Add Notes"],
      },
      {
        key: "clients",
        module: "Clients",
        iconBg: "bg-orange-50 text-orange-600",
        permissions: ["View Clients", "Add Clients", "Edit Clients"],
      },
      {
        key: "applications",
        module: "Applications",
        iconBg: "bg-blue-50 text-blue-600",
        permissions: ["View Applications", "Update Status", "Add Notes", "Delete Applications"],
      },
      {
        key: "interviews",
        module: "Interviews",
        iconBg: "bg-cyan-50 text-cyan-600",
        permissions: ["Schedule Interviews", "Reschedule Interviews", "Cancel Interviews"],
      },
      {
        key: "reports",
        module: "Reports & Analytics",
        iconBg: "bg-purple-50 text-purple-600",
        permissions: ["View Reports", "Export Reports"],
      },
      {
        key: "settings",
        module: "Settings",
        iconBg: "bg-amber-50 text-amber-600",
        permissions: ["View Team Settings"],
      },
    ],
  },
  {
    id: "recruiter",
    name: "Recruiter",
    description: "Manages job postings, searches candidates, and moves them through the hiring pipeline.",
    members: 5,
    status: "Active",
    updatedOn: "May 12, 2024",
    updatedBy: "Rahul Sharma",
    modules: [
      {
        key: "jobs",
        module: "Jobs",
        iconBg: "bg-brand-50 text-brand-600",
        permissions: ["Create Jobs", "Edit Jobs", "View Jobs", "Publish Jobs"],
      },
      {
        key: "candidates",
        module: "Candidates",
        iconBg: "bg-green-50 text-green-600",
        permissions: ["View Candidates", "Edit Candidates", "Move Stage", "Add Notes"],
      },
      {
        key: "clients",
        module: "Clients",
        iconBg: "bg-orange-50 text-orange-600",
        permissions: ["View Clients"],
      },
      {
        key: "applications",
        module: "Applications",
        iconBg: "bg-blue-50 text-blue-600",
        permissions: ["View Applications", "Update Status", "Add Notes"],
      },
      {
        key: "interviews",
        module: "Interviews",
        iconBg: "bg-cyan-50 text-cyan-600",
        permissions: ["Schedule Interviews"],
      },
    ],
  },
];

export const permissionCount = (role: RoleDef): number =>
  role.modules.reduce((sum, m) => sum + m.permissions.length, 0);

export const totalPermissionsAcross = (): number => ROLES.reduce((sum, r) => sum + permissionCount(r), 0);

export const roleBySlug = (slug: string): RoleDef | undefined =>
  ROLES.find((r) => r.id === slug.toLowerCase() || r.name.toLowerCase() === slug.toLowerCase());
