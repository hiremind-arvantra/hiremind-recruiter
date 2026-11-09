"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Pagination } from "@/components/ui/Pagination";
import { PageHeader, Breadcrumbs } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { TabBar } from "@/components/ui/TabBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { ROLES, permissionCount, totalPermissionsAcross, type RoleDef } from "./data";

const PAGE_SIZE_DEFAULT = 10;
const COLUMNS = ["Role Name", "Description", "Permissions", "Members", "Status", "Last Updated", "Actions"];

export default function RolesPermissionsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(PAGE_SIZE_DEFAULT);

  const totalRoles = ROLES.length;
  const totalPermissions = totalPermissionsAcross();
  const restrictedPermissions = 0;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return ROLES;
    return ROLES.filter((r) => r.name.toLowerCase().includes(term) || r.description.toLowerCase().includes(term));
  }, [search]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const pageRows = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  return (
    <div>
      <PageHeader
        eyebrow={<Breadcrumbs items={[{ label: "Team", href: "/company/team" }, { label: "Roles & Permissions" }]} />}
        title="Roles & Permissions"
        subtitle="Create roles to define responsibilities and control access across your agency."
        actions={
          <button type="button" className="btn btn-primary">
            <PlusIcon /> Create Role
          </button>
        }
      />

      <div className="space-y-6">
        {/* Stat tiles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard iconClassName="bg-brand-50 text-brand-600" icon={<UserPlusIcon />} label="Total Roles" value={totalRoles} sub="Active roles" />
          <StatCard iconClassName="bg-success/10 text-success" icon={<ShieldIcon />} label="Total Permissions" value={totalPermissions} sub="Permissions configured" />
          <StatCard iconClassName="bg-ink-100 text-ink-600" icon={<LockIcon />} label="Restricted Permissions" value={restrictedPermissions} sub="Permissions restricted" />
        </div>

        {/* All Roles tab */}
        <TabBar ariaLabel="Role views" items={[{ key: "all", label: "All Roles" }]} value="all" onChange={() => {}} />

        <section className="card overflow-hidden" aria-label="Roles">
          {/* Search + filter */}
          <div className="flex flex-col gap-3 p-4 border-b border-ink-100 sm:flex-row sm:items-center">
            <div className="relative flex-1 min-w-0">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"><SearchIcon /></span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search roles by name..."
                aria-label="Search roles"
                className="field-input h-10 pl-10"
              />
            </div>
            <button type="button" className="btn btn-outline">
              <FunnelIcon /> Filter
            </button>
          </div>

          {/* Table */}
          {pageRows.length === 0 ? (
            <div className="p-4">
              <EmptyState icon={<SearchIcon />} title="No roles match your search." />
            </div>
          ) : (
            <div className="table-scroll">
              <table className="data-table min-w-240">
                <thead>
                  <tr>
                    {COLUMNS.map((c, i) => (
                      <th key={c} scope="col" className={i === COLUMNS.length - 1 ? "text-right" : undefined}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((r) => <RoleRow key={r.id} role={r} />)}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          {filtered.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-ink-100">
              <span className="text-body-sm text-ink-500 tabular">
                Showing {(page - 1) * rowsPerPage + 1} to {Math.min(page * rowsPerPage, filtered.length)} of {filtered.length} roles
              </span>
              {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}
              <div className="flex items-center gap-2 text-body-sm text-ink-500">
                <label htmlFor="roles-rows-per-page">Rows per page:</label>
                <div className="relative">
                  <select id="roles-rows-per-page" value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }} className="field-input h-10 w-auto pl-3 pr-8 appearance-none cursor-pointer tabular">
                    {[10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"><ChevronDown /></span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* About banner */}
        <div className="card p-5 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <span className="icon-tile bg-cobalt-50 text-cobalt-600"><InfoIcon /></span>
            <div className="min-w-0">
              <h2 className="section-title">About roles &amp; permissions</h2>
              <p className="section-subtitle">Create roles based on responsibilities and assign permissions to control what team members can access and manage.</p>
            </div>
          </div>
          <button type="button" className="btn btn-ghost shrink-0 self-start sm:self-center text-brand-700 whitespace-normal text-left">
            Learn more about roles &amp; permissions <ArrowRight />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Pieces ───────────────────────────────────────────────────────────── */
function RoleRow({ role }: { role: RoleDef }) {
  return (
    <tr>
      <td>
        <div className="flex items-center gap-3 min-w-0">
          <span className="icon-tile bg-brand-50 text-brand-600"><UserPlusIcon /></span>
          <span className="font-semibold text-ink-900 truncate">{role.name}</span>
        </div>
      </td>
      <td>
        <p className="max-w-sm text-ink-600 leading-relaxed">{role.description}</p>
      </td>
      <td>
        <div className="whitespace-nowrap">
          <span className="font-semibold text-ink-900 tabular">{permissionCount(role)}</span> <span className="text-ink-500">permissions</span>
        </div>
        <Link href={`/company/team/roles/${role.id}/permissions`} className="mt-1 inline-flex items-center gap-1.5 text-caption font-semibold text-brand-700 hover:text-brand-900 transition-colors whitespace-nowrap">
          <EyeIcon /> View Permissions
        </Link>
      </td>
      <td>
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="text-ink-400"><UsersMiniIcon /></span>
          <span className="font-semibold text-ink-900 tabular">{role.members}</span>
          <span className="text-ink-500">members</span>
        </div>
      </td>
      <td>
        <span className={`badge ${role.status === "Active" ? "badge-success" : "badge-neutral"}`}>
          <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-current" />
          {role.status}
        </span>
      </td>
      <td className="whitespace-nowrap">
        <div className="text-ink-700 tabular">{role.updatedOn}</div>
        <div className="text-caption text-ink-500">by {role.updatedBy}</div>
      </td>
      <td className="text-right">
        <button type="button" aria-label="Role actions" className="btn btn-ghost btn-icon text-ink-500">
          <MoreIcon />
        </button>
      </td>
    </tr>
  );
}

/* ── Icons ────────────────────────────────────────────────────────────── */
function PlusIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>); }
function UserPlusIcon() { return (<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" /><path d="M3 20c1.5-3.5 4-5 6-5s4.5 1.5 6 5M18 8v6M21 11h-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>); }
function ShieldIcon() { return (<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3l8 4v6c0 4-3 7-8 8-5-1-8-4-8-8V7l8-4z" stroke="currentColor" strokeWidth="1.6" /><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
function LockIcon() { return (<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.6" /><path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.6" /></svg>); }
function SearchIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7.5" /><line x1="20.5" y1="20.5" x2="16.4" y2="16.4" /></svg>); }
function FunnelIcon() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" /></svg>); }
function UsersMiniIcon() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.6" /><circle cx="17" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.6" /><path d="M3 20c0-3 3-5 6-5s6 2 6 5M14 20c0-2 2-3 3.5-3 2 0 3.5 1 3.5 3" stroke="currentColor" strokeWidth="1.6" /></svg>); }
function EyeIcon() { return (<svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" /></svg>); }
function InfoIcon() { return (<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" /><path d="M12 11v5M12 8h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>); }
function ArrowRight() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0"><path d="M3 8h10m0 0L8 3m5 5l-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
function ChevronDown() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
function MoreIcon() { return (<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="19" cy="12" r="1.7" /></svg>); }
