"use client";

import { useState } from "react";
import type React from "react";
import Link from "next/link";
import type { CandidateRegStep1Data } from "../../../types/auth.types";
import {
  registerCandidateUser,
  deleteCurrentUser,
  authService,
} from "../../../services/auth.service";
import { updateCandidateBasicInfo, type ResumeParsePreview } from "../../../services/candidate.service";
import ResumeUploadField from "../shared/ResumeUploadField";
import {
  PersonIcon, MailIcon, LockIcon, LocationIcon, CalendarIcon,
  ArrowRightIcon, SpinnerIcon, VerifiedIcon, EyeIcon, EyeOffIcon,
} from "../shared/icons";
import { isValidEmail, isStrongPassword } from "../shared/validators";
import { FieldError, FormGroupTitle, errorInput } from "../shared/ui";

interface Props {
  data: CandidateRegStep1Data;
  onChange: (data: CandidateRegStep1Data) => void;
  onNext: () => void;
  isReturning?: boolean;
  /** Resume held by the parent so it survives navigating between steps. */
  resumeFile: File | null;
  onResumeChange: (file: File | null) => void;
  /** Parsed resume — the parent uses it to prefill this step and stage steps 2–3. */
  onResumeParsed: (preview: ResumeParsePreview) => void;
}

export default function Step1BasicInfo({
  data, onChange, onNext, isReturning = false,
  resumeFile, onResumeChange, onResumeParsed,
}: Props) {
  const set = <K extends keyof CandidateRegStep1Data>(field: K, value: CandidateRegStep1Data[K]) =>
    onChange({ ...data, [field]: value });

  const alreadyRegistered = isReturning;

  const [localErrors, setLocalErrors] = useState<Partial<Record<keyof CandidateRegStep1Data, string>>>({});
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [isLoading, setIsLoading]     = useState(false);
  const [apiError, setApiError]       = useState<string | null>(null);

  // Email OTP
  const [emailOtpSent, setEmailOtpSent]       = useState(false);
  const [emailVerified, setEmailVerified]     = useState(false);
  const [emailOtpInput, setEmailOtpInput]     = useState("");
  const [emailOtpLoading, setEmailOtpLoading] = useState(false);
  const [emailOtpError, setEmailOtpError]     = useState<string | null>(null);

  // Phone OTP
  const [phoneOtpSent, setPhoneOtpSent]       = useState(false);
  const [phoneVerified, setPhoneVerified]     = useState(false);
  const [phoneOtpInput, setPhoneOtpInput]     = useState("");
  const [phoneOtpLoading, setPhoneOtpLoading] = useState(false);
  const [phoneOtpError, setPhoneOtpError]     = useState<string | null>(null);

  const [showPwd, setShowPwd]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const pwd = data.password ?? "";
  const pwdChecks = {
    length:  pwd.length >= 8,
    upper:   /[A-Z]/.test(pwd),
    number:  /\d/.test(pwd),
    special: /[!@#$%^&*(),.?":{}|<>_\-+=/\\[\]~`]/.test(pwd),
  };

  const handleSendEmailOtp = async () => {
    if (!isValidEmail(data.email)) {
      setLocalErrors((p) => ({ ...p, email: "Enter a valid email first" }));
      return;
    }
    setEmailOtpLoading(true);
    setEmailOtpError(null);
    try {
      await authService.signup({ fullName: "", email: data.email, phone: "", password: "" });
      setEmailOtpSent(true);
      setEmailVerified(false);
      setEmailOtpInput("");
    } catch {
      setEmailOtpError("Failed to send OTP. Try again.");
    } finally {
      setEmailOtpLoading(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (emailOtpInput.length !== 6) {
      setEmailOtpError("Enter the 6-digit OTP");
      return;
    }
    setEmailOtpLoading(true);
    setEmailOtpError(null);
    try {
      await authService.verifyOtp(data.email, emailOtpInput);
      setEmailVerified(true);
      setEmailOtpError(null);
      setLocalErrors((p) => ({ ...p, email: "" }));
    } catch {
      setEmailOtpError("Invalid OTP. Please try again.");
    } finally {
      setEmailOtpLoading(false);
    }
  };

  const handleSendPhoneOtp = async () => {
    if (data.phone.trim().length < 10) {
      setLocalErrors((p) => ({ ...p, phone: "Enter a valid 10-digit phone number first" }));
      return;
    }
    setPhoneOtpLoading(true);
    setPhoneOtpError(null);
    try {
      await authService.signup({ fullName: "", email: data.phone, phone: data.phone, password: "" });
      setPhoneOtpSent(true);
      setPhoneVerified(false);
      setPhoneOtpInput("");
    } catch {
      setPhoneOtpError("Failed to send OTP. Try again.");
    } finally {
      setPhoneOtpLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (phoneOtpInput.length !== 6) {
      setPhoneOtpError("Enter the 6-digit OTP");
      return;
    }
    setPhoneOtpLoading(true);
    setPhoneOtpError(null);
    try {
      await authService.verifyOtp(data.phone, phoneOtpInput);
      setPhoneVerified(true);
      setPhoneOtpError(null);
      setLocalErrors((p) => ({ ...p, phone: "" }));
    } catch {
      setPhoneOtpError("Invalid OTP. Please try again.");
    } finally {
      setPhoneOtpLoading(false);
    }
  };

  const validate = () => {
    const errs: Partial<Record<keyof CandidateRegStep1Data, string>> = {};
    // The resume itself is mandatory. Whether it parsed successfully is not — see
    // ResumeUploadField: an unreadable file still lets the candidate continue manually.
    setResumeError(resumeFile ? null : "Please upload your resume to continue");
    if (!data.firstName.trim()) errs.firstName = "Required";
    if (!data.lastName.trim())  errs.lastName  = "Required";
    if (!data.email.trim())                          errs.email = "Required";
    else if (!isValidEmail(data.email))              errs.email = "Invalid email";
    else if (!alreadyRegistered && !emailVerified)   errs.email = "Please verify your email";
    if (!data.phone.trim())                          errs.phone = "Required";
    else if (!alreadyRegistered && !phoneVerified)   errs.phone = "Please verify your phone number";
    if (!alreadyRegistered) {
      if (!data.password) errs.password = "Required";
      else {
        const pwErr = isStrongPassword(data.password);
        if (pwErr) errs.password = pwErr;
      }
      if (!data.confirmPassword) errs.confirmPassword = "Required";
      else if (data.password !== data.confirmPassword) errs.confirmPassword = "Passwords don't match";
    }
    if (!data.dateOfBirth) {
      errs.dateOfBirth = "Required";
    } else {
      const dob = new Date(data.dateOfBirth);
      const today = new Date();
      const minDate = new Date("1900-01-01");
      if (isNaN(dob.getTime()) || dob < minDate || dob >= today) {
        errs.dateOfBirth = "Enter a valid date of birth";
      } else {
        const age = today.getFullYear() - dob.getFullYear() -
          (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);
        if (age < 16) errs.dateOfBirth = "Must be at least 16 years old";
      }
    }
    if (!data.currentLocation.trim()) errs.currentLocation = "Required";
    if (!data.professionalSummary.trim()) errs.professionalSummary = "Required";
    if (!data.acceptTerms) errs.acceptTerms = "You must accept the terms";
    return errs;
  };

  const handleContinue = async () => {
    const errs = validate();
    setLocalErrors(errs);
    if (Object.keys(errs).length > 0 || !resumeFile) return;

    setIsLoading(true);
    setApiError(null);
    try {
      if (!alreadyRegistered) {
        await registerCandidateUser(data);
      }
      try {
        await updateCandidateBasicInfo(data);
      } catch (candidateErr) {
        if (!alreadyRegistered) await deleteCurrentUser();
        throw candidateErr;
      }
      onNext();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Step heading */}
      <div className="flex items-center gap-3 mb-5">
        <span className="icon-tile icon-tile-sm bg-brand-50 text-brand-600 ring-1 ring-brand-100">
          <PersonIcon />
        </span>
        <h2 className="section-title text-title">Basic Information</h2>
      </div>

      {/* Resume first — everything below is prefilled from it. */}
      <ResumeUploadField
        file={resumeFile}
        onFileChange={(f) => { onResumeChange(f); setResumeError(null); }}
        onParsed={onResumeParsed}
        error={resumeError}
      />

      {/* ── Personal details ── */}
      <FormSection title="Personal details">
        <div className="grid md:grid-cols-2 gap-x-5 gap-y-5">
          <Field id="firstName" label="First Name" required error={localErrors.firstName}>
            <InputWithIcon id="firstName" icon={<PersonIcon />} value={data.firstName}
              onChange={(v) => { set("firstName", v); setLocalErrors((p) => ({ ...p, firstName: "" })); }}
              placeholder="Enter your first name" hasError={!!localErrors.firstName}
              aria-describedby={localErrors.firstName ? "firstName-error" : undefined} />
          </Field>
          <Field id="lastName" label="Last Name" required error={localErrors.lastName}>
            <InputWithIcon id="lastName" icon={<PersonIcon />} value={data.lastName}
              onChange={(v) => { set("lastName", v); setLocalErrors((p) => ({ ...p, lastName: "" })); }}
              placeholder="Enter your last name" hasError={!!localErrors.lastName}
              aria-describedby={localErrors.lastName ? "lastName-error" : undefined} />
          </Field>

          <Field id="dateOfBirth" label="Date of Birth" required error={localErrors.dateOfBirth}>
            <InputWithIcon id="dateOfBirth" icon={<CalendarIcon />} value={data.dateOfBirth}
              onChange={(v) => { set("dateOfBirth", v); setLocalErrors((p) => ({ ...p, dateOfBirth: "" })); }}
              placeholder="DD / MM / YYYY" type="date"
              max={new Date().toISOString().split("T")[0]} min="1900-01-01"
              hasError={!!localErrors.dateOfBirth}
              aria-describedby={localErrors.dateOfBirth ? "dateOfBirth-error" : undefined} />
          </Field>
          <Field id="currentLocation" label="Current Location" required hint="City, State, Country" error={localErrors.currentLocation}>
            <InputWithIcon id="currentLocation" icon={<LocationIcon />} value={data.currentLocation}
              onChange={(v) => { set("currentLocation", v); setLocalErrors((p) => ({ ...p, currentLocation: "" })); }}
              placeholder="Enter your city" hasError={!!localErrors.currentLocation}
              aria-describedby={localErrors.currentLocation ? "currentLocation-error" : (!localErrors.currentLocation ? "currentLocation-hint" : undefined)} />
          </Field>

          {/* Professional Summary */}
          <div className="md:col-span-2">
            <label htmlFor="professionalSummary" className="field-label">
              Professional Summary <span className="text-danger" aria-hidden="true">*</span>
            </label>
            <textarea
              id="professionalSummary"
              value={data.professionalSummary}
              onChange={(e) => { set("professionalSummary", e.target.value); setLocalErrors((p) => ({ ...p, professionalSummary: "" })); }}
              placeholder="Briefly describe your professional background, key skills, and career goals..."
              rows={4}
              maxLength={2000}
              aria-invalid={localErrors.professionalSummary ? true : undefined}
              aria-describedby={localErrors.professionalSummary ? "professionalSummary-error" : undefined}
              className={`field-input resize-none text-ink-700 ${errorInput(localErrors.professionalSummary)}`}
            />
            <div className="flex items-start justify-between gap-3">
              {localErrors.professionalSummary
                ? <FieldError id="professionalSummary-error">{localErrors.professionalSummary}</FieldError>
                : <span />}
              <p className="mt-1.5 text-caption text-ink-400 tabular shrink-0">{data.professionalSummary.length}/2000</p>
            </div>
          </div>
        </div>
      </FormSection>

      {/* ── Contact & verification ── */}
      <FormSection title="Contact & verification">
        <div className="grid md:grid-cols-2 gap-x-5 gap-y-5">
          <Field id="email" label="Email Address" required error={localErrors.email}>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 min-w-0">
                <InputWithIcon id="email" icon={alreadyRegistered || emailVerified ? <VerifiedIcon /> : <MailIcon />} value={data.email}
                  onChange={(v) => { set("email", v); setLocalErrors((p) => ({ ...p, email: "" })); setEmailVerified(false); setEmailOtpSent(false); setEmailOtpInput(""); }}
                  placeholder="Enter your email address" type="email"
                  disabled={alreadyRegistered}
                  hasError={!!localErrors.email}
                  aria-describedby={localErrors.email ? "email-error" : undefined} />
              </div>
              {!alreadyRegistered && !emailVerified && (
                <button type="button" onClick={handleSendEmailOtp} disabled={emailOtpLoading || !data.email.trim()}
                  className="btn btn-outline h-11 shrink-0 text-brand-700">
                  {emailOtpLoading && !emailOtpSent ? <SpinnerIcon /> : emailOtpSent ? "Resend" : "Send OTP"}
                </button>
              )}
              {!alreadyRegistered && emailVerified && (
                <span className="badge badge-success h-11 px-4 rounded-xl text-caption justify-center shrink-0">
                  ✓ Verified
                </span>
              )}
            </div>
            {!alreadyRegistered && emailOtpSent && !emailVerified && (
              <div className="mt-2 flex gap-2">
                <input value={emailOtpInput} onChange={(e) => { setEmailOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6)); setEmailOtpError(null); }}
                  placeholder="Enter 6-digit OTP" maxLength={6}
                  aria-label="Email verification code"
                  aria-invalid={emailOtpError ? true : undefined}
                  className={`field-input flex-1 min-w-0 tabular tracking-widest ${errorInput(emailOtpError)}`} />
                <button type="button" onClick={handleVerifyEmailOtp} disabled={emailOtpLoading}
                  className="btn btn-primary h-11 shrink-0">
                  {emailOtpLoading ? <SpinnerIcon /> : "Verify"}
                </button>
              </div>
            )}
            {!alreadyRegistered && emailOtpError && <FieldError>{emailOtpError}</FieldError>}
          </Field>

          <Field id="phone" label="Phone Number" required error={localErrors.phone}>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 min-w-0">
                <PhoneInput id="phone" value={data.phone}
                  onChange={(v) => { set("phone", v); setLocalErrors((p) => ({ ...p, phone: "" })); setPhoneVerified(false); setPhoneOtpSent(false); setPhoneOtpInput(""); }}
                  disabled={alreadyRegistered}
                  hasError={!!localErrors.phone}
                  aria-describedby={localErrors.phone ? "phone-error" : undefined}
                  verified={alreadyRegistered || phoneVerified} />
              </div>
              {!alreadyRegistered && !phoneVerified && (
                <button type="button" onClick={handleSendPhoneOtp} disabled={phoneOtpLoading || data.phone.trim().length < 10}
                  className="btn btn-outline h-11 shrink-0 text-brand-700">
                  {phoneOtpLoading && !phoneOtpSent ? <SpinnerIcon /> : phoneOtpSent ? "Resend" : "Send OTP"}
                </button>
              )}
              {!alreadyRegistered && phoneVerified && (
                <span className="badge badge-success h-11 px-4 rounded-xl text-caption justify-center shrink-0">
                  ✓ Verified
                </span>
              )}
            </div>
            {!alreadyRegistered && phoneOtpSent && !phoneVerified && (
              <div className="mt-2 flex gap-2">
                <input value={phoneOtpInput} onChange={(e) => { setPhoneOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6)); setPhoneOtpError(null); }}
                  placeholder="Enter 6-digit OTP" maxLength={6}
                  aria-label="Phone verification code"
                  aria-invalid={phoneOtpError ? true : undefined}
                  className={`field-input flex-1 min-w-0 tabular tracking-widest ${errorInput(phoneOtpError)}`} />
                <button type="button" onClick={handleVerifyPhoneOtp} disabled={phoneOtpLoading}
                  className="btn btn-primary h-11 shrink-0">
                  {phoneOtpLoading ? <SpinnerIcon /> : "Verify"}
                </button>
              </div>
            )}
            {!alreadyRegistered && phoneOtpError && <FieldError>{phoneOtpError}</FieldError>}
          </Field>
        </div>
      </FormSection>

      {/* ── Account security ── */}
      <FormSection title="Account security">
        <div className="grid md:grid-cols-2 gap-x-5 gap-y-5">
          <Field id="password" label="Password" required error={localErrors.password}>
            <InputWithIcon id="password" icon={<LockIcon />} value={data.password}
              onChange={(v) => { set("password", v); setLocalErrors((p) => ({ ...p, password: "" })); }}
              placeholder="Create a strong password" type={showPwd ? "text" : "password"} hasError={!!localErrors.password}
              trailing={
                <button type="button" onClick={() => setShowPwd((s) => !s)} aria-pressed={showPwd}
                  className="grid place-items-center w-8 h-8 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-ink-100 transition-colors" aria-label="Toggle password visibility">
                  {showPwd ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              }
              aria-describedby={localErrors.password ? "password-error" : "password-rules"} />
          </Field>
          <Field id="confirmPassword" label="Confirm Password" required error={localErrors.confirmPassword}>
            <InputWithIcon id="confirmPassword" icon={<LockIcon />} value={data.confirmPassword}
              onChange={(v) => { set("confirmPassword", v); setLocalErrors((p) => ({ ...p, confirmPassword: "" })); }}
              placeholder="Confirm your password" type={showConfirm ? "text" : "password"} hasError={!!localErrors.confirmPassword}
              trailing={
                <button type="button" onClick={() => setShowConfirm((s) => !s)} aria-pressed={showConfirm}
                  className="grid place-items-center w-8 h-8 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-ink-100 transition-colors" aria-label="Toggle confirm password visibility">
                  {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              }
              aria-describedby={localErrors.confirmPassword ? "confirmPassword-error" : undefined} />
          </Field>

          <ul id="password-rules" className="md:col-span-2 -mt-1 flex flex-wrap gap-2">
            <PwdChip ok={pwdChecks.length}  label="Min 8 characters" />
            <PwdChip ok={pwdChecks.upper}   label="1 uppercase letter" />
            <PwdChip ok={pwdChecks.number}  label="1 number" />
            <PwdChip ok={pwdChecks.special} label="1 special character" />
          </ul>
        </div>
      </FormSection>

      {/* ── Terms + Continue ── */}
      <div className="mt-8 pt-6 border-t border-ink-200/70">
        {apiError && (
          <div role="alert" className="alert alert-danger mb-5">
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" className="mt-px shrink-0"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" /><path d="M12 7v6M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            <span>{apiError}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="min-w-0">
            <label htmlFor="acceptTerms" className="flex items-start gap-3 cursor-pointer">
              <input id="acceptTerms" type="checkbox" checked={data.acceptTerms}
                onChange={(e) => { set("acceptTerms", e.target.checked); setLocalErrors((p) => ({ ...p, acceptTerms: "" })); }}
                aria-invalid={localErrors.acceptTerms ? true : undefined}
                aria-describedby={localErrors.acceptTerms ? "acceptTerms-error" : undefined}
                className="mt-0.5 w-4 h-4 rounded accent-brand-600 shrink-0" />
              <span className="text-body-sm text-ink-600 leading-relaxed">
                I agree to the{" "}
                <Link href="/terms" className="text-brand-700 font-semibold hover:underline">Terms of Service</Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-brand-700 font-semibold hover:underline">Privacy Policy</Link>.
              </span>
            </label>
            {localErrors.acceptTerms && (
              <div className="pl-7">
                <FieldError id="acceptTerms-error">{localErrors.acceptTerms}</FieldError>
              </div>
            )}
          </div>
          <button type="button" onClick={handleContinue} disabled={isLoading}
            className="btn btn-primary btn-lg w-full sm:w-auto px-8 shrink-0">
            {isLoading ? <><SpinnerIcon /> Saving...</> : <>Continue <ArrowRightIcon /></>}
          </button>
        </div>

        <p className="mt-6 text-center text-caption text-ink-500 flex items-center justify-center gap-1.5">
          <LockIcon /> Your information is safe with us. We never share your data.
        </p>
      </div>
    </div>
  );
}

/* ── Sub-components ── */
function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 pt-6 border-t border-ink-200/70">
      <FormGroupTitle>{title}</FormGroupTitle>
      {children}
    </section>
  );
}

function Field({ id, label, required, hint, error, children }: {
  id?: string; label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode;
}) {
  const errorId = id && error ? `${id}-error` : undefined;
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="field-label">
        {label} {required && <span className="text-danger" aria-hidden="true">*</span>}
      </label>
      {children}
      {error && <FieldError id={errorId}>{error}</FieldError>}
      {!error && hint && <p id={id ? `${id}-hint` : undefined} className="field-hint">{hint}</p>}
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
function InputWithIcon({ icon, value, onChange, placeholder, type = "text", hasError = false, disabled = false, trailing, ...rest }: {
  icon: React.ReactNode; value: string; onChange: (v: string) => void;
  placeholder: string; type?: string; hasError?: boolean; disabled?: boolean; trailing?: React.ReactNode; [key: string]: unknown;
}) {
  return (
    <div className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none">{icon}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} disabled={disabled}
        aria-invalid={hasError ? true : undefined}
        {...(rest as React.InputHTMLAttributes<HTMLInputElement>)}
        className={`field-input pl-10 ${trailing ? "pr-12" : ""} ${disabled ? "" : errorInput(hasError)}`} />
      {trailing && <span className="absolute right-1.5 top-1/2 -translate-y-1/2">{trailing}</span>}
    </div>
  );
}

function PhoneInput({ value, onChange, hasError = false, disabled = false, id, verified, "aria-describedby": ariaDescribedby }: {
  value: string; onChange: (v: string) => void; hasError?: boolean; disabled?: boolean; id?: string; verified?: boolean; "aria-describedby"?: string;
}) {
  return (
    <div className="flex">
      <div className={`flex items-center h-11 px-3 rounded-l-xl border border-r-0 border-ink-200 text-body font-medium text-ink-700 gap-1.5 whitespace-nowrap ${disabled ? "bg-ink-100 text-ink-500" : "bg-ink-50"}`}>
        {verified ? <VerifiedIcon /> : "🇮🇳"} <span className="text-ink-400" aria-hidden="true">▾</span> +91
      </div>
      <input id={id} type="tel" value={value} disabled={disabled}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
        placeholder="Enter your phone number"
        aria-describedby={ariaDescribedby}
        aria-invalid={hasError ? true : undefined}
        className={`field-input flex-1 min-w-0 rounded-l-none ${disabled ? "" : errorInput(hasError)}`} />
    </div>
  );
}
