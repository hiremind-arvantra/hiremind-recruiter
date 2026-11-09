"use client";

import { useState, useEffect } from "react";
import type { Experience } from "../../../types/auth.types";
import {
  addWorkExperience,
  updateWorkExperience,
  fetchEmploymentTypes,
  type WorkExperiencePayload,
} from "../../../services/candidate.service";
import type { ExperienceFormData, ProjectForm } from "../shared/types";
import { EMPLOYMENT_TYPE_MAP, EMPLOYMENT_TYPES } from "../shared/constants";
import { ChevronDownIcon, CalendarIcon, SpinnerIcon, BriefcaseIcon } from "../shared/icons";
import { toLabel } from "@/lib/utils";
import { isValidMMYYYY } from "../shared/validators";
import { ModalFrame, FormGroupTitle, FieldError, errorInput } from "../shared/ui";
import ProjectsSubForm from "./ProjectsSubForm";

/** "MM/YYYY" → "YYYY-MM-01" for LocalDate. Returns undefined for empty or "Present". */
function toLocalDate(mmYYYY: string): string | undefined {
  if (!mmYYYY || mmYYYY === "Present" || !isValidMMYYYY(mmYYYY)) return undefined;
  const [mm, yyyy] = mmYYYY.split("/");
  return `${yyyy}-${mm.padStart(2, "0")}-01`;
}

