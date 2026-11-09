"use client";

import { WIZARD_GRID, WizardHeader, FormCard, WizardFooter } from "../shared/wizard";
import type { JobDraft, CompensationData } from "../shared/types";

interface Props {
  data: JobDraft;
  onChange: (d: JobDraft) => void;
  onBack: () => void;
  onContinue: () => void;
}

const SALARY_TYPES = [
  { key: "Fixed CTC",    icon: <RupeeIcon /> },
  { key: "Salary Range", icon: <BarsIcon /> },
] as const;

/** Parse a formatted rupee string ("12,00,000") into a number. */
const parseAmount = (raw: string): number => Number(String(raw ?? "").replace(/[^0-9.]/g, "")) || 0;
const formatAmount = (n: number): string => n.toLocaleString("en-IN");

export default function Step3Compensation({ data, onChange, onBack, onContinue }: Props) {
  const c = data.compensation;
  const set = <K extends keyof CompensationData>(k: K, v: CompensationData[K]) =>
    onChange({ ...data, compensation: { ...c, [k]: v } });

  // Reference annual figure the break-up is measured against.
  // Fixed CTC → the CTC; Salary Range → the midpoint of min/max (or whichever is set).
  const baseCtc = (() => {
    if (c.salaryType === "Salary Range") {
      const lo = parseAmount(c.salaryMin);
      const hi = parseAmount(c.salaryMax);
      if (lo && hi) return (lo + hi) / 2;
      return hi || lo;
    }
    return parseAmount(c.annualCtc);
  })();
  const pctOf = (value: string): string =>
    baseCtc > 0 ? `${((parseAmount(value) / baseCtc) * 100).toFixed(1)}%` : "—";

  const breakupTotal =
    parseAmount(c.basicPay) +
    parseAmount(c.hra) +
    parseAmount(c.specialAllowance) +
    parseAmount(c.otherAllowances) +
    parseAmount(c.variablePay) +
    parseAmount(c.joiningBonus);
  const breakupPct = baseCtc > 0 ? (breakupTotal / baseCtc) * 100 : 0;
  // Within 1% of the CTC counts as reconciled.
  const reconciled = baseCtc > 0 && Math.abs(breakupTotal - baseCtc) <= baseCtc * 0.01;

  return (
    <div>
      <WizardHeader
        current={3}
        subtitle="Define the compensation and benefits for this role."
        onBack={onBack}
        actions={
          <button type="button" onClick={onContinue} className="btn btn-primary">
            Next: Review <ArrowRight />
          </button>
        }
      />

      <div className={WIZARD_GRID}>
        <div className="min-w-0 space-y-5">
          {/* Compensation Details */}
          <FormCard icon={<RupeeIcon size={18} />} title="Compensation Details" subtitle="Provide salary information for this position.">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div role="group" aria-label="Salary Type">
                <Label required>Salary Type</Label>
                <p className="field-hint mt-0 mb-2">How do you want to structure the compensation?</p>
                <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-ink-100/80 border border-ink-200/60">
                  {SALARY_TYPES.map((t) => (
                    <button key={t.key} type="button" onClick={() => set("salaryType", t.key)} aria-pressed={c.salaryType === t.key}
                      className={`flex items-center justify-center gap-1.5 h-10 px-3 rounded-lg text-body-sm font-semibold transition ${
                        c.salaryType === t.key ? "bg-white text-brand-700 shadow-card" : "text-ink-600 hover:text-ink-900"
                      }`}>
                      {t.icon} {t.key}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label required>Currency</Label>
                <p className="field-hint mt-0 mb-2">Select the currency for compensation</p>
                <Select value={c.currency} onChange={(v) => set("currency", v)} ariaLabel="Currency"
                  options={["INR (₹) – Indian Rupee", "USD ($) – US Dollar", "EUR (€) – Euro", "GBP (£) – British Pound"]} />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-5 items-end">
              {c.salaryType === "Salary Range" ? (
                <div role="group" aria-label="Salary Range">
                  <Label required>Salary Range</Label>
                  <p className="field-hint mt-0 mb-2">Enter the minimum and maximum annual salary</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="block text-micro font-medium text-ink-500 mb-1">Min</span>
                      <RupeeInput value={c.salaryMin} onChange={(v) => set("salaryMin", v)} ariaLabel="Minimum salary" />
                    </div>
                    <div>
                      <span className="block text-micro font-medium text-ink-500 mb-1">Max</span>
                      <RupeeInput value={c.salaryMax} onChange={(v) => set("salaryMax", v)} ariaLabel="Maximum salary" />
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <Label required>Annual CTC</Label>
                  <p className="field-hint mt-0 mb-2">Enter the total annual cost to company</p>
                  <RupeeInput value={c.annualCtc} onChange={(v) => set("annualCtc", v)} ariaLabel="Annual CTC" />
                </div>
              )}
              <div className="surface-muted p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="text-caption font-medium text-ink-500 mb-1">Fixed Pay</div>
                  <RupeeInput value={c.fixedPay} onChange={(v) => set("fixedPay", v)} ariaLabel="Fixed Pay" />
                </div>
                <div>
                  <div className="text-caption font-medium text-ink-500 mb-1">Variable Pay</div>
                  <RupeeInput value={c.variablePay} onChange={(v) => set("variablePay", v)} ariaLabel="Variable Pay" />
                </div>
              </div>
            </div>
          </FormCard>

          {/* Salary Break-up */}
          <FormCard
            icon={<BarsIcon size={16} />}
            iconClassName="bg-cobalt-50 text-cobalt-600"
            title={<>Salary Break-up <span className="text-caption font-normal text-ink-500">(Optional)</span></>}
            subtitle="Provide a detailed break-up of the compensation structure."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4">
              <PercentInput label="Basic Pay"        value={c.basicPay}        onChange={(v) => set("basicPay", v)}        pct={pctOf(c.basicPay)} />
              <PercentInput label="HRA"              value={c.hra}             onChange={(v) => set("hra", v)}             pct={pctOf(c.hra)} />
              <PercentInput label="Special Allowance" value={c.specialAllowance} onChange={(v) => set("specialAllowance", v)} pct={pctOf(c.specialAllowance)} />
              <PercentInput label="Other Allowances" value={c.otherAllowances} onChange={(v) => set("otherAllowances", v)} pct={pctOf(c.otherAllowances)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <PercentInput label={<>Annual Bonus / Variable Pay <InfoIcon /></>} subLabel="Performance based incentive or bonus" value={c.variablePay} onChange={(v) => set("variablePay", v)} pct={pctOf(c.variablePay)} />
              <PercentInput label={<>Joining Bonus <span className="text-micro font-normal text-ink-500">(Optional)</span></>} subLabel="One-time joining bonus for selected candidate" value={c.joiningBonus} onChange={(v) => set("joiningBonus", v)} pct={pctOf(c.joiningBonus)} />
            </div>

            {/* Break-up reconciliation against the CTC / range */}
            <div className={`mt-5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 ${
              baseCtc === 0 ? "alert border-ink-200 bg-ink-50 text-ink-600"
                : reconciled ? "alert alert-success"
                : "alert alert-warn"
            }`}>
              <span className="font-semibold tabular">
                Total Break-up: ₹ {formatAmount(breakupTotal)}
                {baseCtc > 0 && <span className="font-normal"> ({breakupPct.toFixed(1)}% of {c.salaryType === "Salary Range" ? "range midpoint" : "CTC"})</span>}
              </span>
              {baseCtc === 0 ? (
                <span>Enter a {c.salaryType === "Salary Range" ? "salary range" : "CTC"} to see alignment</span>
              ) : reconciled ? (
                <span className="font-semibold">✓ Matches {c.salaryType === "Salary Range" ? "range" : "CTC"}</span>
              ) : (
                <span className="font-semibold tabular">
                  {breakupTotal > baseCtc ? "Exceeds" : "Short of"} by ₹ {formatAmount(Math.abs(baseCtc - breakupTotal))}
                </span>
              )}
            </div>
          </FormCard>

          <WizardFooter>
            <button type="button" onClick={onBack} className="btn btn-ghost">
              <ArrowLeft /> Back
            </button>
            <button type="button" onClick={onContinue} className="btn btn-primary">
              Next: Review <ArrowRight />
            </button>
          </WizardFooter>
        </div>

        {/* RIGHT — Compensation Summary (live) and Compensation Tips */}
        <aside className="w-full flex flex-col gap-4 xl:sticky xl:top-2">
          <div className="card-elevated overflow-hidden">
            <div className="px-5 pt-5 pb-4 bg-linear-to-b from-brand-50/70 to-white border-b border-ink-100">
              <h3 className="section-title">Compensation Summary</h3>
              <div className="mt-3">
                {c.salaryType === "Salary Range" ? (
                  <div className="kpi-value text-heading wrap-break-word">₹ {c.salaryMin || "0"} <span className="block mt-1 font-sans text-caption font-medium tracking-normal text-ink-500">/ Min (Annual)</span></div>
                ) : (
                  <div className="kpi-value text-heading wrap-break-word">₹ {c.annualCtc || "0"} <span className="block mt-1 font-sans text-caption font-medium tracking-normal text-ink-500">/ Annual CTC</span></div>
                )}
                <span className="mt-2 badge badge-brand">{c.salaryType}</span>
              </div>
            </div>
            <dl className="px-5 py-3">
              <div className="flex items-center justify-between gap-3 text-body-sm py-2 border-b border-ink-100">
                <dt className="text-ink-600">Fixed Pay</dt><dd className="text-success font-bold tabular">₹ {c.fixedPay || "0"}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 text-body-sm py-2">
                <dt className="text-ink-600">Variable Pay</dt><dd className="text-brand-700 font-bold tabular">₹ {c.variablePay || "0"}</dd>
              </div>
            </dl>
            <div className="mx-5 mb-5 surface-muted px-3.5 py-3">
              <div className="text-micro font-semibold uppercase tracking-wider text-ink-500 mb-1">Currency</div>
              <div className="text-body-sm font-semibold text-ink-900">{c.currency}</div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="section-title mb-3 flex items-center gap-2">
              <span className="icon-tile icon-tile-sm bg-warn/10 text-warn"><BulbIcon /></span>
              Compensation Tips
            </h3>
            <ul className="space-y-2">
              {[
                "Ensure your CTC is competitive in the market to attract top talent.",
                "Clearly communicate both fixed and variable components.",
                "Adding additional benefits increases candidate interest.",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-body-sm text-ink-700 leading-snug"><CheckIcon /><span>{t}</span></li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ─── Primitives ─── */
function Label({ children, required }: { children: React.ReactNode; required?: boolean }) { return <span className="field-label">{children} {required && <span className="text-danger" aria-hidden="true">*</span>}</span>; }
function Select({ value, onChange, options, ariaLabel }: { value: string; onChange: (v: string) => void; options: string[]; ariaLabel?: string }) {
  return (
    <div className="relative">
      <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} aria-label={ariaLabel}
        className="field-input pr-9 appearance-none cursor-pointer">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </div>
  );
}
function RupeeInput({ value, onChange, ariaLabel }: { value: string; onChange: (v: string) => void; ariaLabel?: string }) {
  return (
    <div className="relative">
      <span aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500 font-semibold">₹</span>
      <input value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder="0" aria-label={ariaLabel}
        className="field-input pl-8 tabular" />
    </div>
  );
}
function PercentInput({ label, subLabel, value, onChange, pct }: { label: React.ReactNode; subLabel?: string; value: string; onChange: (v: string) => void; pct?: string }) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      {subLabel && <span className="block text-caption text-ink-500 -mt-1 mb-1.5">{subLabel}</span>}
      <span className="relative block">
        <span aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500 font-semibold">₹</span>
        <input value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder="0"
          className="field-input pl-8 pr-20 tabular" />
        {pct && <span className="absolute right-2 top-1/2 -translate-y-1/2 badge badge-neutral tabular">{pct}</span>}
      </span>
    </label>
  );
}

/* Icons */
function RupeeIcon({ size = 14 }: { size?: number }) { return (<svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M6 4h12M6 8h12M9 4c4 0 6 3 6 6s-2 6-6 6h-3l6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>); }
function BarsIcon({ size = 14 }: { size?: number }) { return (<svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none"><rect x="3" y="14" width="4" height="7" rx="1" fill="currentColor"/><rect x="10" y="9" width="4" height="12" rx="1" fill="currentColor"/><rect x="17" y="4" width="4" height="17" rx="1" fill="currentColor"/></svg>); }
function InfoIcon() { return (<svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" className="inline ml-0.5 -mt-0.5 text-ink-400"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6"/><path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>); }
function BulbIcon() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3 11c1 .6 1.5 1.5 1.5 2.5V17h3v-.5c0-1 .5-1.9 1.5-2.5A6 6 0 0 0 12 3z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
function CheckIcon() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0 text-success"><circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity="0.12" /><path d="M8 12.5l2.5 2.5L16 9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
function ArrowRight() { return (<svg aria-hidden="true" width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 8h10m0 0L8 3m5 5l-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>); }
function ArrowLeft() { return (<svg aria-hidden="true" width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M13 8H3m0 0l5-5m-5 5l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>); }
