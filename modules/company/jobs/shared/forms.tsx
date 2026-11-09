"use client";

import { useId, useState } from "react";

/* ─────────────────────────────────────────────────────────────────────────────
 * Controlled form primitives shared across the jobs forms (EditJobPage, …).
 * Visuals come from the global .field-* classes in app/globals.css.
 * ───────────────────────────────────────────────────────────────────────────── */

export function SectionHeader({ num, title }: { num: number; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="w-8 h-8 rounded-xl bg-brand-50 border border-brand-100 text-brand-700 text-caption font-bold grid place-items-center tabular shrink-0">
        {String(num).padStart(2, "0")}
      </span>
      <h2 className="section-title">{title}</h2>
      <span aria-hidden="true" className="flex-1 h-px bg-ink-100" />
    </div>
  );
}

export function Label({ children, required, htmlFor }: { children: React.ReactNode; required?: boolean; htmlFor?: string }) {
  return (
    <label className="field-label" htmlFor={htmlFor}>
      {children}{required && <span className="text-danger" aria-hidden="true"> *</span>}
    </label>
  );
}

export function Field({ label, required, value, onChange, type = "text", icon }: {
  label?: string; required?: boolean; value: string; onChange: (v: string) => void; type?: string; icon?: React.ReactNode;
}) {
  const id = useId();
  return (
    <div>
      {label && <Label required={required} htmlFor={id}>{label}</Label>}
      <div className="relative">
        {icon && <span aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none">{icon}</span>}
        <input id={id} type={type} value={value} aria-required={required || undefined} onChange={(e) => onChange(e.target.value)} className={`field-input ${icon ? "pl-10" : ""}`} />
      </div>
    </div>
  );
}

export function Select({ label, required, options, value, onChange, srLabel }: {
  label?: string; required?: boolean; options: string[]; value: string; onChange: (v: string) => void; srLabel?: string;
}) {
  const id = useId();
  // Surface the stored value even when it isn't one of the preset options.
  const allOptions = value && !options.includes(value) ? [value, ...options] : options;
  return (
    <div>
      {label ? <Label required={required} htmlFor={id}>{label}</Label> : srLabel ? <span className="sr-only">{srLabel}</span> : null}
      <div className="relative">
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)} aria-label={srLabel || label} className={`field-input appearance-none pr-10 cursor-pointer ${value ? "text-ink-900" : "text-ink-400"}`}>
          <option value="">Select…</option>
          {allOptions.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

/** Tag input — Enter (or blur) commits the typed value; chips have remove buttons. */
export function ChipField({ items, onRemove, onAdd, placeholder }: {
  items: string[]; onRemove: (v: string) => void; onAdd: (v: string) => void; placeholder: string;
}) {
  const [value, setValue] = useState("");
  const commit = () => {
    const trimmed = value.trim();
    if (trimmed) { onAdd(trimmed); setValue(""); }
  };
  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2 rounded-xl border border-ink-200 bg-white min-h-11 transition hover:border-ink-300 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/10">
      {items.map((it) => (
        <span key={it} className="inline-flex items-center gap-1 h-7 pl-2.5 pr-1 rounded-lg bg-brand-50 border border-brand-100 text-caption font-medium text-brand-700">
          {it}
          <button type="button" onClick={() => onRemove(it)} className="w-5 h-5 grid place-items-center rounded-md text-brand-400 hover:text-danger hover:bg-white transition-colors" aria-label={`Remove ${it}`}>
            <svg aria-hidden="true" width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>
          </button>
        </span>
      ))}
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commit(); } }}
        onBlur={commit}
        placeholder={placeholder}
        aria-label={placeholder}
        className="flex-1 min-w-30 h-7 bg-transparent text-body-sm text-ink-800 placeholder:text-ink-400 outline-none"
      />
    </div>
  );
}
