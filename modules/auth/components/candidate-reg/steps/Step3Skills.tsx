"use client";

import { useRef, useState } from "react";
import type { CandidateRegStep3Data, Skill } from "../../../types/auth.types";
import AddSkillModal from "../modals/AddSkillModal";
import CertificationsSection from "../sections/CertificationsSection";
import PreferencesSection from "../sections/PreferencesSection";
import {
  addCandidateSkill,
  buildPreferencesPayload,
  buildSkillPayload,
  deleteCandidateSkill,
  savePreferences,
  updateCandidateSkill,
} from "../../../services/candidate.service";
import { isParsedRow } from "../shared/resumePrefill";
import { cleanYears, missingYears } from "../shared/skillYears";
import { PROFICIENCY_DOTS, POPULAR_SKILL_COLORS } from "../shared/constants";
import { Tooltip, ConfirmDialog, DotsIndicator, EmptyState } from "../shared/ui";
import { useConfirmDelete } from "../shared/hooks";
import {
  SkillsIcon,
  SkillsIconLg,
  EditIcon,
  TrashIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  SpinnerIcon,
} from "../shared/icons";
import type { PreferencesData } from "../shared/types";

interface Props {
  data: CandidateRegStep3Data;
  onChange: (data: CandidateRegStep3Data) => void;
  onNext: () => void;
  onBack: () => void;
}

const ICON_BTN = "grid place-items-center w-10 h-10 rounded-xl text-ink-500 transition-colors disabled:opacity-40";

