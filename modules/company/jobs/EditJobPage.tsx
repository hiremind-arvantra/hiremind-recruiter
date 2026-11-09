"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { encodeId } from "@/lib/urlId";
import { useRouter } from "next/navigation";
import {
  fetchJobFull,
  responseToDraft,
  updateJob,
  setJobStatus,
  publishExistingJob,
  type JobFullDetail,
} from "./services/job.service";
import { listClients, type ClientSummaryResponse } from "@/modules/company/clients/services/client.service";
import type { JobDraft } from "./shared/types";
import { ChipField, Field, Label, SectionHeader, Select } from "./shared/forms";
import { SkillsEditor } from "./shared/SkillsEditor";
import { CalendarIcon, PinIcon } from "./shared/icons";
import { JobPreviewPanel, RichToolbar } from "./components/edit-job/JobPreviewPanel";
import { PageHeader, Breadcrumbs } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { DEFAULT_WEIGHTS, loadJobWeights, saveJobWeights, type MatchWeights } from "@/modules/company/matching";
import { MatchWeightsEditor } from "@/modules/company/matching/components/MatchWeightsEditor";

/* ─────────────────────────────────────────────────────────────────────────────
 * Edit Job — loads GET /company/jobs/{id}, edits a controlled JobDraft, saves
 * via PUT /company/jobs/{id}.
 * ───────────────────────────────────────────────────────────────────────────── */
