"use client";

import { encodeId } from "@/lib/urlId";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Pagination } from "@/components/ui/Pagination";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatCard } from "@/components/ui/StatCard";
import { TabBar } from "@/components/ui/TabBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/Skeleton";
import { Tooltip, ConfirmDialog } from "@/modules/auth/components/candidate-reg/shared/ui";
import { useConfirmDelete } from "@/modules/auth/components/candidate-reg/shared/hooks";
import {
  listTeamMembers,
  deleteTeamMember,
  resetTeamMemberPassword,
  type TeamMemberSummaryResponse,
} from "./services/team.service";

type Role = "Admin" | "Manager" | "Recruiter" | "Viewer";
type Status = "Active" | "Invited" | "Inactive";
type TeamTab = "Team Members" | "Roles & Permissions" | "Activity Log";

interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  accessScope: string;
  status: Status;
  lastActive: string;
}

interface Activity {
  id: string;
  who: string;
  what: string;
  when: string;
}

const TABS: TeamTab[] = ["Team Members", "Roles & Permissions", "Activity Log"];

const STATUS_LABEL: Record<TeamMemberSummaryResponse["status"], Status> = {
  ACTIVE: "Active",
  INVITED: "Invited",
  INACTIVE: "Inactive",
};

/** Backend stores the radio code; show a friendly label. */
const ACCESS_SCOPE_LABEL: Record<string, string> = {
  all: "All Clients & Jobs",
  clients: "Specific Clients",
  department: "Specific Department",
};

const KNOWN_ROLES: Role[] = ["Admin", "Manager", "Recruiter", "Viewer"];

