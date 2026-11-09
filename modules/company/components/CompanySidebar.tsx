"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SidebarFrame from "@/components/shell/SidebarFrame";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

export default function CompanySidebar() {
  const pathname = usePathname() || "";

  const items: NavItem[] = [
    { href: "/company/dashboard",  label: "Dashboard",          icon: <DashboardIcon /> },
    { href: "/company/jobs",       label: "Jobs",               icon: <JobsIcon /> },
    { href: "/company/candidates", label: "Candidates",         icon: <UsersIcon /> },
    { href: "/company/clients",    label: "Clients",            icon: <BuildingIcon /> },
    { href: "/company/applications", label: "Applications",     icon: <DocIcon /> },
    { href: "/company/team",       label: "Team",               icon: <TeamIcon /> },
  ];

  return (
    <SidebarFrame label="Recruiter navigation">
      <nav aria-label="Recruiter" className="flex-1 min-h-0 overflow-y-auto px-3 pt-5 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="eyebrow text-ink-400 px-3 pb-2">Menu</div>
        <ul className="space-y-1">
          {items.map((it) => {
            const active = pathname === it.href || (it.href !== "/company/dashboard" && pathname.startsWith(it.href));
            return (
              <li key={it.href}>
                <Link
                  href={it.href}
                  aria-current={active ? "page" : undefined}
                  className={`nav-item ${active ? "nav-item-active" : ""}`}
                >
                  {it.icon}
                  <span className="flex-1">{it.label}</span>
                  {it.badge && (
                    <span className="badge badge-brand">{it.badge}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-3 pb-3 pt-2 shrink-0">
        <div className="relative overflow-hidden rounded-2xl p-4 text-white bg-[image:var(--gradient-brand)] shadow-glow">
          <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-10 w-28 h-28 rounded-full bg-white/20 blur-2xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -left-10 -bottom-12 w-28 h-28 rounded-full bg-brand-300/40 blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-body-sm font-bold">Upgrade Your Plan</span>
              <span aria-hidden="true">👑</span>
            </div>
            <p className="text-micro text-white/85 mb-3 leading-snug">
              Unlock premium features and take your hiring to the next level.
            </p>
            <button type="button" className="w-full h-9 bg-white text-brand-700 text-caption font-bold rounded-lg inline-flex items-center justify-center gap-1.5 hover:bg-brand-50 transition-colors">
              Upgrade Now <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-ink-200/70 px-5 py-3.5 shrink-0">
        <a href="mailto:contact@arvantra-ai.com" className="flex items-center gap-2.5 text-body-sm text-ink-600 hover:text-brand-700 transition-colors break-all">
          <HelpIcon /> contact@arvantra-ai.com
        </a>
      </div>
    </SidebarFrame>
  );
}

/* Icons */
function DashboardIcon() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7"/></svg>); }
function JobsIcon() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.7"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.7"/></svg>); }
function UsersIcon() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.7"/><circle cx="17" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.7"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5M14 20c0-2 2-3 3.5-3 2 0 3.5 1 3.5 3" stroke="currentColor" strokeWidth="1.7"/></svg>); }
function BuildingIcon() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="1.5" stroke="currentColor" strokeWidth="1.7"/><path d="M9 8h2M13 8h2M9 12h2M13 12h2M9 16h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>); }
function DocIcon() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 2h8l5 5v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.7"/><path d="M9 12h6M9 16h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>); }
function TeamIcon() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.7"/><circle cx="17" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.7"/><path d="M2.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5M15 19c0-2.2 1.5-3.5 4-3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>); }
function HelpIcon() { return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>); }
