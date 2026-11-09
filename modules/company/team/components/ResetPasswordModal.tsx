"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";

export function ResetPasswordModal({
  name,
  password,
  onClose,
}: {
  name: string;
  password: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };
  return (
    <Dialog title="Temporary password reset" hideTitle onClose={onClose} className="max-w-[420px]">
      <p className="font-display font-extrabold text-[1.125rem] text-ink-900" aria-hidden="true">
        Temporary password reset
      </p>
      <p className="text-[0.8125rem] text-ink-500 mt-1">
        Share this one-time password with <span className="font-semibold text-ink-700">{name}</span>.
        They&apos;ll be asked to set a new password on their next login. It won&apos;t be shown again.
      </p>
      <div className="mt-4 flex items-center gap-2 rounded-xl border border-ink-200 bg-ink-50/60 px-3 py-2.5">
        <code className="flex-1 min-w-0 break-all text-[0.875rem] font-mono text-ink-900">{password}</code>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 px-3 py-1.5 rounded-lg text-[0.78125rem] font-semibold text-brand-700 border border-brand-200 hover:bg-brand-50 transition-colors"
        >
          <span aria-live="polite">{copied ? "Copied!" : "Copy"}</span>
        </button>
      </div>
      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2 rounded-lg text-white text-[0.8125rem] font-semibold btn-gradient-brand hover:opacity-90 transition-opacity"
        >
          Done
        </button>
      </div>
    </Dialog>
  );
}
