"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, Breadcrumbs } from "@/components/ui/PageHeader";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LoadingState } from "@/components/ui/Skeleton";
import {
  createClient,
  getClient,
  updateClient,
  type ClientResponse,
} from "./services/client.service";

/* ── Option lists ─────────────────────────────────────────────────────── */
const INDUSTRIES = ["Information Technology", "Finance & Banking", "Healthcare", "Manufacturing", "Retail & E-commerce", "Education", "Consulting", "Other"];
const COMPANY_SIZES = ["1–10", "11–50", "51–200", "201–500", "501–1000", "1000+"];
const COMPANY_TYPES = ["Private Limited", "Public Limited", "Partnership", "Proprietorship", "LLP", "Other"];
const REVENUES = ["< $1M", "$1M – $10M", "$10M – $50M", "$50M – $100M", "$100M+"];
const COUNTRIES = ["India", "United States", "United Kingdom", "Singapore", "United Arab Emirates", "Australia"];
const TIMEZONES = ["(GMT +05:30) Asia/Kolkata", "(GMT +00:00) UTC", "(GMT -05:00) New York", "(GMT +01:00) London"];
const DEPARTMENTS = ["Human Resources", "Engineering", "Finance", "Operations", "Sales", "Marketing", "Other"];
const COUNTRY_CODES = ["+91", "+1", "+44", "+65", "+971"];

interface ClientForm {
  clientName: string; website: string; industry: string;
  companySize: string; companyType: string; annualRevenue: string;
  headquarters: string; country: string; timeZone: string;
  contactName: string; email: string; countryCode: string; phone: string;
  designation: string; department: string; linkedin: string;
  sameAsBilling: boolean;
  billingEmail: string; billingCountryCode: string; billingPhone: string; billingAddress: string;
  city: string; state: string; postalCode: string;
  accountManager: string;
}

const EMPTY: ClientForm = {
  clientName: "", website: "", industry: "",
  companySize: "", companyType: "", annualRevenue: "",
  headquarters: "", country: "", timeZone: "",
  contactName: "", email: "", countryCode: "+91", phone: "",
  designation: "", department: "", linkedin: "",
  sameAsBilling: false,
  billingEmail: "", billingCountryCode: "+91", billingPhone: "", billingAddress: "",
  city: "", state: "", postalCode: "",
  accountManager: "",
};

