"use client";

import { useRef, useState } from "react";
import { uploadResume } from "../../../services/candidate.service";
import { UploadIcon, SpinnerIcon } from "../shared/icons";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
const ALLOWED_EXT   = [".pdf", ".docx"];

interface Props {
  /** S3 key returned by the backend after a previous upload — truthy means resume exists. */
  resumeFileKey?: string;
  /** Marks the résumé as mandatory (shows a required label + prompt). */
  required?: boolean;
  /** Called with the file name and S3 key after a successful upload. */
  onUploaded?: (fileName: string, resumeFileKey: string | null) => void;
}

type UploadStatus = "idle" | "uploading" | "success" | "error";

export default function UploadResumeBanner({ resumeFileKey, required, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus]       = useState<UploadStatus>(resumeFileKey ? "success" : "idle");
  const [fileName, setFileName]   = useState<string>("");
  const [errorMsg, setErrorMsg]   = useState<string>("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setStatus("error");
      setErrorMsg("Only PDF or DOCX files are allowed.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setStatus("error");
      setErrorMsg("File exceeds the 5 MB limit.");
      return;
    }

    setStatus("uploading");
    setErrorMsg("");
    setFileName(file.name);

    try {
      const key = await uploadResume(file);
      setStatus("success");
      onUploaded?.(file.name, key);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Upload failed. Please try again.");
    }
  };

  const isUploaded = status === "success";

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 rounded-2xl border px-4 py-4 transition-colors
      ${isUploaded ? "border-green-200 bg-green-50/50" : "card-ai"}`}>
      {/* hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_EXT.join(",")}
        className="hidden"
        onChange={handleFileChange}
        aria-label="Upload resume"
      />

      <div className="flex items-start gap-3.5 flex-1 min-w-0">
        <span className={`icon-tile ${isUploaded ? "bg-white text-green-700 border border-green-200" : "bg-brand-50 text-brand-600 ring-1 ring-brand-100"}`}>
          {isUploaded ? (
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <UploadIcon />
          )}
        </span>

        <div className="flex-1 min-w-0">
          <div className={`font-semibold text-body ${isUploaded ? "text-green-800" : "text-ink-900"}`}>
            {isUploaded
              ? <>Resume Uploaded <span className="text-micro font-semibold text-green-600" aria-hidden="true">✓</span></>
              : <>Upload Your Resume {required && <span className="text-danger" aria-hidden="true">*</span>}</>}
          </div>
          {isUploaded ? (
            <div className="text-caption text-ink-500 mt-0.5 truncate">{fileName || "Resume on file"}</div>
          ) : (
            <div className="text-caption text-ink-500 mt-0.5 leading-relaxed">
              {required ? "Required — used to generate your AI match scores against jobs." : "Stand out to recruiters by uploading your resume."}
            </div>
          )}
          {status === "error" && (
            <div className="field-error mt-1" role="alert">{errorMsg}</div>
          )}
          {!isUploaded && (
            <div className="text-micro text-ink-400 mt-1">
              Allowed format: PDF, DOCX only&nbsp;•&nbsp;Max size: 5 MB
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        disabled={status === "uploading"}
        onClick={() => inputRef.current?.click()}
        className={`btn btn-sm self-start sm:self-auto shrink-0 ${isUploaded ? "btn-outline" : "btn-secondary"}`}>
        {status === "uploading"
          ? <><SpinnerIcon /> Uploading…</>
          : isUploaded
            ? "Replace"
            : <><UploadIcon /> Upload Resume</>}
      </button>
    </div>
  );
}