export default function Step3Skills({ data, onChange, onNext, onBack }: Props) {
  const [skills, setSkills] = useState<Skill[]>(data.skills ?? []);
  const [certs, setCerts] = useState(data.certifications ?? []);
  const [pref, setPref] = useState<PreferencesData>({
    noticePeriod: data.noticePeriod || "30 Days",
    expectedSalary: data.expectedSalary || "10 – 15 LPA",
    salaryType: data.salaryType || "Fixed",
    jobRolePreferences: data.jobRolePreferences ?? [],
    preferredLocations: data.preferredLocations ?? [],
    openToRelocate: data.openToRelocate ?? false,
    employmentTypes: data.employmentTypes?.length
      ? data.employmentTypes
      : ["FULL_TIME"],
    benefits: data.benefits ?? [],
    additionalNotes: data.additionalNotes ?? "",
  });

  const [skillModal, setSkillModal] = useState<{
    open: boolean;
    editSkill?: Skill;
  }>({ open: false });
  const { confirm, triggerDelete, resetConfirm } = useConfirmDelete();
  const [deletingSkillId, setDeletingSkillId] = useState<string | null>(null);
  const [isSaving,        setIsSaving]        = useState(false);
  const [saveError,       setSaveError]       = useState<string | null>(null);
  // Skills whose years were answered inline and still need saving.
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  // Skills flagged after a Continue attempt without years.
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const skillsRef = useRef<HTMLElement>(null);

  const setYears = (id: string, patch: Partial<Pick<Skill, "experienceValue" | "experienceUnit">>) => {
    setSkills((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch, experienceSource: "candidate" } : s)));
    setDirty((prev) => new Set(prev).add(id));
    setFlagged((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const needingYears = skills.filter(missingYears);

  const handleDeleteSkill = async (id: string) => {
    resetConfirm();
    setDeletingSkillId(id);
    try {
      await deleteCandidateSkill(id);
      setSkills((prev) => prev.filter((s) => s.id !== id));
    } catch {
      /* silently ignore */
    } finally {
      setDeletingSkillId(null);
    }
  };

  const handleNext = async () => {
    setSaveError(null);
    if (needingYears.length > 0) {
      setFlagged(new Set(needingYears.map((s) => s.id)));
      setSaveError(
        `Tell us how long you've used ${needingYears.length === 1 ? "this skill" : `these ${needingYears.length} skills`}: ${needingYears
          .map((s) => s.name)
          .join(", ")}.`,
      );
      skillsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      skillsRef.current?.querySelector<HTMLInputElement>("input[data-years-input]")?.focus({ preventScroll: true });
      return;
    }
    setIsSaving(true);
    try {
      // Résumé-prefilled rows have temporary ids: save them by name (the backend upserts).
      // Rows answered inline are updated in place.
      const saved: Skill[] = [];
      for (const skill of skills) {
        if (isParsedRow(skill.id)) {
          const id = await addCandidateSkill(buildSkillPayload(skill), saved.map((s) => s.id));
          saved.push({ ...skill, id });
        } else {
          if (dirty.has(skill.id)) await updateCandidateSkill(skill.id, buildSkillPayload(skill));
          saved.push(skill);
        }
      }
      setSkills(saved);
      setDirty(new Set());
      await savePreferences(buildPreferencesPayload(pref));
      onChange({ skills: saved, certifications: certs, ...pref });
      onNext();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save preferences");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => { onChange({ skills, certifications: certs, ...pref }); onBack(); };

  return (
    <div className="space-y-5">
      {confirm.open && (
        <ConfirmDialog
          label={confirm.label}
          onConfirm={confirm.onConfirm}
          onCancel={resetConfirm}
        />
      )}
      {skillModal.open && (
        <AddSkillModal
          onClose={() => setSkillModal({ open: false })}
          onSaved={(skill) => {
            setSkills((prev) =>
              skillModal.editSkill
                ? prev.map((s) => (s.id === skillModal.editSkill!.id ? skill : s))
                : [...prev.filter((s) => s.id !== skill.id), skill],
            );
            setSkillModal({ open: false });
          }}
          addedSkills={skills}
          onDeleteSkill={handleDeleteSkill}
          editSkill={skillModal.editSkill}
        />
      )}

      {/* ── Skills ── */}
      <section ref={skillsRef} className="rounded-2xl border border-ink-200/70 bg-white p-5 scroll-mt-4">
        <div className="flex items-center justify-between gap-3 mb-1.5">
          <div className="flex items-center gap-3 min-w-0">
            <span className="icon-tile icon-tile-sm bg-brand-50 text-brand-600">
              <SkillsIcon />
            </span>
            <h3 className="section-title">
              Skills
              {skills.length > 0 && (
                <span className="text-ink-500 font-semibold ml-1 tabular">({skills.length})</span>
              )}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setSkillModal({ open: true })}
            className="btn btn-outline btn-sm shrink-0"
          >
            + Add Skill
          </button>
        </div>
        <p className="text-caption text-ink-500 mb-4 sm:pl-11">
          Add your skills and highlight the most relevant ones. Top Skills
          appear first to recruiters. Recruiters compare how long you&apos;ve used each skill
          with what their job asks for.
        </p>

        {needingYears.length > 0 && (
          <div role="status" className={`alert ${flagged.size ? "alert-danger" : "alert-warn"} mb-4`}>
            <span>
              Your résumé doesn&apos;t say how long you&apos;ve used {needingYears.length === 1 ? "1 skill" : `${needingYears.length} skills`}.
              Add the years below to continue.
            </span>
          </div>
        )}

        {skills.length === 0 ? (
          <EmptyState
            icon={<SkillsIconLg />}
            message="No skills added yet."
            hint={'Click "+ Add Skill" to showcase your expertise.'}
          />
        ) : (
          <ul className="rounded-2xl border border-ink-200/70 divide-y divide-ink-100" aria-label="Your skills">
            <li aria-hidden="true" className="hidden md:grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1.35fr)_6rem_5.5rem] gap-3 px-4 py-2.5 bg-ink-50/80 text-micro font-semibold uppercase tracking-wider text-ink-500 rounded-t-2xl">
              <span>Skill</span>
              <span>Proficiency</span>
              <span>Experience</span>
              <span>Last Used</span>
              <span className="text-right">Actions</span>
            </li>
            {skills.map((s) => {
              const dots = PROFICIENCY_DOTS[s.proficiency] ?? 0;
              const needs = missingYears(s);
              // Stay editable while being answered, so typing "2.5" is not cut off at "2".
              const answering = needs || dirty.has(s.id);
              const isFlagged = flagged.has(s.id);
              const inputId = `skill-years-${s.id}`;
              return (
                <li
                  key={s.id}
                  className={`grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1.35fr)_6rem_5.5rem] gap-x-3 gap-y-2 px-4 py-3 items-center ${
                    isFlagged ? "bg-danger/5" : needs ? "bg-warn/5" : ""
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      aria-hidden="true"
                      className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white shadow-card"
                      style={{ backgroundColor: POPULAR_SKILL_COLORS[s.name] ?? "#6366f1" }}
                    />
                    <span className="font-semibold text-ink-900 wrap-break-word min-w-0">{s.name}</span>
                    {s.highlighted && <span className="badge badge-warn shrink-0">⭐ Top</span>}
                  </div>

                  <div className="order-last col-span-2 md:order-none md:col-span-1 flex items-center gap-2 text-body-sm">
                    <span className="md:hidden text-caption text-ink-500 w-24 shrink-0">Proficiency</span>
                    {s.proficiency ? (
                      <>
                        <DotsIndicator filled={dots} size={8} />
                        <span className="text-ink-600">{s.proficiency}</span>
                      </>
                    ) : (
                      <span className="text-ink-400">Not set</span>
                    )}
                  </div>

                  <div className="order-last col-span-2 md:order-none md:col-span-1 flex items-center gap-2 min-w-0 text-body-sm">
                    <label htmlFor={answering ? inputId : undefined} className="md:hidden text-caption text-ink-500 w-24 shrink-0">
                      Experience
                    </label>
                    {answering ? (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <input
                          id={inputId}
                          data-years-input
                          type="text"
                          inputMode="decimal"
                          value={s.experienceValue}
                          onChange={(e) => setYears(s.id, { experienceValue: cleanYears(e.target.value) })}
                          placeholder="e.g. 2"
                          aria-label={`How long have you used ${s.name}?`}
                          aria-invalid={isFlagged ? true : undefined}
                          className={`field-input h-9 w-16 px-2 text-center tabular ${isFlagged ? "border-danger" : ""}`}
                        />
                        <select
                          value={s.experienceUnit || "Years"}
                          onChange={(e) => setYears(s.id, { experienceUnit: e.target.value })}
                          aria-label={`Unit for ${s.name} experience`}
                          className="field-input h-9 w-24 px-2 text-body-sm"
                        >
                          <option>Years</option>
                          <option>Months</option>
                        </select>
                        {needs && (
                          <span className={`text-micro font-semibold ${isFlagged ? "text-danger" : "text-warn"}`}>Required</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-ink-700 whitespace-nowrap">
                        {s.experienceValue} {s.experienceUnit}
                        {s.experienceSource === "resume" && (
                          <span className="ml-1.5 badge badge-info" title="Measured from the roles on your résumé — edit the skill to change it">
                            from résumé
                          </span>
                        )}
                      </span>
                    )}
                  </div>

                  <div className="hidden md:block text-body-sm text-ink-600 whitespace-nowrap">{s.lastUsed || "—"}</div>

                  <div className="flex items-center justify-end -my-2 row-start-1 col-start-2 md:row-auto md:col-auto">
                    <Tooltip label="Edit">
                      <button
                        type="button"
                        aria-label={`Edit skill ${s.name}`}
                        onClick={() => setSkillModal({ open: true, editSkill: s })}
                        className={`${ICON_BTN} hover:bg-brand-50 hover:text-brand-700`}
                      >
                        <EditIcon />
                      </button>
                    </Tooltip>
                    <Tooltip label="Delete">
                      <button
                        type="button"
                        aria-label={`Delete skill ${s.name}`}
                        onClick={() => triggerDelete(`Delete skill "${s.name}"?`, () => handleDeleteSkill(s.id))}
                        disabled={deletingSkillId === s.id}
                        className={`${ICON_BTN} hover:bg-danger/10 hover:text-danger`}
                      >
                        {deletingSkillId === s.id ? <SpinnerIcon /> : <TrashIcon />}
                      </button>
                    </Tooltip>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ── Certifications ── */}
      <div className="rounded-2xl border border-ink-200/70 bg-white">
        <CertificationsSection certifications={certs} onChange={setCerts} />
      </div>

      {/* ── Preferences ── */}
      <div className="rounded-2xl border border-ink-200/70 bg-white">
        <PreferencesSection data={pref} onChange={setPref} />
      </div>

      {/* ── Actions ── */}
      {saveError && (
        <div role="alert" className="alert alert-danger">{saveError}</div>
      )}
      <div className="sticky bottom-0 z-10 -mx-5 sm:-mx-7 lg:-mx-8 -mb-5 sm:-mb-7 lg:-mb-8 !mt-7 px-5 sm:px-7 lg:px-8 py-4 flex items-center justify-between gap-3 border-t border-ink-200/70 glass rounded-b-card">
        <button
          type="button"
          onClick={handleBack}
          className="btn btn-outline btn-lg px-4 sm:px-6"
        >
          <ArrowLeftIcon /> Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={isSaving}
          className="btn btn-primary btn-lg px-5 sm:px-8"
        >
          {isSaving ? <><SpinnerIcon /> Saving…</> : <>Save &amp; Continue <ArrowRightIcon /></>}
        </button>
      </div>
    </div>
  );
}
