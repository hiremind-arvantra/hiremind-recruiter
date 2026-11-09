"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader, Breadcrumbs, BackLink } from "@/components/ui/PageHeader";
import { TabBar } from "@/components/ui/TabBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { roleBySlug, permissionCount, type ModuleKey, type PermissionModule } from "./data";

type PermTab = "All Permissions" | "Module Summary" | "Role Details";
const TABS: PermTab[] = ["All Permissions", "Module Summary", "Role Details"];

export default function ViewPermissionsPage({ roleSlug }: { roleSlug: string }) {
  const role = roleBySlug(roleSlug);
  const [tab, setTab] = useState<PermTab>("All Permissions");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<ModuleKey>>(new Set());

  const filteredModules = useMemo(() => {
    if (!role) return [];
    const term = search.trim().toLowerCase();
    if (!term) return role.modules;
    return role.modules
      .map((m) => ({ ...m, permissions: m.permissions.filter((p) => p.toLowerCase().includes(term)) }))
      .filter((m) => m.module.toLowerCase().includes(term) || m.permissions.length > 0);
  }, [role, search]);

  if (!role) {
    return (
      <div>
        <PageHeader eyebrow={<BackLink href="/company/team/roles">Back to Roles</BackLink>} title="View Permissions" />
        <EmptyState icon={<ShieldIcon />} title="Role not found." />
      </div>
    );
  }

  const total = permissionCount(role);
  const granted = total; // all mock permissions are granted
  const restricted = total - granted;

  const toggle = (key: ModuleKey) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  return (
    <div>
      <PageHeader
        eyebrow={
          <Breadcrumbs
            items={[
              { label: "Team", href: "/company/team" },
              { label: "Roles & Permissions", href: "/company/team/roles" },
              { label: "View Permissions" },
            ]}
          />
        }
        title="View Permissions"
        subtitle={<>Review all permissions and what the <span className="font-semibold text-ink-700">{role.name}</span> role can access and manage.</>}
        actions={
          <Link href="/company/team/roles" className="btn btn-outline">
            <ArrowLeft /> Back to Roles
          </Link>
        }
      />

      <div className="space-y-6">
        {/* Summary card */}
        <section className="card p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-8" aria-label="Role summary">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <span className="icon-tile w-12 h-12 rounded-2xl bg-brand-50 text-brand-600"><UserPlusIcon /></span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="section-title text-title">{role.name}</h2>
                <span className="badge badge-success">
                  <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-current" />
                  {role.status}
                </span>
              </div>
              <p className="section-subtitle max-w-md">{role.description}</p>
            </div>
          </div>
          <dl className="grid grid-cols-3 gap-2 sm:gap-3 lg:w-auto">
            <Metric icon={<ShieldIcon />} tone="bg-brand-50 text-brand-600" value={total} label="Total Permissions" />
            <Metric icon={<CheckCircleIcon />} tone="bg-success/10 text-success" value={granted} label="Granted" />
            <Metric icon={<XCircleIcon />} tone="bg-danger/10 text-danger" value={restricted} label="Restricted" />
          </dl>
        </section>

        {/* Tabs */}
        <TabBar
          ariaLabel="Permission views"
          items={TABS.map((t) => ({ key: t, label: t }))}
          value={tab}
          onChange={setTab}
        />

        {/* Search + filter */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 min-w-0 sm:max-w-md">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"><SearchIcon /></span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search permission..."
              aria-label="Search permissions"
              className="field-input h-10 pl-10"
            />
          </div>
          <button type="button" className="btn btn-outline self-start sm:self-auto"><FunnelIcon /> Filter</button>
        </div>

        {tab !== "All Permissions" ? (
          <EmptyState icon={<ShieldIcon />} title={`${tab} — coming soon.`} />
        ) : (
          <section className="card overflow-hidden" aria-label="Permissions by module">
            <div aria-hidden="true" className="hidden md:grid grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)_10rem] gap-4 px-5 py-3 bg-ink-50 border-b border-ink-100 text-micro font-semibold uppercase tracking-wider text-ink-500">
              <div>Module</div>
              <div>Permissions</div>
              <div className="text-right">Access</div>
            </div>

            {filteredModules.length === 0 ? (
              <div className="p-4">
                <EmptyState icon={<SearchIcon />} title="No permissions match your search." />
              </div>
            ) : (
              <ul>
                {filteredModules.map((m) => (
                  <ModuleRow key={m.key} mod={m} open={expanded.has(m.key)} onToggle={() => toggle(m.key)} />
                ))}
              </ul>
            )}
          </section>
        )}

        {/* About banner */}
        <div className="card p-5 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <span className="icon-tile bg-cobalt-50 text-cobalt-600"><InfoIcon /></span>
            <div className="min-w-0">
              <h2 className="section-title">About permissions</h2>
              <p className="section-subtitle">Permissions define what actions team members can perform across different modules.</p>
            </div>
          </div>
          <button type="button" className="btn btn-ghost shrink-0 self-start sm:self-center text-brand-700 whitespace-normal text-left">
            Learn more about roles &amp; permissions <ExternalIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Pieces ───────────────────────────────────────────────────────────── */
function Metric({ icon, tone, value, label }: { icon: React.ReactNode; tone: string; value: number; label: string }) {
  return (
    <div className="surface-muted flex flex-col items-start gap-2 px-3 py-3 sm:flex-row sm:items-center sm:gap-3 sm:px-4 min-w-0">
      <span className={`icon-tile icon-tile-sm ${tone}`}>{icon}</span>
      <div className="min-w-0 leading-tight flex flex-col-reverse gap-1">
        <dt className="text-caption text-ink-500">{label}</dt>
        <dd className="kpi-value text-title-lg">{value}</dd>
      </div>
    </div>
  );
}

function ModuleRow({ mod, open, onToggle }: { mod: PermissionModule; open: boolean; onToggle: () => void }) {
  const panelId = `perm-panel-${mod.key}`;
  return (
    <li className="border-b border-ink-100 last:border-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className={`w-full grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)_10rem] items-center gap-x-4 gap-y-2 px-5 py-4 text-left transition-colors hover:bg-ink-50 ${open ? "bg-ink-50" : ""}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="icon-tile bg-cobalt-50 text-cobalt-600"><ModuleIcon name={mod.key} /></span>
          <div className="min-w-0">
            <div className="font-semibold text-ink-900 text-body truncate">{mod.module}</div>
            <div className="text-caption text-ink-500 tabular">{mod.permissions.length} {mod.permissions.length === 1 ? "permission" : "permissions"}</div>
          </div>
        </div>
        <div className="col-span-2 row-start-2 md:col-span-1 md:row-start-auto text-body-sm text-ink-600 leading-relaxed">
          {mod.permissions.join(", ")}
        </div>
        <div className="flex items-center justify-end gap-2">
          <span className="badge badge-success"><CheckCircleIcon small /> All Granted</span>
          <span className={`grid place-items-center w-8 h-8 rounded-lg text-ink-500 transition-transform ${open ? "rotate-180" : ""}`}><ChevronDown /></span>
        </div>
      </button>
      {open && (
        <ul id={panelId} className="px-5 pb-5 md:pl-19 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 bg-ink-50">
          {mod.permissions.map((p) => (
            <li key={p} className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-ink-100 text-body-sm text-ink-700">
              <span className="min-w-0">{p}</span>
              <span className="inline-flex items-center gap-1 text-caption font-semibold text-success shrink-0"><CheckCircleIcon small /> Granted</span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function ModuleIcon({ name }: { name: ModuleKey }) {
  switch (name) {
    case "jobs": return (<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.6" /></svg>);
    case "candidates": return (<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" /><path d="M3 20c1.5-3.5 4-5 6-5s4.5 1.5 6 5M18 8v6M21 11h-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>);
    case "clients": return (<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="16" height="18" rx="1.5" stroke="currentColor" strokeWidth="1.6" /><path d="M9 8h2M13 8h2M9 12h2M13 12h2M9 16h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>);
    case "applications": return (<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M7 2h8l5 5v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.6" /><path d="M9 12h6M9 16h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>);
    case "interviews": return (<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" /><path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>);
    case "reports": return (<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 4v16h16" stroke="currentColor" strokeWidth="1.6" /><path d="M7 16l3-4 3 2 5-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>);
    case "settings": return (<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>);
  }
}

/* ── Icons ────────────────────────────────────────────────────────────── */
function UserPlusIcon() { return (<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" /><path d="M3 20c1.5-3.5 4-5 6-5s4.5 1.5 6 5M18 8v6M21 11h-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>); }
function ShieldIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 3l8 4v6c0 4-3 7-8 8-5-1-8-4-8-8V7l8-4z" stroke="currentColor" strokeWidth="1.7" /><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
function CheckCircleIcon({ small }: { small?: boolean }) { const s = small ? 12 : 16; return (<svg aria-hidden="true" width={s} height={s} viewBox="0 0 24 24" fill="none" className="shrink-0"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" /><path d="M8.5 12l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
function XCircleIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" /><path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" /></svg>); }
function SearchIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7.5" /><line x1="20.5" y1="20.5" x2="16.4" y2="16.4" /></svg>); }
function FunnelIcon() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" /></svg>); }
function InfoIcon() { return (<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" /><path d="M12 11v5M12 8h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>); }
function ArrowLeft() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M13 8H3m0 0l5-5m-5 5l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
function ChevronDown() { return (<svg aria-hidden="true" width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
function ExternalIcon() { return (<svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" className="shrink-0"><path d="M14 4h6v6M20 4l-9 9M19 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
