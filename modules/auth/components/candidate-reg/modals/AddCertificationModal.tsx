"use client";

import { useRef, useState } from "react";
import type { Certification } from "../../../types/auth.types";
import { addCertification, updateCertification, uploadCertificateFile } from "../../../services/candidate.service";
import type { CertificationFormData } from "../shared/types";
import { MONTHS_LONG, PAST_YEARS, FUTURE_YEARS } from "../shared/constants";
import { CertBadgeIcon, InfoIcon, LinkIcon, CalendarIcon, ChevronDownIcon, UploadCloudIcon, SpinnerIcon } from "../shared/icons";
import { ModalFrame, FormGroupTitle, FieldError, errorInput } from "../shared/ui";

const EMPTY: CertificationFormData = {
  name: "", institution: "", credentialId: "", certificateUrl: "",
  passedYear: "", validTillMonth: "", validTillYear: "",
  doesNotExpire: false, description: "", displayOnProfile: true,
};

interface Props {
  onClose: () => void;
  onSaved: (cert: Certification) => void;
  editCert?: Certification;
  /** Ids already in the list — used to reliably identify the newly created row. */
  existingIds?: string[];
}

export default function AddCertificationModal({ onClose, onSaved, editCert, existingIds = [] }: Props) {
  const isEdit = Boolean(editCert);

  const [form, setForm] = useState<CertificationFormData>(editCert ? {
    name:            editCert.name,
    institution:     editCert.institution,
    credentialId:    editCert.credentialId   ?? "",
    certificateUrl:  editCert.certificateUrl ?? "",
    passedYear:      editCert.passedYear,
    validTillMonth:  (editCert.doesNotExpire || !editCert.validTill || editCert.validTill === "Does not expire" || editCert.validTill === "—")
      ? "" : editCert.validTill.split(" ")[0] ?? "",
    validTillYear:   (editCert.doesNotExpire || !editCert.validTill || editCert.validTill === "Does not expire" || editCert.validTill === "—")
      ? "" : editCert.validTill.split(" ")[1] ?? "",
    doesNotExpire:   editCert.doesNotExpire ?? false,
    description:     editCert.description   ?? "",
    displayOnProfile: editCert.displayOnProfile ?? true,
  } : EMPTY);

  const [errors, setErrors]     = useState<Partial<Record<keyof CertificationFormData, string>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile]   = useState<File | null>(null);
  const [existingFileKey, setExistingFileKey] = useState<string | null>(editCert?.certificateFileKey ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof CertificationFormData>(k: K, v: CertificationFormData[K]) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: "" }));
  };

  const validate = () => {
    const errs: Partial<Record<keyof CertificationFormData, string>> = {};
    if (!form.name.trim())        errs.name        = "Certification Name is required";
    if (!form.institution.trim()) errs.institution  = "Issuing Institution is required";
    if (!form.passedYear)         errs.passedYear   = "Passed Year is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    setApiError(null);

    const MONTHS_LONG_MAP: Record<string, string> = {
      January:"01",February:"02",March:"03",April:"04",May:"05",June:"06",
      July:"07",August:"08",September:"09",October:"10",November:"11",December:"12",
    };
    const validTillISO = !form.doesNotExpire && form.validTillYear
      ? `${form.validTillYear}-${MONTHS_LONG_MAP[form.validTillMonth] ?? "01"}-01`
      : undefined;
    const validTillDisplay = form.doesNotExpire
      ? "Does not expire"
      : form.validTillMonth && form.validTillYear
        ? `${form.validTillMonth} ${form.validTillYear}`
        : form.validTillYear || "—";

    const payload = {
      certificationName:  form.name.trim(),
      issuingInstitution: form.institution.trim(),
      credentialId:       form.credentialId.trim()   || undefined,
      certificateUrl:     form.certificateUrl.trim() || undefined,
      passedYear:         form.passedYear ? parseInt(form.passedYear) : undefined,
      validTill:          validTillISO,
      doesNotExpire:      form.doesNotExpire,
      displayOnProfile:   form.displayOnProfile,
      description:        form.description.trim() || undefined,
    };

    try {
      let certId: string;
      if (isEdit && editCert) {
        await updateCertification(editCert.id, payload);
        certId = editCert.id;
      } else {
        certId = await addCertification(payload, existingIds);
      }

      let certificateFileKey: string | undefined;
      if (selectedFile) {
        try {
          await uploadCertificateFile(certId, selectedFile);
          certificateFileKey = `uploaded:${selectedFile.name}`;
        } catch {
          // Non-fatal — cert saved; file upload failed silently
        }
      }

      onSaved({
        id: certId,
        name:             form.name.trim(),
        institution:      form.institution.trim(),
        credentialId:     form.credentialId.trim()   || undefined,
        certificateUrl:   form.certificateUrl.trim() || undefined,
        passedYear:       form.passedYear,
        validTill:        validTillDisplay,
        doesNotExpire:    form.doesNotExpire,
        description:      form.description.trim() || undefined,
        displayOnProfile: form.displayOnProfile,
        certificateFileKey,
      });
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to save certification");
      setIsSaving(false);
    }
  };

  return (
    <ModalFrame
      titleId="cert-modal-title"
      icon={<CertBadgeIcon />}
      title={isEdit ? "Edit Certification" : "Add Certification"}
      subtitle="Add your professional certifications to showcase your achievements."
      onClose={onClose}
      maxWidth="max-w-[700px]"
      footer={
        <>
          {apiError && (
            <div role="alert" className="alert alert-danger mx-5 sm:mx-6 mt-4">
              {apiError}
            </div>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5 sm:px-6 py-4">
            <label htmlFor="cert-displayOnProfile" className="flex items-start gap-2.5 cursor-pointer min-w-0">
              <input id="cert-displayOnProfile" type="checkbox" checked={form.displayOnProfile}
                onChange={e => set("displayOnProfile", e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded accent-brand-600 shrink-0" />
              <span>
                <span className="block text-body-sm font-semibold text-ink-800">Display on my profile</span>
                <span className="block text-caption text-ink-500">This certification will be visible to recruiters on your profile.</span>
              </span>
            </label>
            <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-2 shrink-0">
              <button type="button" onClick={onClose} disabled={isSaving} className="btn btn-outline">
                Cancel
              </button>
              <button type="button" onClick={handleSave} disabled={isSaving} className="btn btn-primary px-6">
                {isSaving ? <><SpinnerIcon /> Saving…</> : isEdit ? "Update Certification" : "Save Certification"}
              </button>
            </div>
          </div>
        </>
      }
    >
      <div className="space-y-7">
        {/* Credential */}
        <div>
          <FormGroupTitle>Credential</FormGroupTitle>
          <div className="grid sm:grid-cols-2 gap-x-4 gap-y-5">
            <div>
              <label htmlFor="cert-name" className="field-label">
                Certification Name <span className="text-danger" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <input id="cert-name" value={form.name} onChange={e => set("name", e.target.value.slice(0, 120))}
                  placeholder="Enter certification name"
                  aria-invalid={errors.name ? true : undefined}
                  aria-describedby={errors.name ? "cert-name-error" : undefined}
                  className={`field-input pr-16 ${errorInput(errors.name)}`} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-micro text-ink-400 tabular pointer-events-none">{form.name.length}/120</span>
              </div>
              <FieldError id="cert-name-error">{errors.name}</FieldError>
            </div>
            <div>
              <label htmlFor="cert-institution" className="field-label">
                Issuing Institution / Organization <span className="text-danger" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <input id="cert-institution" value={form.institution} onChange={e => set("institution", e.target.value.slice(0, 120))}
                  placeholder="Enter institution or organization name"
                  aria-invalid={errors.institution ? true : undefined}
                  aria-describedby={errors.institution ? "cert-institution-error" : undefined}
                  className={`field-input pr-16 ${errorInput(errors.institution)}`} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-micro text-ink-400 tabular pointer-events-none">{form.institution.length}/120</span>
              </div>
              <FieldError id="cert-institution-error">{errors.institution}</FieldError>
            </div>

            <div>
              <div className="flex items-center gap-1 mb-1.5">
                <label htmlFor="cert-credentialId" className="text-body-sm font-semibold text-ink-700">Credential ID</label>
                <span className="text-ink-400 font-normal text-body-sm">(Optional)</span>
                <button type="button" title="The unique ID printed on your certificate" aria-label="The unique ID printed on your certificate"
                  className="grid place-items-center w-6 h-6 rounded-md text-ink-400 hover:text-ink-600 transition-colors"><InfoIcon /></button>
              </div>
              <input id="cert-credentialId" value={form.credentialId} onChange={e => set("credentialId", e.target.value)}
                placeholder="Enter credential ID / license number"
                className="field-input" />
            </div>
            <div>
              <div className="flex items-center gap-1 mb-1.5">
                <label htmlFor="cert-certificateUrl" className="text-body-sm font-semibold text-ink-700">Certificate URL</label>
                <span className="text-ink-400 font-normal text-body-sm">(Optional)</span>
                <button type="button" title="Link to verify your certificate online" aria-label="Link to verify your certificate online"
                  className="grid place-items-center w-6 h-6 rounded-md text-ink-400 hover:text-ink-600 transition-colors"><InfoIcon /></button>
              </div>
              <div className="relative">
                <input id="cert-certificateUrl" value={form.certificateUrl} onChange={e => set("certificateUrl", e.target.value)}
                  placeholder="Enter certificate URL"
                  className="field-input pr-10" />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"><LinkIcon /></span>
              </div>
            </div>
          </div>
        </div>

        {/* Validity */}
        <div className="pt-6 border-t border-ink-200/70">
          <FormGroupTitle>Validity</FormGroupTitle>
          <div className="grid sm:grid-cols-2 gap-x-4 gap-y-5">
            <div>
              <label htmlFor="cert-passedYear" className="field-label">
                Passed Year <span className="text-danger" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"><CalendarIcon /></span>
                <select id="cert-passedYear" value={form.passedYear} onChange={e => set("passedYear", e.target.value)}
                  aria-invalid={errors.passedYear ? true : undefined}
                  aria-describedby={errors.passedYear ? "cert-passedYear-error" : undefined}
                  className={`field-input pl-10 pr-8 text-body-sm appearance-none ${errorInput(errors.passedYear)}`}>
                  <option value="">Select passed year</option>
                  {PAST_YEARS.map(y => <option key={y}>{y}</option>)}
                </select>
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"><ChevronDownIcon /></span>
              </div>
              <FieldError id="cert-passedYear-error">{errors.passedYear}</FieldError>
            </div>
            <div>
              <label htmlFor="cert-validTillMonth" className="field-label">
                Valid Till <span className="text-ink-400 font-normal">(Optional)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <select id="cert-validTillMonth" value={form.validTillMonth} onChange={e => set("validTillMonth", e.target.value)}
                    disabled={form.doesNotExpire}
                    className="field-input pl-3 pr-7 text-body-sm appearance-none">
                    <option value="">Month</option>
                    {MONTHS_LONG.map(m => <option key={m}>{m}</option>)}
                  </select>
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"><ChevronDownIcon /></span>
                </div>
                <div className="relative">
                  <select value={form.validTillYear} onChange={e => set("validTillYear", e.target.value)}
                    disabled={form.doesNotExpire} aria-label="Valid till year"
                    className="field-input pl-3 pr-7 text-body-sm appearance-none">
                    <option value="">Year</option>
                    {FUTURE_YEARS.map(y => <option key={y}>{y}</option>)}
                  </select>
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"><ChevronDownIcon /></span>
                </div>
              </div>
              <label className="mt-2 inline-flex items-center gap-2 min-h-9 cursor-pointer">
                <input type="checkbox" checked={form.doesNotExpire}
                  onChange={e => { set("doesNotExpire", e.target.checked); if (e.target.checked) { set("validTillMonth", ""); set("validTillYear", ""); } }}
                  className="w-4 h-4 rounded accent-brand-600" />
                <span className="text-body-sm text-ink-700">Does not expire</span>
              </label>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="cert-description" className="field-label">
            Description <span className="text-ink-400 font-normal">(Optional)</span>
          </label>
          <textarea id="cert-description" value={form.description}
            onChange={e => set("description", e.target.value.slice(0, 500))}
            placeholder="Add a brief description about this certification"
            rows={2}
            className="field-input resize-none" />
          <div className="text-right text-micro text-ink-400 mt-1 tabular">{form.description.length}/500</div>
        </div>

        {/* File Upload */}
        <div>
          <div className="field-label">
            Certificate <span className="text-ink-400 font-normal">(Optional)</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            aria-label="Upload certificate file"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              if (file && file.size > 5 * 1024 * 1024) {
                setApiError("Certificate file must be 5 MB or smaller.");
                return;
              }
              setSelectedFile(file);
              setExistingFileKey(null);
              setApiError(null);
            }}
          />
          {(() => {
            const hasFile = selectedFile || existingFileKey;
            const label   = selectedFile ? selectedFile.name : existingFileKey?.split("/").pop() ?? "Uploaded document";
            return (
              <div
                role="button"
                tabIndex={0}
                aria-label="Select certificate file"
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
                className={`rounded-2xl border-2 border-dashed px-4 sm:px-5 py-4 flex items-center gap-4 cursor-pointer transition-colors group focus-visible:outline-2 focus-visible:outline-brand-500 focus-visible:outline-offset-2
                  ${hasFile
                    ? "border-green-300 bg-green-50/40 hover:border-green-400"
                    : "border-ink-200 bg-ink-50/50 hover:bg-brand-50/40 hover:border-brand-300"}`}>
                <span className={`icon-tile w-12 h-12 rounded-2xl transition-colors
                  ${hasFile ? "bg-white text-green-700 border border-green-200" : "bg-white text-brand-600 border border-ink-200/70"}`}>
                  {hasFile ? (
                    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <UploadCloudIcon />
                  )}
                </span>
                <div className="min-w-0">
                  {hasFile ? (
                    <>
                      <div className="text-body font-semibold text-green-800 truncate">{label}</div>
                      <div className="text-caption text-ink-500 mt-0.5">Click to replace file</div>
                    </>
                  ) : (
                    <>
                      <div className="text-body font-semibold text-ink-800">
                        Drag &amp; drop file here or{" "}
                        <span className="text-brand-700">browse</span>
                      </div>
                      <div className="text-caption text-ink-500 mt-0.5">Supports PDF, JPG, PNG (Max 5 MB)</div>
                    </>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </ModalFrame>
  );
}
