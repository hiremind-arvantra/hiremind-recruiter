"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import type { CompanyData } from "../shared/types";
import Illustration from "../shared/Illustration";
import { COUNTRIES, INDUSTRIES, statesFor } from "../shared/options";
import { Select, SelectOrText } from "../shared/SelectOrText";
import HorizontalStepper from "../shared/HorizontalStepper";
import { FieldError, errorInput } from "@/modules/auth/components/candidate-reg/shared/ui";

interface Props {
  data: CompanyData;
  onChange: (d: CompanyData) => void;
  onContinue: () => void;
}

type FieldErrors = Partial<Record<keyof CompanyData, string>>;

const LOGO_ACCEPT = ".jpg,.jpeg,.png,.svg";
const LOGO_MAX_BYTES = 2 * 1024 * 1024;

export default function Step1CompanyDetails({ data, onChange, onContinue }: Props) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!data.logoFile) { setLogoPreview(null); return; }
    if (data.logoFile.type === "image/svg+xml") { setLogoPreview(null); return; }
    const reader = new FileReader();
    reader.onload = (e) => setLogoPreview(e.target?.result as string);
    reader.readAsDataURL(data.logoFile);
  }, [data.logoFile]);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/svg+xml"];
    if (!allowed.includes(file.type)) {
      setLogoError("Only JPG, PNG or SVG files are allowed.");
      return;
    }
    if (file.size > LOGO_MAX_BYTES) {
      setLogoError("Logo must be under 2 MB.");
      return;
    }
    setLogoError(null);
    onChange({ ...data, logoFile: file });
    e.target.value = "";
  }

  function removeLogo() {
    onChange({ ...data, logoFile: null });
    setLogoPreview(null);
    setLogoError(null);
  }

  const set = <K extends keyof CompanyData>(k: K, v: CompanyData[K]) => {
    onChange({ ...data, [k]: v });
    if (errors[k]) setErrors((prev) => ({ ...prev, [k]: undefined }));
  };

  function validate(): boolean {
    const errs: FieldErrors = {};
    if (!data.companyName?.trim()) errs.companyName = "Required";
    if (!data.legalName?.trim())   errs.legalName   = "Required";
    if (!data.industry)            errs.industry     = "Required";
    if (!data.companySize)         errs.companySize  = "Required";
    if (!data.companyType)         errs.companyType  = "Required";
    if (!data.country)             errs.country      = "Required";
    if (!data.state)               errs.state        = "Required";
    if (!data.city?.trim())        errs.city         = "Required";
    if (!data.address?.trim())     errs.address      = "Required";
    if (data.gstNumber?.trim() && !/^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/.test(data.gstNumber.trim())) {
      errs.gstNumber = "Invalid GST format (e.g. 22AAAAA0000A1Z5)";
    }
    if (data.panNumber?.trim() && !/^[A-Z]{5}\d{4}[A-Z]$/.test(data.panNumber.trim())) {
      errs.panNumber = "Invalid PAN format (e.g. ABCDE1234F)";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleContinue() {
    if (validate()) onContinue();
  }

  return (
    // Same .site-container column as AuthHeader, so the logo sits directly above the
    // sidebar heading and the form card ends under the Login button.
    <div className="site-container flex-1 grid lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)] gap-8 xl:gap-10 items-start pt-6 sm:pt-8 lg:pt-10 pb-16">
      {/* ─────────────── LEFT SIDEBAR ─────────────── */}
      <aside className="hidden lg:block sticky top-[calc(var(--header-h)+40px)] max-h-[calc(100vh-var(--header-h)-56px)] overflow-y-auto pb-2 space-y-6">
        <div>
          <h2 className="font-display text-heading-lg xl:text-display-sm leading-tight font-extrabold tracking-tight text-ink-900">
            Let&apos;s build the<br />future of hiring,<br />
            <span className="gradient-text">together.</span>
          </h2>
          <p className="mt-3 text-ink-500 text-body-sm leading-relaxed">
            Create your company account and find the right talent, faster with{" "}
            <span className="text-ink-800 font-semibold">HireMind</span>.
          </p>
        </div>

        <Illustration
          src="/images/company-recruiter.jpg"
          alt="A recruiter reviewing AI-matched candidates"
        />

        <ul className="card p-2">
          <BadgeItem icon="shield" title="Trusted Platform" body="Secure sign-up with verified company profiles." />
          <BadgeItem icon="users"  title="Better Matches"    body="AI-powered matching helps you connect with the best talent faster." />
          <BadgeItem icon="chart"  title="Data-Driven Hiring" body="Powerful analytics to streamline your hiring and improve outcomes." />
          <BadgeItem icon="head"   title="Dedicated Support" body="We're here to help you at every step of your hiring journey." />
        </ul>

        <div>
          <div className="text-micro text-ink-500 text-center mb-3">Trusted by leading recruitment teams</div>
          <div className="flex items-center justify-around flex-wrap gap-2 text-nano leading-tight text-center">
            <span className="font-bold text-ink-700">NEXUS<br /><span className="font-normal text-ink-500">RECRUITMENT</span></span>
            <span className="font-bold text-ink-700">PEOPLE<br /><span className="font-normal text-ink-500">FIRST</span></span>
            <span className="font-bold text-ink-700">HIRE<br /><span className="font-normal text-ink-500">SOLUTIONS</span></span>
            <span className="font-bold text-ink-700">CAREER<br /><span className="font-normal text-ink-500">CONNECT</span></span>
            <span className="badge badge-neutral">+2K more</span>
          </div>
        </div>
      </aside>

      {/* ─────────────── RIGHT FORM ─────────────── */}
      <main id="main" tabIndex={-1} className="min-w-0 space-y-6">
        <div className="card-elevated p-5 sm:p-7 lg:p-8">
          {/* Header row + stepper */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-ink-200/70">
            <div className="flex items-start gap-4 min-w-0">
              <span className="icon-tile w-12 h-12 rounded-2xl bg-cobalt-50 text-cobalt-600 ring-1 ring-cobalt-100">
                <BuildingIcon />
              </span>
              <div className="min-w-0">
                <h1 className="page-title">Create your company account</h1>
                <p className="page-subtitle mt-1">Fill in the details below to get started.</p>
              </div>
            </div>
            <HorizontalStepper current={1} />
          </div>

          {/* Company Information */}
          <Section title="Company Information" first>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-5">
              <Field label="Company / Agency Name" required icon={<BuildingIcon size={14} />}
                value={data.companyName} onChange={(v) => set("companyName", v)}
                placeholder="Enter company or agency name" error={errors.companyName} maxLength={200} />
              <Field label="Legal Business Name" required icon={<DocIcon />}
                value={data.legalName} onChange={(v) => set("legalName", v)}
                placeholder="Enter legal business name" error={errors.legalName} maxLength={200} />
              <Field label="Website (Optional)" icon={<GlobeIcon />}
                value={data.website} onChange={(v) => set("website", v)} placeholder="https://www.yourcompany.com" maxLength={300} />

              <SelectOrText label="Industry / Specialization" required icon={<BriefcaseIcon />}
                value={data.industry} onChange={(v) => set("industry", v)} placeholder="Select primary industry"
                options={INDUSTRIES} textPlaceholder="Type your industry"
                error={errors.industry} />
              <Select label="Company Size" required icon={<UsersIcon />}
                value={data.companySize} onChange={(v) => set("companySize", v)} placeholder="Select company size"
                options={["1-10 Employees", "11-50 Employees", "51-200 Employees", "201-500 Employees", "500+ Employees"]}
                error={errors.companySize} />
              <Field label="Founded Year (Optional)" icon={<CalendarIcon />}
                value={data.foundedYear}
                onChange={(v) => set("foundedYear", v.replace(/\D/g, "").slice(0, 4))}
                placeholder="e.g. 2010" maxLength={4} />

              <Select label="Company Type" required icon={<TagIcon />}
                value={data.companyType} onChange={(v) => set("companyType", v)} placeholder="Select company type"
                options={["Private Limited", "Public Limited", "LLP", "Partnership", "Proprietorship"]}
                error={errors.companyType} />
              <Field label="GST Number (Optional)" icon={<DocIcon />}
                value={data.gstNumber}
                onChange={(v) => set("gstNumber", v.toUpperCase().slice(0, 15))}
                placeholder="e.g. 22AAAAA0000A1Z5"
                maxLength={15} error={errors.gstNumber} />
              <Field label="PAN Number (Optional)" icon={<DocIcon />}
                value={data.panNumber}
                onChange={(v) => set("panNumber", v.toUpperCase().slice(0, 10))}
                placeholder="e.g. ABCDE1234F"
                maxLength={10} error={errors.panNumber} />
            </div>
          </Section>

          {/* Office Address */}
          <Section title="Office Address">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-5">
              <SelectOrText label="Country" required icon={<PinIcon />}
                value={data.country} placeholder="Select country"
                onChange={(v) => {
                  // Clear a state that does not belong to the newly chosen country, so the
                  // form can never submit e.g. Tamil Nadu against Australia.
                  const keepState = data.state && statesFor(v).includes(data.state);
                  onChange({ ...data, country: v, state: keepState ? data.state : "" });
                }}
                options={COUNTRIES} textPlaceholder="Type your country"
                error={errors.country} />
              <SelectOrText label="State / Province" required icon={<PinIcon />}
                value={data.state} onChange={(v) => set("state", v)}
                placeholder={data.country ? "Select state or province" : "Select a country first"}
                options={statesFor(data.country)} textPlaceholder="Type your state or province"
                error={errors.state} />
              <Field label="City" required icon={<DocIcon />}
                value={data.city} onChange={(v) => set("city", v)} placeholder="Enter city"
                error={errors.city} maxLength={100} />
            </div>

            <div className="mt-5">
              <Label required htmlFor="cd-address">Complete Address</Label>
              <div className="relative">
                <textarea
                  id="cd-address"
                  value={data.address ?? ""}
                  onChange={(e) => set("address", e.target.value.slice(0, 200))}
                  rows={2}
                  maxLength={200}
                  placeholder="Enter complete office address"
                  aria-invalid={errors.address ? true : undefined}
                  aria-describedby={errors.address ? "cd-address-error" : undefined}
                  className={`field-input pr-16 resize-none ${errorInput(errors.address)}`}
                />
                <span className="absolute bottom-2.5 right-3 text-micro text-ink-400 tabular pointer-events-none">{(data.address ?? "").length}/200</span>
              </div>
              <FieldError id="cd-address-error">{errors.address}</FieldError>
            </div>
          </Section>

          {/* Additional Information */}
          <Section title="Additional Information">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div>
                <Label htmlFor="cd-about">About Your Company (Optional)</Label>
                <div className="relative">
                  <textarea
                    id="cd-about"
                    value={data.about ?? ""}
                    onChange={(e) => set("about", e.target.value.slice(0, 200))}
                    rows={4}
                    maxLength={200}
                    placeholder="Briefly describe your company, services and what makes you unique"
                    className="field-input pr-16 resize-none"
                  />
                  <span className="absolute bottom-2.5 right-3 text-micro text-ink-400 tabular pointer-events-none">{(data.about ?? "").length}/200</span>
                </div>
              </div>
              <div>
                <div className="field-label">Company Logo (Optional)</div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept={LOGO_ACCEPT}
                  className="hidden"
                  aria-label="Upload company logo"
                  onChange={handleLogoChange}
                />
                {data.logoFile ? (
                  <div className="rounded-2xl border border-ink-200/70 bg-ink-50/60 px-4 py-4 flex items-center gap-4">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo preview" className="w-14 h-14 rounded-xl object-contain border border-ink-200/70 bg-white p-1 shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl border border-ink-200/70 bg-white flex items-center justify-center shrink-0 text-cobalt-600">
                        <UploadIcon />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-body-sm font-semibold text-ink-900 truncate">{data.logoFile.name}</div>
                      <div className="text-micro text-ink-500 mt-0.5 tabular">{(data.logoFile.size / 1024).toFixed(0)} KB</div>
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="btn btn-ghost btn-sm -ml-3 mt-0.5 h-8 text-brand-700"
                      >
                        Change
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={removeLogo}
                      aria-label="Remove logo"
                      className="grid place-items-center w-10 h-10 rounded-xl text-ink-500 hover:bg-danger/10 hover:text-danger transition-colors shrink-0"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="w-full min-h-[118px] rounded-2xl border-2 border-dashed border-ink-200 bg-ink-50/50 px-6 py-6 flex flex-col items-center justify-center text-center hover:border-brand-300 hover:bg-brand-50/40 transition-colors"
                  >
                    <span className="icon-tile bg-white text-brand-600 border border-ink-200/70 mb-2">
                      <UploadIcon />
                    </span>
                    <span className="text-brand-700 font-semibold text-body">Click to upload logo</span>
                    <span className="text-micro text-ink-500 mt-0.5">JPG, PNG or SVG (Max 2MB)</span>
                  </button>
                )}
                <FieldError>{logoError}</FieldError>
              </div>
            </div>
          </Section>

          {/* Terms */}
          <div className="mt-8 pt-6 border-t border-ink-200/70">
            <label htmlFor="cd-agree" className="inline-flex items-start gap-3 cursor-pointer">
              <input
                id="cd-agree"
                type="checkbox"
                checked={!!data.agree}
                onChange={(e) => set("agree", e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-brand-600 shrink-0"
              />
              <span className="text-body-sm text-ink-700 leading-relaxed">
                I agree to the <a className="text-brand-700 font-semibold">Terms &amp; Conditions</a>{" "}
                and <a className="text-brand-700 font-semibold">Privacy Policy</a>
              </span>
            </label>
          </div>

          <div className="sticky bottom-0 z-10 -mx-5 sm:-mx-7 lg:-mx-8 -mb-5 sm:-mb-7 lg:-mb-8 mt-6 px-5 sm:px-7 lg:px-8 py-4 flex items-center justify-between gap-3 border-t border-ink-200/70 glass rounded-b-card">
            <Link href="/signup" className="btn btn-outline btn-lg px-5">
              Cancel
            </Link>
            <button
              type="button"
              onClick={handleContinue}
              disabled={!data.agree}
              title={data.agree ? undefined : "Accept the terms to continue"}
              className="btn btn-primary btn-lg px-6 sm:px-8"
            >
              Continue <ArrowRight />
            </button>
          </div>
        </div>

        {/* Bottom trust strip */}
        <BottomStrip />
      </main>
    </div>
  );
}

/* ────────────────── Section + Form primitives ────────────────── */
function Section({ title, first, children }: { title: string; first?: boolean; children: React.ReactNode }) {
  return (
    <section className={first ? "mt-6" : "mt-8 pt-6 border-t border-ink-200/70"}>
      <h2 className="section-title mb-4">{title}</h2>
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
/* ────────────────── Bits ────────────────── */
function BadgeItem({ icon, title, body }: { icon: "shield" | "users" | "chart" | "head"; title: string; body: string }) {
  const icons = { shield: <ShieldIcon />, users: <UsersIcon />, chart: <ChartIcon />, head: <HeadsetIcon /> };
  return (
    <li className="flex items-start gap-3 rounded-2xl px-3 py-3">
      <span className="icon-tile icon-tile-sm bg-cobalt-50 text-cobalt-600 ring-1 ring-cobalt-100">{icons[icon]}</span>
      <div className="min-w-0 leading-snug">
        <div className="text-body-sm font-semibold text-ink-900">{title}</div>
        <div className="text-caption text-ink-500 mt-0.5 leading-relaxed">{body}</div>
      </div>
    </li>
  );
}
function BottomStrip() {
  const items: { icon: React.ReactNode; title: string; body: string }[] = [
    { icon: <ShieldIcon />,  title: "Secure & Safe",   body: "Your data is encrypted and 100% secure" },
    { icon: <ShieldIcon />,  title: "GDPR Compliant",  body: "We follow global data privacy standards" },
    { icon: <LockIcon />,    title: "No Spam",         body: "We respect your privacy. No spam, ever." },
    { icon: <HeadsetIcon />, title: "Email Support",    body: "Need help? Email contactus@arvantra-ai.com." },
  ];
  return (
    <ul className="grid grid-cols-1 min-[440px]:grid-cols-2 xl:grid-cols-4 gap-4 px-1">
      {items.map((i) => (
        <li key={i.title} className="flex items-center gap-3">
          <span className="icon-tile bg-white text-ink-600 border border-ink-200/70">{i.icon}</span>
          <div className="min-w-0 leading-snug">
            <div className="text-body-sm font-semibold text-ink-900">{i.title}</div>
            <div className="text-caption text-ink-500">{i.body}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ────────────────── Inline SVG icons ────────────────── */
function BuildingIcon({ size = 20 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="3" width="16" height="18" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 8h2M13 8h2M9 12h2M13 12h2M9 16h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function DocIcon() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M7 2h8l5 5v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.6" /></svg>); }
function GlobeIcon() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" /><path d="M3 12h18M12 3a13 13 0 0 1 0 18M12 3a13 13 0 0 0 0 18" stroke="currentColor" strokeWidth="1.6" /></svg>); }
function BriefcaseIcon() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.6" /></svg>); }
function UsersIcon() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.6" /><circle cx="17" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.6" /><path d="M3 20c0-3 3-5 6-5s6 2 6 5M14 20c0-2 2-3 3.5-3 2 0 3.5 1 3.5 3" stroke="currentColor" strokeWidth="1.6" /></svg>); }
function CalendarIcon() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" /><path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>); }
function TagIcon() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 12V4h8l10 10-8 8L3 12z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>); }
function PinIcon() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 22s7-6 7-12a7 7 0 1 0-14 0c0 6 7 12 7 12z" stroke="currentColor" strokeWidth="1.6" /><circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.6" /></svg>); }
function UploadIcon() { return (<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M7 18h10a4 4 0 0 0 0-8 6 6 0 0 0-11.7-1A4 4 0 0 0 7 18z" stroke="currentColor" strokeWidth="1.6" /><path d="M12 12v6M9 15l3-3 3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
function ShieldIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 3l8 4v6c0 4-3 7-8 8-5-1-8-4-8-8V7l8-4z" stroke="currentColor" strokeWidth="1.6" /></svg>); }
function ChartIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 4v16h16" stroke="currentColor" strokeWidth="1.6" /><path d="M7 17l4-5 3 3 5-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
function HeadsetIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 14v-2a8 8 0 0 1 16 0v2M4 14h3v6H5a1 1 0 0 1-1-1v-5zm16 0h-3v6h2a1 1 0 0 0 1-1v-5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>); }
function LockIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" /><path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.6" /></svg>); }
function ArrowRight() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h10m0 0L8 3m5 5l-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
function TrashIcon() { return (<svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>); }
