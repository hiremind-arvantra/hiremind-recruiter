"use client";

import { useEffect, useId, useMemo, useState } from "react";
import Illustration from "../shared/Illustration";
import { DEPARTMENTS, LANGUAGES, allTimeZones, defaultTimeZone } from "../shared/options";
import { SelectOrText } from "../shared/SelectOrText";
import type { CompanyData, AdminData } from "../shared/types";
import HorizontalStepper from "../shared/HorizontalStepper";
import VerticalStepper from "../shared/VerticalStepper";
import { registerCompanyUser, saveCompanyProfile, uploadCompanyLogo, deleteCurrentCompany } from "@/modules/auth/services/company.service";
import { isValidEmail, isStrongPassword } from "@/modules/auth/components/candidate-reg/shared/validators";
import { FieldError, errorInput } from "@/modules/auth/components/candidate-reg/shared/ui";

interface Props {
  data: AdminData;
  company: CompanyData;
  /** True once the account has already been created (returning to this step). */
  registered: boolean;
  onRegistered: () => void;
  onChange: (d: AdminData) => void;
  onBack: () => void;
  onContinue: () => void;
}

type FieldErrors = Partial<Record<keyof AdminData | "api", string>>;

const COUNTRY_CODES = ["+91", "+1", "+44", "+65", "+971"];
const NOTIFY_OPTS = ["Receive important updates", "Receive all updates", "Critical only", "None"];

