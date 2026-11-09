"use client";

import { useState, useEffect, useRef } from "react";
import { isParsedRow } from "../shared/resumePrefill";
import { cleanYears } from "../shared/skillYears";
import {
  fetchSkills, addCandidateSkill, updateCandidateSkill, buildSkillPayload,
  type SkillCatalogItem,
} from "../../../services/candidate.service";
import type { Skill } from "../../../types/auth.types";
import { PROFICIENCY_LEVELS, LAST_USED_OPTIONS } from "../shared/constants";
import { DotsIndicator, ModalFrame, FieldError, errorInput } from "../shared/ui";
import {
  SkillIcon, InfoIcon, CalendarIcon, ChevronDownIcon, PlusIcon, TrashSmIcon, SpinnerIcon,
} from "../shared/icons";
import SkillLeftPanel from "./SkillLeftPanel";

interface Props {
  onClose: () => void;
  onSaved: (skill: Skill) => void;
  addedSkills: Skill[];
  onDeleteSkill: (id: string) => void;
  editSkill?: Skill;
}

export default function AddSkillModal({ onClose, onSaved, addedSkills, onDeleteSkill, editSkill }: Props) {
  const isEdit = Boolean(editSkill);

  const [selectedName, setSelectedName]   = useState(editSkill?.name ?? "");
  const [proficiency, setProficiency]     = useState(editSkill?.proficiency ?? "Advanced");
  const [expValue, setExpValue]           = useState(editSkill?.experienceValue ?? "");
  const [expUnit, setExpUnit]             = useState(editSkill?.experienceUnit ?? "Years");
  const [lastUsed, setLastUsed]           = useState(editSkill?.lastUsed ?? LAST_USED_OPTIONS[0]);
  const [highlighted, setHighlighted]     = useState(editSkill?.highlighted ?? false);
  const [addDetails, setAddDetails]       = useState(editSkill?.additionalDetails ?? "");
  const [selectedColor, setSelectedColor] = useState("#6366f1");
  const [searchQuery, setSearchQuery]     = useState("");
  const [searchResults, setSearchResults] = useState<SkillCatalogItem[]>([]);
  const [errors, setErrors]               = useState<Record<string, string>>({});
  const [isSaving, setIsSaving]           = useState(false);
  const [apiError, setApiError]           = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      const res = await fetchSkills(searchQuery.trim());
      setSearchResults(res.slice(0, 8));
    }, 250);
  }, [searchQuery]);

  const selectSkill = (name: string, color: string) => {
    setSelectedName(name);
    setSelectedColor(color);
    setSearchQuery("");
    setSearchResults([]);
    setErrors(e => ({ ...e, name: "" }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!selectedName.trim()) errs.name = "Please select or search a skill";
    if (!proficiency)          errs.proficiency = "Select proficiency level";
    if (!(Number.parseFloat(expValue) > 0)) errs.experience = "Enter how long you have used this skill";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAdd = async () => {
    if (!validate()) return;
    setIsSaving(true);
    setApiError(null);
    const skill: Skill = {
      id:               editSkill?.id ?? crypto.randomUUID(),
      name:             selectedName,
      proficiency,
      experienceValue:  expValue,
      experienceUnit:   expUnit,
      lastUsed,
      highlighted,
      additionalDetails: addDetails || undefined,
      experienceSource: "candidate",
    };
    try {
      const payload = buildSkillPayload(skill);
      // Résumé-prefilled rows carry a temporary id: save them by name (the backend upserts).
      if (isEdit && editSkill && !isParsedRow(editSkill.id)) {
        await updateCandidateSkill(editSkill.id, payload);
      } else {
        const backendId = await addCandidateSkill(payload, addedSkills.map(s => s.id));
        skill.id = backendId;
      }
      onSaved(skill);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to save skill");
      setIsSaving(false);
    }
  };

  return (
    <>
      {deleteConfirm && (
        <div className="modal-overlay z-[60]">
          <div role="dialog" aria-modal="true" aria-labelledby="skill-delete-title" className="modal-panel max-w-[400px] p-6">
            <div className="flex items-start gap-4">
              <span className="icon-tile w-11 h-11 rounded-2xl bg-danger/10 text-danger ring-4 ring-danger/5"><TrashSmIcon /></span>
              <div className="min-w-0 pt-0.5">
                <h2 id="skill-delete-title" className="section-title">Confirm Delete</h2>
                <p className="mt-1 text-body-sm text-ink-600">Delete skill &quot;{deleteConfirm.name}&quot;?</p>
                <p className="mt-1 text-caption text-ink-500">This action cannot be undone.</p>
              </div>
            </div>
            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
              <button type="button" onClick={() => setDeleteConfirm(null)} className="btn btn-outline">Cancel</button>
              <button type="button"
                onClick={() => { onDeleteSkill(deleteConfirm.id); setDeleteConfirm(null); }}
                className="btn btn-danger">Delete</button>
            </div>
          </div>
        </div>
      )}
      <ModalFrame
        titleId="skill-modal-title"
        icon={<SkillIcon />}
        title={isEdit ? "Edit Skill" : "Add Skill"}
        subtitle="Search and add your skills. Mark your proficiency level and highlight key skills."
        onClose={onClose}
        maxWidth="max-w-[940px]"
        bodyClassName="flex flex-col md:flex-row md:overflow-hidden"
        footer={
          <>
            {apiError && (
              <div role="alert" className="alert alert-danger mx-5 sm:mx-6 mt-4">
                {apiError}
              </div>
            )}
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 px-5 sm:px-6 py-4">
              <button type="button" onClick={onClose} disabled={isSaving} className="btn btn-outline">
                Cancel
              </button>
              <button type="button" onClick={handleAdd} disabled={isSaving} className="btn btn-primary px-6">
                {isSaving ? <><SpinnerIcon /> Saving…</> : <>{isEdit ? "Update Skill" : "Add Skill"} <PlusIcon /></>}
              </button>
            </div>
          </>
        }
      >
        {/* ── Left Panel ── */}
        <SkillLeftPanel
          selectedName={selectedName}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchResults={searchResults}
          onSelect={selectSkill}
          addedSkills={addedSkills}
          onDeleteRequest={(id, name) => setDeleteConfirm({ id, name })}
          nameError={errors.name}
        />

        {/* ── Right Panel ── */}
        <div className="flex-1 min-w-0 md:overflow-y-auto p-5 sm:p-6 space-y-5">

          <div className="flex items-center gap-2.5">
            <span className="grid place-items-center w-6 h-6 rounded-full bg-[image:var(--gradient-brand)] text-white text-caption font-bold shrink-0">2</span>
            <h3 className="section-title">Skill Details</h3>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">

            {/* Left column: name, experience, lastUsed, top-skill toggle */}
            <div className="flex flex-col gap-4">
              <div>
                <div className="field-label">
                  Skill Name <span className="text-danger" aria-hidden="true">*</span>
                </div>
                <div aria-live="polite" className={`flex items-center gap-2.5 px-3.5 h-11 rounded-xl border bg-ink-50 text-body ${
                  errors.name ? "border-danger/70" : "border-ink-200"
                }`}>
                  {selectedName
                    ? <><span aria-hidden="true" className="w-3.5 h-3.5 rounded-full shrink-0 ring-2 ring-white" style={{ backgroundColor: selectedColor }} />
                        <span className="font-semibold text-ink-900 truncate">{selectedName}</span></>
                    : <span className="text-ink-400 text-body-sm">Select a skill from the left</span>
                  }
                </div>
              </div>

              <div>
                <label htmlFor="skill-expValue" className="field-label">
                  Experience in this skill <span className="text-danger" aria-hidden="true">*</span>
                </label>
                <div className="flex gap-2">
                  <input id="skill-expValue" type="text" inputMode="decimal" value={expValue}
                    onChange={e => { setExpValue(cleanYears(e.target.value)); setErrors(er => ({ ...er, experience: "" })); }}
                    placeholder="e.g., 2.5"
                    aria-invalid={errors.experience ? true : undefined}
                    aria-describedby={errors.experience ? "skill-exp-error" : undefined}
                    className={`field-input flex-1 min-w-0 tabular ${errors.experience ? "border-danger" : ""}`} />
                  <div className="relative w-28 shrink-0">
                    <select value={expUnit} onChange={e => setExpUnit(e.target.value)} aria-label="Experience unit"
                      className="field-input text-body-sm appearance-none pr-8">
                      <option>Years</option>
                      <option>Months</option>
                    </select>
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"><ChevronDownIcon /></span>
                  </div>
                </div>
                {errors.experience && <p id="skill-exp-error" role="alert" className="field-error">{errors.experience}</p>}
                {editSkill?.experienceSource === "resume" && !errors.experience && (
                  <p className="field-hint">Measured from the roles on your résumé — change it if it&apos;s off.</p>
                )}
              </div>

              <div>
                <label htmlFor="skill-lastUsed" className="field-label">
                  Last Used <span className="text-danger" aria-hidden="true">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"><CalendarIcon /></span>
                  <select id="skill-lastUsed" value={lastUsed} onChange={e => setLastUsed(e.target.value)}
                    className="field-input pl-10 pr-8 text-body-sm appearance-none">
                    {LAST_USED_OPTIONS.map(o => <option key={o}>{o}</option>)}
                  </select>
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"><ChevronDownIcon /></span>
                </div>
              </div>

              <label className="flex items-center gap-3 p-3.5 rounded-2xl border border-warn/25 bg-warn/5 cursor-pointer transition-colors has-checked:border-warn/50 has-checked:bg-warn/10">
                <span className="icon-tile icon-tile-sm bg-white text-warn border border-warn/20">
                  <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l2.7 5.6 6.3.9-4.5 4.4 1 6.1L12 17l-5.5 3 1-6.1L3 9.5l6.3-.9z" /></svg>
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-semibold text-body-sm text-ink-900">Highlight as Top Skill</span>
                  <span className="block text-caption text-ink-500">This skill will be shown first to recruiters</span>
                </span>
                <input type="checkbox" checked={highlighted} onChange={e => setHighlighted(e.target.checked)}
                  className="w-4 h-4 rounded accent-brand-600 cursor-pointer shrink-0" />
              </label>
            </div>

            {/* Right column: proficiency + additional details */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span id="skill-proficiency-label" className="text-body-sm font-semibold text-ink-700">
                  Proficiency Level <span className="text-danger" aria-hidden="true">*</span>
                </span>
                <button type="button" title="Indicates your expertise level in this skill" aria-label="Indicates your expertise level in this skill"
                  className="grid place-items-center w-6 h-6 rounded-md text-ink-400 hover:text-ink-600 transition-colors">
                  <InfoIcon />
                </button>
              </div>
              <div role="radiogroup" aria-labelledby="skill-proficiency-label" className="space-y-1.5">
                {PROFICIENCY_LEVELS.map(level => (
                  <label key={level.label}
                    className={`flex items-center justify-between min-h-11 px-3.5 rounded-xl border cursor-pointer transition-colors ${
                      proficiency === level.label
                        ? "border-brand-400 bg-brand-50"
                        : "border-ink-200 bg-white hover:border-ink-300"
                    }`}>
                    <span className="flex items-center gap-3">
                      <DotsIndicator filled={level.dots} size={9} />
                      <span className={`text-body-sm font-medium ${proficiency === level.label ? "text-brand-800" : "text-ink-700"}`}>{level.label}</span>
                    </span>
                    <input type="radio" name="proficiency" value={level.label}
                      checked={proficiency === level.label}
                      onChange={() => { setProficiency(level.label); setErrors(e => ({ ...e, proficiency: "" })); }}
                      className="accent-brand-600 w-4 h-4" />
                  </label>
                ))}
              </div>
              <FieldError>{errors.proficiency}</FieldError>

              <div className="mt-5">
                <label htmlFor="skill-addDetails" className="field-label">
                  Additional Details <span className="text-ink-400 font-normal">(Optional)</span>
                </label>
                <textarea id="skill-addDetails" value={addDetails}
                  onChange={e => setAddDetails(e.target.value.slice(0, 250))}
                  placeholder="Any additional details about your experience in this skill..."
                  rows={4}
                  className={`field-input text-body-sm resize-none ${errorInput(false)}`} />
                <div className="text-right text-micro text-ink-400 mt-1 tabular">{addDetails.length}/250</div>
              </div>
            </div>
          </div>
        </div>
      </ModalFrame>
    </>
  );
}
