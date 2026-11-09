"use client";

import type React from "react";
import { VerifiedIcon } from "../shared/icons";

export function Field({
  id,
  label,
  required,
  hint,
  error,
  children,
}: {
  id?: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  const errorId = id && error ? `${id}-error` : undefined;
  return (
    <div>
      <label htmlFor={id} className="block text-[0.8125rem] font-semibold text-ink-700 mb-1.5">
        {label}{" "}
        {required && (
          <span className="text-red-500" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-[0.75rem] text-red-500 flex items-center gap-1">
          <span aria-hidden="true">⚠</span>
          {error}
        </p>
      )}
      {!error && hint && <p className="mt-1 text-[0.71875rem] text-ink-400">{hint}</p>}
    </div>
  );
}

export function PwdChip({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[0.6875rem] px-2.5 py-1 rounded-full border font-medium ${
        ok ? "bg-green-50 text-green-700 border-green-100" : "bg-brand-50 text-brand-700 border-brand-100"
      }`}
    >
      {ok ? "✓" : "○"} {label}
    </span>
  );
}
export function InputWithIcon({
  icon,
  value,
  onChange,
  placeholder,
  type = "text",
  hasError = false,
  disabled = false,
  trailing,
  ...rest
}: {
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  hasError?: boolean;
  disabled?: boolean;
  trailing?: React.ReactNode;
  [key: string]: unknown;
}) {
  return (
    <div className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400">{icon}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        {...(rest as React.InputHTMLAttributes<HTMLInputElement>)}
        className={`w-full pl-10 ${trailing ? "pr-11" : "pr-4"} py-2 rounded-xl border text-[0.875rem] outline-none transition ${
          disabled
            ? "bg-ink-100 border-ink-200 text-ink-500 opacity-60 cursor-not-allowed"
            : hasError
              ? "bg-white border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-100"
              : "bg-white border-ink-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        }`}
      />
      {trailing && <span className="absolute right-3.5 top-1/2 -translate-y-1/2">{trailing}</span>}
    </div>
  );
}

export function PhoneInput({
  value,
  onChange,
  hasError = false,
  disabled = false,
  id,
  verified,
  "aria-describedby": ariaDescribedby,
}: {
  value: string;
  onChange: (v: string) => void;
  hasError?: boolean;
  disabled?: boolean;
  id?: string;
  verified?: boolean;
  "aria-describedby"?: string;
}) {
  return (
    <div className="flex">
      <div
        className={`flex items-center px-3 rounded-l-xl border border-r-0 border-ink-200 text-[0.84375rem] font-medium text-ink-700 gap-1.5 whitespace-nowrap ${disabled ? "bg-ink-100 opacity-60" : "bg-ink-50"}`}
      >
        {verified ? <VerifiedIcon /> : "🇮🇳"} <span className="text-ink-400">▾</span> +91
      </div>
      <input
        id={id}
        type="tel"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
        placeholder="Enter your phone number"
        aria-describedby={ariaDescribedby}
        className={`flex-1 px-4 py-2 rounded-r-xl border text-[0.875rem] outline-none transition ${
          disabled
            ? "bg-ink-100 border-ink-200 text-ink-500 opacity-60 cursor-not-allowed"
            : hasError
              ? "bg-white border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-100"
              : "bg-white border-ink-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        }`}
      />
    </div>
  );
}
