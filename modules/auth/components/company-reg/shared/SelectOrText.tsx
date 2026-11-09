"use client";

import { useEffect, useId, useState } from "react";
import { OTHER } from "./options";
import { FieldError, errorInput } from "@/modules/auth/components/candidate-reg/shared/ui";

/**
 * Shared between the company-registration steps. Lives here rather than inside a step so
 * Step 1 (industry, country, state) and Step 2 (department) behave identically.
 */

function Label({ children, required, htmlFor }: { children: React.ReactNode; required?: boolean; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="field-label">
      {children} {required && <span className="text-danger" aria-hidden="true">*</span>}
    </label>
  );
}

function Chevron() {
  return (
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * A select that turns into a text box when the value is not on the list.
 *
 * No list of countries, states or industries is ever complete, so rather than block a
 * recruiter whose answer is missing, picking "Other" reveals an input and whatever they
 * type is stored as the value. A value that is already off-list (an edit, or coming back
 * to the step) re-opens in text mode automatically.
 */
export function SelectOrText({ label, required, icon, value, onChange, placeholder, options, error, textPlaceholder }: {
  label: string; required?: boolean; icon?: React.ReactNode;
  value: string; onChange: (v: string) => void; placeholder?: string; options: string[];
  error?: string; textPlaceholder?: string;
}) {
  const isListed = !value || options.includes(value);
  const [freeText, setFreeText] = useState(!isListed);
  const id = useId();

  // Switching country rebuilds the state list; a value that is now off-list must flip to
  // text, and one that is back on the list must flip away from it.
  useEffect(() => {
    if (value && !options.includes(value)) setFreeText(true);
  }, [options, value]);

  if (freeText) {
    return (
      <div className="min-w-0">
        <Label required={required} htmlFor={id}>{label}</Label>
        <div className="relative">
          {icon && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none">{icon}</span>}
          <input
            id={id}
            type="text"
            value={value}
            autoFocus
            onChange={(e) => onChange(e.target.value)}
            placeholder={textPlaceholder ?? `Enter ${label.toLowerCase()}`}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            className={`field-input ${icon ? "pl-10" : ""} pr-24 ${errorInput(error)}`}
          />
          <button
            type="button"
            onClick={() => { setFreeText(false); onChange(""); }}
            className="btn btn-ghost btn-sm absolute right-1.5 top-1/2 -translate-y-1/2 h-8 text-brand-700"
          >
            Choose
          </button>
        </div>
        <FieldError id={`${id}-error`}>{error}</FieldError>
      </div>
    );
  }

  return (
    <Select
      label={label} required={required} icon={icon} value={value} placeholder={placeholder}
      options={[...options, OTHER]} error={error}
      onChange={(v) => {
        if (v === OTHER) { setFreeText(true); onChange(""); return; }
        onChange(v);
      }}
    />
  );
}

export function Select({ label, required, icon, value, onChange, placeholder, options, error }: {
  label: string; required?: boolean; icon?: React.ReactNode;
  value: string; onChange: (v: string) => void; placeholder?: string; options: string[]; error?: string;
}) {
  const id = useId();
  return (
    <div className="min-w-0">
      <Label required={required} htmlFor={id}>{label}</Label>
      <div className="relative">
        {icon && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none">{icon}</span>}
        <select
          id={id}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`field-input appearance-none cursor-pointer ${icon ? "pl-10" : ""} pr-10 ${value ? "text-ink-900" : "text-ink-400"} ${errorInput(error)}`}
        >
          <option value="" disabled>{placeholder}</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <Chevron />
      </div>
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  );
}
