"use client";

import { useEffect, useId, useRef, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { TabBar } from "@/components/ui/TabBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/Skeleton";
import {
  getCompanyProfile,
  saveCompanyProfile,
  uploadCompanyLogo,
  type CompanyProfile,
} from "@/modules/auth/services/company.service";
import type { CompanyRegStep1Data } from "@/modules/auth/types/auth.types";
import { CompanyMatchingPanel } from "@/modules/company/matching/components/CompanyMatchingPanel";

/* Option lists mirror the company-registration Step 1 form. */
const INDUSTRIES = ["IT Services & Consulting", "Finance", "Healthcare", "Manufacturing", "Education", "Other"];
const COMPANY_SIZES = ["1-10 Employees", "11-50 Employees", "51-200 Employees", "201-500 Employees", "500+ Employees"];
const COMPANY_TYPES = ["Private Limited", "Public Limited", "LLP", "Partnership", "Proprietorship"];
const COUNTRIES = ["India", "United States", "United Kingdom", "Singapore", "UAE"];
const STATES = ["Maharashtra", "Karnataka", "Tamil Nadu", "Delhi", "Telangana"];

type Tab = "profile" | "matching" | "account" | "notifications";
const TABS: { key: Tab; label: string }[] = [
  { key: "profile", label: "Company Profile" },
  { key: "matching", label: "Matching" },
  { key: "account", label: "Account" },
  { key: "notifications", label: "Notifications" },
];

const EMPTY: CompanyProfile = {
  companyName: "", legalName: "", website: "", industry: "", companySize: "",
  foundedYear: "", companyType: "", gstNumber: "", panNumber: "", country: "",
  state: "", city: "", address: "", about: "", logoUrl: null, status: null,
};

export default function CompanySettingsPage() {
  const [tab, setTab] = useState<Tab>("profile");
  const [form, setForm] = useState<CompanyProfile>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const loadedRef = useRef(false);
  const aboutId = useId();
  const logoHintId = useId();

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    getCompanyProfile()
      .then((profile) => { if (profile) setForm(profile); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = <K extends keyof CompanyProfile>(key: K, value: CompanyProfile[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  function pickLogo(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/svg+xml"];
    if (!allowed.includes(file.type) || file.size > 2 * 1024 * 1024) {
      setError("Logo must be JPG, PNG or SVG and under 2 MB.");
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
    uploadCompanyLogo(file).catch(() => {});
  }

  async function handleSave() {
    if (saving) return;
    if (!form.companyName.trim()) { setError("Company name is required."); return; }
    setSaving(true);
    setError(null);
    // saveCompanyProfile expects the registration Step 1 shape.
    const payload: CompanyRegStep1Data = { ...form, agree: true };
    try {
      await saveCompanyProfile(payload);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  // Simple completion signal for the Profile tab.
  const requiredFields = [form.companyName, form.industry, form.companySize, form.country, form.city, form.about];
  const completion = Math.round((requiredFields.filter((v) => v.trim()).length / requiredFields.length) * 100);
  const logoSrc = logoPreview ?? form.logoUrl;

  return (
    <div className="max-w-[1100px]">
      <PageHeader title="Settings" subtitle="Manage your company profile, account, and preferences." />

      <div className="space-y-6">
        <TabBar ariaLabel="Settings sections" items={TABS} value={tab} onChange={setTab} />

        {tab === "profile" && (
          loading ? (
            <LoadingState label="Loading profile…" rows={3} />
          ) : (
            <div className="space-y-6">
              {/* Completion signal */}
              <section className="card p-5 flex items-center gap-4" aria-label="Profile completion">
                <span className={`icon-tile ${completion === 100 ? "bg-success/10 text-success" : "bg-brand-50 text-brand-600"}`}>
                  {completion === 100 ? <CheckIcon /> : <GaugeIcon />}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-3 mb-2">
                    <span id="settings-completion-label" className="text-body-sm font-semibold text-ink-800">Profile completion</span>
                    <span className="font-display text-title-sm font-extrabold text-ink-900 tabular">{completion}%</span>
                  </div>
                  <div
                    role="progressbar"
                    aria-labelledby="settings-completion-label"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={completion}
                    className="h-2 rounded-full bg-ink-100 overflow-hidden"
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${completion === 100 ? "bg-success" : "bg-(image:--gradient-brand)"}`}
                      style={{ width: `${completion}%` }}
                    />
                  </div>
                </div>
              </section>

              {/* Logo + identity */}
              <section className="card-elevated p-5 sm:p-7">
                <SectionHeader title="Company Identity" icon={<BuildingIcon />} className="mb-5" />
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-6 surface-muted p-4">
                  <span className="w-16 h-16 rounded-2xl bg-white border border-ink-100 shadow-card overflow-hidden grid place-items-center text-brand-600 font-display font-extrabold text-title shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {logoSrc ? <img src={logoSrc} alt="Company logo" className="w-full h-full object-cover" /> : (form.companyName.charAt(0) || "C").toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <button type="button" onClick={() => fileRef.current?.click()} aria-describedby={logoHintId} className="btn btn-outline btn-sm">
                      <UploadIcon /> {logoSrc ? "Change Logo" : "Upload Logo"}
                    </button>
                    <p id={logoHintId} className="field-hint">JPG, PNG or SVG · max 2 MB</p>
                    <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.svg" className="hidden" onChange={pickLogo} tabIndex={-1} aria-hidden="true" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                  <Field label="Company Name" required value={form.companyName} onChange={(v) => set("companyName", v)} />
                  <Field label="Legal Name" value={form.legalName} onChange={(v) => set("legalName", v)} />
                  <Field label="Website" value={form.website} onChange={(v) => set("website", v)} placeholder="https://" />
                  <Field label="Founded Year" value={form.foundedYear} onChange={(v) => set("foundedYear", v)} placeholder="2020" />
                  <SelectField label="Industry" required value={form.industry} onChange={(v) => set("industry", v)} options={INDUSTRIES} />
                  <SelectField label="Company Size" required value={form.companySize} onChange={(v) => set("companySize", v)} options={COMPANY_SIZES} />
                  <SelectField label="Company Type" value={form.companyType} onChange={(v) => set("companyType", v)} options={COMPANY_TYPES} />
                </div>
              </section>

              {/* Location + registration */}
              <section className="card-elevated p-5 sm:p-7">
                <SectionHeader title="Location & Registration" icon={<PinIcon />} className="mb-5" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                  <SelectField label="Country" required value={form.country} onChange={(v) => set("country", v)} options={COUNTRIES} />
                  <SelectField label="State" value={form.state} onChange={(v) => set("state", v)} options={STATES} />
                  <Field label="City" required value={form.city} onChange={(v) => set("city", v)} />
                  <Field label="GST Number" value={form.gstNumber} onChange={(v) => set("gstNumber", v)} />
                  <Field label="PAN Number" value={form.panNumber} onChange={(v) => set("panNumber", v)} />
                  <div className="md:col-span-2">
                    <Field label="Address" value={form.address} onChange={(v) => set("address", v)} />
                  </div>
                </div>
              </section>

              {/* About */}
              <section className="card-elevated p-5 sm:p-7">
                <label htmlFor={aboutId} className="field-label">
                  About the Company <span className="text-danger" aria-hidden="true">*</span>
                </label>
                <textarea
                  id={aboutId}
                  value={form.about}
                  onChange={(e) => set("about", e.target.value)}
                  rows={4}
                  aria-required="true"
                  placeholder="Tell candidates about your company, culture, and mission…"
                  className="field-input resize-y"
                />
              </section>

              {error && (
                <div role="alert" className="alert alert-danger">
                  <AlertIcon /> <span>{error}</span>
                </div>
              )}

              <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-end gap-3 rounded-2xl border border-ink-100 glass shadow-elevated px-4 py-3">
                {saved && (
                  <span role="status" className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-success">
                    <CheckIcon size={14} /> Saved
                  </span>
                )}
                <button type="button" onClick={handleSave} disabled={saving} className="btn btn-primary">
                  {saving ? <><SpinnerIcon /> Saving…</> : "Save Changes"}
                </button>
              </div>
            </div>
          )
        )}

        {tab === "matching" && <CompanyMatchingPanel />}

        {tab === "account" && (
          <PlaceholderTab
            icon={<UserIcon />}
            title="Account Settings"
            body="Manage your login email, password, and admin details. Password changes are available from the login screen for now; full account management is coming soon."
          />
        )}
        {tab === "notifications" && (
          <PlaceholderTab
            icon={<BellIcon />}
            title="Notification Preferences"
            body="Choose which email and in-app alerts you receive for new applications, interviews, and team activity. This is coming soon."
          />
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, required, placeholder }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; placeholder?: string }) {
  const id = useId();
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="field-label">{label} {required && <span className="text-danger" aria-hidden="true">*</span>}</label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-required={required || undefined}
        className="field-input"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options, required }: { label: string; value: string; onChange: (v: string) => void; options: string[]; required?: boolean }) {
  const id = useId();
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="field-label">{label} {required && <span className="text-danger" aria-hidden="true">*</span>}</label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-required={required || undefined}
          className={`field-input pr-9 appearance-none cursor-pointer ${value ? "text-ink-900" : "text-ink-400"}`}
        >
          <option value="">Select…</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"><ChevronDown /></span>
      </div>
    </div>
  );
}

function PlaceholderTab({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return <EmptyState icon={icon} title={title} description={body} />;
}

/* ── Icons ────────────────────────────────────────────────────────────── */
function BuildingIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="16" height="18" rx="1.5" stroke="currentColor" strokeWidth="1.7" /><path d="M9 8h2M13 8h2M9 12h2M13 12h2M9 16h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>); }
function PinIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z" stroke="currentColor" strokeWidth="1.7" /><circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.7" /></svg>); }
function GaugeIcon() { return (<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 16a8 8 0 1 1 16 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /><path d="M12 16l3.5-4.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" /><circle cx="12" cy="16" r="1.4" fill="currentColor" /></svg>); }
function UploadIcon() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 16V4M7 9l5-5 5 5M4 20h16" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
function UserIcon() { return (<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="9" r="3.5" stroke="currentColor" strokeWidth="1.7" /><path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5" stroke="currentColor" strokeWidth="1.7" /></svg>); }
function BellIcon() { return (<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><path d="M10 20.5a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>); }
function CheckIcon({ size = 18 }: { size?: number }) { return (<svg aria-hidden="true" width={size} height={size} viewBox="0 0 16 16" fill="none" className="shrink-0"><path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
function AlertIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" /><path d="M12 7.5v5.5M12 16.5h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>); }
function ChevronDown() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
function SpinnerIcon() { return (<svg aria-hidden="true" className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.25" /><path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>); }
