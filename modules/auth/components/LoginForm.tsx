"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import RoleSelector from "./RoleSelector";
import { loginUser } from "../services/auth.service";
import type { UserRole } from "../types/auth.types";

export default function LoginForm() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>("candidate");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const clearFieldError = (field: string) =>
    setErrors((prev) => ({ ...prev, [field]: "" }));

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Enter a valid email address";
    if (!password) errs.password = "Password is required";
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
      await loginUser({ role, email, password });
      router.push("/dashboard");
    } catch {
      setSubmitError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-7">
        <h1 className="font-display font-extrabold text-display-sm text-ink-900 tracking-tight">
          Welcome back
        </h1>
        <p className="mt-1.5 text-ink-500 text-body">
          Sign in to your HireMind account
        </p>
      </div>

      <RoleSelector value={role} onChange={setRole} />

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
        {submitError && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-body flex items-start gap-2">
            <span className="shrink-0 mt-0.5">⚠</span>
            <span>{submitError}</span>
          </div>
        )}

        {/* Email */}
        <div>
          <label htmlFor="login-email" className="field-label">
            {role === "candidate" ? "Email address" : "Work email"}
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); clearFieldError("email"); }}
            placeholder={role === "candidate" ? "you@example.com" : "you@company.com"}
            aria-describedby={errors.email ? "login-email-error" : undefined}
            className={`w-full px-4 py-3 rounded-xl border text-body outline-none transition bg-white ${
              errors.email
                ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                : "border-ink-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            }`}
          />
          {errors.email && <p id="login-email-error" role="alert" className="mt-1 text-caption text-red-600">{errors.email}</p>}
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="login-password" className="text-body-sm font-semibold text-ink-700">Password</label>
            <Link href="/forgot-password" className="text-body-sm text-brand-600 hover:text-brand-700 font-medium">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearFieldError("password"); }}
              placeholder="Enter your password"
              aria-describedby={errors.password ? "login-password-error" : undefined}
              className={`w-full px-4 py-3 pr-12 rounded-xl border text-body outline-none transition bg-white ${
                errors.password
                  ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  : "border-ink-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-ink-400 hover:text-ink-600 transition"
              tabIndex={-1}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          {errors.password && <p id="login-password-error" role="alert" className="mt-1 text-caption text-red-600">{errors.password}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl text-white font-semibold text-body-lg transition hover:opacity-95 disabled:opacity-60 mt-1 btn-gradient-brand"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <SpinnerIcon /> Signing in...
            </span>
          ) : (
            "Sign in"
          )}
        </button>
      </form>

      <Divider label="or continue with" />

      <button
        type="button"
        className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl border border-ink-200 text-body font-semibold text-ink-700 hover:bg-ink-50 transition"
      >
        <GoogleIcon />
        Sign in with Google
      </button>

      <p className="mt-7 text-center text-body text-ink-500">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-brand-600 font-semibold hover:text-brand-700">
          Create account
        </Link>
      </p>
    </div>
  );
}

/* ---- Shared sub-components ---- */

function Divider({ label }: { label: string }) {
  return (
    <div className="my-5 flex items-center gap-3">
      <div className="flex-1 h-px bg-ink-200" />
      <span className="text-body-sm text-ink-400 font-medium">{label}</span>
      <div className="flex-1 h-px bg-ink-200" />
    </div>
  );
}

/* ---- Icons ---- */
function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8S2 12 2 12z" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M3 3l18 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function SpinnerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" className="animate-spin" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}
