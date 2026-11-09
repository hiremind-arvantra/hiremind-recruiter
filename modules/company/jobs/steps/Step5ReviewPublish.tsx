"use client";

import { useId, useState } from "react";
import RightRail from "../shared/RightRail";
import { WIZARD_GRID, WizardHeader, WizardFooter } from "../shared/wizard";
import type { JobDraft } from "../shared/types";

interface Props {
  data: JobDraft;
  onBack: () => void;
  onEdit: (step: 1 | 2 | 3) => void;
  onPublish: () => void;
  onSaveDraft?: () => void;
  publishing?: boolean;
  savingDraft?: boolean;
  publishError?: string | null;
}

export default function Step5ReviewPublish({ data, onBack, onEdit, onPublish, onSaveDraft, publishing = false, savingDraft = false, publishError = null }: Props) {
  const [confirm, setConfirm] = useState(true);
  const confirmId = useId();
  const busy = publishing || savingDraft;

  const actions = (
    <>
      <button type="button" onClick={onSaveDraft} disabled={busy} className="btn btn-outline">
        {savingDraft ? "Saving…" : "Save Draft"}
      </button>
      <button type="button" onClick={onPublish} disabled={!confirm || busy} className="btn btn-primary">
        {publishing ? "Submitting…" : "Submit Job"} <PaperPlane />
      </button>
    </>
  );

  return (
    <div>
      <WizardHeader
        current={4}
        subtitle="Review all details before publishing your job."
        onBack={onBack}
        actions={actions}
      />

      <div className={WIZARD_GRID}>
        <div className="min-w-0 space-y-5">
          {/* Job Details */}
          <SectionCard icon={<BriefIcon />} title="Job Details" onEdit={() => onEdit(1)}>
            <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6">
              <Field label="Job Title"          value={data.details.title || "—"} />
              <Field label="Department"         value={data.details.department || "—"} />
              <Field label="Work Location"      value={`${data.details.workplaceLocation || "—"}${data.details.workMode ? ` (${data.details.workMode})` : ""}`} />
              <Field label="Role / Category"    value={data.details.roleCategory || "—"} />
              <Field label="Employment Type"    value={data.details.employmentType || "—"} />
              <Field label="Number of Openings" value={String(data.details.openings || 1)} />
            </dl>
          </SectionCard>

          {/* Job Description */}
          <SectionCard icon={<DocIcon />} iconBg="bg-cobalt-50 text-cobalt-600" title="Job Description" onEdit={() => onEdit(1)}>
            <p className="text-body text-ink-700 leading-relaxed whitespace-pre-line">
              {data.details.description?.trim() || "Design, develop and maintain scalable web applications..."}
            </p>
            <p className="text-caption text-ink-500 italic mt-2">(Full description will be visible in job post)</p>
          </SectionCard>

          {/* Requirements */}
          <SectionCard icon={<UsersIcon />} title="Requirements" onEdit={() => onEdit(2)} iconBg="bg-success/10 text-success">
            <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6">
              <Field label="Skills"               value={data.requirements.skills.map((s) => s.name).filter(Boolean).join(", ") || "—"} />
              <Field label="Skills (Experience)"  value={data.requirements.skills.filter((s) => s.name.trim()).map((s) => `${s.name} (${s.years}+ Yrs)`).join(", ") || "—"} />
              <Field label="Experience Level"     value={data.requirements.experienceLevel || "—"} />
              <Field label="Minimum Experience"   value={`${data.requirements.minExperience} ${data.requirements.experienceUnit}`} />
              <Field label="Experience Range"     value={data.details.experienceMin && data.details.experienceMax ? `${data.details.experienceMin} - ${data.details.experienceMax} Years` : (data.details.experienceRange || "—")} />
              <Field label="Education"            value={data.details.educationQualification || "—"} />
            </dl>
          </SectionCard>

          {/* Compensation */}
          <SectionCard icon={<RupeeIcon />} title="Compensation" onEdit={() => onEdit(3)} iconBg="bg-warn/10 text-warn">
            <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6">
              <Field label="Salary Type"        value={data.compensation.salaryType === "Fixed CTC" ? "Annual (CTC)" : data.compensation.salaryType} />
              <Field label={data.compensation.salaryType === "Salary Range" ? "Salary Range" : "Total CTC"}
                     value={data.compensation.salaryType === "Salary Range"
                       ? (data.compensation.salaryMin || data.compensation.salaryMax
                           ? `₹ ${data.compensation.salaryMin || "—"} – ₹ ${data.compensation.salaryMax || "—"} per annum`
                           : "—")
                       : (data.compensation.annualCtc ? `₹ ${data.compensation.annualCtc} per annum` : "—")} />
              <Field label="Fixed Pay"          value={data.compensation.fixedPay ? `₹ ${data.compensation.fixedPay}` : "—"} />
              <Field label="Variable Pay"       value={data.compensation.variablePay ? `₹ ${data.compensation.variablePay}` : "—"} />
              <Field label="Currency"           value={data.compensation.currency || "—"} />
            </dl>
          </SectionCard>

          {/* Publish error */}
          {publishError && (
            <div role="alert" className="alert alert-danger">
              {publishError}
            </div>
          )}

          {/* Confirmation */}
          <label htmlFor={confirmId} className={`flex items-start gap-3 rounded-2xl border px-4 py-3.5 cursor-pointer transition-colors ${confirm ? "border-brand-200 bg-brand-50/50" : "border-ink-200 bg-white"}`}>
            <input id={confirmId} type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)}
              className="accent-brand-600 w-4 h-4 mt-0.5 shrink-0" />
            <span className="text-body-sm text-ink-700">
              I confirm that all the information provided is accurate and complies with company policies and applicable laws.
            </span>
          </label>

          {/* Bottom buttons */}
          <WizardFooter>
            <button type="button" onClick={onBack} className="btn btn-ghost">
              <ArrowLeft /> Back
            </button>
            <div className="flex flex-wrap items-center gap-2">
              {actions}
            </div>
          </WizardFooter>
        </div>

        <RightRail
          current={4}
          data={data}
          showProgress={false}
          tips={{
            title: "Tips for a great job post",
            tips: ["All details look good!", "Review one last time for accuracy", "An attractive job post gets better candidates"],
          }}
        />
      </div>
    </div>
  );
}

