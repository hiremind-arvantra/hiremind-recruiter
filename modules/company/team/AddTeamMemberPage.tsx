"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, Breadcrumbs } from "@/components/ui/PageHeader";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LoadingState } from "@/components/ui/Skeleton";
import {
  createTeamMember,
  getTeamMember,
  updateTeamMember,
  type TeamMemberResponse,
} from "./services/team.service";

/* ── Option lists ─────────────────────────────────────────────────────── */
const COUNTRY_CODES = ["+91", "+1", "+44", "+65", "+971"];
const DEPARTMENTS = ["Operations", "Recruitment", "Business Dev", "Finance", "Sales", "Marketing", "Other"];
const EMPLOYEE_TYPES = ["Full-time", "Part-time", "Contract", "Intern"];
const ROLES = ["Admin", "Manager", "Recruiter", "Viewer"];
const PERMISSIONS = ["Full Access", "Standard", "Limited", "Custom"];
const REPORTING_MANAGERS = ["Ananya Singh", "Rahul Sharma", "Priya Nair"];

const ACCESS_SCOPES = [
  { value: "all", title: "All Clients & Jobs", desc: "Can access all clients, jobs and candidates" },
  { value: "clients", title: "Specific Clients", desc: "Restrict access to selected clients" },
  { value: "department", title: "Specific Department", desc: "Restrict access to department data" },
] as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Guarantees ≥1 upper, ≥1 lower, ≥1 digit, ≥1 symbol so it passes the backend's
// @StrongPassword rule (the provisioned login account is created from this value).
const genPassword = () => {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ", lower = "abcdefghijkmnpqrstuvwxyz";
  const digit = "23456789", symbol = "!@#$%";
  const all = upper + lower + digit + symbol;
  const pick = (set: string) => set.charAt(Math.floor(Math.random() * set.length));
  const chars = [pick(upper), pick(lower), pick(digit), pick(symbol)];
  for (let i = 4; i < 12; i++) chars.push(pick(all));
  return chars.sort(() => Math.random() - 0.5).join("");
};

interface TeamMemberForm {
  fullName: string; email: string; countryCode: string; phone: string;
  designation: string; department: string; employeeType: string;
  role: string; permissions: string; reportingManager: string; accessScope: string;
  sendVia: "email" | "sms"; tempPasswordEnabled: boolean; twoFactor: boolean;
  message: string;
}

const EMPTY: TeamMemberForm = {
  fullName: "", email: "", countryCode: "+91", phone: "",
  designation: "", department: "", employeeType: "",
  role: "", permissions: "", reportingManager: "", accessScope: "all",
  sendVia: "email", tempPasswordEnabled: true, twoFactor: true,
  message: "",
};

/** Map a backend TeamMemberResponse onto the edit form. */
function toForm(member: TeamMemberResponse): TeamMemberForm {
  return {
    fullName: member.fullName ?? "",
    email: member.email ?? "",
    countryCode: member.countryCode || "+91",
    phone: member.phone ?? "",
    designation: member.designation ?? "",
    department: member.department ?? "",
    employeeType: member.employeeType ?? "",
    role: member.role ?? "",
    permissions: member.permissions ?? "",
    reportingManager: member.reportingManager ?? "",
    accessScope: member.accessScope || "all",
    sendVia: member.invitedVia === "sms" ? "sms" : "email",
    tempPasswordEnabled: member.tempPasswordEnabled,
    twoFactor: member.twoFactorEnabled,
    message: member.message ?? "",
  };
}

