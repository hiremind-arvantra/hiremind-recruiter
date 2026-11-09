"use client";

import { useState } from "react";
import type { Certification } from "../../../types/auth.types";
import AddCertificationModal from "../modals/AddCertificationModal";
import { deleteCertification } from "../../../services/candidate.service";
import { CertIcon, CertIconLg, EditIcon, TrashIcon, SpinnerIcon } from "../shared/icons";
import { Tooltip, ConfirmDialog, EmptyState } from "../shared/ui";
import { useConfirmDelete } from "../shared/hooks";

interface Props {
  certifications: Certification[];
  onChange: (certifications: Certification[]) => void;
}

const ICON_BTN = "grid place-items-center w-10 h-10 rounded-xl text-ink-500 transition-colors disabled:opacity-40";

export default function CertificationsSection({ certifications, onChange }: Props) {
  const [certModal,      setCertModal]      = useState<{ open: boolean; editCert?: Certification }>({ open: false });
  const { confirm, triggerDelete, resetConfirm } = useConfirmDelete();
  const [deletingCertId, setDeletingCertId] = useState<string | null>(null);

  const handleDeleteCert = async (id: string) => {
    resetConfirm();
    setDeletingCertId(id);
    try {
      await deleteCertification(id);
      onChange(certifications.filter(c => c.id !== id));
    } catch { /* silently ignore */ }
    finally { setDeletingCertId(null); }
  };

  return (
    <section className="p-5">
      {confirm.open && (
        <ConfirmDialog label={confirm.label} onConfirm={confirm.onConfirm}
          onCancel={resetConfirm} />
      )}
      {certModal.open && (
        <AddCertificationModal
          existingIds={certifications.map(c => c.id)}
          onClose={() => setCertModal({ open: false })}
          onSaved={cert => {
            onChange(certModal.editCert
              ? certifications.map(c => c.id === cert.id ? cert : c)
              : [...certifications.filter(c => c.id !== cert.id), cert]
            );
            setCertModal({ open: false });
          }}
          editCert={certModal.editCert}
        />
      )}

      <div className="flex items-center justify-between gap-3 mb-1.5">
        <div className="flex items-center gap-3 min-w-0">
          <span className="icon-tile icon-tile-sm bg-brand-50 text-brand-600"><CertIcon /></span>
          <h3 className="section-title truncate">Professional Certifications</h3>
        </div>
        <button type="button" onClick={() => setCertModal({ open: true })}
          className="btn btn-outline btn-sm shrink-0">+ Add Certification</button>
      </div>
      <p className="text-caption text-ink-500 mb-4 sm:pl-11">
        Add your certifications to showcase your credentials and stand out to recruiters.
      </p>

      {certifications.length === 0
        ? (
          <EmptyState
            icon={<CertIconLg />}
            message="No certifications added yet."
            hint={'Click "+ Add Certification" to showcase your achievements.'}
          />
        ) : (
          <div className="table-scroll rounded-2xl border border-ink-200/70">
            <table className="data-table min-w-[640px]">
              <thead>
                <tr>
                  {["Certification Name","Issuing Institution","Passed Year","Valid Till","Actions"].map(h => (
                    <th key={h} scope="col">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {certifications.map((c) => (
                  <tr key={c.id}>
                    <td className="max-w-[220px]">
                      <div className="font-semibold text-ink-900 truncate">{c.name}</div>
                      {c.credentialId && <div className="text-micro text-ink-500 font-normal">ID: {c.credentialId}</div>}
                    </td>
                    <td>{c.institution}</td>
                    <td className="tabular">{c.passedYear}</td>
                    <td>
                      {c.doesNotExpire
                        ? <span className="badge badge-success">No Expiry</span>
                        : c.validTill
                      }
                    </td>
                    <td>
                      <div className="flex items-center -my-2">
                        <Tooltip label="Edit">
                          <button type="button" aria-label={`Edit ${c.name}`} onClick={() => setCertModal({ open: true, editCert: c })}
                            className={`${ICON_BTN} hover:bg-brand-50 hover:text-brand-700`}><EditIcon /></button>
                        </Tooltip>
                        <Tooltip label="Delete">
                          <button type="button" aria-label={`Delete ${c.name}`}
                            onClick={() => triggerDelete(`Delete "${c.name}"?`, () => handleDeleteCert(c.id))}
                            disabled={deletingCertId === c.id}
                            className={`${ICON_BTN} hover:bg-danger/10 hover:text-danger`}>
                            {deletingCertId === c.id ? <SpinnerIcon /> : <TrashIcon />}
                          </button>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
    </section>
  );
}
