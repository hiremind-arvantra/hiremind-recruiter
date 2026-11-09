import RequireAuth from "@/components/auth/RequireAuth";
import CompanyHeader from "@/modules/company/components/CompanyHeader";
import CompanySidebar from "@/modules/company/components/CompanySidebar";

import type { Metadata } from "next";

// Everything in this shell is behind a login; keep it out of search results.
export const metadata: Metadata = { robots: { index: false, follow: false } };

/* Recruiter workspace shell — same geometry as the candidate shell ((app)/layout.tsx). */
export default function CompanyAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth>
      <div className="h-screen flex flex-col overflow-hidden app-canvas">
        <CompanyHeader />
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <CompanySidebar />
          <main id="main" tabIndex={-1} className="flex-1 min-w-0 min-h-0 overflow-y-auto">
            <div className="app-page">{children}</div>
          </main>
        </div>
      </div>
    </RequireAuth>
  );
}
