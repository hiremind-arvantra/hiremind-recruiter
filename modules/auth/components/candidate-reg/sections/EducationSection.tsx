"use client";

import { useState } from "react";
import type { Education } from "../../../types/auth.types";
import AddEducationModal from "../modals/AddEducationModal";
import { deleteEducation } from "../../../services/candidate.service";
import { GradIcon, GradIconLg, EditIcon, TrashIcon, SpinnerIcon } from "../shared/icons";
import { Tooltip, ConfirmDialog, SectionHeader, EmptyState } from "../shared/ui";
import type { EduModalState } from "../shared/types";

interface Props {
  education: Education[];
  onChange: (education: Education[]) => void;
}

const ICON_BTN = "grid place-items-center w-10 h-10 rounded-xl text-ink-500 transition-colors disabled:opacity-40";

export default function EducationSection({ education, onChange }: Props) {
  const [eduModal, setEduModal]       = useState<EduModalState>({ open: false });
  const [deletingId, setDeletingId]   = useState<string | null>(null);
  const [confirm, setConfirm]         = useState<{ open: boolean; label: string; id: string }>({ open: false, label: "", id: "" });

  const handleDelete = async () => {
    setConfirm((prev) => ({ ...prev, open: false }));
    setDeletingId(confirm.id);
    try {
      await deleteEducation(confirm.id);
      onChange(education.filter((e) => e.id !== confirm.id));
    } catch {
      // silently ignore — user can retry
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="p-5">
      {confirm.open && (
        <ConfirmDialog
          label={confirm.label}
          onConfirm={handleDelete}
          onCancel={() => setConfirm({ open: false, label: "", id: "" })}
        />
      )}
      {eduModal.open && (
        <AddEducationModal
          onClose={() => setEduModal({ open: false })}
          onSaved={(edu) => {
            onChange(
              eduModal.editId
                ? education.map((e) => (e.id === edu.id ? edu : e))
                : [...education.filter((e) => e.id !== edu.id), edu],
            );
            setEduModal({ open: false });
          }}
          editId={eduModal.editId}
          initialData={eduModal.initialData}
          existingAttachments={eduModal.existingAttachments}
          existingIds={education.map((e) => e.id)}
        />
      )}

      <SectionHeader
        icon={<GradIcon />}
        title="Education Details"
        addLabel="+ Add Education"
        onAdd={() => setEduModal({ open: true })}
      />

      {education.length === 0 ? (
        <EmptyState
          icon={<GradIconLg />}
          message="No education added yet."
          hint='Click "Add Education" to include your educational background.'
        />
      ) : (
        <div className="table-scroll rounded-2xl border border-ink-200/70">
          <table className="data-table min-w-[620px]">
            <thead>
              <tr>
                {["Degree / Course", "Institute / University", "Specialization", "Year of Passing", "Actions"].map((h) => (
                  <th key={h} scope="col">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {education.map((edu) => (
                <tr key={edu.id}>
                  <td className="font-semibold text-ink-900">{edu.degree}</td>
                  <td>{edu.institution}</td>
                  <td className="text-ink-600">{edu.specialization || "—"}</td>
                  <td className="text-ink-600 whitespace-nowrap tabular">{edu.yearOfPassing || "—"}</td>
                  <td>
                    <div className="flex items-center -my-2">
                      <Tooltip label="Edit">
                        <button type="button" aria-label={`Edit ${edu.degree}`}
                          onClick={() => setEduModal({
                            open: true, editId: edu.id,
                            initialData: {
                              degree: edu.degree, institution: edu.institution,
                              specialization: edu.specialization, location: edu.location,
                              yearOfPassing: edu.yearOfPassing, grade: edu.grade,
                              educationType: edu.educationType, description: edu.description,
                            },
                            existingAttachments: edu.attachmentFileKeys ?? [],
                          })}
                          className={`${ICON_BTN} hover:bg-brand-50 hover:text-brand-700`}>
                          <EditIcon />
                        </button>
                      </Tooltip>
                      <Tooltip label="Delete">
                        <button type="button" aria-label={`Delete ${edu.degree}`}
                          onClick={() => setConfirm({ open: true, label: `Delete "${edu.degree}" from ${edu.institution}?`, id: edu.id })}
                          disabled={deletingId === edu.id}
                          className={`${ICON_BTN} hover:bg-danger/10 hover:text-danger`}>
                          {deletingId === edu.id ? <SpinnerIcon /> : <TrashIcon />}
                        </button>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