export default function AddTeamMemberPage({ memberId }: { memberId?: string } = {}) {
  const router = useRouter();
  const isEdit = Boolean(memberId);
  const [form, setForm] = useState<TeamMemberForm>(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [errors, setErrors] = useState<Partial<Record<keyof TeamMemberForm, string>>>({});
  const [tempPassword, setTempPassword] = useState(genPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [inviteFailed, setInviteFailed] = useState(false);
  const ids = useId();

  const set = <K extends keyof TeamMemberForm>(key: K, value: TeamMemberForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  // Edit mode — load the existing member once and prefill the form.
  const prefilled = useRef(false);
  useEffect(() => {
    if (!memberId || prefilled.current) return; // StrictMode double-invoke guard
    prefilled.current = true;
    getTeamMember(memberId)
      .then((member) => setForm(toForm(member)))
      .catch((err) => setSubmitError(err instanceof Error ? err.message : "Failed to load team member"))
      .finally(() => setLoading(false));
  }, [memberId]);

  function validate(): boolean {
    const errs: Partial<Record<keyof TeamMemberForm, string>> = {};
    if (!form.fullName.trim()) errs.fullName = "Full name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!EMAIL_RE.test(form.email)) errs.email = "Enter a valid email address";
    if (!form.designation.trim()) errs.designation = "Designation is required";
    if (!form.role) errs.role = "Role is required";
    if (!form.permissions) errs.permissions = "Permissions are required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSend() {
    if (!validate()) return;
    setSaving(true);
    setSubmitError(null);
    const payload = {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      countryCode: form.countryCode || undefined,
      phone: form.phone.trim() || undefined,
      designation: form.designation.trim(),
      department: form.department || undefined,
      employeeType: form.employeeType || undefined,
      role: form.role,
      permissions: form.permissions,
      reportingManager: form.reportingManager || undefined,
      accessScope: form.accessScope,
      invitedVia: form.sendVia,
      tempPasswordEnabled: form.tempPasswordEnabled,
      twoFactorEnabled: form.twoFactor,
      message: form.message.trim() || undefined,
      // Provisions the member's login account (create only; ignored on update).
      tempPassword: form.tempPasswordEnabled ? tempPassword : undefined,
    };
    try {
      let failed = false;
      if (isEdit && memberId) {
        await updateTeamMember(memberId, payload);
      } else {
        // The member is created either way; flag it so the admin knows to share
        // the credentials by hand when delivery didn't happen.
        failed = (await createTeamMember(payload)).inviteSent === false;
      }
      setInviteFailed(failed);
      setSaved(true);
      // Stay on the page when delivery failed — the temp password is only shown here.
      if (!failed) setTimeout(() => router.push("/company/team"), 1200);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : isEdit ? "Failed to update team member" : "Failed to invite team member");
    } finally {
      setSaving(false);
    }
  }

  const title = isEdit ? "Edit Team Member" : "Add Team Member";
  const header = (
    <PageHeader
      eyebrow={<Breadcrumbs items={[{ label: "Team", href: "/company/team" }, { label: title }]} />}
      title={title}
      subtitle={isEdit ? "Update this team member's details, role and access." : "Invite a new team member to collaborate and manage your hiring together."}
    />
  );

  if (loading) {
    return (
      <div>
        {header}
        <LoadingState label="Loading team member…" rows={3} />
      </div>
    );
  }

  const errorCount = Object.values(errors).filter(Boolean).length;
  const tempPasswordId = `${ids}-temp-password`;
  const tempPasswordHintId = `${ids}-temp-password-hint`;
  const twoFactorHintId = `${ids}-2fa-hint`;
  const messageId = `${ids}-message`;
  const uploadLabelId = `${ids}-upload-label`;

  return (
    <div>
      {header}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] items-start">
        {/* ── Main form ── */}
        <div className="min-w-0 space-y-6">
          {saved && !inviteFailed && (
            <div role="status" className="alert alert-success font-semibold">
              <CheckIcon /> {isEdit
                ? "Team member updated successfully."
                : `Invitation sent to ${form.email.trim()}.`}
            </div>
          )}
          {saved && inviteFailed && (
            <div role="status" className="alert alert-warn">
              <AlertIcon />
              <div>
                <div className="font-semibold">Member created, but the invite could not be delivered.</div>
                <div className="mt-1">
                  Their login account is active — share the email and temporary password below with
                  them manually. Check the server&apos;s email settings so the next invite sends automatically.
                </div>
              </div>
            </div>
          )}
          {submitError && (
            <div role="alert" className="alert alert-danger font-semibold">
              <AlertIcon /> <span>{submitError}</span>
            </div>
          )}

          <div className="card-elevated p-5 sm:p-7">
            {/* Personal Information */}
            <FormSection title="Personal Information" subtitle="Who you're inviting and where they sit." icon={<UserIcon />}>
              <Field label="Full Name" required value={form.fullName} onChange={(v) => set("fullName", v)} placeholder="Enter full name" error={errors.fullName} maxLength={150} />
              <Field label="Email Address" type="email" required value={form.email} onChange={(v) => set("email", v)} placeholder="Enter email address" error={errors.email} maxLength={150} />
              <PhoneField label="Phone Number" cc={form.countryCode} onCc={(v) => set("countryCode", v)} value={form.phone} onValue={(v) => set("phone", v)} placeholder="Enter phone number" />
              <Field label="Designation" required value={form.designation} onChange={(v) => set("designation", v)} placeholder="Enter designation" error={errors.designation} maxLength={100} />
              <SelectField label="Department" value={form.department} onChange={(v) => set("department", v)} placeholder="Select department" options={DEPARTMENTS} />
              <SelectField label="Employee Type" value={form.employeeType} onChange={(v) => set("employeeType", v)} placeholder="Select employee type" options={EMPLOYEE_TYPES} />
            </FormSection>

            {/* Access & Role */}
            <FormSection
              title={<>Access &amp; Role</>}
              subtitle="What this member can see and manage."
              icon={<KeyIcon />}
              footer={
                <fieldset className="mt-6">
                  <legend className="field-label">
                    Access Scope <span className="text-danger" aria-hidden="true">*</span>
                  </legend>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {ACCESS_SCOPES.map((s) => {
                      const checked = form.accessScope === s.value;
                      return (
                        <label
                          key={s.value}
                          className={`relative flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-colors focus-within:ring-4 focus-within:ring-brand-500/15 ${checked ? "border-brand-400 bg-brand-50/60" : "border-ink-200 bg-white hover:border-ink-300"}`}
                        >
                          <input type="radio" name="accessScope" checked={checked} onChange={() => set("accessScope", s.value)} className="mt-0.5 w-4 h-4 accent-brand-600" />
                          <span className="min-w-0">
                            <span className={`block text-body-sm font-semibold ${checked ? "text-brand-800" : "text-ink-900"}`}>{s.title}</span>
                            <span className="block text-caption text-ink-500 mt-0.5 leading-relaxed">{s.desc}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              }
            >
              <SelectField label="Role" required value={form.role} onChange={(v) => set("role", v)} placeholder="Select role" options={ROLES} error={errors.role} />
              <SelectField
                label="Permissions"
                required
                value={form.permissions}
                onChange={(v) => set("permissions", v)}
                placeholder="Select permissions"
                options={PERMISSIONS}
                error={errors.permissions}
                hint={errors.permissions ? undefined : "Choose the level of access for this team member"}
              />
              <SelectField label="Reporting Manager" value={form.reportingManager} onChange={(v) => set("reportingManager", v)} placeholder="Select reporting manager" options={REPORTING_MANAGERS} />
            </FormSection>

            {/* Login & Security */}
            <FormSection title={<>Login &amp; Security</>} subtitle="How the member signs in the first time." icon={<ShieldIcon />}>
              <fieldset className="min-w-0">
                <legend className="field-label">
                  Send Invitation Using <span className="text-danger" aria-hidden="true">*</span>
                </legend>
                <div className="space-y-1">
                  <label className="flex min-h-10 items-center gap-3 text-body-sm text-ink-700 cursor-pointer">
                    <input type="radio" name="sendVia" checked={form.sendVia === "email"} onChange={() => set("sendVia", "email")} className="w-4 h-4 accent-brand-600" />
                    <span>Email <span className="text-ink-500">(Recommended)</span></span>
                  </label>
                  <label className="flex min-h-10 items-center gap-3 text-body-sm text-ink-700 cursor-pointer">
                    <input type="radio" name="sendVia" checked={form.sendVia === "sms"} onChange={() => set("sendVia", "sms")} className="w-4 h-4 accent-brand-600" />
                    Phone Number (SMS)
                  </label>
                </div>
              </fieldset>

              <div className="min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <label htmlFor={tempPasswordId} className="field-label mb-0">Temporary Password</label>
                  <Toggle on={form.tempPasswordEnabled} onChange={(v) => set("tempPasswordEnabled", v)} label="Temporary password" />
                </div>
                <div className={`relative ${form.tempPasswordEnabled ? "" : "opacity-50 pointer-events-none"}`} aria-disabled={!form.tempPasswordEnabled || undefined}>
                  <input
                    id={tempPasswordId}
                    type={showPassword ? "text" : "password"}
                    value={tempPassword}
                    readOnly
                    aria-describedby={tempPasswordHintId}
                    className="field-input pr-22 font-mono tabular bg-ink-50"
                  />
                  <div className="absolute inset-y-0 right-0.5 flex items-center">
                    <button type="button" aria-label="Toggle password visibility" aria-pressed={showPassword} onClick={() => setShowPassword((s) => !s)} className="w-10 h-10 grid place-items-center rounded-lg text-ink-500 hover:text-ink-900 hover:bg-ink-100 transition-colors">
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                    <button type="button" aria-label="Regenerate password" onClick={() => setTempPassword(genPassword())} className="w-10 h-10 grid place-items-center rounded-lg text-ink-500 hover:text-ink-900 hover:bg-ink-100 transition-colors">
                      <RefreshIcon />
                    </button>
                  </div>
                </div>
                <p id={tempPasswordHintId} className="field-hint">User will be prompted to change password on first login</p>
              </div>

              <div className="min-w-0 surface-muted p-4 self-start">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-body-sm font-semibold text-ink-700">Two-Factor Authentication</div>
                    <p id={twoFactorHintId} className="text-caption text-ink-500 mt-0.5">Require 2FA verification for added security</p>
                  </div>
                  <Toggle on={form.twoFactor} onChange={(v) => set("twoFactor", v)} label="Two-factor authentication" describedBy={twoFactorHintId} />
                </div>
              </div>
            </FormSection>

            {/* Additional Information */}
            <FormSection
              title={<>Additional Information <span className="font-normal text-ink-500">(Optional)</span></>}
              icon={<DocIcon />}
              columns="two"
            >
              <div className="min-w-0">
                <label htmlFor={messageId} className="field-label">Add a Personal Message</label>
                <textarea id={messageId} value={form.message} onChange={(e) => set("message", e.target.value)} placeholder="Write a message to the team member (optional)..." maxLength={500} className="field-input min-h-32 resize-y" />
              </div>
              <div className="min-w-0">
                <span id={uploadLabelId} className="field-label">Upload Profile Picture</span>
                <button type="button" aria-describedby={uploadLabelId} className="w-full min-h-32 rounded-xl border-2 border-dashed border-ink-200 bg-ink-50/50 hover:border-brand-300 hover:bg-brand-50/40 transition-colors flex flex-col items-center justify-center text-ink-500 px-4">
                  <span className="icon-tile icon-tile-sm bg-white text-brand-600 shadow-card mb-2"><UploadIcon /></span>
                  <span className="text-body-sm font-semibold text-ink-700">Click to upload</span>
                  <span className="text-caption text-ink-500 mt-0.5">JPG, PNG or GIF (Max. 2MB)</span>
                </button>
              </div>
            </FormSection>
          </div>

          {/* Action bar — stays in reach while scrolling a long form */}
          <div className="sticky bottom-4 z-10 flex flex-col-reverse gap-3 rounded-2xl border border-ink-100 glass shadow-elevated px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-body-sm empty:hidden sm:empty:block" aria-live="polite">
              {errorCount > 0 && (
                <span className="inline-flex items-center gap-1.5 font-medium text-danger">
                  <AlertIcon /> {errorCount === 1 ? "1 field needs attention" : `${errorCount} fields need attention`}
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => router.push("/company/team")} className="btn btn-outline flex-1 sm:flex-none">Cancel</button>
              <button type="button" onClick={handleSend} disabled={saving || loading} className="btn btn-primary flex-1 sm:flex-none">
                {saving ? <><SpinnerIcon /> {isEdit ? "Saving…" : "Sending…"}</> : <>{isEdit ? "Save Changes" : "Send Invitation"} <ChevronRight /></>}
              </button>
            </div>
          </div>
        </div>

        {/* ── Right rail — guidance ── */}
        <aside className="grid gap-4 md:grid-cols-3 xl:grid-cols-1" aria-label="Guidance">
          <RailCard icon={<UserIcon />} title="About Team Members">
            <p className="text-caption text-ink-500 mb-3">Team members can help you manage your hiring process more efficiently.</p>
            <ul className="space-y-2.5">
              {["Collaborate on jobs and candidates", "Share notes and feedback", "Track progress and generate reports", "Secure role-based access"].map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-body-sm text-ink-700">
                  <span className="mt-0.5 grid place-items-center w-4 h-4 rounded-full bg-success/10 text-success shrink-0"><CheckIcon size={10} /></span> {t}
                </li>
              ))}
            </ul>
          </RailCard>

          <RailCard icon={<ShieldIcon />} title="Roles & Permissions">
            <p className="text-caption text-ink-500 mb-3">Choose a role based on responsibilities.</p>
            <ul className="divide-y divide-ink-100">
              {[
                { role: "Admin", desc: "Full access to all features and settings" },
                { role: "Manager", desc: "Manage jobs, candidates and clients" },
                { role: "Recruiter", desc: "Access to jobs and candidates" },
                { role: "Viewer", desc: "View access to assigned data only" },
              ].map((r) => (
                <li key={r.role} className={`flex items-start gap-3 py-2.5 first:pt-0 last:pb-0 rounded-lg ${form.role === r.role ? "text-brand-700" : ""}`}>
                  <span className={`w-7 h-7 rounded-lg grid place-items-center shrink-0 ${form.role === r.role ? "bg-brand-100 text-brand-700" : "bg-ink-100 text-ink-600"}`}><UserIcon small /></span>
                  <span className="min-w-0">
                    <span className="block text-body-sm font-semibold text-ink-900">{r.role}</span>
                    <span className="block text-caption text-ink-500">{r.desc}</span>
                  </span>
                </li>
              ))}
            </ul>
          </RailCard>

          <RailCard icon={<InfoIcon />} title="Important">
            <p className="text-body-sm text-ink-600 leading-relaxed">
              An invitation email will be sent to the team member with login instructions and a link to set their password.
            </p>
            <p className="text-body-sm text-ink-600 leading-relaxed mt-2">
              You can manage team members and their access anytime from <span className="text-ink-900 font-semibold">Team Settings</span>.
            </p>
          </RailCard>
        </aside>
      </div>
    </div>
  );
}

/* ── Form primitives ──────────────────────────────────────────────────── */
function FormSection({ title, subtitle, icon, children, footer, columns = "three" }: { title: React.ReactNode; subtitle?: string; icon?: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode; columns?: "two" | "three" }) {
  return (
    <section className="mt-8 pt-7 border-t border-ink-100 first:border-0 first:pt-0 first:mt-0">
      <SectionHeader title={title} subtitle={subtitle} icon={icon} className="mb-5" />
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4 ${columns === "three" ? "2xl:grid-cols-3" : ""}`}>{children}</div>
      {footer}
    </section>
  );
}
function Label({ htmlFor, children, required }: { htmlFor: string; children: React.ReactNode; required?: boolean }) {
  return <label htmlFor={htmlFor} className="field-label">{children} {required && <span className="text-danger" aria-hidden="true">*</span>}</label>;
}
function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return <p id={id} className="field-error flex items-center gap-1" role="alert"><AlertIcon size={12} /> {error}</p>;
}
function Field({ label, required, value, onChange, placeholder, error, maxLength, type = "text" }: { label: string; required?: boolean; value: string; onChange: (v: string) => void; placeholder?: string; error?: string; maxLength?: number; type?: "text" | "email" }) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className="min-w-0">
      <Label htmlFor={id} required={required}>{label}</Label>
      <input id={id} type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} maxLength={maxLength}
        aria-required={required || undefined} aria-invalid={error ? true : undefined} aria-describedby={error ? errorId : undefined}
        className={`field-input ${error ? "border-danger hover:border-danger" : ""}`} />
      <FieldError id={errorId} error={error} />
    </div>
  );
}
function SelectField({ label, required, value, onChange, placeholder, options, error, hint }: { label: string; required?: boolean; value: string; onChange: (v: string) => void; placeholder?: string; options: string[]; error?: string; hint?: string }) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className="min-w-0">
      <Label htmlFor={id} required={required}>{label}</Label>
      <div className="relative">
        <select id={id} value={value ?? ""} onChange={(e) => onChange(e.target.value)}
          aria-required={required || undefined} aria-invalid={error ? true : undefined} aria-describedby={describedBy}
          className={`field-input pr-9 appearance-none cursor-pointer ${value ? "text-ink-900" : "text-ink-400"} ${error ? "border-danger hover:border-danger" : ""}`}>
          <option value="">{placeholder}</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"><ChevronDown /></span>
      </div>
      <FieldError id={errorId} error={error} />
      {hint && <p id={hintId} className="field-hint">{hint}</p>}
    </div>
  );
}
function PhoneField({ label, cc, onCc, value, onValue, placeholder }: { label: string; cc: string; onCc: (v: string) => void; value: string; onValue: (v: string) => void; placeholder: string }) {
  const id = useId();
  return (
    // min-w-0 lets the composite control shrink inside its grid cell instead of
    // pushing the phone input past the card edge.
    <div className="min-w-0">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2 min-w-0">
        <div className="relative shrink-0">
          <select value={cc} onChange={(e) => onCc(e.target.value)} aria-label={`${label} country code`} className="field-input w-auto pl-3 pr-8 appearance-none cursor-pointer tabular">
            {COUNTRY_CODES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"><ChevronDown /></span>
        </div>
        <input id={id} type="tel" value={value ?? ""} onChange={(e) => onValue(e.target.value.replace(/\D/g, "").slice(0, 10))} inputMode="numeric" maxLength={10} placeholder={placeholder}
          className="field-input flex-1 min-w-0 tabular" />
      </div>
    </div>
  );
}
function Toggle({ on, onChange, label, describedBy }: { on: boolean; onChange: (v: boolean) => void; label: string; describedBy?: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} aria-describedby={describedBy} onClick={() => onChange(!on)}
      className="relative -my-2 inline-flex h-10 w-12 shrink-0 items-center justify-center rounded-full">
      <span aria-hidden="true" className={`relative block w-10 h-6 rounded-full transition-colors ${on ? "bg-(image:--gradient-brand)" : "bg-ink-300"}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-card transition-transform ${on ? "translate-x-4" : "translate-x-0"}`} />
      </span>
    </button>
  );
}
function RailCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <SectionHeader as="h3" title={title} icon={icon} className="mb-3 items-center" />
      {children}
    </div>
  );
}

/* ── Icons ────────────────────────────────────────────────────────────── */
function UserIcon({ small }: { small?: boolean }) { const s = small ? 13 : 16; return (<svg aria-hidden="true" width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="9" r="3.5" stroke="currentColor" strokeWidth="1.7" /><path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5" stroke="currentColor" strokeWidth="1.7" /></svg>); }
function KeyIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="8" cy="8" r="4" stroke="currentColor" strokeWidth="1.7" /><path d="M11 11l8 8m-3 0l2-2m-5-1l2-2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
function ShieldIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 3l8 4v6c0 4-3 7-8 8-5-1-8-4-8-8V7l8-4z" stroke="currentColor" strokeWidth="1.7" /><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
function DocIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M7 2h8l5 5v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.7" /><path d="M9 12h6M9 16h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>); }
function InfoIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" /><path d="M12 11v5M12 8h.01" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" /></svg>); }
function UploadIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M7 18a4 4 0 0 1-.5-7.97A6 6 0 0 1 18 9.5a3.5 3.5 0 0 1 .5 6.97" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /><path d="M12 12v6M9.5 14.5l2.5-2.5 2.5 2.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
function EyeIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" stroke="currentColor" strokeWidth="1.7" /><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" /></svg>); }
function EyeOffIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 3l18 18M10.6 5.1A10.8 10.8 0 0 1 12 5c6 0 10 7 10 7a17.6 17.6 0 0 1-3.2 3.9M6.6 6.6C3.8 8.5 2 12 2 12s4 7 10 7c1.7 0 3.2-.5 4.5-1.2M9.9 9.9a3 3 0 0 0 4.2 4.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>); }
function RefreshIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 12a9 9 0 1 1-2.64-6.36M21 4v5h-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
function CheckIcon({ size = 14 }: { size?: number }) { return (<svg aria-hidden="true" width={size} height={size} viewBox="0 0 16 16" fill="none" className="shrink-0"><path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
function AlertIcon({ size = 16 }: { size?: number }) { return (<svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" className="shrink-0"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.9" /><path d="M12 7.5v5.5M12 16.5h.01" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" /></svg>); }
function ChevronDown() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
function ChevronRight() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
function SpinnerIcon() { return (<svg aria-hidden="true" className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.25" /><path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>); }