function fmtLastActive(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function mapMember(raw: TeamMemberSummaryResponse): Member {
  const role = (KNOWN_ROLES.includes(raw.role as Role) ? raw.role : "Recruiter") as Role;
  return {
    id: raw.id,
    name: raw.fullName,
    email: raw.email,
    role,
    department: raw.department?.trim() || "—",
    accessScope: raw.accessScope ? ACCESS_SCOPE_LABEL[raw.accessScope] ?? raw.accessScope : "—",
    status: STATUS_LABEL[raw.status] ?? "Active",
    lastActive: fmtLastActive(raw.lastActivity),
  };
}

// Activity domain doesn't exist yet — Recent Activity renders its empty state.
const ACTIVITY: Activity[] = [];

const PAGE_SIZE_DEFAULT = 10;
const ROLE_OPTIONS = ["All Roles", "Admin", "Manager", "Recruiter", "Viewer"];
const STATUS_OPTIONS = ["All Status", "Active", "Invited", "Inactive"];

const ROLE_BADGE: Record<Role, string> = {
  Admin: "badge-brand",
  Manager: "badge-cobalt",
  Recruiter: "badge-neutral",
  Viewer: "badge-neutral",
};
/** Icon tile / bar tones for the Roles Distribution rail. */
const ROLE_TONE: Record<Role, { tile: string; bar: string }> = {
  Admin: { tile: "bg-brand-50 text-brand-600", bar: "bg-brand-500" },
  Manager: { tile: "bg-cobalt-50 text-cobalt-600", bar: "bg-cobalt-500" },
  Recruiter: { tile: "bg-ink-100 text-ink-600", bar: "bg-ink-400" },
  Viewer: { tile: "bg-ink-50 text-ink-500", bar: "bg-ink-300" },
};
const STATUS_BADGE: Record<Status, string> = {
  Active: "badge-success",
  Invited: "badge-brand",
  Inactive: "badge-neutral",
};
const AVATAR_COLORS = ["bg-brand-100 text-brand-700", "bg-cobalt-100 text-cobalt-700", "bg-ink-200 text-ink-700", "bg-cobalt-50 text-cobalt-600", "bg-brand-50 text-brand-600"];
const avatarColor = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
const initials = (name: string) => name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

export default function TeamPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TeamTab>("Team Members");
  const goToRoles = () => router.push("/company/team/roles");
  const goToAdd = () => router.push("/company/team/new");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(PAGE_SIZE_DEFAULT);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { confirm, triggerDelete, resetConfirm } = useConfirmDelete();

  const fetched = useRef(false);
  useEffect(() => {
    if (fetched.current) return; // StrictMode double-invoke guard
    fetched.current = true;
    listTeamMembers(0, 100)
      .then(({ content }) => setMembers(content.map(mapMember)))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load team members"))
      .finally(() => setLoading(false));
  }, []);

  const [resetState, setResetState] = useState<{ name: string; password: string } | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  const handleEdit = (id: string) => router.push(`/company/team/${encodeId(id)}/edit`);

  const handleResetPassword = async (member: Member) => {
    setResettingId(member.id);
    setResetError(null);
    try {
      const password = await resetTeamMemberPassword(member.id);
      setResetState({ name: member.name, password });
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setResettingId(null);
    }
  };

  const handleDelete = (member: Member) =>
    triggerDelete(`Delete "${member.name}"?`, async () => {
      await deleteTeamMember(member.id);
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(member.id);
        return next;
      });
      resetConfirm();
    });

  const total = members.length;
  const active = members.filter((m) => m.status === "Active").length;
  const invited = members.filter((m) => m.status === "Invited").length;
  const inactive = members.filter((m) => m.status === "Inactive").length;

  const roleCounts = useMemo(() => {
    const counts = { Admin: 0, Manager: 0, Recruiter: 0, Viewer: 0 } as Record<Role, number>;
    for (const m of members) counts[m.role] += 1;
    return counts;
  }, [members]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return members.filter((m) => {
      if (term && !m.name.toLowerCase().includes(term) && !m.email.toLowerCase().includes(term) && !m.role.toLowerCase().includes(term)) return false;
      if (roleFilter !== "All Roles" && m.role !== roleFilter) return false;
      if (statusFilter !== "All Status" && m.status !== statusFilter) return false;
      return true;
    });
  }, [members, search, roleFilter, statusFilter]);

  // Reset to the first page whenever the result set changes.
  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, statusFilter, rowsPerPage]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const pageRows = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const toggleRow = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const allOnPageSelected = pageRows.length > 0 && pageRows.every((m) => selected.has(m.id));
  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) pageRows.forEach((m) => next.delete(m.id));
      else pageRows.forEach((m) => next.add(m.id));
      return next;
    });

  const overviewLegend = [
    { label: "Active", count: active, dot: "bg-success" },
    { label: "Invited", count: invited, dot: "bg-brand-400" },
    { label: "Inactive", count: inactive, dot: "bg-ink-300" },
  ];

  return (
    <div>
      <PageHeader
        title="Teams"
        subtitle="Manage your team members and their access permissions."
        actions={
          <button type="button" onClick={goToAdd} className="btn btn-primary">
            <PlusIcon /> Add Team Member
          </button>
        }
      />

      <div className="space-y-6">
        <TabBar
          ariaLabel="Team sections"
          items={TABS.map((t) => ({ key: t, label: t }))}
          value={tab}
          onChange={(t) => (t === "Roles & Permissions" ? goToRoles() : setTab(t))}
        />

        {tab !== "Team Members" ? (
          <EmptyState icon={<ClipboardIcon />} title={`${tab} — coming soon.`} />
        ) : (
          <>
            {/* Stat tiles */}
            <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard iconClassName="bg-brand-50 text-brand-600" icon={<UsersIcon />} label="Total Members" value={String(total)} />
              <StatCard iconClassName="bg-success/10 text-success" icon={<ShieldIcon />} label="Active Members" value={String(active)} />
              <StatCard iconClassName="bg-cobalt-50 text-cobalt-600" icon={<UserPlusIcon />} label="Invited" value={String(invited)} />
              <StatCard iconClassName="bg-ink-100 text-ink-600" icon={<LockIcon />} label="Inactive" value={String(inactive)} />
            </div>

            {/* Member list card: toolbar + table + footer */}
            <section className="card overflow-hidden" aria-label="Team members">
              <div className="flex flex-col gap-3 p-4 border-b border-ink-100 md:flex-row md:flex-wrap md:items-center">
                <div className="relative flex-1 min-w-0 md:min-w-64">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"><SearchIcon /></span>
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search team member by name, email or role..."
                    aria-label="Search team members"
                    className="field-input h-10 pl-10"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                  <FilterSelect label="Role" value={roleFilter} onChange={setRoleFilter} options={ROLE_OPTIONS} />
                  <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} />
                  <button type="button" className="btn btn-outline col-span-2 sm:col-span-1">
                    <FunnelIcon /> Filter
                  </button>
                </div>
              </div>

              {loading ? (
                <LoadingState label="Loading team…" rows={3} className="p-4" />
              ) : error ? (
                <div className="p-4">
                  <div role="alert" className="alert alert-danger">
                    <AlertIcon /> <span>{error}</span>
                  </div>
                </div>
              ) : total === 0 ? (
                <div className="p-4">
                  <EmptyState
                    className="py-16"
                    icon={<UsersIcon />}
                    title="Your team is ready to grow!"
                    description="Get started by adding your first team member. Invite your team and collaborate seamlessly."
                    action={
                      <button type="button" onClick={goToAdd} className="btn btn-primary">
                        <PlusIcon /> Add Team Member
                      </button>
                    }
                  />
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-4">
                  <EmptyState icon={<SearchIcon />} title="No team members match your filters." />
                </div>
              ) : (
                <>
                  <div className="table-scroll max-h-[min(720px,75vh)]">
                    <table className="data-table min-w-260 [&_td]:px-3 [&_th]:px-3">
                      <thead>
                        <tr>
                          <th scope="col" className="w-12">
                            <label className="grid place-items-center w-10 h-10 -my-3 cursor-pointer">
                              <input type="checkbox" checked={allOnPageSelected} onChange={toggleAll} aria-label="Select all" className="w-4 h-4 rounded accent-brand-600 cursor-pointer" />
                            </label>
                          </th>
                          <th scope="col">Member</th>
                          <th scope="col">Role</th>
                          <th scope="col">Department</th>
                          <th scope="col">Access Scope</th>
                          <th scope="col">Status</th>
                          <th scope="col">Last Active</th>
                          <th scope="col" className="text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageRows.map((m) => (
                          <MemberRow key={m.id} member={m} checked={selected.has(m.id)} onToggle={() => toggleRow(m.id)} onEdit={handleEdit} onDelete={handleDelete} onReset={handleResetPassword} resetting={resettingId === m.id} />
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-ink-100">
                    <span className="text-body-sm text-ink-500 tabular">
                      Showing {(page - 1) * rowsPerPage + 1} to {Math.min(page * rowsPerPage, filtered.length)} of {filtered.length} members
                    </span>
                    {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}
                    <div className="flex items-center gap-2 text-body-sm text-ink-500">
                      <label htmlFor="team-rows-per-page">Rows per page:</label>
                      <div className="relative">
                        <select id="team-rows-per-page" value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }} className="field-input h-10 w-auto pl-3 pr-8 appearance-none cursor-pointer tabular">
                          {[10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
                        </select>
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"><ChevronDown /></span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </section>
          </>
        )}

        {/* ── Insights rail — under the table so the 8-column table keeps its width ── */}
        <aside className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 items-start" aria-label="Team insights">
          {/* Team Overview */}
          <div className="card p-5">
            <SectionHeader as="h3" title="Team Overview" />
            <div className="mt-4 flex items-center gap-5">
              <Donut
                segments={[
                  { count: active, color: "var(--color-success)" },
                  { count: invited, color: "var(--color-brand-400)" },
                  { count: inactive, color: "var(--color-ink-300)" },
                ]}
                total={total}
                caption="Total"
                ariaLabel={`${total} members: ${active} active, ${invited} invited, ${inactive} inactive`}
              />
              <ul className="flex-1 min-w-0 max-w-64 space-y-2.5">
                {overviewLegend.map(({ label, count, dot }) => (
                  <li key={label} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 min-w-0">
                      <span aria-hidden="true" className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                      <span className="text-caption text-ink-600 truncate">{label}</span>
                    </span>
                    <span className="text-caption font-semibold text-ink-800 tabular shrink-0">
                      {count} <span className="font-medium text-ink-500">({total ? ((count / total) * 100).toFixed(1) : "0"}%)</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Roles Distribution */}
          <div className="card p-5">
            <SectionHeader
              as="h3"
              title="Roles Distribution"
              action={total > 0 ? <button type="button" onClick={goToRoles} className="btn btn-ghost btn-sm">View all</button> : undefined}
            />
            {total === 0 ? (
              <div className="py-6 flex flex-col items-center text-center">
                <span className="empty-state-icon"><ShieldIcon /></span>
                <div className="text-body-sm font-semibold text-ink-700">No roles created yet</div>
                <div className="text-caption text-ink-500 mt-0.5 max-w-56">Create roles to define responsibilities and manage access.</div>
                <button type="button" onClick={goToRoles} className="btn btn-outline btn-sm mt-4">
                  Go to Roles &amp; Permissions
                </button>
              </div>
            ) : (
              <ul className="mt-4 space-y-3">
                {(Object.keys(roleCounts) as Role[]).map((role) => (
                  <li key={role}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2.5 text-body-sm text-ink-700">
                        <span className={`w-7 h-7 rounded-lg grid place-items-center ${ROLE_TONE[role].tile}`}><ShieldIcon size={13} /></span>
                        {role}
                      </span>
                      <span className="text-body-sm font-semibold text-ink-900 tabular">{roleCounts[role]}</span>
                    </div>
                    <div className="mt-1.5 ml-9.5 h-1 rounded-full bg-ink-100 overflow-hidden">
                      <div className={`h-full rounded-full ${ROLE_TONE[role].bar}`} style={{ width: `${(roleCounts[role] / total) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Recent Activity */}
          <div className="card p-5">
            <SectionHeader
              as="h3"
              title="Recent Activity"
              action={ACTIVITY.length > 0 && total > 0 ? <button type="button" className="btn btn-ghost btn-sm">View all</button> : undefined}
            />
            {total === 0 || ACTIVITY.length === 0 ? (
              <div className="py-6 flex flex-col items-center text-center">
                <span className="empty-state-icon"><ClipboardIcon /></span>
                <div className="text-body-sm font-semibold text-ink-700">No recent activity</div>
                <div className="text-caption text-ink-500 mt-0.5 max-w-56">Team activities will appear here once you start adding members.</div>
              </div>
            ) : (
              <ul className="mt-4 space-y-3.5">
                {ACTIVITY.map((a) => (
                  <li key={a.id} className="flex items-start gap-2.5">
                    <span aria-hidden="true" className={`w-8 h-8 rounded-full grid place-items-center shrink-0 text-micro font-bold ${avatarColor(a.who)}`}>{initials(a.who)}</span>
                    <div className="min-w-0">
                      <p className="text-body-sm text-ink-700 leading-snug">
                        <span className="font-semibold text-ink-900">{a.who}</span> {a.what}
                      </p>
                      <span className="text-micro text-ink-500">{a.when}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>

      {confirm.open && (
        <ConfirmDialog label={confirm.label} onConfirm={confirm.onConfirm} onCancel={resetConfirm} />
      )}

      {resetState && (
        <ResetPasswordModal name={resetState.name} password={resetState.password} onClose={() => setResetState(null)} />
      )}

      {resetError && (
        <div className="fixed bottom-5 right-5 left-5 sm:left-auto z-50 sm:max-w-sm rounded-xl bg-white shadow-float">
          <div role="alert" className="alert alert-danger items-center">
            <AlertIcon />
            <span className="flex-1">{resetError}</span>
            <button type="button" onClick={() => setResetError(null)} aria-label="Dismiss" className="btn btn-ghost btn-icon -my-2 -mr-2 text-danger">
              <CloseIcon />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ResetPasswordModal({ name, password, onClose }: { name: string; password: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const titleId = useId();
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="modal-panel max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3.5">
          <span className="icon-tile bg-warn/10 text-warn"><KeyIcon size={18} /></span>
          <div className="min-w-0">
            <h2 id={titleId} className="section-title text-title">Temporary password reset</h2>
            <p className="text-body-sm text-ink-500 mt-1 leading-relaxed">
              Share this one-time password with <span className="font-semibold text-ink-700">{name}</span>. They&apos;ll be asked to set a new password on their next login. It won&apos;t be shown again.
            </p>
          </div>
        </div>
        <div className="mt-5 flex items-center gap-2 surface-muted pl-4 pr-1.5 py-1.5">
          <code className="flex-1 min-w-0 break-all font-mono text-body-lg tracking-wide text-ink-900">{password}</code>
          <button type="button" onClick={copy} className="btn btn-secondary btn-sm shrink-0">
            {copied ? <CheckIcon /> : <CopyIcon />}
            <span aria-live="polite">{copied ? "Copied!" : "Copy"}</span>
          </button>
        </div>
        <div className="mt-6 flex justify-end">
          <button type="button" onClick={onClose} className="btn btn-primary">Done</button>
        </div>
      </div>
    </div>
  );
}

/* ── Pieces ───────────────────────────────────────────────────────────── */
function MemberRow({ member, checked, onToggle, onEdit, onDelete, onReset, resetting }: { member: Member; checked: boolean; onToggle: () => void; onEdit: (id: string) => void; onDelete: (member: Member) => void; onReset: (member: Member) => void; resetting: boolean }) {
  return (
    <tr className={checked ? "bg-brand-50/60" : undefined}>
      <td>
        <label className="grid place-items-center w-10 h-10 -my-2 cursor-pointer">
          <input type="checkbox" checked={checked} onChange={onToggle} aria-label={`Select ${member.name}`} className="w-4 h-4 rounded accent-brand-600 cursor-pointer" />
        </label>
      </td>
      <td>
        <div className="flex items-center gap-3 min-w-0 max-w-60">
          <span aria-hidden="true" className={`w-9 h-9 rounded-full grid place-items-center shrink-0 text-caption font-bold ${avatarColor(member.name)}`}>{initials(member.name)}</span>
          <div className="min-w-0">
            <div className="font-semibold text-ink-900 truncate">{member.name}</div>
            <div className="text-caption text-ink-500 truncate">{member.email}</div>
          </div>
        </div>
      </td>
      <td><span className={`badge ${ROLE_BADGE[member.role]}`}>{member.role}</span></td>
      <td><div className={`truncate max-w-32 ${member.department === "—" ? "text-ink-400" : ""}`}>{member.department}</div></td>
      <td>
        <div className="flex items-center gap-1.5 min-w-0 max-w-44 text-ink-600">
          <span className="text-ink-400 shrink-0"><UsersIcon size={14} /></span>
          <span className="truncate">{member.accessScope}</span>
        </div>
      </td>
      <td>
        <span className={`badge ${STATUS_BADGE[member.status]}`}>
          <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-current" />
          {member.status}
        </span>
      </td>
      <td className="whitespace-nowrap tabular text-ink-600">{member.lastActive}</td>
      <td>
        <div className="flex items-center justify-end gap-0.5">
          <RowAction label={resetting ? "Resetting…" : "Reset password"} onClick={() => !resetting && onReset(member)} className="hover:text-warn hover:bg-warn/10">
            {resetting ? <SpinnerMini /> : <KeyIcon />}
          </RowAction>
          <RowAction label="Edit" onClick={() => onEdit(member.id)} className="hover:text-brand-700 hover:bg-brand-50">
            <EditIcon />
          </RowAction>
          <RowAction label="Delete" onClick={() => onDelete(member)} className="hover:text-danger hover:bg-danger/10">
            <TrashIcon />
          </RowAction>
        </div>
      </td>
    </tr>
  );
}

function RowAction({ label, onClick, className, children }: { label: string; onClick?: () => void; className?: string; children: React.ReactNode }) {
  return (
    <Tooltip label={label}>
      <button type="button" onClick={onClick} aria-label={label} className={`w-10 h-10 grid place-items-center rounded-xl text-ink-500 transition-colors ${className ?? ""}`}>
        {children}
      </button>
    </Tooltip>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="relative min-w-0">
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} className="field-input h-10 w-full sm:w-40 pr-9 appearance-none cursor-pointer">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"><ChevronDown /></span>
    </div>
  );
}

/** Status donut — segment sizes are data-driven, colours come from theme tokens. */
function Donut({ segments, total, caption, ariaLabel }: { segments: { count: number; color: string }[]; total: number; caption: string; ariaLabel: string }) {
  let acc = 0;
  const stops = segments.map(({ count, color }) => {
    const from = acc;
    acc += total ? (count / total) * 100 : 0;
    return `${color} ${from}% ${acc}%`;
  });
  const background = total === 0
    ? "var(--color-ink-100)"
    : `conic-gradient(${stops.join(", ")}, var(--color-ink-100) ${acc}% 100%)`;
  return (
    <div role="img" aria-label={ariaLabel} className="relative w-28 h-28 shrink-0">
      <div className="w-full h-full rounded-full" style={{ background }} />
      <div className="absolute inset-3 rounded-full bg-white shadow-card flex flex-col items-center justify-center">
        <span className="kpi-value text-title-lg">{total}</span>
        <span className="text-nano font-medium text-ink-500 mt-1">{caption}</span>
      </div>
    </div>
  );
}

/* ── Icons ────────────────────────────────────────────────────────────── */
function PlusIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>); }
function UsersIcon({ size = 18 }: { size?: number }) { return (<svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.6" /><circle cx="17" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.6" /><path d="M3 20c0-3 3-5 6-5s6 2 6 5M14 20c0-2 2-3 3.5-3 2 0 3.5 1 3.5 3" stroke="currentColor" strokeWidth="1.6" /></svg>); }
function UserPlusIcon() { return (<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" /><path d="M3 20c1.5-3.5 4-5 6-5s4.5 1.5 6 5M18 8v6M21 11h-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>); }
function ShieldIcon({ size = 18 }: { size?: number }) { return (<svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M12 3l8 4v6c0 4-3 7-8 8-5-1-8-4-8-8V7l8-4z" stroke="currentColor" strokeWidth="1.6" /><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
function LockIcon() { return (<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.6" /><path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.6" /></svg>); }
function SearchIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7.5" /><line x1="20.5" y1="20.5" x2="16.4" y2="16.4" /></svg>); }
function FunnelIcon() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" /></svg>); }
function ClipboardIcon() { return (<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="6" y="4" width="12" height="17" rx="1.5" stroke="currentColor" strokeWidth="1.5" /><path d="M9 4V3h6v1" stroke="currentColor" strokeWidth="1.5" /><path d="M9 10h6M9 14h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>); }
function AlertIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" /><path d="M12 7.5v5.5M12 16.5h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>); }
function CloseIcon() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>); }
function CopyIcon() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" /><path d="M5 15V6a2 2 0 0 1 2-2h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>); }
function CheckIcon() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
function ChevronDown() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
function EditIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 20h4l10-10a2 2 0 0 0-3-3L5 17v3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><path d="M13.5 6.5l3 3" stroke="currentColor" strokeWidth="1.6" /></svg>); }
function TrashIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
function KeyIcon({ size = 16 }: { size?: number }) { return (<svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="8" cy="8" r="4" stroke="currentColor" strokeWidth="1.6" /><path d="M11 11l8 8m-3 0l2-2m-5-1l2-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
function SpinnerMini() { return (<svg aria-hidden="true" className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.25" /><path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>); }
