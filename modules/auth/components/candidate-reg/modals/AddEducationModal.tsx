"use client";

import { useState, useEffect, useRef } from "react";
import {
  fetchDegreeCourses,
  fetchEducationTypes,
  addEducation,
  updateEducation,
  uploadEducationFile,
  type DegreeCourse,
  type EducationTypeItem,
} from "../../../services/candidate.service";
import type { Education } from "../../../types/auth.types";
import type { EducationFormData } from "../shared/types";
import { ChevronDownIcon, CalendarIcon, UploadCloudIcon, SpinnerIcon, TrashSmIcon, GraduationCapIcon } from "../shared/icons";
import { ModalFrame, FormGroupTitle, FieldError, errorInput } from "../shared/ui";

interface Props {
  onClose: () => void;
  onSaved: (education: Education) => void;
  editId?: string;
  initialData?: Partial<EducationFormData>;
  existingAttachments?: string[];
  existingIds?: string[];
}

const EMPTY: EducationFormData = {
  degree: "", specialization: "", institution: "", location: "",
  yearOfPassing: "", grade: "", educationType: "", description: "",
};

export default function AddEducationModal({ onClose, onSaved, editId, initialData, existingAttachments = [], existingIds = [] }: Props) {
  const [form, setForm]         = useState<EducationFormData>({ ...EMPTY, ...initialData });
  const [errors, setErrors]     = useState<Partial<Record<keyof EducationFormData, string>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newFiles, setNewFiles]                 = useState<File[]>([]);
  const [keptExistingKeys, setKeptExistingKeys] = useState<string[]>(existingAttachments);

  const [degrees, setDegrees]         = useState<DegreeCourse[]>([]);
  const [eduTypes, setEduTypes]       = useState<EducationTypeItem[]>([]);
  const [loadingMaster, setLoadingMaster] = useState(true);

  const isEdit = Boolean(editId);

  useEffect(() => {
    Promise.all([fetchDegreeCourses(), fetchEducationTypes()])
      .then(([deg, types]) => {
        setDegrees(deg);
        setEduTypes(types);
        if (types.length && !initialData?.educationType)
          setForm((f) => ({ ...f, educationType: types[0].name }));
      })
      .finally(() => setLoadingMaster(false));
  }, []);

  const set = <K extends keyof EducationFormData>(k: K, v: EducationFormData[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const validate = (): boolean => {
    const errs: Partial<Record<keyof EducationFormData, string>> = {};
    if (!form.degree) errs.degree = "Degree / Course is required";
    if (!form.institution.trim()) errs.institution = "Institute / University is required";
    if (!form.location.trim()) errs.location = "Location is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    setApiError(null);
    const payload = {
      degree:         form.degree,
      institution:    form.institution.trim(),
      specialization: form.specialization.trim() || undefined,
      location:       form.location.trim(),
      yearOfPassing:  form.yearOfPassing.trim() || undefined,
      grade:          form.grade.trim() || undefined,
      educationType:  form.educationType || undefined,
      description:    form.description.trim() || undefined,
    };
    try {
      let backendId: string;
      if (isEdit && editId) {
        await updateEducation(editId, payload);
        backendId = editId;
      } else {
        backendId = await addEducation(payload, existingIds);
      }
      let latestKeys: string[] = [...keptExistingKeys];
      for (const file of newFiles) {
        try {
          latestKeys = await uploadEducationFile(backendId, file);
        } catch {
          // non-fatal — education saved even if a file upload fails
        }
      }
      onSaved({
        id:                 backendId,
        degree:             form.degree,
        institution:        form.institution.trim(),
        specialization:     form.specialization.trim(),
        location:           form.location.trim(),
        yearOfPassing:      form.yearOfPassing.trim(),
        grade:              form.grade.trim(),
        educationType:      form.educationType,
        description:        form.description.trim(),
        attachmentFileKeys: latestKeys,
      });
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to save education");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalFrame
      titleId="edu-modal-title"
      icon={<GraduationCapIcon />}
      title={isEdit ? "Edit Education" : "Add Education"}
      subtitle="Add your educational qualification details."
      onClose={onClose}
      maxWidth="max-w-[660px]"
      footer={
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 px-5 sm:px-6 py-4">
          <button type="button" onClick={onClose} className="btn btn-outline">
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={isSaving || loadingMaster} className="btn btn-primary px-6">
            {isSaving ? <><SpinnerIcon /> Saving…</> : isEdit ? "Update Education" : "Save Education"}
          </button>
        </div>
      }
    >
      <div className="space-y-7">
        {apiError && (
          <div role="alert" className="alert alert-danger">{apiError}</div>
        )}

        {/* Qualification */}
        <div>
          <FormGroupTitle>Qualification</FormGroupTitle>
          <div className="grid sm:grid-cols-2 gap-x-4 gap-y-5">
            <div>
              <label htmlFor="edu-degree" className="field-label">Degree / Course <span className="text-danger" aria-hidden="true">*</span></label>
              <div className="relative">
                <select id="edu-degree" value={form.degree} onChange={(e) => set("degree", e.target.value)} disabled={loadingMaster}
                  aria-invalid={errors.degree ? true : undefined}
                  aria-describedby={errors.degree ? "edu-degree-error" : undefined}
                  className={`field-input appearance-none pr-9 ${errorInput(errors.degree)}`}>
                  <option value="">Select degree or course</option>
                  {degrees.map((d) => <option key={d.name} value={d.name}>{d.name}</option>)}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"><ChevronDownIcon /></span>
              </div>
              <FieldError id="edu-degree-error">{errors.degree}</FieldError>
            </div>
            <div>
              <label htmlFor="edu-specialization" className="field-label">Specialization <span className="text-ink-400 font-normal">(Optional)</span></label>
              <input id="edu-specialization" value={form.specialization} onChange={(e) => set("specialization", e.target.value)}
                placeholder="e.g., Computer Science, Finance"
                className="field-input" />
            </div>

            <div>
              <label htmlFor="edu-institution" className="field-label">Institute / University <span className="text-danger" aria-hidden="true">*</span></label>
              <input id="edu-institution" value={form.institution} onChange={(e) => set("institution", e.target.value)}
                placeholder="Enter institute or university name"
                aria-invalid={errors.institution ? true : undefined}
                aria-describedby={errors.institution ? "edu-institution-error" : undefined}
                className={`field-input ${errorInput(errors.institution)}`} />
              <FieldError id="edu-institution-error">{errors.institution}</FieldError>
            </div>
            <div>
              <label htmlFor="edu-location" className="field-label">Location <span className="text-danger" aria-hidden="true">*</span></label>
              <input id="edu-location" value={form.location} onChange={(e) => set("location", e.target.value)}
                placeholder="City, State, Country"
                aria-invalid={errors.location ? true : undefined}
                aria-describedby={errors.location ? "edu-location-error" : undefined}
                className={`field-input ${errorInput(errors.location)}`} />
              <FieldError id="edu-location-error">{errors.location}</FieldError>
            </div>

            <div>
              <label htmlFor="edu-yearOfPassing" className="field-label">Year of Passing</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"><CalendarIcon /></span>
                <input id="edu-yearOfPassing" value={form.yearOfPassing} onChange={(e) => set("yearOfPassing", e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="e.g., 2023" maxLength={4}
                  className="field-input pl-10 tabular" />
              </div>
            </div>
            <div>
              <label htmlFor="edu-grade" className="field-label">Grade / Percentage <span className="text-ink-400 font-normal">(Optional)</span></label>
              <input id="edu-grade" value={form.grade} onChange={(e) => set("grade", e.target.value)}
                placeholder="e.g., 8.5 CGPA or 75%"
                className="field-input" />
            </div>
          </div>
        </div>

        {/* Education Type */}
        <fieldset className="pt-6 border-t border-ink-200/70">
          <legend className="sr-only">Education Type</legend>
          <div aria-hidden="true" className="field-label">Education Type</div>
          <div className="flex flex-wrap gap-2">
            {loadingMaster
              ? <span className="text-body-sm text-ink-400 py-2">Loading…</span>
              : eduTypes.map((t) => (
                <label key={t.name} className="inline-flex items-center gap-2 min-h-10 px-3.5 rounded-xl border border-ink-200 bg-white cursor-pointer text-body-sm text-ink-700 transition-colors hover:border-ink-300 has-checked:border-brand-300 has-checked:bg-brand-50 has-checked:text-brand-800">
                  <input type="radio" name="eduType" value={t.name} checked={form.educationType === t.name}
                    onChange={() => set("educationType", t.name)} className="accent-brand-600 w-4 h-4" />
                  <span>{t.name}</span>
                </label>
              ))
            }
          </div>
        </fieldset>

        {/* Description */}
        <div>
          <label htmlFor="edu-description" className="field-label">Description <span className="text-ink-400 font-normal">(Optional)</span></label>
          <textarea id="edu-description" value={form.description} onChange={(e) => set("description", e.target.value.slice(0, 1000))}
            placeholder="Add any relevant details about your education" rows={3}
            className="field-input resize-none" />
          <div className="text-right text-micro text-ink-400 mt-1 tabular">{form.description.length} / 1000</div>
        </div>

        {/* Attachments */}
        <div>
          <div className="field-label">Attachments <span className="text-ink-400 font-normal">(Optional)</span></div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            aria-label="Upload supporting documents"
            onChange={(e) => {
              const picked = Array.from(e.target.files ?? []);
              setNewFiles((prev) => [...prev, ...picked]);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full rounded-2xl border-2 border-dashed border-ink-200 bg-ink-50/50 px-4 py-4 flex items-center gap-3.5 hover:bg-brand-50/40 hover:border-brand-300 transition-colors text-left">
            <span className="icon-tile bg-white text-brand-600 border border-ink-200/70"><UploadCloudIcon /></span>
            <span className="min-w-0">
              <span className="block text-body-sm font-semibold text-ink-800">Upload supporting documents (Marksheet, Certificate, etc.)</span>
              <span className="block text-caption text-ink-500 mt-0.5">PDF, DOC, DOCX only &nbsp;•&nbsp; Max size: 5MB &nbsp;•&nbsp; Multiple files allowed</span>
            </span>
          </button>

          {/* Kept existing attachments */}
          {keptExistingKeys.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {keptExistingKeys.map((key) => {
                const name = key.split("/").pop() ?? key;
                return (
                  <li key={key} className="flex items-center justify-between gap-2 pl-3.5 pr-1 py-1 rounded-xl bg-ink-50 border border-ink-200/70 text-body-sm text-ink-700">
                    <span className="truncate min-w-0">{name}</span>
                    <button type="button" aria-label={`Remove ${name}`}
                      onClick={() => setKeptExistingKeys((prev) => prev.filter((k) => k !== key))}
                      className="grid place-items-center w-9 h-9 rounded-lg text-ink-400 hover:text-danger hover:bg-danger/10 transition-colors shrink-0">
                      <TrashSmIcon />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Newly selected files */}
          {newFiles.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {newFiles.map((file, idx) => (
                <li key={`${file.name}-${idx}`} className="flex items-center justify-between gap-2 pl-3.5 pr-1 py-1 rounded-xl bg-brand-50 border border-brand-100 text-body-sm text-ink-700">
                  <span className="truncate min-w-0">{file.name}</span>
                  <button type="button" aria-label={`Remove ${file.name}`}
                    onClick={() => setNewFiles((prev) => prev.filter((_, i) => i !== idx))}
                    className="grid place-items-center w-9 h-9 rounded-lg text-ink-400 hover:text-danger hover:bg-danger/10 transition-colors shrink-0">
                    <TrashSmIcon />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </ModalFrame>
  );
}
