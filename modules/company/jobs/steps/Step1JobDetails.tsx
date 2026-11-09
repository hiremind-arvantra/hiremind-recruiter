"use client";

import { useEffect, useId, useState } from "react";
import RightRail from "../shared/RightRail";
import { WIZARD_GRID, WizardHeader, FormCard, WizardFooter } from "../shared/wizard";
import { WORKPLACE_LOCATIONS, DEPARTMENTS } from "../shared/constants";
import { DEGREE_OPTIONS } from "@/modules/auth/components/candidate-reg/shared/constants";
import type { JobDraft, JobDetailsData } from "../shared/types";
import { listClients, type ClientSummaryResponse } from "@/modules/company/clients/services/client.service";

interface Props {
  data: JobDraft;
  onChange: (d: JobDraft) => void;
  onCancel: () => void;
  onContinue: () => void;
}

type FieldErrors = Partial<Record<keyof JobDetailsData, string>>;

export default function Step1JobDetails({ data, onChange, onCancel, onContinue }: Props) {
  const d = data.details;
  const [errors, setErrors] = useState<FieldErrors>({});
  const [clients, setClients] = useState<ClientSummaryResponse[]>([]);
  const descriptionId = useId();

  useEffect(() => {
    listClients(0, 100)
      .then(({ content }) => setClients(content))
      .catch(() => {}); // non-fatal — dropdown stays empty if clients fail to load
  }, []);

  const set = <K extends keyof JobDetailsData>(k: K, v: JobDetailsData[K]) => {
    onChange({ ...data, details: { ...d, [k]: v } });
    if (errors[k]) setErrors((prev) => ({ ...prev, [k]: undefined }));
  };

  function validate(): boolean {
    const next: FieldErrors = {};
    if (!d.title.trim())             next.title = "Job title is required";
    if (!d.clientId)                 next.clientId = "Client is required";
    if (!d.workplaceLocation.trim()) next.workplaceLocation = "Workplace location is required";
    if (!d.description.trim())       next.description = "Job description is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  const handleContinue = () => {
    if (validate()) onContinue();
  };

  return (
    <div>
      <WizardHeader
        current={1}
        subtitle="Fill in the details to attract the right candidates."
        actions={
          <button type="button" onClick={handleContinue} className="btn btn-primary">
            Next: Requirements <ArrowRight />
          </button>
        }
      />

      <div className={WIZARD_GRID}>
        {/* MAIN */}
        <div className="min-w-0 space-y-5">
          {/* Job Details */}
          <FormCard icon={<BriefIcon />} title="Job Details" subtitle="Provide the basic information about the job role.">
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-4">
              <Field label="Job Title" required value={d.title} onChange={(v) => set("title", v)} placeholder="e.g. Senior Software Engineer" error={errors.title} />
              <ClientSelect value={d.clientId} onChange={(v) => set("clientId", v)} clients={clients} error={errors.clientId} />
              <Select label="Job Role / Category (Optional)" value={d.roleCategory} onChange={(v) => set("roleCategory", v)} placeholder="Select role / category" options={["Software Development", "Product", "Design", "Marketing"]} />
              <Select label="Department" value={d.department} onChange={(v) => set("department", v)} placeholder="Select department" options={DEPARTMENTS} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-4 mt-5 items-end">
              <div role="group" aria-label="Employment Type">
                <Label required>Employment Type</Label>
                <div className="flex flex-wrap gap-2">
                  {["Full-time", "Part-time", "Contract", "Internship"].map((t) => (
                    <Pill key={t} active={d.employmentType === t} onClick={() => set("employmentType", t)}>{t}</Pill>
                  ))}
                </div>
              </div>
              <div role="group" aria-label="Number of Openings">
                <Label required>Number of Openings</Label>
                <div className="flex items-center justify-between h-11 rounded-xl border border-ink-200 bg-white px-1">
                  <button type="button" aria-label="Decrease openings" onClick={() => set("openings", Math.max(1, d.openings - 1))} className="w-10 h-9 rounded-lg hover:bg-ink-100 text-ink-700 text-title-sm">−</button>
                  <span className="text-body font-bold tabular text-ink-900" aria-live="polite">{d.openings}</span>
                  <button type="button" aria-label="Increase openings" onClick={() => set("openings", d.openings + 1)} className="w-10 h-9 rounded-lg hover:bg-ink-100 text-ink-700 text-title-sm">+</button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              <Select label="Workplace / Office Location" required value={d.workplaceLocation} onChange={(v) => set("workplaceLocation", v)} placeholder="Select city, state or country" options={WORKPLACE_LOCATIONS} error={errors.workplaceLocation} />
              <DateField label="Proposed Starting Date" required value={d.startingDate} onChange={(v) => set("startingDate", v)} />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Work mode">
              {(["On-site", "Remote", "Hybrid"] as const).map((m) => (
                <label
                  key={m}
                  className={`inline-flex items-center gap-2 h-10 px-3.5 rounded-xl border text-body-sm font-medium cursor-pointer transition-colors ${
                    d.workMode === m ? "border-brand-300 bg-brand-50 text-brand-700" : "border-ink-200 bg-white text-ink-700 hover:border-ink-300"
                  }`}
                >
                  <input type="radio" name="mode" checked={d.workMode === m} onChange={() => set("workMode", m)} className="accent-brand-600" />
                  {m}
                </label>
              ))}
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between mb-1.5">
                <Label required htmlFor={descriptionId}>Job Description</Label>
                <button type="button" className="ai-chip h-7 hover:bg-brand-50 transition-colors"><SparkIcon /> Ask AI</button>
              </div>
              <RichTextStub />
              <textarea
                id={descriptionId}
                value={d.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Describe the role, responsibilities, expectations, and what makes this role exciting..."
                aria-invalid={errors.description ? true : undefined}
                aria-describedby={errors.description ? `${descriptionId}-error` : undefined}
                className={`field-input min-h-32 rounded-t-none resize-y ${errors.description ? "border-danger" : ""}`}
                maxLength={3000}
              />
              <div className="flex items-center justify-between mt-1">
                {errors.description ? <span id={`${descriptionId}-error`} role="alert" className="field-error mt-0">{errors.description}</span> : <span />}
                <span className="text-micro text-ink-500 tabular">{d.description.length}/3000</span>
              </div>
            </div>
          </FormCard>

          {/* Additional Details */}
          <FormCard icon={<DocIcon />} iconClassName="bg-cobalt-50 text-cobalt-600" title="Additional Details" subtitle="Add more information to help candidates understand the role better.">
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
              <Select label="Experience Required" required value={d.experienceRange} onChange={(v) => set("experienceRange", v)} placeholder="Select experience range" options={["Fresher", "1-3 Years", "3-6 Years", "6-10 Years", "10+ Years"]} />
              <div role="group" aria-label="Overall Experience (Years)">
                <Label required>Overall Experience (Years)</Label>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <Select value={d.experienceMin} onChange={(v) => set("experienceMin", v)} placeholder="Min" options={["0", "1", "2", "3", "5", "8", "10"]} ariaLabel="Minimum years" />
                  <span className="text-ink-500 text-caption">to</span>
                  <Select value={d.experienceMax} onChange={(v) => set("experienceMax", v)} placeholder="Max" options={["1", "3", "5", "8", "10", "15"]} ariaLabel="Maximum years" />
                </div>
              </div>
              <Select label="Notice Period" value={d.noticePeriod} onChange={(v) => set("noticePeriod", v)} placeholder="Select notice period" options={["Immediate", "15 Days", "30 Days", "60 Days", "90+ Days"]} />

              <Select label="Education Qualification" value={d.educationQualification} onChange={(v) => set("educationQualification", v)} placeholder="Select qualification (Optional)" options={DEGREE_OPTIONS} />
              <Select label="Industry" value={d.industry} onChange={(v) => set("industry", v)} placeholder="Select industry (Optional)" options={["IT Services", "Product", "Banking", "Healthcare", "Education"]} />
              <Select label="Job Shift (Optional)" value={d.jobShift} onChange={(v) => set("jobShift", v)} placeholder="Select shift" options={["General Shift", "Night Shift", "Rotational"]} />

              <DateField label="Application Deadline (Optional)" value={d.applicationDeadline} onChange={(v) => set("applicationDeadline", v)} />
              <DateField label="Job Expiry (Optional)" value={d.jobExpiry} onChange={(v) => set("jobExpiry", v)} />
              <div role="group" aria-label="Is this a Confidential Job?">
                <Label>Is this a Confidential Job? <Info /></Label>
                <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-ink-100/80 border border-ink-200/60">
                  {(["Yes", "No"] as const).map((y) => (
                    <button key={y} type="button" onClick={() => set("confidential", y)} aria-pressed={d.confidential === y}
                      className={`h-9 rounded-lg text-body-sm font-semibold transition ${
                        d.confidential === y ? "bg-white text-brand-700 shadow-card" : "text-ink-600 hover:text-ink-900"
                      }`}>{y}</button>
                  ))}
                </div>
              </div>
            </div>
          </FormCard>

          {/* Footer buttons */}
          <WizardFooter>
            <button type="button" onClick={onCancel} className="btn btn-ghost">Cancel</button>
            <button type="button" onClick={handleContinue} className="btn btn-primary">
              Next: Requirements <ArrowRight />
            </button>
          </WizardFooter>
        </div>

        <RightRail
          current={1}
          data={data}
          showJobSummary={false}
          showProgress={false}
          tips={{
            title: "Tips for a great job post",
            tips: ["Use a clear and specific job title", "Add key skills and experience", "Mention salary range (recommended)", "Highlight growth and benefits", "Keep the description concise and easy to read"],
          }}
        />
      </div>
    </div>
  );
}

/* ─── Local form primitives ─── */
function Label({ children, required, htmlFor }: { children: React.ReactNode; required?: boolean; htmlFor?: string }) {
  return <label htmlFor={htmlFor} className="field-label">{children} {required && <span className="text-danger" aria-hidden="true">*</span>}</label>;
}
function ErrorText({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return <span id={id} role="alert" className="field-error block">{error}</span>;
}
function Field({ label, required, value, onChange, placeholder, error }: { label?: string; required?: boolean; value: string; onChange: (v: string) => void; placeholder?: string; error?: string }) {
  const id = useId();
  return (
    <div>
      {label && <Label required={required} htmlFor={id}>{label}</Label>}
      <input id={id} value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined}
        className={`field-input ${error ? "border-danger" : ""}`} />
      <ErrorText id={`${id}-error`} error={error} />
    </div>
  );
}
function Select({ label, required, value, onChange, placeholder, options, error, ariaLabel }: { label?: string; required?: boolean; value: string; onChange: (v: string) => void; placeholder?: string; options: string[]; error?: string; ariaLabel?: string }) {
  const id = useId();
  return (
    <div>
      {label && <Label required={required} htmlFor={id}>{label}</Label>}
      <div className="relative">
        <select id={id} value={value ?? ""} onChange={(e) => onChange(e.target.value)} aria-label={label ? undefined : ariaLabel}
          aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined}
          className={`field-input pr-9 appearance-none cursor-pointer ${error ? "border-danger" : ""} ${value ? "text-ink-900" : "text-ink-400"}`}>
          <option value="" disabled>{placeholder}</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronIcon />
      </div>
      <ErrorText id={`${id}-error`} error={error} />
    </div>
  );
}
function ClientSelect({ value, onChange, clients, error }: { value: string; onChange: (v: string) => void; clients: ClientSummaryResponse[]; error?: string }) {
  const id = useId();
  return (
    <div>
      <Label required htmlFor={id}>Client</Label>
      <div className="relative">
        <select id={id} value={value ?? ""} onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined}
          className={`field-input pr-9 appearance-none cursor-pointer ${error ? "border-danger" : ""} ${value ? "text-ink-900" : "text-ink-400"}`}>
          <option value="" disabled>{clients.length ? "Select client" : "No clients available"}</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.clientName}</option>)}
        </select>
        <ChevronIcon />
      </div>
      <ErrorText id={`${id}-error`} error={error} />
    </div>
  );
}
function DateField({ label, required, value, onChange }: { label: string; required?: boolean; value: string; onChange: (v: string) => void }) {
  const id = useId();
  return (
    <div>
      <Label required={required} htmlFor={id}>{label}</Label>
      <div className="relative">
        <span aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"><CalIcon /></span>
        <input id={id} type="date" value={value ?? ""} onChange={(e) => onChange(e.target.value)}
          className={`field-input pl-10 ${value ? "text-ink-900" : "text-ink-400"}`} />
      </div>
    </div>
  );
}
function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={`h-10 px-4 rounded-xl text-body-sm font-semibold border transition-colors ${
      active ? "bg-brand-50 text-brand-700 border-brand-300 shadow-card" : "bg-white text-ink-700 border-ink-200 hover:border-ink-300"
    }`}>{children}</button>
  );
}
/* Decorative formatting toolbar attached to the description box (not wired). */
function RichTextStub() {
  return (
    <div aria-hidden="true" className="flex items-center gap-0.5 px-2 py-1.5 border border-ink-200 border-b-0 rounded-t-xl bg-ink-50 text-ink-500 text-body-sm overflow-x-auto">
      {["B", "I", "U", "S"].map((c) => <button key={c} type="button" tabIndex={-1} className="w-8 h-8 shrink-0 hover:bg-white hover:text-ink-900 rounded-lg font-semibold">{c}</button>)}
      <span className="w-px h-4 bg-ink-200 mx-1 shrink-0" />
      {["≡", "≣", "⫶", "≣"].map((c, i) => <button key={i} type="button" tabIndex={-1} className="w-8 h-8 shrink-0 hover:bg-white hover:text-ink-900 rounded-lg">{c}</button>)}
      <span className="w-px h-4 bg-ink-200 mx-1 shrink-0" />
      {[<LinkIcon key="l"/>, <ImageIcon key="i"/>, <CodeIcon key="c"/>, <ExpandIcon key="e"/>].map((ic, i) => <button key={i} type="button" tabIndex={-1} className="w-8 h-8 shrink-0 hover:bg-white hover:text-ink-900 rounded-lg grid place-items-center">{ic}</button>)}
    </div>
  );
}