/** Map a fetched client (edit mode) onto the form shape. */
function toForm(c: ClientResponse): ClientForm {
  return {
    clientName: c.clientName ?? "",
    website: c.website ?? "",
    industry: c.industry ?? "",
    companySize: c.companySize ?? "",
    companyType: c.companyType ?? "",
    annualRevenue: c.annualRevenue ?? "",
    headquarters: c.headquarters ?? "",
    country: c.country ?? "",
    timeZone: c.timeZone ?? "",
    contactName: c.contactName ?? "",
    email: c.email ?? "",
    countryCode: c.countryCode ?? "+91",
    phone: c.phone ?? "",
    designation: c.designation ?? "",
    department: c.department ?? "",
    linkedin: c.linkedin ?? "",
    sameAsBilling: false,
    billingEmail: c.billingEmail ?? "",
    billingCountryCode: c.billingCountryCode ?? "+91",
    billingPhone: c.billingPhone ?? "",
    billingAddress: c.billingAddress ?? "",
    city: c.city ?? "",
    state: c.state ?? "",
    postalCode: c.postalCode ?? "",
    accountManager: c.accountManager ?? "",
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* Shared create/edit form. With a `clientId` it loads the client, prefills the
 * form, and saves via PUT; without one it creates a new client via POST. */
export default function AddClientPage({ clientId }: { clientId?: string } = {}) {
  const isEdit = Boolean(clientId);
  const router = useRouter();
  const [form, setForm] = useState<ClientForm>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof ClientForm, string>>>({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(isEdit);

  // Edit mode — fetch the client once and prefill the form (StrictMode guard).
  const fetched = useRef(false);
  useEffect(() => {
    if (!clientId || fetched.current) return;
    fetched.current = true;
    getClient(clientId)
      .then((client) => setForm(toForm(client)))
      .catch((err) => setSubmitError(err instanceof Error ? err.message : "Failed to load client"))
      .finally(() => setLoading(false));
  }, [clientId]);

  const set = <K extends keyof ClientForm>(key: K, value: ClientForm[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // Mirror primary contact into billing when the box is ticked.
      if (next.sameAsBilling) {
        if (key === "email") next.billingEmail = value as string;
        if (key === "phone") next.billingPhone = value as string;
        if (key === "countryCode") next.billingCountryCode = value as string;
        if (key === "sameAsBilling" && value) {
          next.billingEmail = prev.email;
          next.billingPhone = prev.phone;
          next.billingCountryCode = prev.countryCode;
        }
      }
      return next;
    });
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  function validate(): boolean {
    const errs: Partial<Record<keyof ClientForm, string>> = {};
    if (!form.clientName.trim()) errs.clientName = "Client name is required";
    if (!form.industry) errs.industry = "Industry is required";
    if (!form.headquarters.trim()) errs.headquarters = "Headquarters / location is required";
    if (!form.country) errs.country = "Country is required";
    if (!form.contactName.trim()) errs.contactName = "Primary contact name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!EMAIL_RE.test(form.email)) errs.email = "Enter a valid email address";
    if (!form.phone.trim()) errs.phone = "Phone number is required";
    if (!form.billingEmail.trim()) errs.billingEmail = "Billing email is required";
    else if (!EMAIL_RE.test(form.billingEmail)) errs.billingEmail = "Enter a valid email address";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    setSubmitError(null);
    try {
      const payload = {
        clientName: form.clientName.trim(),
        website: form.website.trim() || undefined,
        industry: form.industry,
        companySize: form.companySize || undefined,
        companyType: form.companyType || undefined,
        annualRevenue: form.annualRevenue || undefined,
        headquarters: form.headquarters.trim(),
        country: form.country,
        timeZone: form.timeZone || undefined,
        contactName: form.contactName.trim(),
        email: form.email.trim(),
        countryCode: form.countryCode || undefined,
        phone: form.phone.trim(),
        designation: form.designation.trim() || undefined,
        department: form.department || undefined,
        linkedin: form.linkedin.trim() || undefined,
        billingEmail: form.billingEmail.trim(),
        billingCountryCode: form.billingCountryCode || undefined,
        billingPhone: form.billingPhone.trim() || undefined,
        billingAddress: form.billingAddress.trim() || undefined,
        city: form.city.trim() || undefined,
        state: form.state.trim() || undefined,
        postalCode: form.postalCode.trim() || undefined,
        accountManager: form.accountManager.trim() || undefined,
      };
      if (isEdit && clientId) {
        await updateClient(clientId, payload);
      } else {
        await createClient(payload);
      }
      setSaved(true);
      setTimeout(() => router.push("/company/clients"), 1200);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to save client");
    } finally {
      setSaving(false);
    }
  }

  const title = isEdit ? "Edit Client" : "Add New Client";
  const header = (
    <PageHeader
      eyebrow={<Breadcrumbs items={[{ label: "Clients", href: "/company/clients" }, { label: title }]} />}
      title={title}
      subtitle={
        isEdit
          ? "Update this client organization's details."
          : "Add client organization details to start managing your relationship and jobs."
      }
    />
  );

  if (loading) {
    return (
      <div>
        {header}
        <LoadingState label="Loading client…" rows={3} />
      </div>
    );
  }

  const errorCount = Object.values(errors).filter(Boolean).length;

  return (
    <div>
      {header}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] items-start">
        {/* ── Main form ── */}
        <div className="min-w-0 space-y-6">
          {saved && (
            <div role="status" className="alert alert-success font-semibold">
              <CheckIcon /> {isEdit ? "Client updated successfully." : "Client saved successfully."}
            </div>
          )}
          {submitError && (
            <div role="alert" className="alert alert-danger font-semibold">
              <AlertIcon /> <span>{submitError}</span>
            </div>
          )}

          <div className="card-elevated p-5 sm:p-7">
            {/* Company Information */}
            <FormSection title="Company Information" subtitle="Who the client is and where they operate." icon={<BuildingIcon />}>
              <Field label="Client Name" required value={form.clientName} onChange={(v) => set("clientName", v)} placeholder="Enter client / company name" error={errors.clientName} maxLength={200} />
              <Field label="Website" value={form.website} onChange={(v) => set("website", v)} placeholder="www.company.com" maxLength={300} />
              <SelectField label="Industry" required value={form.industry} onChange={(v) => set("industry", v)} placeholder="Select industry" options={INDUSTRIES} error={errors.industry} />
              <SelectField label="Company Size" value={form.companySize} onChange={(v) => set("companySize", v)} placeholder="Select company size" options={COMPANY_SIZES} />
              <SelectField label="Company Type" value={form.companyType} onChange={(v) => set("companyType", v)} placeholder="Select company type" options={COMPANY_TYPES} />
              <SelectField label="Annual Revenue" value={form.annualRevenue} onChange={(v) => set("annualRevenue", v)} placeholder="Select revenue range" options={REVENUES} />
              <Field label="Headquarters / Location" required value={form.headquarters} onChange={(v) => set("headquarters", v)} placeholder="Enter headquarters location" error={errors.headquarters} maxLength={200} />
              <SelectField label="Country" required value={form.country} onChange={(v) => set("country", v)} placeholder="Select country" options={COUNTRIES} error={errors.country} />
              <SelectField label="Time Zone" value={form.timeZone} onChange={(v) => set("timeZone", v)} placeholder="Select time zone" options={TIMEZONES} />
            </FormSection>

            {/* Primary Contact Information */}
            <FormSection
              title="Primary Contact Information"
              subtitle="The person you work with day to day."
              icon={<UserIcon />}
              footer={
                <label className="mt-5 inline-flex min-h-10 items-center gap-3 cursor-pointer rounded-xl pr-2">
                  <input type="checkbox" checked={form.sameAsBilling} onChange={(e) => set("sameAsBilling", e.target.checked)} className="w-4 h-4 rounded accent-brand-600" />
                  <span className="text-body-sm text-ink-700">This is also the billing contact</span>
                </label>
              }
            >
              <Field label="Primary Contact Name" required value={form.contactName} onChange={(v) => set("contactName", v)} placeholder="Enter full name" error={errors.contactName} maxLength={150} />
              <Field label="Email Address" type="email" required value={form.email} onChange={(v) => set("email", v)} placeholder="Enter email address" error={errors.email} maxLength={150} />
              <PhoneField label="Phone Number" required cc={form.countryCode} onCc={(v) => set("countryCode", v)} value={form.phone} onValue={(v) => set("phone", v)} placeholder="Enter phone number" error={errors.phone} />
              <Field label="Designation" value={form.designation} onChange={(v) => set("designation", v)} placeholder="Enter designation" maxLength={100} />
              <SelectField label="Department" value={form.department} onChange={(v) => set("department", v)} placeholder="Select department" options={DEPARTMENTS} />
              <Field label="LinkedIn Profile (Optional)" value={form.linkedin} onChange={(v) => set("linkedin", v)} placeholder="https://linkedin.com/in/username" maxLength={300} />
            </FormSection>

            {/* Billing Information */}
            <FormSection title="Billing Information" subtitle="Where invoices and billing notices go." icon={<CardIcon />}>
              <Field label="Billing Email" type="email" required value={form.billingEmail} onChange={(v) => set("billingEmail", v)} placeholder="Enter billing email" error={errors.billingEmail} maxLength={150} />
              <PhoneField label="Billing Phone" cc={form.billingCountryCode} onCc={(v) => set("billingCountryCode", v)} value={form.billingPhone} onValue={(v) => set("billingPhone", v)} placeholder="Enter billing phone number" />
              <Field label="Billing Address" value={form.billingAddress} onChange={(v) => set("billingAddress", v)} placeholder="Enter billing address" maxLength={300} />
              <Field label="City" value={form.city} onChange={(v) => set("city", v)} placeholder="Enter city" maxLength={100} />
              <Field label="State / Province" value={form.state} onChange={(v) => set("state", v)} placeholder="Enter state / province" maxLength={100} />
              <Field label="Postal / ZIP Code" value={form.postalCode} onChange={(v) => set("postalCode", v)} placeholder="Enter postal / zip code" maxLength={20} />
            </FormSection>

            {/* Account Management */}
            <FormSection title="Account Management" icon={<UserIcon />}>
              <Field
                label="Account Manager"
                value={form.accountManager}
                onChange={(v) => set("accountManager", v)}
                placeholder="Assign an account manager"
                maxLength={150}
                hint="The recruiter who owns this client relationship. Leave blank to keep it unassigned."
              />
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
              <button type="button" onClick={() => router.push("/company/clients")} className="btn btn-outline flex-1 sm:flex-none">
                Cancel
              </button>
              <button type="button" onClick={handleSave} disabled={saving} className="btn btn-primary flex-1 sm:flex-none">
                {saving ? <><SpinnerIcon /> Saving…</> : <>{isEdit ? "Update Client" : "Save Client"} <ChevronRight /></>}
              </button>
            </div>
          </div>
        </div>

        {/* ── Right rail — guidance ── */}
        <aside className="grid gap-4 md:grid-cols-3 xl:grid-cols-1" aria-label="Guidance">
          <RailCard icon={<BuildingIcon />} title="Why Add a Client?">
            <p className="text-caption text-ink-500 mb-3">Adding clients helps you:</p>
            <ul className="space-y-2.5">
              {["Manage client relationships efficiently", "Track jobs and hiring progress", "Organize contacts and communications", "Generate client-specific reports"].map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-body-sm text-ink-700">
                  <span className="mt-0.5 grid place-items-center w-4 h-4 rounded-full bg-success/10 text-success shrink-0"><CheckIcon size={10} /></span> {t}
                </li>
              ))}
            </ul>
          </RailCard>

          <RailCard icon={<InfoIcon />} title="Information Guide">
            <p className="text-body-sm text-ink-600 leading-relaxed">
              Please provide accurate information. Fields marked with <span className="text-danger font-semibold">*</span> are mandatory.
              You can add contacts and jobs after creating the client.
            </p>
          </RailCard>

          <RailCard icon={<RocketIcon />} title="What's Next?">
            <ol className="relative space-y-3">
              <span aria-hidden="true" className="absolute left-2.5 top-3 bottom-3 w-px bg-ink-200" />
              {["Add client information", "Add key contacts (optional)", "Create job openings", "Start hiring!"].map((t, i) => (
                <li key={t} className="relative flex items-center gap-3 text-body-sm text-ink-700">
                  <span className={`w-5 h-5 rounded-full text-nano font-bold grid place-items-center shrink-0 tabular ${i === 0 ? "bg-brand-600 text-white" : "bg-white border border-ink-200 text-ink-600"}`}>{i + 1}</span>
                  {t}
                </li>
              ))}
            </ol>
          </RailCard>
        </aside>
      </div>
    </div>
  );
}

/* ── Form primitives ──────────────────────────────────────────────────── */
function FormSection({ title, subtitle, icon, children, footer }: { title: string; subtitle?: string; icon?: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <section className="mt-8 pt-7 border-t border-ink-100 first:border-0 first:pt-0 first:mt-0">
      <SectionHeader title={title} subtitle={subtitle} icon={icon} className="mb-5" />
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-x-5 gap-y-4">{children}</div>
      {footer}
    </section>
  );
}

function Label({ htmlFor, children, required }: { htmlFor: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="field-label">
      {children} {required && <span className="text-danger" aria-hidden="true">*</span>}
    </label>
  );
}

function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={id} className="field-error flex items-center gap-1" role="alert">
      <AlertIcon size={12} /> {error}
    </p>
  );
}

