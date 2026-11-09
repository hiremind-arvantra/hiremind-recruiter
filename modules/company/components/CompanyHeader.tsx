"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import BrandLogo from "@/components/marketing/BrandLogo";
import SidebarMenuButton from "@/components/shell/SidebarMenuButton";
import { getStoredCompanyName, getStoredCompanyLogoUrl, clearAuth } from "@/lib/api/config";

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

const MENU_ITEM =
  "w-full text-left px-2.5 py-2 rounded-lg text-body-sm font-semibold transition-colors flex items-center gap-2";

export default function CompanyHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [companyName, setCompanyName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCompanyName(getStoredCompanyName() ?? "");
    setLogoUrl(getStoredCompanyLogoUrl());
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  function handleLogoClick() {
    if (pathname === "/company/dashboard") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      router.push("/company/dashboard");
    }
  }

  function handleLogout() {
    clearAuth();
    router.push("/login");
  }

  const displayName = companyName || "My Company";
  const avatarInitials = companyName ? initials(companyName) : "MC";

  return (
    <header className="chrome-header shrink-0 relative z-30 flex items-stretch">
      {/* Brand column — the sidebar width from md up, so what follows starts at the page
          content edge. Below md the sidebar is a drawer and this column collapses. */}
      <div className="shrink-0 flex items-center gap-1.5 pl-2 pr-2 sm:pl-4 md:pl-[calc(var(--shell-inset)+24px)] md:pr-6 md:w-[calc(var(--sidebar-w)+var(--shell-inset))]">
        <SidebarMenuButton />
        <button type="button" onClick={handleLogoClick} className="cursor-pointer rounded-lg" aria-label="HireMind dashboard">
          <BrandLogo size="md" />
        </button>
      </div>

      {/* Actions, right-aligned. There was a global search box here; it searched nothing,
          so it is gone and each page keeps its own search over its own data. */}
      <div className="flex-1 min-w-0 flex items-center gap-2 sm:gap-3 px-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1 sm:gap-2 shrink-0 ml-auto">
          <IconBtn aria-label="Notifications" badge="3"><BellIcon /></IconBtn>
          <IconBtn aria-label="Messages"      badge="6"><EnvelopeIcon /></IconBtn>
          <div className="w-px h-7 bg-ink-200 mx-1" />
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Account menu"
              className="flex items-center gap-2.5 p-1 sm:pr-2.5 rounded-xl hover:bg-ink-100/80 transition-colors"
            >
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt={displayName}
                  className="w-9 h-9 rounded-xl object-contain border border-ink-200/80 bg-white p-0.5 shrink-0"
                />
              ) : (
                <span className="w-9 h-9 rounded-xl bg-[image:var(--gradient-brand)] text-white text-caption font-bold flex items-center justify-center shrink-0">
                  {avatarInitials}
                </span>
              )}
              <span className="hidden sm:block text-left leading-tight min-w-0">
                <span className="block text-body-sm font-semibold text-ink-900 max-w-[160px] truncate">{displayName}</span>
                <span className="block text-micro text-ink-400">Recruitment Company</span>
              </span>
              <span className="hidden sm:block text-ink-400"><ChevronDown /></span>
            </button>
            {menuOpen && (
              <div role="menu" className="card-elevated absolute right-0 top-[calc(100%+8px)] w-48 p-1.5 z-50 animate-fade-up">
                <Link
                  href="/company/settings"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  className={`${MENU_ITEM} text-ink-700 hover:bg-ink-100 hover:text-ink-900`}
                >
                  <GearIcon /> Settings
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className={`${MENU_ITEM} text-danger hover:bg-danger/5`}
                >
                  <LogoutIcon /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function IconBtn({ children, badge, ...rest }: { children: React.ReactNode; badge?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className="relative w-10 h-10 rounded-xl text-ink-600 grid place-items-center hover:bg-brand-50 hover:text-brand-600 transition-colors" {...rest}>
      {children}
      {badge && (
        <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-danger text-white text-nano font-bold flex items-center justify-center ring-2 ring-white">
          {badge}
        </span>
      )}
    </button>
  );
}

function BellIcon() { return (<svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9zM10 21a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>); }
function EnvelopeIcon() { return (<svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.7"/><path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="1.7"/></svg>); }
function ChevronDown() { return (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>); }
function GearIcon() { return (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4.8a7 7 0 0 0-2.1-1.2L14 3h-4l-.4 2.4a7 7 0 0 0-2.1 1.2l-2.4-.8-2 3.4 2 1.6c-.1.4-.1.8-.1 1.2s0 .8.1 1.2l-2 1.6 2 3.4 2.4-.8c.7.5 1.4.9 2.1 1.2L10 21h4l.4-2.4c.7-.3 1.4-.7 2.1-1.2l2.4.8 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>); }
function LogoutIcon() { return (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>); }