function SectionCard({ icon, iconBg = "bg-brand-50 text-brand-600", title, onEdit, children }: { icon: React.ReactNode; iconBg?: string; title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <section className="card-elevated">
      <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 sm:px-6 border-b border-ink-100">
        <div className="flex items-center gap-3 min-w-0">
          <span className={`icon-tile icon-tile-sm ${iconBg}`}>{icon}</span>
          <h2 className="section-title">{title}</h2>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={onEdit} className="btn btn-ghost btn-sm h-10 text-brand-700" aria-label={`Edit ${title}`}>
            <EditIcon /> Edit
          </button>
          <button type="button" className="text-ink-400 w-10 h-10 grid place-items-center rounded-xl hover:bg-ink-100" aria-label={`${title} section`}>
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      </div>
      <div className="px-5 pb-5 pt-4 sm:px-6">{children}</div>
    </section>
  );
}
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-caption font-medium text-ink-500">{label}</dt>
      <dd className="text-body-sm text-ink-900 font-semibold mt-1 wrap-break-word">{value}</dd>
    </div>
  );
}

/* Icons */
function BriefIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.6"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.6"/></svg>); }
function DocIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M7 2h8l5 5v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.6"/><path d="M9 12h6M9 16h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>); }
function UsersIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.6"/><circle cx="17" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.6"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5M14 20c0-2 2-3 3.5-3 2 0 3.5 1 3.5 3" stroke="currentColor" strokeWidth="1.6"/></svg>); }
function RupeeIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 4h12M6 8h12M9 4c4 0 6 3 6 6s-2 6-6 6h-3l6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>); }
function EditIcon() { return (<svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M16 4l4 4-11 11H5v-4L16 4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>); }
function ArrowLeft() { return (<svg aria-hidden="true" width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M13 8H3m0 0l5-5m-5 5l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>); }
function PaperPlane() { return (<svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M3 11l18-8-8 18-3-7-7-3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>); }
