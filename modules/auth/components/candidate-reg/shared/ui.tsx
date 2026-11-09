"use client";

import { useId, useState } from "react";
import type React from "react";
import { TrashIcon, SpinnerIcon } from "./icons";

/* ── Tooltip ── */
export function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="relative group/tip">
      {children}
      <div
        role="tooltip"
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-ink-900 text-white text-micro font-medium rounded-lg whitespace-nowrap shadow-elevated opacity-0 translate-y-1 group-hover/tip:opacity-100 group-hover/tip:translate-y-0 group-focus-within/tip:opacity-100 group-focus-within/tip:translate-y-0 pointer-events-none transition z-30"
      >
        {label}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-ink-900" />
      </div>
    </div>
  );
}

/* ── Confirm Dialog ── */
export function ConfirmDialog({
  label,
  onConfirm,
  onCancel,
}: {
  label: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const handleConfirm = async () => { setDeleting(true); await onConfirm(); };
  return (
    <div className="modal-overlay">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
        className="modal-panel max-w-[400px] p-6"
      >
        <div className="flex items-start gap-4">
          <span className="icon-tile w-11 h-11 rounded-2xl bg-danger/10 text-danger ring-4 ring-danger/5">
            <TrashIcon />
          </span>
          <div className="min-w-0 pt-0.5">
            <h2 id="confirm-dialog-title" className="section-title">Confirm Delete</h2>
            <p id="confirm-dialog-desc" className="mt-1 text-body-sm text-ink-600 leading-relaxed break-words">{label}</p>
            <p className="mt-1 text-caption text-ink-500">This action cannot be undone.</p>
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
          <button type="button" onClick={onCancel} disabled={deleting} className="btn btn-outline">
            Cancel
          </button>
          <button type="button" onClick={handleConfirm} disabled={deleting} className="btn btn-danger">
            {deleting ? <><SpinnerIcon /> Deleting…</> : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Section Header ── */
export function SectionHeader({
  icon,
  title,
  addLabel,
  onAdd,
}: {
  icon: React.ReactNode;
  title: string;
  addLabel: string;
  onAdd?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-3 min-w-0">
        <span className="icon-tile icon-tile-sm bg-brand-50 text-brand-600">
          {icon}
        </span>
        <h3 className="section-title truncate">{title}</h3>
      </div>
      {addLabel && (
        <button type="button" onClick={onAdd} className="btn btn-outline btn-sm shrink-0">
          {addLabel}
        </button>
      )}
    </div>
  );
}

/* ── Empty State ── */
export function EmptyState({
  icon,
  message,
  hint,
}: {
  icon: React.ReactNode;
  message: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-ink-200 bg-ink-50/60 px-5 py-7 flex flex-col items-center justify-center gap-1.5 text-center">
      <span className="grid place-items-center w-14 h-14 mb-1 rounded-2xl bg-white text-ink-400 border border-ink-200/70">
        {icon}
      </span>
      <div className="font-semibold text-body-sm text-ink-700">{message}</div>
      <div className="text-caption text-ink-500 max-w-sm">{hint}</div>
    </div>
  );
}

/* ── Dots Indicator ── */
export function DotsIndicator({ filled, size = 9 }: { filled: number; size?: number }) {
  return (
    <div className="flex gap-1 items-center" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i}
          className={`rounded-full shrink-0 ${i < filled ? "bg-brand-600" : "bg-ink-200"}`}
          style={{ width: size, height: size }}
        />
      ))}
    </div>
  );
}

/* ── Select Field ── */
export function SelectField({
  label,
  required,
  value,
  onChange,
  options,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label} {required && <span className="text-danger" aria-hidden="true">*</span>}
      </label>
      <div className="relative">
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)}
          className="field-input appearance-none pr-10 cursor-pointer">
          {options.map((o) => <option key={o}>{o}</option>)}
        </select>
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

/* ── Modal chrome ──
 * Shared frame for the add/edit dialogs: fixed header, scrolling body, footer actions
 * pinned to the bottom of the panel. Presentation only — callers keep their own state. */
export function ModalFrame({
  titleId,
  icon,
  title,
  subtitle,
  onClose,
  closeDisabled,
  maxWidth = "max-w-[720px]",
  footer,
  children,
  bodyClassName = "px-5 sm:px-6 py-5",
  zClassName = "",
}: {
  titleId: string;
  icon: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  onClose: () => void;
  closeDisabled?: boolean;
  maxWidth?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
  bodyClassName?: string;
  zClassName?: string;
}) {
  return (
    <div className={`modal-overlay ${zClassName}`}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`modal-panel ${maxWidth} flex flex-col overflow-hidden`}
      >
        <div className="flex items-start justify-between gap-4 px-5 sm:px-6 pt-5 pb-4 border-b border-ink-200/70">
          <div className="flex items-start gap-3.5 min-w-0">
            <span className="icon-tile w-11 h-11 bg-brand-50 text-brand-600 ring-1 ring-brand-100">
              {icon}
            </span>
            <div className="min-w-0">
              <h2 id={titleId} className="font-display font-extrabold text-title-lg text-ink-900 leading-tight">{title}</h2>
              {subtitle && <p className="mt-1 text-body-sm text-ink-500 leading-relaxed">{subtitle}</p>}
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={closeDisabled} aria-label="Close"
            className="btn btn-ghost btn-icon shrink-0 -mr-2 -mt-1">
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className={`flex-1 min-h-0 overflow-y-auto ${bodyClassName}`}>
          {children}
        </div>
        {footer && (
          <div className="shrink-0 border-t border-ink-200/70 bg-ink-50/70">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/** Group heading inside a modal or form body. */
export function FormGroupTitle({ children, hint }: { children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="mb-3">
      <div className="text-micro font-bold uppercase tracking-wider text-ink-500">{children}</div>
      {hint && <p className="mt-0.5 text-caption text-ink-500">{hint}</p>}
    </div>
  );
}

/** Inline field error, wired to its input through aria-describedby. */
export function FieldError({ id, children }: { id?: string; children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="field-error flex items-start gap-1.5">
      <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" className="mt-px shrink-0">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
        <path d="M12 7v6M12 17h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
      <span>{children}</span>
    </p>
  );
}

/** Border treatment for a field-input in an error state. */
export const errorInput = (hasError: unknown) =>
  hasError ? "border-danger/70 hover:border-danger focus:border-danger bg-danger/[0.02]" : "";
