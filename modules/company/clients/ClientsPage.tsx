"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { encodeId } from "@/lib/urlId";
import { useRouter } from "next/navigation";
import { Pagination } from "@/components/ui/Pagination";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/Skeleton";
import { Tooltip, ConfirmDialog } from "@/modules/auth/components/candidate-reg/shared/ui";
import { useConfirmDelete } from "@/modules/auth/components/candidate-reg/shared/hooks";
import {
  listClients,
  deleteClient,
  setClientLocked,
  type ClientSummaryResponse,
} from "./services/client.service";

interface Client {
  id: string;
  name: string;
  industry: string;
  accountManager: string;
  openJobs: number;
  lastActivity: string;
  status: "Active" | "Inactive" | "Prospect";
  locked: boolean;
}

const STATUS_LABEL: Record<ClientSummaryResponse["status"], Client["status"]> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  PROSPECT: "Prospect",
};

const STATUS_BADGE: Record<Client["status"], string> = {
  Active: "badge-success",
  Inactive: "badge-neutral",
  Prospect: "badge-info",
};

const COLUMNS = ["Client Name", "Industry", "Account Manager", "Open Jobs", "Last Activity", "Status", "Actions"];

const INDUSTRY_OPTIONS = ["All Industries", "Information Technology", "Finance & Banking", "Healthcare", "Manufacturing", "Retail & E-commerce", "Education", "Consulting", "Other"];
const STATUS_OPTIONS = ["All", "Active", "Inactive", "Prospect"];

/** Default (unfiltered) selection — "Search" applies, "Reset" returns here. */
const DEFAULT_FILTERS = { industry: "All Industries", status: "All", accountManager: "All" };

function fmtDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function mapClient(raw: ClientSummaryResponse): Client {
  return {
    id: raw.id,
    name: raw.clientName,
    industry: raw.industry,
    accountManager: raw.accountManager?.trim() || "Unassigned",
    openJobs: raw.openJobs,
    lastActivity: fmtDate(raw.lastActivity),
    status: STATUS_LABEL[raw.status] ?? "Active",
    locked: raw.locked,
  };
}

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { confirm, triggerDelete, resetConfirm } = useConfirmDelete();

  // Filters (client-side — the list API has no filter params yet). Apply-on-click
  // like the Jobs list: the dropdowns hold *pending* selections; only "Search"
  // copies them into `applied`, which actually drives the filtered result.
  const [industry, setIndustry] = useState(DEFAULT_FILTERS.industry);
  const [statusFilter, setStatusFilter] = useState(DEFAULT_FILTERS.status);
  const [accountManager, setAccountManager] = useState(DEFAULT_FILTERS.accountManager);
  const [applied, setApplied] = useState(DEFAULT_FILTERS);

  const applyFilters = () =>
    setApplied({ industry, status: statusFilter, accountManager });

  const resetFilters = () => {
    setIndustry(DEFAULT_FILTERS.industry);
    setStatusFilter(DEFAULT_FILTERS.status);
    setAccountManager(DEFAULT_FILTERS.accountManager);
    setApplied(DEFAULT_FILTERS);
  };

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetched = useRef(false);
  useEffect(() => {
    if (fetched.current) return; // StrictMode double-invoke guard
    fetched.current = true;
    listClients(0, 100)
      .then(({ content }) => setClients(content.map(mapClient)))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load clients"))
      .finally(() => setLoading(false));
  }, []);

  const handleEdit = (id: string) => router.push(`/company/clients/${encodeId(id)}/edit`);

  // Soft-delete: remove the row from local state once the server confirms.
  const handleDelete = (client: Client) =>
    triggerDelete(`Delete "${client.name}"?`, async () => {
      await deleteClient(client.id);
      setClients((prev) => prev.filter((c) => c.id !== client.id));
      resetConfirm();
    });

  // Lock/unlock: a locked client can't have new jobs created against it.
  const handleToggleLock = async (client: Client) => {
    const next = !client.locked;
    setClients((prev) => prev.map((c) => (c.id === client.id ? { ...c, locked: next } : c))); // optimistic
    try {
      await setClientLocked(client.id, next);
    } catch (err) {
      setClients((prev) => prev.map((c) => (c.id === client.id ? { ...c, locked: !next } : c))); // revert
      setError(err instanceof Error ? err.message : "Failed to update client lock");
    }
  };

  // Account Manager filter options derived from the loaded clients (unique,
  // alpha-sorted, "Unassigned" last) — so the dropdown reflects real assignees.
  const accountManagerOptions = useMemo(() => {
    const names = new Set(clients.map((c) => c.accountManager));
    const hasUnassigned = names.delete("Unassigned");
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    return ["All", ...sorted, ...(hasUnassigned ? ["Unassigned"] : [])];
  }, [clients]);

  // Stat cards reflect ALL clients, independent of the active filters.
  const total = clients.length;
  const active = clients.filter((c) => c.status === "Active").length;
  const inactive = clients.filter((c) => c.status === "Inactive").length;
  const prospects = clients.filter((c) => c.status === "Prospect").length;
  const openJobs = clients.reduce((sum, c) => sum + c.openJobs, 0);

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      if (applied.industry !== "All Industries" && c.industry !== applied.industry) return false;
      if (applied.status !== "All" && c.status !== applied.status) return false;
      if (applied.accountManager !== "All" && c.accountManager !== applied.accountManager) return false;
      return true;
    });
  }, [clients, applied]);

  // Reset to the first page whenever the applied filters or page size change.
  useEffect(() => {
    setPage(1);
  }, [applied, rowsPerPage]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const pageRows = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  // Newest clients (list arrives createdAt DESC) for the rail.
  const recentAdditions = clients.slice(0, 4);

  // Clients ranked by live open-job count (PUBLISHED jobs linked to the client).
  const topClients = [...clients]
    .filter((c) => c.openJobs > 0)
    .sort((a, b) => b.openJobs - a.openJobs)
    .slice(0, 5);
  const maxOpenJobs = topClients[0]?.openJobs ?? 0;

  const legend = [
    { label: "Active", count: active, dot: "bg-success" },
    { label: "Inactive", count: inactive, dot: "bg-ink-400" },
    { label: "Prospects", count: prospects, dot: "bg-cobalt-500" },
  ];

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle="Manage your client organizations and relationships."
        actions={
          <Link href="/company/clients/new" className="btn btn-primary">
            <PlusIcon /> Add New Client
          </Link>
        }
      />

      <div className="space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard iconClassName="bg-brand-50 text-brand-600" icon={<BuildingIcon />} label="Total Clients" value={String(total)} />
          <StatCard iconClassName="bg-success/10 text-success" icon={<ShieldIcon />} label="Active Clients" value={String(active)} />
          <StatCard iconClassName="bg-cobalt-50 text-cobalt-600" icon={<BriefIcon />} label="Open Jobs" value={String(openJobs)} />
        </div>

        {/* Table card: filter toolbar (apply-on-click) + table + footer */}
        <section className="card overflow-hidden" aria-label="Client list">
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-end border-b border-ink-100">
            <FilterSelect id="client-filter-industry" label="Industry" value={industry} onChange={setIndustry} options={INDUSTRY_OPTIONS} />
            <FilterSelect id="client-filter-status" label="Status" value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} />
            <FilterSelect id="client-filter-manager" label="Account Manager" value={accountManager} onChange={setAccountManager} options={accountManagerOptions} />
            <div className="flex gap-2 sm:ml-auto">
              <button type="button" onClick={applyFilters} className="btn btn-primary flex-1 sm:flex-none">
                <FunnelIcon /> Search
              </button>
              <button type="button" onClick={resetFilters} className="btn btn-outline flex-1 sm:flex-none">
                Reset
              </button>
            </div>
          </div>

          {loading ? (
            <LoadingState label="Loading clients…" rows={3} className="p-4" />
          ) : error ? (
            <div className="p-4">
              <div role="alert" className="alert alert-danger">
                <AlertIcon />
                <span>{error}</span>
              </div>
            </div>
          ) : total === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={<BuildingIcon />}
                title="No clients added yet"
                description="Get started by adding your first client organization. Once added, you can manage open jobs, track activity, and build stronger relationships."
                action={
                  <Link href="/company/clients/new" className="btn btn-primary">
                    <PlusIcon /> Add New Client
                  </Link>
                }
              />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-4">
              <EmptyState icon={<FunnelIcon />} title="No clients match your filters." />
            </div>
          ) : (
            <div className="table-scroll max-h-[min(720px,75vh)]">
              <table className="data-table min-w-235">
                <thead>
                  <tr>
                    {COLUMNS.map((c) => (
                      <th key={c} scope="col" className={c === "Actions" ? "text-right" : undefined}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((c) => (
                    <ClientRow key={c.id} client={c} onEdit={handleEdit} onDelete={handleDelete} onToggleLock={handleToggleLock} />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          {!loading && !error && filtered.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-ink-100">
              <span className="text-body-sm text-ink-500 tabular">
                Showing {(page - 1) * rowsPerPage + 1}–{Math.min(page * rowsPerPage, filtered.length)} of {filtered.length} clients
              </span>
              {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}
              <div className="flex items-center gap-2 text-body-sm text-ink-500">
                <label htmlFor="clients-rows-per-page">Rows per page:</label>
                <div className="relative">
                  <select
                    id="clients-rows-per-page"
                    value={rowsPerPage}
                    onChange={(e) => setRowsPerPage(Number(e.target.value))}
                    className="field-input h-10 w-auto pl-3 pr-8 appearance-none cursor-pointer tabular"
                  >
                    {[10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"><ChevronDown /></span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ── Insights rail — sits under the table so the 7-column table keeps its width ── */}
        <aside className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4 items-start" aria-label="Client insights">
          {/* Client Overview */}
          <div className="card p-5">
            <SectionHeader as="h3" title="Client Overview" />
            <div className="mt-4 flex items-center gap-5">
              <Donut
                segments={[
                  { count: active, color: "var(--color-success)" },
                  { count: inactive, color: "var(--color-ink-400)" },
                  { count: prospects, color: "var(--color-cobalt-500)" },
                ]}
                total={total}
                caption="Total Clients"
                ariaLabel={`${total} clients: ${active} active, ${inactive} inactive, ${prospects} prospects`}
              />
              <ul className="flex-1 min-w-0 max-w-64 space-y-2.5">
                {legend.map(({ label, count, dot }) => (
                  <li key={label} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 min-w-0">
                      <span aria-hidden="true" className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                      <span className="text-caption text-ink-600 truncate">{label}</span>
                    </span>
                    <span className="text-caption font-semibold text-ink-800 tabular shrink-0">
                      {count} <span className="font-medium text-ink-500">({total ? Math.round((count / total) * 100) : 0}%)</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Top Clients by Open Jobs */}
          {topClients.length === 0 ? (
            <EmptyRailCard
              title="Top Clients by Open Jobs"
              icon={<BriefIcon />}
              heading="No open jobs yet"
              sub="Post jobs linked to a client to see them ranked here."
            />
          ) : (
            <div className="card p-5">
              <SectionHeader as="h3" title="Top Clients by Open Jobs" />
              <ul className="mt-4 space-y-3.5">
                {topClients.map((c) => (
                  <li key={c.id}>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-body-sm font-semibold text-ink-800 truncate">{c.name}</span>
                      <span className="text-caption font-semibold text-ink-600 tabular shrink-0">{c.openJobs} open</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-ink-100 overflow-hidden">
                      <div className="h-full rounded-full bg-(image:--gradient-brand)" style={{ width: `${maxOpenJobs ? (c.openJobs / maxOpenJobs) * 100 : 0}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recent Client Additions */}
          {recentAdditions.length === 0 ? (
            <EmptyRailCard
              title="Recent Client Additions"
              icon={<UserPlusIcon />}
              heading="No recent clients"
              sub="Newly added clients will appear here."
            />
          ) : (
            <div className="card p-5">
              <SectionHeader as="h3" title="Recent Client Additions" />
              <ul className="mt-4 space-y-3">
                {recentAdditions.map((c) => (
                  <li key={c.id} className="flex items-center gap-3">
                    <ClientMonogram name={c.name} />
                    <div className="min-w-0 flex-1">
                      <div className="text-body-sm font-semibold text-ink-900 truncate">{c.name}</div>
                      <div className="text-caption text-ink-500 truncate">{c.industry}</div>
                    </div>
                    <span className="text-micro text-ink-500 tabular shrink-0">{c.lastActivity}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Quick Actions — shortcuts to existing routes only */}
          <nav className="card p-5" aria-label="Quick actions">
            <SectionHeader as="h3" title="Quick Actions" />
            <ul className="mt-3 space-y-1">
              {[
                { href: "/company/clients/new", label: "Add New Client", icon: <PlusIcon /> },
                { href: "/company/jobs/new", label: "Post a Job", icon: <BriefIcon /> },
                { href: "/company/applications", label: "View Applications", icon: <UserPlusIcon /> },
              ].map((a) => (
                <li key={a.href}>
                  <Link href={a.href} className="group flex items-center gap-3 h-11 px-2 -mx-2 rounded-xl text-body-sm font-medium text-ink-700 hover:bg-ink-50 hover:text-ink-900 transition-colors">
                    <span className="icon-tile icon-tile-sm bg-ink-100 text-ink-600 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">{a.icon}</span>
                    <span className="flex-1">{a.label}</span>
                    <span className="text-ink-400 group-hover:text-brand-600 transition-colors"><ChevronRight /></span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      </div>

      {confirm.open && (
        <ConfirmDialog label={confirm.label} onConfirm={confirm.onConfirm} onCancel={resetConfirm} />
      )}
    </div>
  );
}

/* ── Pieces ───────────────────────────────────────────────────────────── */
/* Truncates to one line; surfaces the full text as a hover tooltip only when
 * the text is actually clipped (scrollWidth > clientWidth). Re-measures on
 * container resize. */
function TruncatedText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setOverflowing(el.scrollWidth > el.clientWidth);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text]);

  return (
    <div ref={ref} className={`truncate ${className ?? ""}`} title={overflowing ? text : undefined}>
      {text}
    </div>
  );
}

function ClientMonogram({ name }: { name: string }) {
  return (
    <span aria-hidden="true" className="w-9 h-9 rounded-xl bg-ink-100 text-ink-700 grid place-items-center shrink-0 font-display font-bold text-caption">
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}

function ClientRow({
  client,
  onEdit,
  onDelete,
  onToggleLock,
}: {
  client: Client;
  onEdit: (id: string) => void;
  onDelete: (client: Client) => void;
  onToggleLock: (client: Client) => void;
}) {
  return (
    <tr>
      <td>
        <div className="flex items-center gap-3 min-w-0 max-w-65">
          <ClientMonogram name={client.name} />
          <div className="min-w-0">
            <TruncatedText text={client.name} className="font-semibold text-ink-900" />
            {client.locked && (
              <span className="mt-1 badge badge-warn" title="Locked — new jobs can't be created for this client">
                <LockIcon size={11} /> Locked
              </span>
            )}
          </div>
        </div>
      </td>
      <td>
        <TruncatedText text={client.industry} className="max-w-42.5" />
      </td>
      <td>
        <div className={`truncate max-w-40 ${client.accountManager === "Unassigned" ? "text-ink-500" : ""}`}>{client.accountManager}</div>
      </td>
      <td className="tabular">
        {client.openJobs > 0 ? (
          <span className="badge badge-brand">{client.openJobs} open</span>
        ) : (
          <span className="text-ink-500">0</span>
        )}
      </td>
      <td className="whitespace-nowrap tabular text-ink-600">{client.lastActivity}</td>
      <td>
        <span className={`badge ${STATUS_BADGE[client.status]}`}>
          <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-current" />
          {client.status}
        </span>
      </td>
      <td>
        <div className="flex items-center justify-end gap-1">
          <RowAction label="Edit" onClick={() => onEdit(client.id)} className="hover:text-brand-700 hover:bg-brand-50">
            <EditIcon />
          </RowAction>
          <RowAction label="Delete" onClick={() => onDelete(client)} className="hover:text-danger hover:bg-danger/10">
            <TrashIcon />
          </RowAction>
          {/* A single toggle — Unlock when locked, Lock when open. */}
          {client.locked ? (
            <RowAction label="Unlock" onClick={() => onToggleLock(client)} className="text-success hover:bg-success/10">
              <UnlockIcon />
            </RowAction>
          ) : (
            <RowAction label="Lock" onClick={() => onToggleLock(client)} className="hover:text-warn hover:bg-warn/10">
              <LockIcon />
            </RowAction>
          )}
        </div>
      </td>
    </tr>
  );
}

function RowAction({
  label,
  onClick,
  className,
  children,
}: {
  label: string;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip label={label}>
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={`w-10 h-10 grid place-items-center rounded-xl text-ink-500 transition-colors ${className ?? ""}`}
      >
        {children}
      </button>
    </Tooltip>
  );
}

function FilterSelect({ id, label, value, onChange, options }: { id: string; label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="w-full sm:w-52">
      <label htmlFor={id} className="field-label">{label}</label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="field-input h-10 pr-9 appearance-none cursor-pointer"
        >
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"><ChevronDown /></span>
      </div>
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

function EmptyRailCard({ title, icon, heading, sub }: { title: string; icon: React.ReactNode; heading: string; sub: string }) {
  return (
    <div className="card p-5">
      <SectionHeader
        as="h3"
        title={title}
        action={<button type="button" className="btn btn-ghost btn-sm">View All</button>}
      />
      <div className="py-6 flex flex-col items-center text-center">
        <span className="empty-state-icon">{icon}</span>
        <div className="text-body-sm font-semibold text-ink-700">{heading}</div>
        <div className="text-caption text-ink-500 mt-0.5 max-w-xs">{sub}</div>
      </div>
    </div>
  );
}

/* ── Icons ────────────────────────────────────────────────────────────── */
function PlusIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>); }
function BuildingIcon() { return (<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="16" height="18" rx="1.5" stroke="currentColor" strokeWidth="1.6" /><path d="M9 8h2M13 8h2M9 12h2M13 12h2M9 16h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>); }
function ShieldIcon() { return (<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3l8 4v6c0 4-3 7-8 8-5-1-8-4-8-8V7l8-4z" stroke="currentColor" strokeWidth="1.6" /><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
function BriefIcon() { return (<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.6" /></svg>); }
function UserPlusIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" /><path d="M3 20c1.5-3.5 4-5 6-5s4.5 1.5 6 5M18 8v6M21 11h-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>); }
function FunnelIcon() { return (<svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M3 5h18l-7 8v6l-4-2v-4L3 5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>); }
function AlertIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" /><path d="M12 7.5v5.5M12 16.5h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>); }
function EditIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 20h4l10-10a2 2 0 0 0-3-3L5 17v3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><path d="M13.5 6.5l3 3" stroke="currentColor" strokeWidth="1.6" /></svg>); }
function TrashIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
function LockIcon({ size = 16 }: { size?: number }) { return (<svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.8" /><path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.8" /></svg>); }
function UnlockIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.6" /><path d="M8 11V8a4 4 0 0 1 7.5-1.9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>); }
function ChevronDown() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
function ChevronRight() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
