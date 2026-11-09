"use client";

import { useState, useRef } from "react";
import type React from "react";
import type { CandidateRegData } from "../../../types/auth.types";
import { PersonIcon, BriefcaseIcon, EditIcon, ArrowLeftIcon, SpinnerIcon } from "../shared/icons";
import { uploadProfilePicture, submitProfile } from "../../../services/candidate.service";

interface Props {
  data: CandidateRegData;
  onBack: () => void;
  onEditStep: (step: number) => void;
  onSubmit: () => void;
}

export default function Step4Review({ data, onBack, onEditStep, onSubmit }: Props) {
  const [confirmed, setConfirmed]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [picturePreview, setPicturePreview] = useState<string | null>(null);
  const [pictureUploading, setPictureUploading] = useState(false);
  const [pictureError, setPictureError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setPictureError("Only image files are allowed"); return; }
    if (file.size > 5 * 1024 * 1024) { setPictureError("Image must be under 5 MB"); return; }
    setPictureError(null);
    setPicturePreview(URL.createObjectURL(file));
    setPictureUploading(true);
    try {
      await uploadProfilePicture(file);
    } catch {
      setPictureError("Upload failed. You can retry after registration.");
    } finally {
      setPictureUploading(false);
    }
  };

  const { step1, step2, step3 } = data;

  const fullName = [step1.firstName, step1.lastName].filter(Boolean).join(" ") || "—";
  const email    = step1.email    || "—";
  const phone    = step1.phone    ? `+91 ${step1.phone}` : "—";
  const location = step1.currentLocation || "—";

  const currentExp = step2.experience[0];
  const totalExp   = currentExp?.totalExperience || "—";
  const currRole   = currentExp?.jobTitle         || "—";
  const currComp   = currentExp?.company          || "—";
  const empType    = currentExp?.employmentType   || "—";

  const topSkills    = step3.skills.filter((s) => s.highlighted).slice(0, 4);
  const extraSkills  = Math.max(0, step3.skills.length - topSkills.length);
  const noticePeriod = step3.noticePeriod    || "—";
  const salary       = step3.expectedSalary  || "—";
  const roles        = step3.jobRolePreferences;
  const prefLocation = step3.preferredLocations?.length ? step3.preferredLocations.join(", ") : "—";
  const benefits     = step3.benefits;

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitProfile();
      onSubmit();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <p className="text-ink-500 text-body mb-6">
        Please review all your information before submitting your profile.
      </p>

      <div className="space-y-4">
        {/* ── Basic Information ── */}
        <SectionCard icon={<PersonIcon />} iconClass="bg-brand-50 text-brand-600"
          title="Basic Information">
          <div className="flex flex-col min-[420px]:flex-row items-start gap-5">
            {/* Avatar + upload */}
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div className="w-20 h-20 rounded-full bg-brand-50 ring-4 ring-white shadow-elevated overflow-hidden flex items-center justify-center">
                {picturePreview
                  ? <img src={picturePreview} alt="Profile" className="w-full h-full object-cover" />
                  : <span className="font-display text-brand-700 font-extrabold text-heading-lg">{fullName[0] ?? "?"}</span>
                }
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePictureChange} aria-label="Upload profile photo" />
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={pictureUploading}
                className="btn btn-ghost btn-sm text-brand-700">
                {pictureUploading ? "Uploading…" : picturePreview ? "Change" : "Upload Photo"}
              </button>
              {pictureError && <p role="alert" className="field-error mt-0 text-center max-w-[120px]">{pictureError}</p>}
            </div>
            {/* Details */}
            <div className="min-w-0 space-y-1.5 pt-1">
              <p className="font-display font-bold text-title text-ink-900 break-words">{fullName}</p>
              <p className="text-body text-ink-600 break-all">{email}</p>
              <p className="text-body text-ink-600 tabular">{phone}</p>
              <p className="text-body text-ink-600">{location}</p>
            </div>
          </div>
        </SectionCard>

        {/* ── Professional Details ── */}
        <SectionCard icon={<BriefcaseIcon />} iconClass="bg-cobalt-50 text-cobalt-600"
          title="Professional Details" onEdit={() => onEditStep(2)}>
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 mb-5">
            <SummaryItem label="Total Experience" value={totalExp} />
            <SummaryItem label="Current Role"     value={currRole} />
            <SummaryItem label="Current Company"  value={currComp} />
            <SummaryItem label="Employment Type"  value={empType}  />
          </dl>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="surface-muted p-4">
              <p className="text-body-sm font-bold text-ink-800 mb-2">Work Experience <span className="text-ink-500 tabular">({step2.experience.length})</span></p>
              <ul className="space-y-1.5">
                {step2.experience.length > 0 ? step2.experience.map((e) => (
                  <li key={e.id} className="text-body-sm text-ink-600 flex items-start gap-2">
                    <Dot />
                    {e.company} ({e.startDate} – {e.endDate})
                  </li>
                )) : (
                  <li className="text-body-sm text-ink-500 italic">No experience added yet.</li>
                )}
              </ul>
            </div>
            <div className="surface-muted p-4">
              <p className="text-body-sm font-bold text-ink-800 mb-2">Education <span className="text-ink-500 tabular">({step2.education.length})</span></p>
              <ul className="space-y-1.5">
                {step2.education.length > 0 ? step2.education.map((e) => (
                  <li key={e.id} className="text-body-sm text-ink-600 flex items-start gap-2">
                    <Dot />
                    {e.degree}, {e.institution} ({e.yearOfPassing})
                  </li>
                )) : (
                  <li className="text-body-sm text-ink-500 italic">No education added yet.</li>
                )}
              </ul>
            </div>
          </div>
        </SectionCard>

        {/* ── Skills & Certifications ── */}
        <SectionCard icon={<StarIcon />} iconClass="bg-warn/10 text-warn"
          title="Skills & Certifications" onEdit={() => onEditStep(3)}>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="surface-muted p-4">
              <p className="text-body-sm font-bold text-ink-800 mb-2.5">Top Skills</p>
              {topSkills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {topSkills.map((s) => (
                    <span key={s.name} className="badge badge-neutral h-7 px-3 text-caption bg-white">{s.name}</span>
                  ))}
                  {extraSkills > 0 && (
                    <span className="badge badge-brand h-7 px-3 text-caption">+{extraSkills} more</span>
                  )}
                </div>
              ) : (
                <p className="text-body-sm text-ink-500 italic">No skills added yet.</p>
              )}
            </div>
            <div className="surface-muted p-4">
              <p className="text-body-sm font-bold text-ink-800 mb-2">Certifications <span className="text-ink-500 tabular">({step3.certifications.length})</span></p>
              <ul className="space-y-1.5">
                {step3.certifications.length > 0 ? step3.certifications.map((c) => (
                  <li key={c.id} className="text-body-sm text-ink-600 flex items-start gap-2">
                    <Dot />{c.name}
                  </li>
                )) : (
                  <li className="text-body-sm text-ink-500 italic">No certifications added yet.</li>
                )}
              </ul>
            </div>
          </div>
        </SectionCard>

        {/* ── Preferences ── */}
        <SectionCard icon={<HeartIcon />} iconClass="bg-peach-50 text-peach-700"
          title="Preferences" onEdit={() => onEditStep(3)}>
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 mb-5">
            <SummaryItem label="Notice Period"         value={noticePeriod} />
            <SummaryItem label="Expected Salary (CTC)" value={salary}       />
            <SummaryItem label="Role Preferences"      value={roles.length ? roles.join(", ") : "—"} />
            <div className="min-w-0">
              <dt className="text-caption text-ink-500 font-medium mb-1">Preferred Location</dt>
              <dd className="text-body font-bold text-ink-900 break-words">{prefLocation}</dd>
              {step3.openToRelocate && (
                <dd className="text-caption text-green-700 font-semibold flex items-center gap-1 mt-1">
                  <CheckSmall /> Open to relocate
                </dd>
              )}
            </div>
          </dl>
          <div className="pt-4 border-t border-ink-200/70">
            <p className="text-body-sm font-bold text-ink-800 mb-2.5">Other Benefits</p>
            {benefits.length > 0 ? (
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {benefits.map((b) => (
                  <span key={b} className="flex items-center gap-1.5 text-body-sm text-ink-600">
                    <span className="grid place-items-center w-4 h-4 rounded-full bg-green-100 text-green-700"><CheckSmall /></span>
                    {b}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-body-sm text-ink-500 italic">No benefits selected.</p>
            )}
          </div>
        </SectionCard>
      </div>

      {/* ── Confirmation + actions ── */}
      <div className="mt-8 pt-6 border-t border-ink-200/70">
        <label htmlFor="review-confirm" className="surface-muted flex items-start gap-3 p-4 cursor-pointer has-checked:border-brand-200 has-checked:bg-brand-50/60 transition-colors">
          <input id="review-confirm" type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded accent-brand-600 shrink-0" />
          <span className="text-body-sm text-ink-700 leading-relaxed">
            I confirm that all the information provided is true and accurate to the best of my knowledge.
          </span>
        </label>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button type="button" onClick={onBack} className="btn btn-outline btn-lg px-4 sm:px-6">
            <ArrowLeftIcon /> Back
          </button>
          <button type="button" onClick={handleSubmit} disabled={!confirmed || submitting}
            className="btn btn-primary btn-lg px-5 sm:px-8">
            {submitting ? <><SpinnerIcon /> Submitting...</> : <>Submit Profile <SendIcon /></>}
          </button>
        </div>

        {submitError && (
          <p role="alert" className="field-error justify-end text-right mt-3">
            {submitError}
          </p>
        )}
      </div>
    </div>
  );
}

/* ── Sub-components ── */
function SectionCard({ icon, iconClass, title, onEdit, children }: {
  icon: React.ReactNode; iconClass: string;
  title: string; onEdit?: () => void; children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-ink-200/70 bg-white">
      <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-ink-200/70">
        <div className="flex items-center gap-3 min-w-0">
          <span className={`icon-tile icon-tile-sm ${iconClass}`}>{icon}</span>
          <h3 className="section-title truncate">{title}</h3>
        </div>
        {onEdit && (
          <button type="button" onClick={onEdit} aria-label={`Edit ${title}`}
            className="btn btn-outline btn-sm shrink-0">
            <EditIcon /> Edit
          </button>
        )}
      </div>
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-caption text-ink-500 font-medium mb-1">{label}</dt>
      <dd className="text-body font-bold text-ink-900 leading-tight break-words">{value || "—"}</dd>
    </div>
  );
}

function Dot() {
  return <span aria-hidden="true" className="mt-2 w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />;
}

/* ── Local icons not in shared ── */
function StarIcon()    { return <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 3l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>; }
function HeartIcon()   { return <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>; }
function CheckSmall()  { return <svg aria-hidden="true" width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function SendIcon()    { return <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>; }
