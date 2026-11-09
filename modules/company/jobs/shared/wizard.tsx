import { PageHeader } from "@/components/ui/PageHeader";
import JobStepper from "./JobStepper";
import { ArrowLeft } from "./icons";
import type { StepNum } from "./types";

/* ─────────────────────────────────────────────────────────────────────────────
 * Presentation-only layout pieces for the 4-step "Post a New Job" wizard, so
 * every step renders the same heading, stepper, form cards and action bar.
 * They hold no state — each step still owns its handlers and validation.
 * ───────────────────────────────────────────────────────────────────────────── */

/** Main column + sticky rail. Rail stacks below the form under `xl`. */
export const WIZARD_GRID = "grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start";

export function WizardHeader({ current, subtitle, onBack, actions }: {
  current: StepNum;
  subtitle: string;
  onBack?: () => void;
  actions?: React.ReactNode;
}) {
  return (
    <>
      <PageHeader
        eyebrow={onBack ? <WizardBackButton onClick={onBack} /> : undefined}
        title="Post a New Job"
        subtitle={subtitle}
        actions={actions}
      />
      <div className="card px-4 py-4 sm:px-6 sm:py-5 mb-6">
        <JobStepper current={current} />
      </div>
    </>
  );
}

/** Back control for the PageHeader eyebrow (a button: it changes step, not route). */
export function WizardBackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 h-8 -ml-1 px-1 text-body-sm font-medium text-ink-500 hover:text-brand-700 transition-colors"
    >
      <ArrowLeft size={14} /> Back
    </button>
  );
}

/** A grouped form section: icon tile, title, subtitle, optional right action. */
export function FormCard({ icon, iconClassName = "bg-brand-50 text-brand-600", title, subtitle, action, children }: {
  icon?: React.ReactNode;
  iconClassName?: string;
  title: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="card-elevated p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div className="flex items-start gap-3 min-w-0">
          {icon && <span className={`icon-tile ${iconClassName}`}>{icon}</span>}
          <div className="min-w-0">
            <h2 className="section-title">{title}</h2>
            {subtitle && <p className="section-subtitle">{subtitle}</p>}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  );
}

/** Bottom action bar — stays in reach while scrolling long forms. */
export function WizardFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-ink-200/70 glass shadow-elevated px-3 py-3">
      {children}
    </div>
  );
}
