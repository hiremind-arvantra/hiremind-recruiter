"use client";

import { useRef, useState } from "react";
import { AIInsight } from "@/components/ui/AIInsight";
import { Skeleton } from "@/components/ui/Skeleton";
import { parseResumePreview, type ResumeParsePreview } from "../../../services/candidate.service";
import { prefillSummary } from "./resumePrefill";

const MAX_MB = 5;
// No .doc: the parser reads PDF and DOCX only, and a legacy .doc would be accepted
// here and then come back unreadable.
const ACCEPT = ".pdf,.docx";

type Status = "idle" | "parsing" | "filled" | "unreadable";

interface Props {
  /** The chosen file, held by the parent so it survives step navigation. */
  file: File | null;
  onFileChange: (file: File | null) => void;
  /** Called once with the parsed payload so the parent can fill the later steps. */
  onParsed: (preview: ResumeParsePreview) => void;
  /** Set when the candidate tried to continue without choosing a file. */
  error?: string | null;
}

/**
 * Mandatory first field of candidate registration: upload a resume, and the rest of the
 * form fills itself in from it.
 *
 * The file is required, but a *successful parse* is not — an unreadable scan or an AI
 * outage leaves the candidate free to continue and type their details in by hand. That is
 * deliberate: an AI failure must never make signing up impossible.
 */
export default function ResumeUploadField({ file, onFileChange, onParsed, error }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>(file ? "filled" : "idle");
  const [summary, setSummary] = useState("");
  const [rejectReason, setRejectReason] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  async function handleFile(picked: File | null) {
    setRejectReason(null);
    if (!picked) return;
    if (picked.size > MAX_MB * 1024 * 1024) {
      setRejectReason(`That file is over ${MAX_MB}MB. Please upload a smaller resume.`);
      return;
    }
    const name = picked.name.toLowerCase();
    if (!ACCEPT.split(",").some((ext) => name.endsWith(ext))) {
      setRejectReason("Please upload a PDF or DOCX file. A .doc can be saved as .docx in Word.");
      return;
    }

    onFileChange(picked);
    setStatus("parsing");
    try {
      const preview = await parseResumePreview(picked);
      if (preview.parsed) {
        onParsed(preview);
        setSummary(prefillSummary(preview));
        setStatus("filled");
      } else {
        setStatus("unreadable");
      }
    } catch (err) {
      // The file is still accepted — only the prefill is lost.
      setRejectReason(err instanceof Error ? err.message : "Could not read that resume.");
      setStatus("unreadable");
    }
  }

  const hasFile = Boolean(file) && status !== "parsing";
  const zoneClass = error
    ? "border-dashed border-danger/50 bg-danger/5"
    : dragging
      ? "border-dashed border-brand-400 bg-brand-50/80"
      : status === "parsing"
        ? "border-solid border-brand-200 bg-white"
        : hasFile
          ? "border-solid border-ink-200 bg-white"
          : "border-dashed border-brand-200 bg-white/70 hover:border-brand-400 hover:bg-white";

  return (
    <AIInsight
      label="AI resume parsing"
      className="mb-2"
      title={
        <label htmlFor="resume-upload" className="cursor-pointer">
          Upload Resume <span className="text-danger" aria-hidden="true">*</span>
        </label>
      }
    >
      <p className="-mt-1 mb-4 text-body-sm text-ink-500 leading-relaxed max-w-xl">
        We&apos;ll read it and fill in the rest of your details for you. PDF or DOCX, up to {MAX_MB}MB.
      </p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFile(e.dataTransfer.files?.[0] ?? null);
        }}
        className={`rounded-2xl border-2 transition-colors ${zoneClass}`}
      >
        <input
          ref={inputRef}
          id="resume-upload"
          type="file"
          accept={ACCEPT}
          className="hidden"
          aria-describedby={error ? "resume-upload-error" : undefined}
          onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
        />

        {status === "parsing" ? (
          <div role="status" aria-live="polite" className="flex items-start gap-4 px-4 sm:px-5 py-4">
            <span className="icon-tile bg-brand-50 text-brand-600 ring-1 ring-brand-100">
              <span aria-hidden="true" className="w-4 h-4 rounded-full border-2 border-brand-200 border-t-brand-600 animate-spin" />
            </span>
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="text-body-sm font-semibold text-ink-800">
                Reading your resume — this can take up to a minute…
              </div>
              <div className="mt-3 space-y-2" aria-hidden="true">
                <Skeleton className="h-2.5 w-3/4" />
                <Skeleton className="h-2.5 w-1/2" />
              </div>
            </div>
          </div>
        ) : file ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4">
            <div className="flex items-start gap-3.5 flex-1 min-w-0">
              <span className={`icon-tile ${status === "filled" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                <FileIcon />
              </span>
              <div className="min-w-0">
                <div className="text-body-sm font-semibold text-ink-900 truncate">{file.name}</div>
                {status === "filled" ? (
                  <div className="text-caption text-green-700 mt-0.5 flex items-start gap-1.5">
                    <CheckIcon />
                    <span>Filled in {summary} — review as you go.</span>
                  </div>
                ) : (
                  <div className="text-caption text-amber-700 mt-0.5 leading-relaxed">
                    Saved, but we couldn&apos;t read the details automatically. Please fill the fields in yourself.
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="btn btn-outline btn-sm self-start sm:self-auto"
            >
              Replace
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full flex items-center gap-4 px-4 sm:px-5 py-5 text-left rounded-2xl"
          >
            <span className="icon-tile w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
              <UploadIcon />
            </span>
            <span className="text-body-sm text-ink-600">
              <span className="font-semibold text-brand-700">Choose a file</span> or drag it here
            </span>
          </button>
        )}
      </div>

      {rejectReason && (
        <p role="alert" className="mt-2 text-caption font-medium text-amber-700">{rejectReason}</p>
      )}
      {error && (
        <p id="resume-upload-error" role="alert" className="field-error">{error}</p>
      )}
    </AIInsight>
  );
}

function UploadIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M7 18h10a4 4 0 0 0 0-8 6 6 0 0 0-11.7-1A4 4 0 0 0 7 18z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M12 16v-5M9.5 13.5L12 11l2.5 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function FileIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M7 2h7l5 5v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M14 2v5h5M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg aria-hidden="true" width="13" height="13" viewBox="0 0 16 16" fill="none" className="mt-px shrink-0">
      <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