function parseDateInput(val: string): string {
  const cleaned = val.replace(/\D/g, "");
  if (cleaned.length <= 2) return cleaned;
  return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 6)}`;
}

const EMPTY_PROJECT: ProjectForm = {
  title: "", role: "", startDate: "", endDate: "", description: "", skills: [], skillInput: "", teamSize: "",
};

const EMPTY: ExperienceFormData = {
  company: "", employmentType: "", totalExperience: "", jobTitle: "", location: "",
  noticePeriod: "", startDate: "", endDate: "", isCurrent: false, description: "",
};

interface Props {
  onClose: () => void;
  onSaved: (experience: Experience) => void;
  initialExperience?: Experience;
  existingIds?: string[];
}

export default function AddExperienceModal({ onClose, onSaved, initialExperience, existingIds = [] }: Props) {
  const isEdit = Boolean(initialExperience);

  const [form, setForm] = useState<ExperienceFormData>(initialExperience ? {
    company:         initialExperience.company,
    employmentType:  initialExperience.employmentType,
    totalExperience: initialExperience.totalExperience,
    jobTitle:        initialExperience.jobTitle,
    location:        initialExperience.location,
    noticePeriod:    initialExperience.noticePeriod,
    startDate:       initialExperience.startDate,
    endDate:         initialExperience.isCurrent ? "" : initialExperience.endDate,
    isCurrent:       initialExperience.isCurrent,
    description:     initialExperience.description ?? "",
  } : EMPTY);

  const [projects, setProjects] = useState<ProjectForm[]>(
    initialExperience?.projects.map(p => ({
      title: p.title, role: p.role, startDate: p.startDate,
      endDate: p.endDate, description: p.description,
      skills: p.technologies, skillInput: "",
      teamSize: p.teamSize ?? "",
    })) ?? []
  );

  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Employment types from backend; falls back to hardcoded constants on error
  const [employmentTypes, setEmploymentTypes] = useState<string[]>(EMPLOYMENT_TYPES);
  const [typeMap, setTypeMap] = useState<Record<string, string>>(EMPLOYMENT_TYPE_MAP);

  useEffect(() => {
    fetchEmploymentTypes()
      .then((items) => {
        if (!items.length) return;
        // backend returns e.g. [{ name: "FULL_TIME" }]
        // Convert to display labels: "FULL_TIME" → "Full Time"
        const labels = items.map((i) => toLabel(i.name));
        const map    = Object.fromEntries(items.map((i) => [toLabel(i.name), i.name]));
        setEmploymentTypes(labels);
        setTypeMap(map);
      })
      .catch(() => { /* keep hardcoded fallback */ });
  }, []);

  const set = <K extends keyof ExperienceFormData>(k: K, v: ExperienceFormData[K]) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: "" }));
  };

  const setProject = (index: number, patch: Partial<ProjectForm>) => {
    setProjects(ps => ps.map((p, i) => i === index ? { ...p, ...patch } : p));
    const cleared = Object.fromEntries(Object.keys(patch).map(k => [`project_${index}_${k}`, ""]));
    setErrors(e => ({ ...e, ...cleared }));
  };

  const addProject    = () => setProjects(ps => [...ps, { ...EMPTY_PROJECT }]);
  const removeProject = (index: number) => setProjects(ps => ps.filter((_, i) => i !== index));

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.company.trim())  errs.company  = "Company Name is required";
    if (!form.jobTitle.trim()) errs.jobTitle = "Job Title is required";
    if (!form.location.trim()) errs.location = "Location is required";

    if (!form.startDate.trim()) {
      errs.startDate = "Start Date is required";
    } else if (!isValidMMYYYY(form.startDate)) {
      errs.startDate = "Enter a valid date (MM/YYYY, month 01–12, year 1950–2100)";
    }

    if (!form.isCurrent) {
      if (!form.endDate.trim()) {
        errs.endDate = "End Date is required";
      } else if (!isValidMMYYYY(form.endDate)) {
        errs.endDate = "Enter a valid date (MM/YYYY, month 01–12, year 1950–2100)";
      } else if (form.startDate && isValidMMYYYY(form.startDate)) {
        if (toLocalDate(form.endDate)! < toLocalDate(form.startDate)!) {
          errs.endDate = "End Date must be after Start Date";
        }
      }
    }

    projects.forEach((p, i) => {
      if (!p.title.trim())       errs[`project_${i}_title`]       = "Project Title is required";
      if (!p.role.trim())        errs[`project_${i}_role`]        = "Role is required";
      if (!p.description.trim()) errs[`project_${i}_description`] = "Description is required";
      if (p.startDate && !isValidMMYYYY(p.startDate)) errs[`project_${i}_startDate`] = "Invalid date";
      if (p.endDate   && !isValidMMYYYY(p.endDate))   errs[`project_${i}_endDate`]   = "Invalid date";
    });

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    setApiError(null);
    try {
      const payload: WorkExperiencePayload = {
        companyName:      form.company.trim(),
        jobTitle:         form.jobTitle.trim(),
        employmentType:   typeMap[form.employmentType] ?? "FULL_TIME",
        location:         form.location.trim() || undefined,
        startDate:        toLocalDate(form.startDate) ?? form.startDate,
        endDate:          form.isCurrent ? null : (toLocalDate(form.endDate) ?? undefined),
        currentlyWorking: form.isCurrent,
        noticePeriod:     form.noticePeriod.trim() || undefined,
        description:      form.description.trim() || undefined,
        projects: projects.map(p => ({
          projectName:      p.title.trim(),
          roleName:         p.role.trim() || undefined,
          description:      p.description.trim() || undefined,
          startDate:        toLocalDate(p.startDate),
          endDate:          toLocalDate(p.endDate),
          teamSize:         p.teamSize ? Number(p.teamSize) : undefined,
          technologiesUsed: p.skills.join(", ") || undefined,
        })),
      };

      let backendId: string;
      if (isEdit && initialExperience) {
        await updateWorkExperience(initialExperience.id, payload);
        backendId = initialExperience.id;
      } else {
        backendId = await addWorkExperience(payload, existingIds);
      }

      const experience: Experience = {
        id:              backendId,
        company:         form.company.trim(),
        employmentType:  form.employmentType,
        totalExperience: form.totalExperience.trim(),
        jobTitle:        form.jobTitle.trim(),
        location:        form.location.trim(),
        noticePeriod:    form.noticePeriod.trim(),
        description:     form.description.trim(),
        startDate:       form.startDate,
        endDate:         form.isCurrent ? "Present" : form.endDate,
        isCurrent:       form.isCurrent,
        expanded:        false,
        projects: projects.map(p => ({
          id:           crypto.randomUUID(),
          title:        p.title.trim(),
          role:         p.role.trim(),
          startDate:    p.startDate,
          endDate:      p.endDate,
          description:  p.description.trim(),
          teamSize:     p.teamSize,
          technologies: p.skills,
        })),
      };
      onSaved(experience);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to save experience");
      setIsSaving(false);
    }
  };

  const describe = (key: string) => (errors[key] ? `exp-${key}-error` : undefined);

  return (
    <ModalFrame
      titleId="exp-modal-title"
      icon={<BriefcaseIcon />}
      title={isEdit ? "Edit Experience" : "Add Experience"}
      subtitle={<>Add your work experience and the projects you&apos;ve worked on.</>}
      onClose={onClose}
      maxWidth="max-w-[780px]"
      footer={
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 px-5 sm:px-6 py-4">
          <button type="button" onClick={onClose} className="btn btn-outline">
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={isSaving} className="btn btn-primary px-6">
            {isSaving ? <><SpinnerIcon /> Saving…</> : isEdit ? "Update Experience" : "Save Experience"}
          </button>
        </div>
      }
    >
      <div className="space-y-7">
        {apiError && (
          <div role="alert" className="alert alert-danger">{apiError}</div>
        )}

        {/* Role */}
        <div>
          <FormGroupTitle>Role</FormGroupTitle>
          <div className="grid sm:grid-cols-3 gap-x-4 gap-y-5">
            <div>
              <label htmlFor="exp-company" className="field-label">
                Company Name <span className="text-danger" aria-hidden="true">*</span>
              </label>
              <input id="exp-company" value={form.company} onChange={e => set("company", e.target.value)}
                placeholder="Enter company name"
                aria-invalid={errors.company ? true : undefined} aria-describedby={describe("company")}
                className={`field-input ${errorInput(errors.company)}`} />
              <FieldError id="exp-company-error">{errors.company}</FieldError>
            </div>

            <div>
              <label htmlFor="exp-employmentType" className="field-label">Employment Type</label>
              <div className="relative">
                <select id="exp-employmentType" value={form.employmentType} onChange={e => set("employmentType", e.target.value)}
                  className="field-input appearance-none pr-9">
                  <option value="">Select employment type</option>
                  {employmentTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"><ChevronDownIcon /></span>
              </div>
            </div>

            <div>
              <label htmlFor="exp-totalExperience" className="field-label">
                Total Experience at Company <span className="text-danger" aria-hidden="true">*</span>
              </label>
              <input id="exp-totalExperience" value={form.totalExperience}
                onChange={e => set("totalExperience", e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="e.g., 2.5" maxLength={5}
                className="field-input" />
            </div>

            <div>
              <label htmlFor="exp-jobTitle" className="field-label">
                Job Title <span className="text-danger" aria-hidden="true">*</span>
              </label>
              <input id="exp-jobTitle" value={form.jobTitle} onChange={e => set("jobTitle", e.target.value)}
                placeholder="Enter your job title"
                aria-invalid={errors.jobTitle ? true : undefined} aria-describedby={describe("jobTitle")}
                className={`field-input ${errorInput(errors.jobTitle)}`} />
              <FieldError id="exp-jobTitle-error">{errors.jobTitle}</FieldError>
            </div>

            <div>
              <label htmlFor="exp-location" className="field-label">
                Location <span className="text-danger" aria-hidden="true">*</span>
              </label>
              <input id="exp-location" value={form.location} onChange={e => set("location", e.target.value)}
                placeholder="Enter city"
                aria-invalid={errors.location ? true : undefined}
                aria-describedby={errors.location ? "exp-location-error" : "exp-location-hint"}
                className={`field-input ${errorInput(errors.location)}`} />
              <p id="exp-location-hint" className="field-hint">City, State, Country</p>
              <FieldError id="exp-location-error">{errors.location}</FieldError>
            </div>

            <div>
              <label htmlFor="exp-noticePeriod" className="field-label">
                Notice Period <span className="text-ink-400 font-normal">(Optional)</span>
              </label>
              <input id="exp-noticePeriod" value={form.noticePeriod}
                onChange={e => set("noticePeriod", e.target.value.replace(/\D/g, ""))}
                placeholder="e.g., 30" maxLength={4}
                className="field-input" />
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="pt-6 border-t border-ink-200/70">
          <FormGroupTitle>Timeline</FormGroupTitle>
          <div className="grid sm:grid-cols-3 gap-x-4 gap-y-5 items-start">
            <div>
              <label htmlFor="exp-startDate" className="field-label">
                Start Date <span className="text-danger" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"><CalendarIcon /></span>
                <input id="exp-startDate" value={form.startDate} onChange={e => set("startDate", parseDateInput(e.target.value))}
                  placeholder="MM / YYYY" maxLength={7}
                  aria-invalid={errors.startDate ? true : undefined} aria-describedby={describe("startDate")}
                  className={`field-input pl-10 tabular ${errorInput(errors.startDate)}`} />
              </div>
              <FieldError id="exp-startDate-error">{errors.startDate}</FieldError>
            </div>

            <div>
              <label htmlFor="exp-endDate" className="field-label">
                End Date {form.isCurrent
                  ? <span className="text-ink-400 font-normal">(Optional)</span>
                  : <span className="text-danger" aria-hidden="true">*</span>}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"><CalendarIcon /></span>
                <input id="exp-endDate" value={form.endDate} onChange={e => set("endDate", parseDateInput(e.target.value))}
                  placeholder="MM / YYYY" maxLength={7} disabled={form.isCurrent}
                  aria-invalid={errors.endDate ? true : undefined} aria-describedby={describe("endDate")}
                  className={`field-input pl-10 tabular ${form.isCurrent ? "" : errorInput(errors.endDate)}`} />
              </div>
              <FieldError id="exp-endDate-error">{errors.endDate}</FieldError>
            </div>

            <label className="sm:mt-6.5 flex items-center gap-2.5 h-11 px-3.5 rounded-xl border border-ink-200 bg-white cursor-pointer transition-colors hover:border-ink-300 has-checked:border-brand-300 has-checked:bg-brand-50">
              <input type="checkbox" checked={form.isCurrent}
                onChange={e => { set("isCurrent", e.target.checked); if (e.target.checked) set("endDate", ""); }}
                className="w-4 h-4 accent-brand-600 shrink-0" />
              <span className="text-body-sm text-ink-700">I am currently working here</span>
            </label>
          </div>
        </div>

        {/* What you did */}
        <div className="pt-6 border-t border-ink-200/70">
          <FormGroupTitle>What You Did</FormGroupTitle>
          <label htmlFor="exp-description" className="field-label">
            Role Description <span className="text-ink-400 font-normal">(Optional)</span>
          </label>
          <textarea
            id="exp-description"
            value={form.description}
            onChange={e => set("description", e.target.value)}
            rows={4}
            maxLength={4000}
            placeholder="e.g., Built REST APIs in Python and FastAPI, migrated the reporting database to PostgreSQL, mentored two junior engineers."
            aria-describedby="exp-description-hint"
            className="field-input resize-y"
          />
          <p id="exp-description-hint" className="field-hint">
            Mention the tools and skills you used. Recruiters see how long you used each skill based on this.
          </p>
        </div>

        {/* Projects */}
        <div className="pt-6 border-t border-ink-200/70">
          <ProjectsSubForm
            projects={projects}
            errors={errors}
            onAdd={addProject}
            onRemove={removeProject}
            onChange={setProject}
          />
        </div>
      </div>
    </ModalFrame>
  );
}
