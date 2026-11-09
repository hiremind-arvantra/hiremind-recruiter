import type { JobDraft } from "../../shared/types";
import { BriefIcon, ClockIcon, PinIcon, RupeeIcon } from "../../shared/icons";

const STATUS_STYLES: Record<string, string> = {
  PUBLISHED: "badge-success",
  DRAFT: "badge-neutral",
  CLOSED: "badge-danger",
  EXPIRED: "badge-warn",
};
const STATUS_LABELS: Record<string, string> = { PUBLISHED: "Active", DRAFT: "Draft", CLOSED: "Closed", EXPIRED: "Expired" };

/* Right-rail live preview of the job being edited — rendered as the card a
 * candidate would see, raised off the canvas. */
export function JobPreviewPanel({ draft, status }: { draft: JobDraft; status: string }) {
  const skills = draft.requirements.skills.map((s) => s.name);
  const shownSkills = skills.slice(0, 3);
  const extra = skills.length - shownSkills.length;
  return (
    <div className="card-elevated overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-4 bg-linear-to-b from-brand-50/70 to-white">
        <div>
          <span className="eyebrow">Live preview</span>
          <h3 className="section-title mt-1">Job Preview</h3>
        </div>
        <span className={`badge ${STATUS_STYLES[status] ?? STATUS_STYLES.DRAFT}`}>
          <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
          {STATUS_LABELS[status] ?? status}
        </span>
      </div>
      <div className="px-5 pb-5">
        <div className="surface-muted p-4">
          <div className="flex items-start gap-3">
            <span className="icon-tile bg-white text-brand-600 border border-brand-100 shadow-card"><BriefIcon size={20} /></span>
            <div className="min-w-0">
              <div className="font-display font-bold text-body-lg text-ink-900 leading-snug wrap-break-word">{draft.details.title || "Untitled Job"}</div>
              {draft.details.department && <div className="text-body-sm text-ink-600 font-medium mt-0.5">{draft.details.department}</div>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 mt-4 text-caption text-ink-600">
            <span className="flex items-center gap-1.5 min-w-0"><PinIcon className="shrink-0 text-ink-400" /> <span className="truncate">{draft.details.workplaceLocation || "—"}</span></span>
            <span className="flex items-center gap-1.5 min-w-0"><BriefIcon className="shrink-0 text-ink-400" /> <span className="truncate">{draft.details.employmentType || "—"}</span></span>
            <span className="flex items-center gap-1.5 min-w-0"><ClockIcon className="shrink-0 text-ink-400" /> <span className="truncate">{draft.details.experienceMin || "—"}{draft.details.experienceMax ? ` - ${draft.details.experienceMax}` : ""} yrs</span></span>
            <span className="flex items-center gap-1.5 min-w-0 tabular"><RupeeIcon className="shrink-0 text-ink-400" /> <span className="truncate">{draft.compensation.annualCtc || "—"}</span></span>
          </div>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-ink-200/70">
              {shownSkills.map((s) => <span key={s} className="badge badge-neutral bg-white">{s}</span>)}
              {extra > 0 && <span className="badge badge-brand">+{extra}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* Decorative rich-text toolbar (visual only — wired editor is future work). */
export function RichToolbar() {
  return (
    <div aria-hidden="true" className="flex items-center gap-0.5 px-2 py-1.5 border border-ink-200 border-b-0 rounded-t-xl bg-ink-50 text-ink-500 text-body-sm flex-wrap">
      {["B", "I", "U"].map((c) => <button key={c} type="button" tabIndex={-1} className="w-8 h-8 hover:bg-white hover:text-ink-900 rounded-lg font-semibold">{c}</button>)}
      <span className="w-px h-4 bg-ink-200 mx-1" />
      {["“”", "≣", "•", "1."].map((c, i) => <button key={i} type="button" tabIndex={-1} className="w-8 h-8 hover:bg-white hover:text-ink-900 rounded-lg text-micro">{c}</button>)}
    </div>
  );
}