/* Icons */
function ChevronIcon() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
function BriefIcon() { return (<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.6"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.6"/></svg>); }
function DocIcon() { return (<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M7 2h8l5 5v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.6"/><path d="M9 12h6M9 16h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>); }
function ArrowRight() { return (<svg aria-hidden="true" width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 8h10m0 0L8 3m5 5l-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>); }
function CalIcon() { return (<svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6"/><path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>); }
function SparkIcon() { return (<svg aria-hidden="true" width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9z"/></svg>); }
function Info() { return (<svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" className="inline ml-0.5 -mt-0.5 text-ink-400"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6"/><path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>); }
function LinkIcon() { return (<svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M10 14l4-4M14 7l1.5-1.5a4 4 0 1 1 5.7 5.7L19 13M10 17l-1.5 1.5a4 4 0 1 1-5.7-5.7L5 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>); }
function ImageIcon() { return (<svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6"/><circle cx="9" cy="10" r="2" stroke="currentColor" strokeWidth="1.6"/><path d="M21 16l-5-5-10 9" stroke="currentColor" strokeWidth="1.6"/></svg>); }
function CodeIcon() { return (<svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M9 18l-6-6 6-6M15 6l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>); }
function ExpandIcon() { return (<svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M4 9V4h5M20 15v5h-5M4 15v5h5M20 9V4h-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>); }
