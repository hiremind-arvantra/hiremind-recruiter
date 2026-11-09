"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "../services/auth.service";
import { AuthGlyph } from "./AuthCardShell";

function OtpFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => { inputRefs.current[0]?.focus(); }, []);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value.slice(-1);
    setDigits(next);
    setError("");
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = Array(6).fill("");
    pasted.split("").forEach((c, i) => { next[i] = c; });
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleVerify = async () => {
    const otp = digits.join("");
    if (otp.length < 6) { setError("Please enter the complete 6-digit code."); return; }

    try {
      setLoading(true);
      setError("");
      await authService.verifyOtp(email, otp);
      router.push("/dashboard");
    } catch {
      setError("Invalid or expired code. Please try again.");
      setDigits(Array(6).fill(""));
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    try {
      setResending(true);
      await authService.resendOtp(email);
      setCountdown(30);
      setCanResend(false);
      setDigits(Array(6).fill(""));
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally {
      setResending(false);
    }
  };

  const otpFilled = digits.join("").length === 6;

  return (
    <div className="w-full">
      <AuthGlyph kind="mail" />

      <h1 className="page-title mt-5">
        Verify your email
      </h1>
      <p className="page-subtitle">
        We&apos;ve sent a 6-digit verification code to{" "}
        {email ? <span className="font-semibold text-ink-800 break-all">{email}</span> : "your email"}
      </p>

      {/* OTP inputs */}
      <div
        role="group"
        aria-label="6-digit verification code"
        className="grid grid-cols-6 gap-1.5 sm:gap-2.5 mt-7"
        onPaste={handlePaste}
      >
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            aria-label={`Digit ${i + 1}`}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "otp-error" : undefined}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className={`w-full min-w-0 h-12 sm:h-14 text-center text-title-lg sm:text-heading font-bold tabular rounded-xl border outline-none transition-[border-color,box-shadow,background-color] select-none focus:ring-4 ${
              error
                ? "border-danger/70 text-danger bg-danger/5 focus:ring-danger/10"
                : d
                ? "border-brand-400 text-ink-900 bg-brand-50/60 focus:border-brand-500 focus:ring-brand-500/10"
                : "border-ink-200 text-ink-900 bg-white hover:border-ink-300 focus:border-brand-500 focus:ring-brand-500/10"
            }`}
          />
        ))}
      </div>

      {error && (
        <p id="otp-error" role="alert" className="field-error">{error}</p>
      )}

      {/* Verify button */}
      <button
        type="button"
        onClick={handleVerify}
        disabled={loading || !otpFilled}
        className="mt-6 btn btn-primary btn-lg w-full"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <SpinnerIcon /> Verifying...
          </span>
        ) : (
          "Verify code"
        )}
      </button>

      {/* Resend */}
      <p className="mt-5 text-center text-body-sm text-ink-500" aria-live="polite">
        Didn&apos;t receive the code?{" "}
        {canResend ? (
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="text-brand-700 font-semibold hover:text-brand-800 disabled:opacity-60 transition-colors"
          >
            {resending ? "Sending..." : "Resend code"}
          </button>
        ) : (
          <span className="text-ink-500">
            Resend in{" "}
            <span className="font-semibold text-ink-700 tabular">{countdown}s</span>
          </span>
        )}
      </p>

      <div className="mt-6 pt-5 border-t border-ink-200/70 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-body-sm font-medium text-ink-500 hover:text-ink-800 transition-colors"
        >
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to sign in
        </Link>
      </div>
    </div>
  );
}

function SpinnerIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" className="animate-spin" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export default function OtpForm() {
  return (
    <Suspense fallback={
      <div role="status" className="w-full text-center py-10 text-ink-400 text-body">Loading...</div>
    }>
      <OtpFormInner />
    </Suspense>
  );
}
