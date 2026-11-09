"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearAuth, getAccessToken } from "@/lib/api/config";
import { loginUser } from "../services/auth.service";
import { fetchCompanyProfile } from "../services/company.service";
import type { UserRole } from "../types/auth.types";
import AuthHeader from "./AuthHeader";
import { assetPath } from "@/lib/assetPath";
import { ImageStage } from "@/components/ui/ImageStage";
import { Tilt } from "@/components/ui/Tilt";

/**
 * The page the visitor was trying to reach when RequireAuth sent them here (?next=).
 * Only a path inside this site, and only one belonging to the role signing in — a
 * candidate following a recruiter's link lands on their own dashboard instead.
 */
function requestedPath(role: UserRole): string | null {
  if (typeof window === "undefined") return null;
  const target = new URLSearchParams(window.location.search).get("next");
  if (!target || !target.startsWith("/") || target.startsWith("//")) return null;
  const recruiterArea = target.startsWith("/company");
  return recruiterArea === (role === "recruiter") ? target : null;
}

/**
 * `role` is fixed by the hostname: candidate.* signs candidates in, recruiter.* signs
 * recruiters in. Only a host that serves both apps (a local machine) still asks.
 */
export default function LoginPage({ role: fixedRole }: { role?: UserRole }) {
  const router = useRouter();
  const [chosenRole, setRole] = useState<UserRole>("candidate");
  const role = fixedRole ?? chosenRole;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  /*
   * Arriving at the login page ends the session, whether the visitor navigated here,
   * signed out, or walked back to it with the browser's Back button. That last case is
   * the point: pressing Forward afterwards used to restore the app from the back/forward
   * cache with the session intact. Now Forward lands on a shell with no token, and
   * RequireAuth sends the visitor straight back here to sign in again.
   *
   * `pageshow` is what a back/forward-cache restore fires; mounting covers the rest.
   */
  useEffect(() => {
    const endSession = () => {
      if (getAccessToken()) clearAuth();
    };
    endSession();
    window.addEventListener("pageshow", endSession);
    return () => window.removeEventListener("pageshow", endSession);
  }, []);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = "Enter a valid email address";
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
      const { mustResetPassword } = await loginUser({ role, email, password, rememberMe });
      const next = requestedPath(role) ?? (role === "recruiter" ? "/company/dashboard" : "/dashboard");
      if (mustResetPassword) {
        // Provisioned (team-member) account — force a password change before entering.
        router.push(`/set-password?next=${encodeURIComponent(next)}`);
        return;
      }
      if (role === "recruiter") {
        await fetchCompanyProfile().catch(() => {});
      }
      router.push(next);
    } catch {
      setSubmitError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const errorBorder = "border-danger/70 hover:border-danger focus:border-danger";

  return (
    <div className="min-h-screen flex flex-col app-canvas">
      {/* ── Header ── */}
      {/* Shared .site-container column: the logo lines up with "Welcome back" below it
          and Create Account with the login card's right edge, as on every public page. */}
      <AuthHeader
        cta={{
          label: "Create Account",
          href: "/signup",
          icon: <CreateAccountIcon />,
        }}
      />

      {/* ── Main content ── */}
      <main id="main" tabIndex={-1} className="flex-1">
        <div className="site-container grid lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_440px] gap-10 xl:gap-20 items-start pt-8 sm:pt-10 lg:pt-16 pb-14">
          {/* Left: headline + role cards + illustration */}
          <div className="hidden lg:block min-w-0">
            <h1 className="hero-title">
              Welcome back!
              <br />
              Let&apos;s build <span className="gradient-text">winning</span>
              <br />
              futures together.
            </h1>
            <p className="hero-lead mt-5 max-w-md">
              Login to your HireMind account and continue your journey.
            </p>

            {/* Feature cards + illustration side by side */}
            <div className="mt-10 grid grid-cols-[minmax(0,1fr)_200px] xl:grid-cols-[minmax(0,1fr)_260px] gap-6 items-center">
              <div className="space-y-3">
                <FeatureCard
                  icon={<CandidateIcon />}
                  iconClass="bg-brand-50 text-brand-600 ring-1 ring-brand-100"
                  title="For Candidates"
                  desc="Find the right job, showcase your skills and take the next step in your career."
                />
                <FeatureCard
                  icon={<CompanyIcon />}
                  iconClass="bg-cobalt-50 text-cobalt-600 ring-1 ring-cobalt-100"
                  title="For Recruitment Companies"
                  desc="Find, engage and hire top talent faster with the power of AI."
                />
              </div>
              {/* Illustration */}
              <Tilt>
                <ImageStage tone="neutral" className="py-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={assetPath("/images/rec-cand.png")}
                    alt="Candidate & Recruiter"
                    className="relative w-full h-auto object-contain"
                  />
                </ImageStage>
              </Tilt>
            </div>

            <div className="mt-8 flex items-start gap-3 max-w-lg">
              <span className="icon-tile icon-tile-sm bg-white text-green-700 border border-ink-200/70">
                <ShieldIcon />
              </span>
              <div>
                <div className="font-semibold text-body-sm text-ink-900">
                  Your data is safe with us
                </div>
                <div className="text-caption text-ink-500 mt-0.5 leading-relaxed">
                  We use advanced security measures to protect your information
                  and privacy.
                </div>
              </div>
            </div>
          </div>

          {/* Right: login card — right-aligned to sit under the header's Create Account button */}
          <div className="w-full max-w-[440px] mx-auto lg:mx-0 lg:justify-self-end">
            <div className="card-elevated p-6 sm:p-8 animate-fade-up">
              <h2 className="font-display font-extrabold text-heading text-ink-900 tracking-tight">
                Login to your account
              </h2>
              <p className="mt-1 text-ink-500 text-body-sm">
                {fixedRole
                  ? fixedRole === "recruiter"
                    ? "Sign in to your recruitment company account"
                    : "Sign in to your candidate account"
                  : "Please choose your account type to continue"}
              </p>

              {/* Role selector — hidden when the hostname already says which app this is. */}
              {!fixedRole && (
              <div role="group" aria-label="Account type" className="grid grid-cols-2 gap-2 mt-5">
                {(["candidate", "recruiter"] as UserRole[]).map((r) => {
                  const isCand = r === "candidate";
                  const selected = role === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        setRole(r);
                        setSubmitError("");
                        setErrors({});
                      }}
                      className={`flex flex-col min-[400px]:flex-row items-start min-[400px]:items-center gap-2 min-[400px]:gap-2.5 min-h-14 p-2.5 rounded-xl border text-left transition-[border-color,background-color,box-shadow] ${
                        selected
                          ? "border-brand-400 bg-brand-50/70 ring-4 ring-brand-500/10"
                          : "border-ink-200 bg-white hover:border-ink-300"
                      }`}
                    >
                      <span
                        className={`icon-tile icon-tile-sm ${isCand ? "bg-brand-100 text-brand-700" : "bg-cobalt-50 text-cobalt-600"}`}
                      >
                        {isCand ? <CandidateIcon /> : <CompanyIcon />}
                      </span>
                      <span className="min-[400px]:flex-1 min-w-0 font-semibold text-body-sm text-ink-900 leading-tight break-words">
                        {isCand ? "Candidate" : "Recruitment Company"}
                      </span>
                    </button>
                  );
                })}
              </div>
              )}

              {/* Form */}
              <form
                onSubmit={handleSubmit}
                className="mt-6 flex flex-col gap-4"
                noValidate
              >
                {submitError && (
                  <div role="alert" className="alert alert-danger">
                    {submitError}
                  </div>
                )}

                <div>
                  <label htmlFor="login-email" className="field-label">
                    Email Address <span className="text-danger" aria-hidden="true">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none">
                      <MailIcon />
                    </span>
                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErrors((p) => ({ ...p, email: "" }));
                      }}
                      placeholder="Enter your email address"
                      aria-invalid={errors.email ? true : undefined}
                      aria-describedby={errors.email ? "login-email-error" : undefined}
                      className={`field-input pl-10 pr-4 ${errors.email ? errorBorder : ""}`}
                    />
                  </div>
                  {errors.email && (
                    <p id="login-email-error" role="alert" className="field-error">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="login-password" className="text-body-sm font-semibold text-ink-700">
                      Password <span className="text-danger" aria-hidden="true">*</span>
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-body-sm text-brand-700 hover:text-brand-800 font-medium"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none">
                      <LockIcon />
                    </span>
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrors((p) => ({ ...p, password: "" }));
                      }}
                      placeholder="Enter your password"
                      aria-invalid={errors.password ? true : undefined}
                      aria-describedby={errors.password ? "login-password-error" : undefined}
                      className={`field-input pl-10 pr-12 ${errors.password ? errorBorder : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 grid place-items-center w-8 h-8 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-ink-100 transition-colors"
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  {errors.password && (
                    <p id="login-password-error" role="alert" className="field-error">
                      {errors.password}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <label className="flex items-center gap-2 min-h-9 cursor-pointer whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded accent-brand-600"
                    />
                    <span className="text-body-sm text-ink-700">Remember me</span>
                  </label>
                  <span
                    className="text-caption text-ink-500 flex items-center gap-1 cursor-help whitespace-nowrap"
                    title="When enabled, you'll stay signed in on this device and won't need to log in again for 30 days. Leave it off on shared or public computers."
                  >
                    Keep me signed in
                    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" />
                      <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary btn-lg w-full mt-1"
                >
                  {loading ? (
                    <>
                      <SpinnerIcon /> Signing in...
                    </>
                  ) : (
                    <>
                      Login <ArrowRightIcon />
                    </>
                  )}
                </button>
              </form>

              <div className="my-5 flex items-center gap-3">
                <div className="flex-1 h-px bg-ink-200/80" />
                <span className="text-caption text-ink-500 font-medium">
                  or continue with
                </span>
                <div className="flex-1 h-px bg-ink-200/80" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: "Google", icon: <GoogleIcon /> },
                  { name: "Microsoft", icon: <MicrosoftIcon /> },
                ].map((s) => (
                  <button
                    key={s.name}
                    type="button"
                    className="btn btn-outline px-2 text-body-sm"
                  >
                    {s.icon}
                    <span className="font-medium text-ink-700">
                      {s.name}
                    </span>
                  </button>
                ))}
              </div>

              <p className="mt-6 pt-5 border-t border-ink-200/70 text-center text-body-sm text-ink-500">
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="text-brand-700 font-semibold hover:text-brand-800"
                >
                  Create Account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-ink-200/60 glass shrink-0">
        <div className="site-container py-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-body-sm text-ink-500">
          <span>© 2026 HireMind. All rights reserved.</span>
          <span className="text-ink-300" aria-hidden="true">|</span>
          <Link
            href="/terms"
            className="text-ink-600 hover:text-brand-700 transition-colors"
          >
            Terms &amp; Conditions
          </Link>
          <span className="text-ink-300" aria-hidden="true">|</span>
          <Link
            href="/privacy"
            className="text-ink-600 hover:text-brand-700 transition-colors"
          >
            Privacy Policy
          </Link>
          <span className="text-ink-300" aria-hidden="true">|</span>
          <Link
            href="/help"
            className="text-ink-600 hover:text-brand-700 transition-colors"
          >
            Help Center
          </Link>
        </div>
      </footer>
    </div>
  );
}

/* ── Sub-components ── */
function FeatureCard({
  icon,
  iconClass,
  title,
  desc,
}: {
  icon: React.ReactNode;
  iconClass: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="card flex items-start gap-4 p-4">
      <span className={`icon-tile ${iconClass}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <div className="font-bold text-body text-ink-900">{title}</div>
        <div className="text-body-sm text-ink-500 mt-0.5 leading-relaxed">
          {desc}
        </div>
      </div>
    </div>
  );
}

/* ── Icons ── */
function CandidateIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="7" r="4" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 21c0-3.866 4.029-7 9-7s9 3.134 9 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function CompanyIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="3" width="20" height="18" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M2 9h20" stroke="currentColor" strokeWidth="1.6" />
      <rect x="6" y="13" width="3" height="3" rx="0.5" fill="currentColor" fillOpacity="0.5" />
      <rect x="10.5" y="13" width="3" height="3" rx="0.5" fill="currentColor" fillOpacity="0.5" />
      <rect x="15" y="13" width="3" height="3" rx="0.5" fill="currentColor" fillOpacity="0.5" />
      <rect x="8" y="17" width="8" height="4" rx="0.5" fill="currentColor" fillOpacity="0.3" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M12 3l8 4v6c0 4-3 7-8 8-5-1-8-4-8-8V7l8-4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function MailIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function EyeIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8S2 12 2 12z" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function EyeOffIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M3 3l18 18"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
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
function ArrowRightIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 8h10m0 0L8 3m5 5l-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function GoogleIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
function MicrosoftIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 21 21">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}
function CreateAccountIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 21c0-4 4-7 9-7s9 3 9 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