function Field({ label, required, value, onChange, placeholder, error, maxLength, hint, type = "text" }: {
  label: string; required?: boolean; value: string; onChange: (v: string) => void;
  placeholder?: string; error?: string; maxLength?: number; hint?: string; type?: "text" | "email";
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className="min-w-0">
      <Label htmlFor={id} required={required}>{label}</Label>
      <input
        id={id}
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`field-input ${error ? "border-danger hover:border-danger" : ""}`}
      />
      <FieldError id={errorId} error={error} />
      {hint && <p id={hintId} className="field-hint">{hint}</p>}
    </div>
  );
}

function SelectField({ label, required, value, onChange, placeholder, options, error }: {
  label: string; required?: boolean; value: string; onChange: (v: string) => void;
  placeholder?: string; options: string[]; error?: string;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className="min-w-0">
      <Label htmlFor={id} required={required}>{label}</Label>
      <div className="relative">
        <select
          id={id}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`field-input pr-9 appearance-none cursor-pointer ${value ? "text-ink-900" : "text-ink-400"} ${error ? "border-danger hover:border-danger" : ""}`}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"><ChevronDown /></span>
      </div>
      <FieldError id={errorId} error={error} />
    </div>
  );
}

function PhoneField({ label, required, cc, onCc, value, onValue, placeholder, error }: {
  label: string; required?: boolean; cc: string; onCc: (v: string) => void;
  value: string; onValue: (v: string) => void; placeholder: string; error?: string;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    // min-w-0 lets this composite control shrink within its grid cell instead of
    // overflowing into the neighbouring field (Billing Address).
    <div className="min-w-0">
      <Label htmlFor={id} required={required}>{label}</Label>
      <div className="flex gap-2 min-w-0">
        <div className="relative shrink-0">
          <select value={cc} onChange={(e) => onCc(e.target.value)} aria-label={`${label} country code`}
            className="field-input w-auto pl-3 pr-8 appearance-none cursor-pointer tabular">
            {COUNTRY_CODES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"><ChevronDown /></span>
        </div>
        <input
          id={id}
          type="tel"
          value={value ?? ""}
          onChange={(e) => onValue(e.target.value.replace(/\D/g, "").slice(0, 10))}
          inputMode="numeric"
          maxLength={10}
          placeholder={placeholder}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`field-input flex-1 min-w-0 tabular ${error ? "border-danger hover:border-danger" : ""}`}
        />
      </div>
      <FieldError id={errorId} error={error} />
    </div>
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
function BuildingIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="16" height="18" rx="1.5" stroke="currentColor" strokeWidth="1.7" /><path d="M9 8h2M13 8h2M9 12h2M13 12h2M9 16h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>); }
function UserIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="9" r="3.5" stroke="currentColor" strokeWidth="1.7" /><path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5" stroke="currentColor" strokeWidth="1.7" /></svg>); }
function CardIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" /><path d="M3 10h18" stroke="currentColor" strokeWidth="1.7" /></svg>); }
function InfoIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" /><path d="M12 11v5M12 8h.01" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" /></svg>); }
function RocketIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 15c-1 2-1 5-1 5s3 0 5-1m-4-4a8 8 0 0 1 11-11c2 0 3 1 3 3a8 8 0 0 1-11 11l-3 1 1-3z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><circle cx="14.5" cy="9.5" r="1.5" stroke="currentColor" strokeWidth="1.7" /></svg>); }
function CheckIcon({ size = 14 }: { size?: number }) { return (<svg aria-hidden="true" width={size} height={size} viewBox="0 0 16 16" fill="none" className="shrink-0"><path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
function AlertIcon({ size = 16 }: { size?: number }) { return (<svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" className="shrink-0"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.9" /><path d="M12 7.5v5.5M12 16.5h.01" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" /></svg>); }
function ChevronDown() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
function ChevronRight() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
function SpinnerIcon() { return (<svg aria-hidden="true" className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.25" /><path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>); }
