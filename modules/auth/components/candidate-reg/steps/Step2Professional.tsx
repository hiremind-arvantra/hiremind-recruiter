"use client";

import { useState } from "react";
import type { CandidateRegStep2Data, Experience } from "../../../types/auth.types";
import AddExperienceModal from "../modals/AddExperienceModal";
import EducationSection from "../sections/EducationSection";
import StepActions from "../StepActions";
import UploadResumeBanner from "../sections/UploadResumeBanner";
import { deleteWorkExperience } from "../../../services/candidate.service";
import {
  BriefcaseIcon, BriefcaseIconLg, EditIcon, TrashIcon, SpinnerIcon, ChevronIcon,
} from "../shared/icons";
import { Tooltip, ConfirmDialog, SectionHeader, EmptyState, FieldError } from "../shared/ui";
import { useConfirmDelete } from "../shared/hooks";

interface Props {
  data: CandidateRegStep2Data;
  onChange: (data: CandidateRegStep2Data) => void;
  onNext: () => void;
  onBack: () => void;
}

interface ExpModalState {
  open: boolean;
  initialExperience?: Experience;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function fmtDate(mmYYYY: string): string {
  if (!mmYYYY || mmYYYY === "Present") return mmYYYY;
  const [mm, yyyy] = mmYYYY.split("/");
  return mm && yyyy ? `${MONTHS[parseInt(mm, 10) - 1]} ${yyyy}` : mmYYYY;
}

const ICON_BTN = "grid place-items-center w-10 h-10 rounded-xl text-ink-500 transition-colors disabled:opacity-40";

export default function Step2Professional({ data, onChange, onNext, onBack }: Props) {
  const [education, setEducation]     = useState(data.education);
  const [experience, setExperience]   = useState<Experience[]>(data.experience);
  const [resumeFileKey, setResumeFileKey] = useState(data.resumeFileKey);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [expandedExp, setExpandedExp] = useState<Set<string>>(new Set(data.experience.map((e) => e.id)));
  const [deletingExpId, setDeletingExpId] = useState<string | null>(null);
  const [expModal, setExpModal]       = useState<ExpModalState>({ open: false });
  const { confirm, triggerDelete, resetConfirm } = useConfirmDelete();

  const handleNext = () => {
    // Résumé is mandatory — it produces the embedding that powers the AI match engine,
    // fake-profile detector and recommendations across the platform.
    if (!resumeFileKey) {
      setResumeError("Please upload your résumé to continue — it's used to generate your AI match scores.");
      return;
    }
    onChange({ education, experience, resumeFileKey });
    onNext();
  };
  const handleBack = () => { onChange({ education, experience, resumeFileKey }); onBack(); };

  const handleDeleteExperience = async (id: string) => {
    resetConfirm();
    setDeletingExpId(id);
    try {
      await deleteWorkExperience(id);
      setExperience((prev) => prev.filter((e) => e.id !== id));
    } catch {
      // silently ignore — user can retry
    } finally {
      setDeletingExpId(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedExp((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {confirm.open && (
        <ConfirmDialog
          label={confirm.label}
          onConfirm={confirm.onConfirm}
          onCancel={resetConfirm}
        />
      )}
      {expModal.open && (
        <AddExperienceModal
          onClose={() => setExpModal({ open: false })}
          onSaved={(exp) => {
            setExperience((prev) =>
              expModal.initialExperience
                ? prev.map((e) => (e.id === exp.id ? exp : e))
                : [...prev.filter((e) => e.id !== exp.id), exp],
            );
            setExpandedExp((prev) => new Set([...prev, exp.id]));
            setExpModal({ open: false });
          }}
          initialExperience={expModal.initialExperience}
          existingIds={experience.map((e) => e.id)}
        />
      )}

      {/* ── Education Details ── */}
      <div className="rounded-2xl border border-ink-200/70 bg-white">
        <EducationSection education={education} onChange={setEducation} />
      </div>

      {/* ── Professional Experience ── */}
      <section className="rounded-2xl border border-ink-200/70 bg-white p-5">
        <SectionHeader
          icon={<BriefcaseIcon />}
          title="Professional Experience"
          addLabel="+ Add Experience"
          onAdd={() => setExpModal({ open: true })}
        />
        {experience.length === 0 ? (
          <EmptyState
            icon={<BriefcaseIconLg />}
            message="No experience added yet."
            hint='Click "Add Experience" to include your professional experience.'
          />
        ) : (
          <div className="space-y-3">
            {experience.map((exp) => (
              <ExperienceCard
                key={exp.id}
                exp={exp}
                expanded={expandedExp.has(exp.id)}
                onToggle={() => toggleExpand(exp.id)}
                onEdit={() => setExpModal({ open: true, initialExperience: exp })}
                onDelete={() => triggerDelete(`Delete experience at "${exp.company}"?`, () => handleDeleteExperience(exp.id))}
                isDeleting={deletingExpId === exp.id}
                onDeleteProject={(projId) => {
                  setExperience((prev) =>
                    prev.map((e) =>
                      e.id === exp.id
                        ? { ...e, projects: e.projects.filter((p) => p.id !== projId) }
                        : e,
                    ),
                  );
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Upload Resume Banner (required) ── */}
      <div>
        <UploadResumeBanner
          resumeFileKey={resumeFileKey || undefined}
          required
          onUploaded={(_fileName, key) => { setResumeFileKey(key ?? ""); if (key) setResumeError(null); }}
        />
        {resumeError && <FieldError>{resumeError}</FieldError>}
      </div>

      {/* ── Actions ── */}
      <StepActions onBack={handleBack} onNext={handleNext} />
    </div>
  );
}

/* ── Experience Card ── */
function ExperienceCard({ exp, expanded, onToggle, onEdit, onDelete, isDeleting, onDeleteProject }: {
  exp: Experience; expanded: boolean; isDeleting: boolean;
  onToggle: () => void; onEdit: () => void; onDelete: () => void;
  onDeleteProject: (projId: string) => void;
}) {
  const duration = `${fmtDate(exp.startDate)} – ${fmtDate(exp.endDate)}`;
  const noticePeriodDisplay = exp.noticePeriod
    ? isNaN(Number(exp.noticePeriod)) ? exp.noticePeriod : `${exp.noticePeriod} Days`
    : "—";

  return (
    <article className="rounded-2xl border border-ink-200/70 bg-ink-50/50">
      {/* Company + actions */}
      <div className="flex items-start justify-between gap-3 px-4 pt-4">
        <div className="flex items-start gap-3 min-w-0">
          <span className="icon-tile bg-white text-cobalt-600 border border-ink-200/70">
            <BriefcaseIcon />
          </span>
          <div className="min-w-0">
            <div className="text-micro font-medium text-ink-500">Company</div>
            <div className="font-display font-bold text-body-lg text-ink-900 truncate">{exp.company}</div>
          </div>
        </div>
        <div className="flex items-center shrink-0 -mr-1.5">
          <Tooltip label="Edit">
            <button type="button" onClick={onEdit} aria-label="Edit experience"
              className={`${ICON_BTN} hover:bg-brand-50 hover:text-brand-700`}><EditIcon /></button>
          </Tooltip>
          <Tooltip label="Delete">
            <button type="button" onClick={onDelete} disabled={isDeleting} aria-label="Delete experience"
              className={`${ICON_BTN} hover:bg-danger/10 hover:text-danger`}>
              {isDeleting ? <SpinnerIcon /> : <TrashIcon />}
            </button>
          </Tooltip>
          <Tooltip label={expanded ? "Collapse" : "Expand"}>
            <button type="button" onClick={onToggle} aria-label={expanded ? "Collapse projects" : "Expand projects"} aria-expanded={expanded}
              className={`${ICON_BTN} hover:bg-ink-100 hover:text-ink-800`}>
              <ChevronIcon expanded={expanded} />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Details */}
      <dl className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-3 px-4 pt-3 pb-4">
        <Meta label="Job Title" value={exp.jobTitle || "—"} />
        <Meta label="Employment Type" value={exp.employmentType || "—"} />
        <Meta label="Duration" value={duration} />
        <Meta label="Total Experience" value={exp.totalExperience ? `${exp.totalExperience} Yrs` : "—"} />
        <Meta label="Location" value={exp.location || "—"} />
        <Meta label="Notice Period" value={noticePeriodDisplay} />
      </dl>

      {/* Projects — only shown when expanded */}
      {expanded && (
        <div className="border-t border-ink-200/70 bg-white rounded-b-2xl">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="font-semibold text-body text-ink-900">
              Projects{exp.projects.length > 0 && <span className="ml-1 text-ink-500 tabular">({exp.projects.length})</span>}
            </span>
            <button type="button" onClick={onEdit} className="btn btn-ghost btn-sm text-brand-700">
              + Add Project
            </button>
          </div>

          {exp.projects.length === 0 ? (
            <div className="px-4 pb-4 text-caption text-ink-500">No projects added.</div>
          ) : (
            <div className="table-scroll border-t border-ink-200/70 rounded-b-2xl">
              <table className="data-table min-w-[640px]">
                <thead>
                  <tr>
                    {["Project Details","Role & Duration","Team Size","Technologies Used","Actions"].map((h) => (
                      <th key={h} scope="col">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {exp.projects.map((proj) => {
                    const techs = typeof proj.technologies === "string"
                      ? (proj.technologies as string).split(",").map((t) => t.trim()).filter(Boolean)
                      : proj.technologies;
                    return (
                      <tr key={proj.id} className="align-top">
                        <td className="max-w-[220px]">
                          <div className="font-semibold text-ink-900">{proj.title}</div>
                          {proj.description && (
                            <div className="text-ink-500 text-caption mt-0.5 line-clamp-2">{proj.description}</div>
                          )}
                        </td>
                        <td className="whitespace-nowrap">
                          {proj.role && <div className="text-ink-700"><span className="text-ink-500">Role:</span> {proj.role}</div>}
                          <div className="text-ink-500 text-caption mt-0.5">{fmtDate(proj.startDate)} – {fmtDate(proj.endDate)}</div>
                        </td>
                        <td className="text-center tabular">{proj.teamSize || "—"}</td>
                        <td>
                          <div className="flex flex-wrap gap-1">
                            {techs.map((t, ti) => (
                              <span key={`${proj.id}_${ti}_${t}`} className="badge badge-brand">{t}</span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center -my-2">
                            <Tooltip label="Edit experience">
                              <button type="button" onClick={onEdit} aria-label="Edit experience to manage projects"
                                className={`${ICON_BTN} hover:bg-brand-50 hover:text-brand-700`}><EditIcon /></button>
                            </Tooltip>
                            <Tooltip label="Remove project">
                              <button type="button" onClick={() => onDeleteProject(proj.id)} aria-label="Remove project"
                                className={`${ICON_BTN} hover:bg-danger/10 hover:text-danger`}><TrashIcon /></button>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-micro font-medium text-ink-500">{label}</dt>
      <dd className="mt-0.5 font-semibold text-body-sm text-ink-800 break-words">{value}</dd>
    </div>
  );
}
