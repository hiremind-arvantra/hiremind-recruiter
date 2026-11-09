"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authService } from "../services/auth.service";

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

const INITIAL: FormState = {
  fullName: "", email: "", phone: "", password: "", confirmPassword: "", acceptTerms: false,
};

export default function SignupForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const set = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.fullName.trim()) errs.fullName = "Full name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Enter a valid email address";
    if (!form.phone.trim()) errs.phone = "Phone number is required";
    else if (!/^\d{10}$/.test(form.phone.replace(/\s/g, ""))) errs.phone = "Enter a valid 10-digit number";
    if (!form.password) errs.password = "Password is required";
    else if (form.password.length < 8) errs.password = "Password must be at least 8 characters";
    if (!form.confirmPassword) errs.confirmPassword = "Please confirm your password";
    else if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords do not match";
    if (!form.acceptTerms) errs.acceptTerms = "You must accept the terms to continue";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    try {
      setLoading(true);
      setSubmitError("");
      await authService.signup({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      router.push(`/otp?email=${encodeURIComponent(form.email)}`);
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength(form.password);

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="font-display font-extrabold text-display-sm text-ink-900 tracking-tight">
          Create your account
        </h1>
        <p className="mt-1.5 text-ink-500 text-body">
          Join HireMind as a job seeker
        </p>
      </div>

      {/* Social sign-up */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button type="button" className="flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl border border-ink-200 text-body font-semibold text-ink-700 hover:bg-ink-50 transition">
          <GoogleIcon /> Continue with Google
        </button>
        <button type="button" className="flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl border border-ink-200 text-body font-semibold text-ink-700 hover:bg-ink-50 transition">
          <LinkedInIcon /> Continue with LinkedIn
        </button>
      </div>

      <div className="my-5 flex items-center gap-3">
        <div className="flex-1 h-px bg-ink-200" />
        <span className="text-body-sm text-ink-400 font-medium">or sign up with email</span>
        <div className="flex-1 h-px bg-ink-200" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {submitError && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-body flex items-start gap-2">
            <span className="shrink-0 mt-0.5">⚠</span><span>{submitError}</span>
          </div>
        )}

        {/* Full Name */}
        <Field label="Full name" error={errors.fullName}>
          <input
            type="text"
            value={form.fullName}
            onChange={(e) => set("fullName", e.target.value)}
            placeholder="Sarah Johnson"
            className={inputCls(!!errors.fullName)}
          />
        </Field>

        {/* Email */}
        <Field label="Email address" error={errors.email}>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="you@example.com"
            className={inputCls(!!errors.email)}
          />
        </Field>

        {/* Phone */}
        <Field label="Phone number" error={errors.phone}>
          <div className="flex">
            <span className="inline-flex items-center px-3.5 rounded-l-xl border border-r-0 border-ink-200 bg-ink-50 text-ink-600 text-body font-medium whitespace-nowrap">
              🇮🇳 +91
            </span>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="98765 43210"
              className={`flex-1 px-4 py-3 rounded-r-xl border text-body outline-none transition bg-white ${
                errors.phone
                  ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  : "border-ink-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              }`}
            />
          </div>
        </Field>

        {/* Password */}
        <Field label="Password" error={errors.password}>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder="Minimum 8 characters"
              className={`${inputCls(!!errors.password)} pr-12`}
            />
            <button type="button" onClick={() => setShowPassword((v) => !v)} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-ink-400 hover:text-ink-600 transition">
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          {form.password && !errors.password && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-all ${
                    i <= strength.score
                      ? strength.score <= 1 ? "bg-red-400"
                        : strength.score === 2 ? "bg-orange-400"
                        : strength.score === 3 ? "bg-yellow-400"
                        : "bg-green-500"
                      : "bg-ink-200"
                  }`} />
                ))}
              </div>
              <span className={`text-micro font-semibold ${
                strength.score <= 1 ? "text-red-500"
                : strength.score === 2 ? "text-orange-500"
                : strength.score === 3 ? "text-yellow-500"
                : "text-green-600"
              }`}>{strength.label}</span>
            </div>
          )}
        </Field>

        {/* Confirm Password */}
        <Field label="Confirm password" error={errors.confirmPassword}>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              value={form.confirmPassword}
              onChange={(e) => set("confirmPassword", e.target.value)}
              placeholder="Re-enter your password"
              className={`${inputCls(!!errors.confirmPassword)} pr-12`}
            />
            <button type="button" onClick={() => setShowConfirm((v) => !v)} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-ink-400 hover:text-ink-600 transition">
              {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </Field>

        {/* Terms */}
        <div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.acceptTerms}
              onChange={(e) => set("acceptTerms", e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-ink-300 accent-brand-600 cursor-pointer"
            />
            <span className="text-body-sm text-ink-600 leading-relaxed">
              I agree to HireMind&apos;s{" "}
              <Link href="/terms" className="text-brand-600 hover:underline font-medium">Terms of Service</Link>
              {" "}and{" "}
              <Link href="/privacy" className="text-brand-600 hover:underline font-medium">Privacy Policy</Link>
            </span>
          </label>
          {errors.acceptTerms && <p className="mt-1.5 text-caption text-red-600">{errors.acceptTerms}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl text-white font-semibold text-body-lg transition hover:opacity-95 disabled:opacity-60 btn-gradient-brand"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <SpinnerIcon /> Creating account...
            </span>
          ) : (
            "Create account"
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-body text-ink-500">
        Already have an account?{" "}
        <Link href="/login" className="text-brand-600 font-semibold hover:text-brand-700">
          Sign in
        </Link>
      </p>
    </div>
  );
}

/* ---- Helpers ---- */

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      {children}
      {error && <p className="mt-1 text-caption text-red-600">{error}</p>}
    </div>
  );
}

function inputCls(hasError: boolean) {
  return `w-full px-4 py-3 rounded-xl border text-body outline-none transition bg-white ${
    hasError
      ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
      : "border-ink-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
  }`;
}

function getPasswordStrength(password: string) {
  if (!password) return { score: 0, label: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return { score, label: ["", "Weak", "Fair", "Good", "Strong"][score] };
}

/* ---- Icons ---- */
function EyeIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8S2 12 2 12z" stroke="currentColor" strokeWidth="1.6" /><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" /></svg>;
}
function EyeOffIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M3 3l18 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>;
}
function SpinnerIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" className="animate-spin" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" /><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>;
}
function GoogleIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>;
}
function LinkedInIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg>;
}