export default function Step2AdminDetails({ data, company, registered, onRegistered, onChange, onBack, onContinue }: Props) {
  // Intl.supportedValuesOf is a browser API, so the zone list is built after mount —
  // computing it during render would make the server and client markup disagree.
  const [timeZones, setTimeZones] = useState<string[]>([]);
  useEffect(() => { setTimeZones(allTimeZones()); }, []);

  // Preselect the zone for the company's country (captured in step 1). Only fills an
  // empty field, so an admin who has chosen their own zone keeps it.
  const suggestedZone = useMemo(() => defaultTimeZone(company.country ?? ""), [company.country]);
  useEffect(() => {
    if (!data.timeZone && suggestedZone) {
      onChange({ ...data, timeZone: suggestedZone });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestedZone]);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const set = <K extends keyof AdminData>(k: K, v: AdminData[K]) => {
    onChange({ ...data, [k]: v });
    if (errors[k]) setErrors((prev) => ({ ...prev, [k]: undefined, api: undefined }));
  };

  const pwd = data.password ?? "";
  const checks = {
    length: pwd.length >= 8,
    upper:  /[A-Z]/.test(pwd),
    number: /\d/.test(pwd),
    special:/[!@#$%^&*(),.?":{}|<>_\-+=/\\[\]~`]/.test(pwd),
  };

  function validate(): boolean {
    const errs: FieldErrors = {};
    if (!data.fullName?.trim())   errs.fullName    = "Required";
    if (!data.designation?.trim()) errs.designation = "Required";
    if (!data.email?.trim())      errs.email       = "Required";
    else if (!isValidEmail(data.email)) errs.email = "Enter a valid email address";
    if (!data.mobile?.trim())                                    errs.mobile = "Required";
    else if (data.mobile.trim().length !== 10)                 errs.mobile = "Enter a valid 10-digit mobile number";
    const pwdErr = isStrongPassword(data.password ?? "");
    if (pwdErr)                   errs.password    = pwdErr;
    if (!data.confirmPassword?.trim()) errs.confirmPassword = "Required";
    else if (data.password !== data.confirmPassword) errs.confirmPassword = "Passwords do not match";
    if (!data.timeZone)           errs.timeZone    = "Required";
    if (!data.language)           errs.language    = "Required";
    if (!data.emailNotifications) errs.emailNotifications = "Required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleContinue() {
    if (!validate()) return;
    setIsLoading(true);
    setErrors((prev) => ({ ...prev, api: undefined }));
    try {
      if (!registered) {
        // First time through: create the account, then the company profile.
        await registerCompanyUser(data);
        try {
          await saveCompanyProfile(company);
        } catch (profileErr) {
          await deleteCurrentCompany().catch(() => {});
          throw profileErr;
        }
        onRegistered();
      } else {
        // Returning to this step (e.g. "Change Number") — the account already
        // exists, so just update the profile. Re-registering would 409.
        await saveCompanyProfile(company);
      }
      // Upload the logo once the company row exists. Non-fatal: registration
      // still succeeds if S3 is unavailable — only logo_file_key is missing.
      if (company.logoFile) {
        await uploadCompanyLogo(company.logoFile).catch(() => {});
      }
      onContinue();
    } catch (err) {
      setErrors((prev) => ({ ...prev, api: err instanceof Error ? err.message : "Registration failed. Please try again." }));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    // Same .site-container column as AuthHeader — see Step 1.
    <div className="site-container flex-1 grid lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)] gap-8 xl:gap-10 items-start pt-6 sm:pt-8 lg:pt-10 pb-16">
      {/* ─────────────── LEFT SIDEBAR ─────────────── */}
      <aside className="hidden lg:block sticky top-[calc(var(--header-h)+40px)] max-h-[calc(100vh-var(--header-h)-56px)] overflow-y-auto pb-2 space-y-5">
        <h2 className="font-display text-title-lg font-extrabold tracking-tight text-ink-900">Create your company account</h2>

        <VerticalStepper
          current={2}
          steps={[
            { n: 1, title: "Company Details", caption: "Completed",                     done: true  },
            { n: 2, title: "Admin Details",   caption: "Add administrator information", done: false },
            { n: 3, title: "Verification",    caption: "Verify your email and phone",   done: false },
          ]}
        />

        <Illustration
          src="/images/company-recruiter.jpg"
          alt="A recruiter reviewing AI-matched candidates"
        />

        <div className="card p-4">
          <div className="font-display font-bold text-body-sm text-ink-900 mb-3">Why add admin details?</div>
          <ul className="space-y-3">
            <Why icon="lock"   title="Secure Access"       body="Only authorized admins can manage your account." />
            <Why icon="slider" title="Full Control"        body="Manage jobs, candidates and team members." />
            <Why icon="users"  title="Better Collaboration" body="Invite team members and collaborate seamlessly." />
            <Why icon="shield" title="Data Protection"     body="Your information is encrypted and safe with us." />
          </ul>
        </div>

        <NeedHelpCard />
      </aside>

      {/* ─────────────── RIGHT FORM ─────────────── */}
      <main id="main" tabIndex={-1} className="min-w-0">
        <div className="card-elevated p-5 sm:p-7 lg:p-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-ink-200/70">
            <div className="flex items-start gap-4 min-w-0">
              <span className="icon-tile w-12 h-12 rounded-2xl bg-cobalt-50 text-cobalt-600 ring-1 ring-cobalt-100">
                <UserIcon size={20} />
              </span>
              <div className="min-w-0">
                <h1 className="page-title">Admin Details</h1>
                <p className="page-subtitle mt-1">Add the primary administrator who will manage this account.</p>
              </div>
            </div>
            <HorizontalStepper current={2} />
          </div>

          {/* API error banner */}
          {errors.api && (
            <div className="alert alert-danger mt-6" role="alert">
              {errors.api}
            </div>
          )}

          {/* Personal Information */}
          <Section title="Personal Information" icon={<UserIcon size={14} />} first>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-5">
              <Field label="Full Name" required icon={<UserIcon size={14} />}
                value={data.fullName} onChange={(v) => set("fullName", v)}
                placeholder="Enter full name" error={errors.fullName} maxLength={100} />
              <Field label="Designation" required icon={<MailIcon />}
                value={data.designation} onChange={(v) => set("designation", v)}
                placeholder="Enter designation" error={errors.designation} maxLength={100} />
              <SelectOrText label="Department" icon={<DocIcon />}
                value={data.department} onChange={(v) => set("department", v)}
                placeholder="Select department" options={DEPARTMENTS}
                textPlaceholder="Type your department" />

              <Field label="Email Address" required icon={<MailIcon />}
                value={data.email} onChange={(v) => set("email", v)}
                placeholder="Enter admin email address" error={errors.email} maxLength={150} />

              <div className="min-w-0">
                <Label required htmlFor="admin-mobile">Mobile Number</Label>
                <PhoneField id="admin-mobile" cc={data.countryCode ?? "+91"} onCc={(v) => set("countryCode", v)}
                  value={data.mobile} onValue={(v) => set("mobile", v)} placeholder="Enter mobile number"
                  error={errors.mobile} />
                <FieldError id="admin-mobile-error">{errors.mobile}</FieldError>
              </div>

              <div className="min-w-0">
                <Label htmlFor="admin-altMobile">Alternate Mobile (Optional)</Label>
                <PhoneField id="admin-altMobile" cc={data.altCountryCode ?? "+91"} onCc={(v) => set("altCountryCode", v)}
                  value={data.altMobile} onValue={(v) => set("altMobile", v)} placeholder="Enter alternate number" />
              </div>
            </div>
          </Section>

          {/* Login Credentials */}
          <Section title="Login Credentials" icon={<LockIcon />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
              <PasswordField label="Password" required value={pwd}
                onChange={(v) => set("password", v)}
                show={showPwd} onToggle={() => setShowPwd((s) => !s)}
                placeholder="Create a strong password" error={errors.password} />
              <PasswordField label="Confirm Password" required value={data.confirmPassword ?? ""}
                onChange={(v) => set("confirmPassword", v)}
                show={showConfirm} onToggle={() => setShowConfirm((s) => !s)}
                placeholder="Confirm your password" error={errors.confirmPassword} />
            </div>
            <ul className="mt-4 flex flex-wrap gap-2">
              <PwdChip ok={checks.length}  label="Min 8 characters" />
              <PwdChip ok={checks.upper}   label="1 uppercase letter" />
              <PwdChip ok={checks.number}  label="1 number" />
              <PwdChip ok={checks.special} label="1 special character" />
            </ul>
          </Section>

          {/* Preferences */}
          <Section title="Preferences" icon={<GearIcon />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-5">
              <Select label="Default Time Zone" required value={data.timeZone}
                onChange={(v) => set("timeZone", v)}
                options={timeZones.length ? timeZones : [suggestedZone].filter(Boolean)}
                placeholder={suggestedZone || "Select time zone"} error={errors.timeZone} />
              <Select label="Preferred Language" required value={data.language}
                onChange={(v) => set("language", v)} options={LANGUAGES}
                placeholder="English" error={errors.language} />
              <Select label="Email Notifications" required value={data.emailNotifications}
                onChange={(v) => set("emailNotifications", v)} options={NOTIFY_OPTS}
                placeholder="Receive important updates" error={errors.emailNotifications} />
            </div>
          </Section>

          {/* Bottom buttons */}
          <div className="sticky bottom-0 z-10 -mx-5 sm:-mx-7 lg:-mx-8 -mb-5 sm:-mb-7 lg:-mb-8 mt-8 px-5 sm:px-7 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-2 border-t border-ink-200/70 glass rounded-b-card">
            <button onClick={onBack} disabled={isLoading} className="btn btn-outline btn-lg px-4 sm:px-5">
              <ArrowLeft /> Back
            </button>
            <div className="flex items-center gap-2 ml-auto">
              <button disabled={isLoading} className="btn btn-ghost btn-lg px-3 sm:px-5">
                Save &amp; Exit
              </button>
              <button onClick={handleContinue} disabled={isLoading} className="btn btn-primary btn-lg px-5 sm:px-7">
                {isLoading ? <SpinnerIcon /> : null}
                {isLoading ? "Creating account…" : "Continue"}
                {!isLoading && <ArrowRight />}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ────────────────── Section + Form primitives ────────────────── */
function Section({ title, icon, first, children }: { title: string; icon?: React.ReactNode; first?: boolean; children: React.ReactNode }) {
  return (
    <section className={first ? "mt-6" : "mt-8 pt-6 border-t border-ink-200/70"}>
      <h2 className="section-title mb-4 flex items-center gap-2.5">
        {icon && <span className="icon-tile w-7 h-7 rounded-lg bg-ink-100 text-ink-600">{icon}</span>} {title}
      </h2>
      {children}
    </section>
  );
}
function Label({ children, required, htmlFor }: { children: React.ReactNode; required?: boolean; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="field-label">
      {children} {required && <span className="text-danger" aria-hidden="true">*</span>}
    </label>
  );
}
function Field({ label, required, icon, value, onChange, placeholder, error, maxLength }: {
  label: string; required?: boolean; icon?: React.ReactNode;
  value: string; onChange: (v: string) => void; placeholder?: string; error?: string;
  maxLength?: number;
}) {
  const id = useId();
  return (
    <div className="min-w-0">
      <Label required={required} htmlFor={id}>{label}</Label>
      <div className="relative">
        {icon && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none">{icon}</span>}
        <input
          id={id}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`field-input ${icon ? "pl-10" : ""} ${errorInput(error)}`}
        />
      </div>
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  );
}
function Select({ label, required, value, onChange, placeholder, options, error }: {
  label: string; required?: boolean; value: string; onChange: (v: string) => void;
  placeholder?: string; options: string[]; error?: string;
}) {
  const id = useId();
  return (
    <div className="min-w-0">
      <Label required={required} htmlFor={id}>{label}</Label>
      <div className="relative">
        <select
          id={id}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`field-input pr-10 appearance-none cursor-pointer ${value ? "text-ink-900" : "text-ink-400"} ${errorInput(error)}`}
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
function PhoneField({ id, cc, onCc, value, onValue, placeholder, error }: {
  id?: string; cc: string; onCc: (v: string) => void; value: string; onValue: (v: string) => void; placeholder: string; error?: string;
}) {
  return (
    <div className="flex gap-2">
      <div className="relative shrink-0">
        <select value={cc} onChange={(e) => onCc(e.target.value)} aria-label="Country code"
          className="field-input w-[88px] pl-3 pr-8 appearance-none cursor-pointer tabular">
          {COUNTRY_CODES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <Chevron />
      </div>
      <div className="relative flex-1 min-w-0">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"><PhoneIcon /></span>
        <input
          id={id}
          value={value ?? ""}
          onChange={(e) => onValue(e.target.value.replace(/\D/g, "").slice(0, 10))}
          inputMode="numeric"
          maxLength={10}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={error && id ? `${id}-error` : undefined}
          className={`field-input pl-10 tabular ${errorInput(error)}`}
        />
      </div>
    </div>
  );
}
function PasswordField({ label, required, value, onChange, show, onToggle, placeholder, error }: {
  label: string; required?: boolean; value: string; onChange: (v: string) => void;
  show: boolean; onToggle: () => void; placeholder: string; error?: string;
}) {
  const id = useId();
  return (
    <div className="min-w-0">
      <Label required={required} htmlFor={id}>{label}</Label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"><LockIcon /></span>
        <input id={id} type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`field-input pl-10 pr-12 ${errorInput(error)}`} />
        <button type="button" onClick={onToggle} aria-pressed={show}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 grid place-items-center w-8 h-8 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-ink-100 transition-colors" aria-label="Toggle password visibility">
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  );
}
function PwdChip({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className={`badge ${ok ? "badge-success" : "badge-neutral"} transition-colors`}>
      {ok ? (
        <svg aria-hidden="true" width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      ) : (
        <svg aria-hidden="true" width="11" height="11" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.6" /></svg>
      )}
      <span className="sr-only">{ok ? "Met:" : "Not met:"}</span> {label}
    </li>
  );
}
function Why({ icon, title, body }: { icon: "lock" | "slider" | "users" | "shield"; title: string; body: string }) {
  const icons = { lock: <LockIcon />, slider: <SliderIcon />, users: <UsersIcon />, shield: <ShieldIcon /> };
  return (
    <li className="flex items-start gap-3">
      <span className="icon-tile w-7 h-7 rounded-lg bg-cobalt-50 text-cobalt-600">{icons[icon]}</span>
      <div className="min-w-0 leading-snug">
        <div className="text-caption font-bold text-ink-900">{title}</div>
        <div className="text-caption text-ink-500">{body}</div>
      </div>
    </li>
  );
}
function NeedHelpCard() {
  return (
    <div className="flex items-start gap-3 px-1">
      <span className="icon-tile w-9 h-9 rounded-xl bg-white text-ink-600 border border-ink-200/70"><HeadsetIcon /></span>
      <div className="min-w-0">
        <div className="text-body-sm font-bold text-ink-900">Need help?</div>
        <div className="text-caption text-ink-500">Our support team is here to assist you.</div>
        <a className="mt-1 inline-flex items-center gap-1 text-caption font-semibold text-brand-700">Contact Support <ArrowRight /></a>
      </div>
    </div>
  );
}

/* Icons */
function Chevron() {
  return (
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function SpinnerIcon() {
  return (
    <svg aria-hidden="true" className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
function UserIcon({ size = 18 }: { size?: number }) { return (<svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="9" r="3.5" stroke="currentColor" strokeWidth="1.6" /><path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>); }
function MailIcon() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" /><path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="1.6" /></svg>); }
function DocIcon() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M7 2h8l5 5v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.6" /></svg>); }
function PhoneIcon() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>); }
function LockIcon() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" /><path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.6" /></svg>); }
function GearIcon() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" /><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4.8a7 7 0 0 0-2.1-1.2L14 3h-4l-.4 2.4a7 7 0 0 0-2.1 1.2l-2.4-.8-2 3.4 2 1.6c-.1.4-.1.8-.1 1.2s0 .8.1 1.2l-2 1.6 2 3.4 2.4-.8c.7.5 1.4.9 2.1 1.2L10 21h4l.4-2.4c.7-.3 1.4-.7 2.1-1.2l2.4.8 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>); }
function UsersIcon() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.6" /><circle cx="17" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.6" /><path d="M3 20c0-3 3-5 6-5s6 2 6 5M14 20c0-2 2-3 3.5-3 2 0 3.5 1 3.5 3" stroke="currentColor" strokeWidth="1.6" /></svg>); }
function SliderIcon() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4 6h12M4 18h7M4 12h16M14 4v4M9 16v4M18 10v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>); }
function ShieldIcon() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 3l8 4v6c0 4-3 7-8 8-5-1-8-4-8-8V7l8-4z" stroke="currentColor" strokeWidth="1.6" /></svg>); }
function HeadsetIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 14v-2a8 8 0 0 1 16 0v2M4 14h3v6H5a1 1 0 0 1-1-1v-5zm16 0h-3v6h2a1 1 0 0 0 1-1v-5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>); }
function EyeIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" stroke="currentColor" strokeWidth="1.6" /><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" /></svg>); }
function EyeOffIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 3l18 18M10 10a3 3 0 0 0 4 4M9 5a10 10 0 0 1 13 7 12 12 0 0 1-3 4M6 7C3 9 2 12 2 12s4 7 10 7c1.5 0 3-.4 4-1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>); }
function ArrowRight() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h10m0 0L8 3m5 5l-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
function ArrowLeft() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M13 8H3m0 0l5-5m-5 5l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