export default function EditJobPage({ jobId }: { jobId: string }) {
  const router = useRouter();
  const fetched = useRef(false);
  const fieldId = useId();

  const [draft, setDraft] = useState<JobDraft | null>(null);
  const [status, setStatus] = useState<JobFullDetail["status"]>("DRAFT");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);
  const [clients, setClients] = useState<ClientSummaryResponse[]>([]);
  // Matching weights are stored by the matching module, not by the job API, so they
  // load and save alongside the draft rather than inside it.
  const [matching, setMatching] = useState<MatchWeights>({ ...DEFAULT_WEIGHTS });
  const fetchedWeights = useRef(false);
  // DRAFT → Active is staged rather than applied on change, so "Update Job" saves the
  // edits first and the job never goes live carrying stale field values.
  const [publishOnSave, setPublishOnSave] = useState(false);

  // Manual Active/Closed toggle — recruiter's counterpart to auto-expiry.
  async function changeStatus(next: "PUBLISHED" | "CLOSED") {
    if (next === status || statusSaving) return;
    setStatusSaving(true);
    setSaveError(null);
    try {
      const updated = await setJobStatus(jobId, next);
      setStatus(updated.status);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to update job status");
    } finally {
      setStatusSaving(false);
    }
  }

  useEffect(() => {
    listClients(0, 100)
      .then(({ content }) => setClients(content))
      .catch(() => {}); // non-fatal
  }, []);

  useEffect(() => {
    if (fetchedWeights.current) return; // guard React StrictMode double-invoke
    fetchedWeights.current = true;
    loadJobWeights(jobId)
      .then(({ weights }) => setMatching(weights))
      .catch(() => {}); // non-fatal — the company defaults stay in place
  }, [jobId]);

  useEffect(() => {
    if (fetched.current) return; // guard React StrictMode double-invoke
    fetched.current = true;
    fetchJobFull(jobId)
      .then((detail) => {
        setDraft(responseToDraft(detail));
        setStatus(detail.status);
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Failed to load job"))
      .finally(() => setLoading(false));
  }, [jobId]);

  /* Section updaters — keep state changes localized and readable. */
  const setDetails = (patch: Partial<JobDraft["details"]>) =>
    setDraft((prev) => (prev ? { ...prev, details: { ...prev.details, ...patch } } : prev));
  const setRequirements = (patch: Partial<JobDraft["requirements"]>) =>
    setDraft((prev) => (prev ? { ...prev, requirements: { ...prev.requirements, ...patch } } : prev));
  const setCompensation = (patch: Partial<JobDraft["compensation"]>) =>
    setDraft((prev) => (prev ? { ...prev, compensation: { ...prev.compensation, ...patch } } : prev));

  const skillRows = draft?.requirements.skills ?? [];
  const addSkill = () => setRequirements({ skills: [...skillRows, { id: Date.now().toString(), name: "", years: 1 }] });
  const setSkillYears = (id: string, years: number) =>
    setRequirements({ skills: skillRows.map((s) => (s.id === id ? { ...s, years: Math.max(0, years) } : s)) });
  const setSkillName = (id: string, name: string) =>
    setRequirements({ skills: skillRows.map((s) => (s.id === id ? { ...s, name } : s)) });
  const removeSkill = (id: string) => setRequirements({ skills: skillRows.filter((s) => s.id !== id) });
  const addBenefit = (value: string) =>
    setCompensation({
      benefits: draft?.compensation.benefits.includes(value)
        ? draft.compensation.benefits
        : [...(draft?.compensation.benefits ?? []), value],
    });
  const removeBenefit = (value: string) =>
    setCompensation({ benefits: (draft?.compensation.benefits ?? []).filter((b) => b !== value) });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!draft) return;
    setSaving(true);
    setSaveError(null);
    try {
      await updateJob(jobId, draft);
      await saveJobWeights(jobId, matching).catch(() => {}); // stored outside the job payload
      // Publish after the edits land, so the job goes live with what was just saved.
      if (status === "DRAFT" && publishOnSave) {
        await publishExistingJob(jobId);
      }
      router.push("/company/jobs");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to update job");
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div role="status" aria-live="polite">
        <PageHeader
          eyebrow={<Breadcrumbs items={[{ label: "Jobs", href: "/company/jobs" }, { label: "Edit Job" }]} />}
          title="Edit Job"
          subtitle="Update your job details and attract the right candidates."
        />
        <div className="card-elevated p-6 space-y-4 max-w-275">
          <p className="text-body-sm text-ink-500">Loading job…</p>
          <Skeleton className="h-4 w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-11" />)}
          </div>
        </div>
      </div>
    );
  }
  if (loadError || !draft) {
    return (
      <div>
        <PageHeader
          eyebrow={<Breadcrumbs items={[{ label: "Jobs", href: "/company/jobs" }, { label: "Edit Job" }]} />}
          title="Edit Job"
        />
        <div role="alert" className="alert alert-danger max-w-275">
          {loadError ?? "Job not found."}
        </div>
        <Link href="/company/jobs" className="btn btn-outline mt-4">
          ← Back to Jobs
        </Link>
      </div>
    );
  }

  const dateCls = "field-input pl-10 text-ink-700";

  return (
    <div>
      <PageHeader
        eyebrow={
          <Breadcrumbs
            items={[
              { label: "Jobs", href: "/company/jobs" },
              { label: draft.details.title || "Untitled Job" },
              { label: "Edit Job" },
            ]}
          />
        }
        title="Edit Job"
        subtitle="Update your job details and attract the right candidates."
        actions={
          <Link href={`/company/jobs/${encodeId(jobId)}/applications`} className="btn btn-outline">
            View Applications
          </Link>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
        {/* ── Form column ── */}
        <form onSubmit={handleSubmit} className="min-w-0 space-y-5">
          <div className="card-elevated p-5 sm:p-6 lg:p-8 space-y-10">
            {/* 1 — Job Details */}
            <section>
              <SectionHeader num={1} title="Job Details" />
              <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
                <Field label="Job Title" required value={draft.details.title} onChange={(v) => setDetails({ title: v })} />
                <div>
                  <Label required htmlFor={`${fieldId}-client`}>Client</Label>
                  <div className="relative">
                    <select id={`${fieldId}-client`} value={draft.details.clientId ?? ""} onChange={(e) => setDetails({ clientId: e.target.value })}
                      className={`field-input pr-10 appearance-none cursor-pointer ${draft.details.clientId ? "text-ink-900" : "text-ink-400"}`}>
                      <option value="" disabled>{clients.length ? "Select client" : "No clients available"}</option>
                      {clients.map((c) => <option key={c.id} value={c.id}>{c.clientName}</option>)}
                    </select>
                    <ChevronIcon />
                  </div>
                </div>
                <Select label="Job Function" options={["Engineering", "Product", "Design", "Sales", "Marketing"]} value={draft.details.roleCategory} onChange={(v) => setDetails({ roleCategory: v })} />
                <Select label="Employment Type" required options={["Full-time", "Part-time", "Contract", "Internship", "Freelance"]} value={draft.details.employmentType} onChange={(v) => setDetails({ employmentType: v })} />
                <Select label="Experience Level" options={["Entry Level", "Junior", "Mid Level", "Senior", "Lead"]} value={draft.requirements.experienceLevel} onChange={(v) => setRequirements({ experienceLevel: v })} />
                <Select label="Notice Period" options={["Immediate", "15 Days", "30 Days", "60 Days", "90 Days"]} value={draft.details.noticePeriod} onChange={(v) => setDetails({ noticePeriod: v })} />
                <Field label="Number of Openings" required type="number" value={String(draft.details.openings)} onChange={(v) => setDetails({ openings: Number(v) || 0 })} />
                <Select label="Department" options={["Engineering", "Product", "Design", "Sales", "HR"]} value={draft.details.department} onChange={(v) => setDetails({ department: v })} />
                <Field label="Industry" value={draft.details.industry} onChange={(v) => setDetails({ industry: v })} />
                <Field label="Work Location" required value={draft.details.workplaceLocation} onChange={(v) => setDetails({ workplaceLocation: v })} icon={<PinIcon size={14} />} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-4 mt-5 items-start">
                <fieldset>
                  <legend className="field-label">Remote Option</legend>
                  <div className="flex flex-wrap items-center gap-2">
                    {(["On-site", "Hybrid", "Remote"] as const).map((m) => (
                      <label
                        key={m}
                        className={`inline-flex items-center gap-2 h-11 px-3.5 rounded-xl border text-body-sm font-medium cursor-pointer transition-colors ${
                          draft.details.workMode === m ? "border-brand-300 bg-brand-50 text-brand-700" : "border-ink-200 bg-white text-ink-700 hover:border-ink-300"
                        }`}
                      >
                        <input type="radio" name="remote" checked={draft.details.workMode === m} onChange={() => setDetails({ workMode: m })} className="accent-brand-600" />
                        {m}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <Field label="Job Shift" value={draft.details.jobShift} onChange={(v) => setDetails({ jobShift: v })} />
              </div>
            </section>

            {/* 2 — Job Description */}
            <section>
              <SectionHeader num={2} title="Job Description" />
              <div>
                <Label required htmlFor={`${fieldId}-description`}>Description</Label>
                <RichToolbar />
                <textarea
                  id={`${fieldId}-description`}
                  value={draft.details.description} maxLength={5000} rows={6}
                  onChange={(e) => setDetails({ description: e.target.value })}
                  className="field-input rounded-t-none resize-y"
                />
                <div className="mt-1 text-right text-micro text-ink-500 tabular">{draft.details.description.length}/5000</div>
              </div>
              <div className="mt-4">
                <Label htmlFor={`${fieldId}-responsibilities`}>Key Responsibilities</Label>
                <textarea
                  id={`${fieldId}-responsibilities`}
                  value={draft.requirements.responsibilities} maxLength={3000} rows={4}
                  onChange={(e) => setRequirements({ responsibilities: e.target.value })}
                  className="field-input resize-y"
                />
              </div>
            </section>

            {/* 3 — Requirements */}
            <section>
              <SectionHeader num={3} title="Requirements" />
              <div>
                <div className="flex flex-wrap items-end justify-between gap-2 mb-2">
                  <div>
                    <Label required>Skills &amp; Experience</Label>
                    <p className="field-hint mt-0">The minimum experience asked for each skill is used when matching candidates.</p>
                  </div>
                  <button type="button" onClick={addSkill} className="btn btn-secondary btn-sm">+ Add Skill</button>
                </div>
                <SkillsEditor
                  skills={skillRows}
                  onYears={setSkillYears}
                  onName={setSkillName}
                  onDelete={(skill) => removeSkill(skill.id)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Field label="Education" value={draft.details.educationQualification} onChange={(v) => setDetails({ educationQualification: v })} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 items-start">
                <fieldset>
                  <legend className="field-label">Experience (Years)</legend>
                  <div className="flex items-center gap-2">
                    <input type="number" min={0} value={draft.details.experienceMin} onChange={(e) => setDetails({ experienceMin: e.target.value })} aria-label="Minimum experience years" className="field-input tabular" />
                    <span className="text-ink-500 text-caption shrink-0">to</span>
                    <input type="number" min={0} value={draft.details.experienceMax} onChange={(e) => setDetails({ experienceMax: e.target.value })} aria-label="Maximum experience years" className="field-input tabular" />
                    <span className="text-ink-500 text-body-sm shrink-0">Years</span>
                  </div>
                </fieldset>
              </div>
            </section>

            {/* 4 — Compensation & Benefits */}
            <section>
              <SectionHeader num={4} title="Compensation & Benefits" />
              <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-4 items-end">
                <Field label="Annual CTC (₹)" value={draft.compensation.annualCtc} onChange={(v) => setCompensation({ annualCtc: v })} />
                <Select label="Salary Type" options={["Fixed CTC", "Salary Range"]} value={draft.compensation.salaryType} onChange={(v) => setCompensation({ salaryType: v as JobDraft["compensation"]["salaryType"] })} />
                <Select label="Currency" options={["INR (₹)", "USD ($)", "EUR (€)"]} value={draft.compensation.currency} onChange={(v) => setCompensation({ currency: v })} />
              </div>
              <div className="mt-4">
                <Label>Additional Benefits <span className="font-normal text-ink-500">(Optional)</span></Label>
                <ChipField items={draft.compensation.benefits} onRemove={removeBenefit} onAdd={addBenefit} placeholder="Add a benefit + Enter" />
              </div>
            </section>

            {/* 5 — Additional Settings */}
            <section>
              <SectionHeader num={5} title="Additional Settings" />
              <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 items-start">
                <div>
                  <Label htmlFor={`${fieldId}-deadline`}>Application Deadline</Label>
                  <div className="relative">
                    <DateIcon />
                    <input id={`${fieldId}-deadline`} type="date" value={draft.details.applicationDeadline} onChange={(e) => setDetails({ applicationDeadline: e.target.value })} className={dateCls} />
                  </div>
                </div>
                <div>
                  <Label htmlFor={`${fieldId}-expiry`}>Job Expiry</Label>
                  <div className="relative">
                    <DateIcon />
                    <input id={`${fieldId}-expiry`} type="date" value={draft.details.jobExpiry} onChange={(e) => setDetails({ jobExpiry: e.target.value })} className={dateCls} />
                  </div>
                </div>
                <div>
                  <Label htmlFor={`${fieldId}-start`}>Proposed Start Date</Label>
                  <div className="relative">
                    <DateIcon />
                    <input id={`${fieldId}-start`} type="date" value={draft.details.startingDate} onChange={(e) => setDetails({ startingDate: e.target.value })} className={dateCls} />
                  </div>
                </div>
                <div>
                  <Label htmlFor={`${fieldId}-status`}>Job Status</Label>
                  {status === "DRAFT" ? (
                    <>
                      <div className="relative">
                        <select
                          id={`${fieldId}-status`}
                          value={publishOnSave ? "PUBLISHED" : "DRAFT"}
                          onChange={(e) => setPublishOnSave(e.target.value === "PUBLISHED")}
                          className="field-input pr-10 appearance-none cursor-pointer"
                        >
                          <option value="DRAFT">Draft</option>
                          <option value="PUBLISHED">Active</option>
                        </select>
                        <ChevronIcon />
                      </div>
                      {publishOnSave && (
                        <p className="field-hint">
                          Goes live for candidates when you select Update Job.
                        </p>
                      )}
                    </>
                  ) : status === "EXPIRED" || status === "CLOSED" ? (
                    <div className="flex items-center gap-2">
                      <span id={`${fieldId}-status`} className="flex-1 h-11 px-3.5 inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-ink-50 text-body text-ink-700 font-medium">
                        <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-danger" /> Closed
                      </span>
                      <button type="button" onClick={() => changeStatus("PUBLISHED")} disabled={statusSaving} className="btn btn-secondary h-11">Reopen</button>
                    </div>
                  ) : (
                    <div className="relative">
                      <select id={`${fieldId}-status`} value="PUBLISHED" onChange={(e) => changeStatus(e.target.value as "PUBLISHED" | "CLOSED")} disabled={statusSaving} className="field-input pr-10 appearance-none cursor-pointer">
                        <option value="PUBLISHED">Active</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                      <ChevronIcon />
                    </div>
                  )}
                </div>
                <div className="md:col-span-2 2xl:col-span-1 surface-muted flex items-center justify-between gap-3 px-4 py-3 md:mt-6">
                  <div className="leading-tight">
                    <div className="text-body-sm font-semibold text-ink-800">Confidential Job</div>
                    <div className="text-caption text-ink-500 mt-0.5">Hide company name from candidates</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDetails({ confidential: draft.details.confidential === "Yes" ? "No" : "Yes" })}
                    className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${draft.details.confidential === "Yes" ? "bg-brand-600" : "bg-ink-300"}`}
                    aria-pressed={draft.details.confidential === "Yes"}
                    aria-label="Confidential job"
                  >
                    <span aria-hidden="true" className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-card transition-all ${draft.details.confidential === "Yes" ? "left-5.5" : "left-0.5"}`} />
                  </button>
                </div>
              </div>
            </section>

            {/* 6 — Candidate Matching Preferences */}
            <section>
              <SectionHeader num={6} title="Candidate Matching Preferences" />
              <p className="-mt-3 mb-4 text-body-sm text-ink-500">
                How much each category counts when candidates are scored against this job. Saved with the job when you
                update it.
              </p>
              <MatchWeightsEditor variant="compact" value={matching} onChange={setMatching} disabled={saving} />
            </section>
          </div>

          {saveError && (
            <div role="alert" className="alert alert-danger">{saveError}</div>
          )}

          {/* Footer — stays in reach on the long form */}
          <div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-ink-200/70 glass shadow-elevated px-3 py-3">
            <Link href="/company/jobs" className="btn btn-ghost">Cancel</Link>
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving
                ? (status === "DRAFT" && publishOnSave ? "Publishing…" : "Updating…")
                : (status === "DRAFT" && publishOnSave ? "Update & Publish" : "Update Job")}
            </button>
          </div>
        </form>

        {/* ── Right rail — live preview (stacks below under xl) ── */}
        <aside className="w-full xl:sticky xl:top-2">
          <JobPreviewPanel draft={draft} status={publishOnSave && status === "DRAFT" ? "PUBLISHED" : status} />
        </aside>
      </div>
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function DateIcon() {
  return (
    <span aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none">
      <CalendarIcon size={15} />
    </span>
  );
}
