"use client";

import { useState, useRef } from "react";
import { fetchSkills, type SkillCatalogItem } from "../../../services/candidate.service";
import type { ProjectForm } from "../shared/types";
import { CalendarIconSm, TrashIcon } from "../shared/icons";
import { FieldError, errorInput } from "../shared/ui";

function parseDateInput(val: string): string {
  const cleaned = val.replace(/\D/g, "");
  if (cleaned.length <= 2) return cleaned;
  return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 6)}`;
}

interface Props {
  projects: ProjectForm[];
  errors: Record<string, string>;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onChange: (index: number, patch: Partial<ProjectForm>) => void;
}

export default function ProjectsSubForm({ projects, errors, onAdd, onRemove, onChange }: Props) {
  const [skillSuggestions, setSkillSuggestions] = useState<Record<number, SkillCatalogItem[]>>({});
  const skillTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const fetchSuggestions = (projectIndex: number, query: string) => {
    clearTimeout(skillTimers.current[projectIndex]);
    if (!query.trim()) { setSkillSuggestions(s => ({ ...s, [projectIndex]: [] })); return; }
    skillTimers.current[projectIndex] = setTimeout(async () => {
      const results = await fetchSkills(query.trim());
      setSkillSuggestions(s => ({ ...s, [projectIndex]: results }));
    }, 250);
  };

  const pickSuggestion = (projectIndex: number, skillName: string) => {
    const proj = projects[projectIndex];
    onChange(projectIndex, proj.skills.includes(skillName)
      ? { skillInput: "" }
      : { skills: [...proj.skills, skillName], skillInput: "" }
    );
    setSkillSuggestions(s => ({ ...s, [projectIndex]: [] }));
  };

  const commitSkill = (projectIndex: number) => {
    const proj = projects[projectIndex];
    const skill = proj.skillInput.replace(/,$/, "").trim();
    if (!skill || proj.skills.includes(skill)) { onChange(projectIndex, { skillInput: "" }); return; }
    onChange(projectIndex, { skills: [...proj.skills, skill], skillInput: "" });
  };

  const removeSkill = (projectIndex: number, skill: string) =>
    onChange(projectIndex, { skills: projects[projectIndex].skills.filter(s => s !== skill) });

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="section-title">
          Projects{projects.length > 0 && <span className="text-ink-500 font-semibold ml-1 tabular">({projects.length})</span>}
        </h3>
        <button type="button" onClick={onAdd} className="btn btn-outline btn-sm">
          + Add Project
        </button>
      </div>

      {projects.length === 0 && (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-ink-50/60 px-4 py-6 text-center text-body-sm text-ink-500">
          No projects added. Click &ldquo;+ Add Project&rdquo; to include your work.
        </div>
      )}

      <div className="space-y-4">
        {projects.map((proj, idx) => {
          const err = (k: string) => errors[`project_${idx}_${k}`];
          const pid = (k: string) => `proj-${idx}-${k}`;
          return (
            <div key={idx} className="surface-muted p-4 sm:p-5 space-y-4">

              {/* Project header */}
              <div className="flex items-center justify-between">
                <span className="grid place-items-center w-7 h-7 rounded-full bg-[image:var(--gradient-brand)] text-white text-caption font-bold shrink-0 tabular">
                  {idx + 1}
                </span>
                <button type="button" onClick={() => onRemove(idx)}
                  className="btn btn-ghost btn-sm text-danger hover:text-danger">
                  <TrashIcon /> Remove
                </button>
              </div>

              {/* Title + Role + Team Size + Duration */}
              <div className="grid sm:grid-cols-2 gap-x-4 gap-y-4">
                <div>
                  <label htmlFor={pid("title")} className="field-label">
                    Project Title <span className="text-danger" aria-hidden="true">*</span>
                  </label>
                  <input id={pid("title")} value={proj.title} onChange={e => onChange(idx, { title: e.target.value })}
                    placeholder="Enter project title"
                    aria-invalid={err("title") ? true : undefined}
                    aria-describedby={err("title") ? `${pid("title")}-error` : undefined}
                    className={`field-input ${errorInput(err("title"))}`} />
                  <FieldError id={`${pid("title")}-error`}>{err("title")}</FieldError>
                </div>

                <div>
                  <label htmlFor={pid("role")} className="field-label">
                    Role in Project <span className="text-danger" aria-hidden="true">*</span>
                  </label>
                  <input id={pid("role")} value={proj.role} onChange={e => onChange(idx, { role: e.target.value })}
                    placeholder="e.g., Developer, Team Lead"
                    aria-invalid={err("role") ? true : undefined}
                    aria-describedby={err("role") ? `${pid("role")}-error` : undefined}
                    className={`field-input ${errorInput(err("role"))}`} />
                  <FieldError id={`${pid("role")}-error`}>{err("role")}</FieldError>
                </div>

                <div>
                  <label htmlFor={pid("teamSize")} className="field-label">
                    Team Size <span className="text-ink-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    id={pid("teamSize")}
                    type="number" min="1" max="9999"
                    value={proj.teamSize}
                    onChange={e => onChange(idx, { teamSize: e.target.value.replace(/\D/g, "") })}
                    placeholder="e.g., 5"
                    className="field-input" />
                </div>

                <div>
                  <label htmlFor={pid("startDate")} className="field-label">
                    Duration <span className="text-danger" aria-hidden="true">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1 min-w-0">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"><CalendarIconSm /></span>
                      <input id={pid("startDate")} value={proj.startDate} onChange={e => onChange(idx, { startDate: parseDateInput(e.target.value) })}
                        placeholder="MM/YYYY" maxLength={7} aria-label="Project start date"
                        aria-invalid={err("startDate") ? true : undefined}
                        className={`field-input pl-8 pr-2 text-body-sm tabular ${errorInput(err("startDate"))}`} />
                    </div>
                    <span className="text-ink-400 text-caption shrink-0" aria-hidden="true">–</span>
                    <div className="relative flex-1 min-w-0">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"><CalendarIconSm /></span>
                      <input value={proj.endDate} onChange={e => onChange(idx, { endDate: parseDateInput(e.target.value) })}
                        placeholder="MM/YYYY" maxLength={7} aria-label="Project end date"
                        aria-invalid={err("endDate") ? true : undefined}
                        className={`field-input pl-8 pr-2 text-body-sm tabular ${errorInput(err("endDate"))}`} />
                    </div>
                  </div>
                  <FieldError>{err("startDate") || err("endDate")}</FieldError>
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor={pid("description")} className="field-label">
                  Project Description <span className="text-danger" aria-hidden="true">*</span>
                </label>
                <textarea id={pid("description")} value={proj.description}
                  onChange={e => onChange(idx, { description: e.target.value.slice(0, 1000) })}
                  placeholder="Describe the project, your responsibilities, and the impact you created..."
                  rows={3}
                  aria-invalid={err("description") ? true : undefined}
                  aria-describedby={err("description") ? `${pid("description")}-error` : undefined}
                  className={`field-input resize-none ${errorInput(err("description"))}`} />
                <div className="flex items-start justify-between gap-3">
                  {err("description")
                    ? <FieldError id={`${pid("description")}-error`}>{err("description")}</FieldError>
                    : <span />}
                  <span className="mt-1.5 text-micro text-ink-400 tabular shrink-0">{proj.description.length} / 1000</span>
                </div>
              </div>

              {/* Skills tag input */}
              <div className="relative">
                <label htmlFor={pid("skills")} className="field-label">
                  Skills Used in this Project <span className="text-danger" aria-hidden="true">*</span>
                </label>
                <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-2.5 py-2 min-h-11 transition-[border-color,box-shadow] hover:border-ink-300 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/10">
                  {proj.skills.map(skill => (
                    <span key={skill} className="badge badge-brand h-7 pl-2.5 pr-1 text-caption">
                      {skill}
                      <button type="button" onClick={() => removeSkill(idx, skill)} aria-label={`Remove ${skill}`}
                        className="grid place-items-center w-5 h-5 rounded-full text-brand-500 hover:text-brand-800 hover:bg-brand-100 transition-colors">
                        <svg aria-hidden="true" width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" /></svg>
                      </button>
                    </span>
                  ))}
                  <input
                    id={pid("skills")}
                    value={proj.skillInput}
                    onChange={e => {
                      onChange(idx, { skillInput: e.target.value });
                      fetchSuggestions(idx, e.target.value);
                    }}
                    onKeyDown={e => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        commitSkill(idx);
                        setSkillSuggestions(s => ({ ...s, [idx]: [] }));
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => setSkillSuggestions(s => ({ ...s, [idx]: [] })), 150);
                      if (proj.skillInput.trim()) commitSkill(idx);
                    }}
                    placeholder={proj.skills.length === 0 ? "Search or add skills" : ""}
                    aria-describedby={`${pid("skills")}-hint`}
                    className="flex-1 min-w-28 h-7 px-1.5 text-body-sm text-ink-700 outline-none bg-transparent placeholder:text-ink-400" />
                </div>
                {(skillSuggestions[idx]?.length ?? 0) > 0 && (
                  <ul className="absolute z-20 left-0 right-0 mt-1 p-1 bg-white rounded-xl border border-ink-200/70 shadow-elevated max-h-44 overflow-y-auto">
                    {skillSuggestions[idx].map(s => (
                      <li key={s.id}>
                        <button type="button" onMouseDown={() => pickSuggestion(idx, s.name)}
                          className="w-full text-left px-3 py-2 rounded-lg text-body-sm text-ink-700 hover:bg-brand-50 hover:text-brand-700 transition-colors">
                          {s.name}
                          {s.category && <span className="text-micro text-ink-400 ml-2">{s.category}</span>}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <p id={`${pid("skills")}-hint`} className="field-hint">Press Enter or comma to add a skill</p>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
