"use client";

import { useState, useEffect, useId } from "react";
import { NOTICE_OPTIONS, SALARY_OPTIONS, SALARY_TYPE, LOCATION_OPTIONS, BENEFIT_OPTIONS, EMPLOYMENT_TYPE_MAP, EMPLOYMENT_TYPES } from "../shared/constants";
import { SelectField } from "../shared/ui";
import { PrefsIcon } from "../shared/icons";
import type { PreferencesData } from "../shared/types";
import { fetchEmploymentTypes } from "../../../services/candidate.service";
import { toLabel } from "@/lib/utils";

interface Props {
  data: PreferencesData;
  onChange: (data: PreferencesData) => void;
}

/** { label: "Full Time", enumName: "FULL_TIME" } */
interface EmpTypeOption { label: string; enumName: string; }

// Fallback built from hardcoded constants (Freelance excluded)
const FALLBACK_EMP_OPTIONS: EmpTypeOption[] = EMPLOYMENT_TYPES
  .map((label) => ({
    label,
    enumName: EMPLOYMENT_TYPE_MAP[label] ?? label.toUpperCase().replace(/ /g, "_"),
  }))
  .filter((o) => o.enumName !== "FREELANCE");

/** Checkbox rendered as a selectable pill — the native input stays the control. */
const PILL =
  "inline-flex items-center gap-2 min-h-10 px-3.5 rounded-xl border border-ink-200 bg-white cursor-pointer text-body-sm text-ink-700 transition-colors hover:border-ink-300 has-checked:border-brand-300 has-checked:bg-brand-50 has-checked:text-brand-800";

export default function PreferencesSection({ data, onChange }: Props) {
  const [pref, setPref]         = useState<PreferencesData>(data);
  const [roleInput, setRoleInput] = useState("");
  const [empOptions, setEmpOptions] = useState<EmpTypeOption[]>(FALLBACK_EMP_OPTIONS);
  const uid = useId();

  useEffect(() => {
    fetchEmploymentTypes()
      .then((items) => {
        if (!items.length) return;
        setEmpOptions(items
          .filter((i) => i.name !== "FREELANCE")
          .map((i) => ({ label: toLabel(i.name), enumName: i.name })));
      })
      .catch(() => { /* keep fallback */ });
  }, []);

  const set = <K extends keyof PreferencesData>(key: K, value: PreferencesData[K]) => {
    const next = { ...pref, [key]: value };
    setPref(next);
    onChange(next);
  };

  const toggle = (field: "employmentTypes" | "benefits" | "preferredLocations", value: string) => {
    const arr = (pref[field] as string[]) ?? [];
    set(field, arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]);
  };

  const addRole = () => {
    const role = roleInput.trim();
    if (role && !pref.jobRolePreferences.includes(role)) {
      set("jobRolePreferences", [...pref.jobRolePreferences, role]);
    }
    setRoleInput("");
  };

  const removeRole = (role: string) =>
    set("jobRolePreferences", pref.jobRolePreferences.filter(r => r !== role));

  return (
    <section className="p-5">
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="icon-tile icon-tile-sm bg-brand-50 text-brand-600"><PrefsIcon /></span>
            <h3 className="section-title">Preferences</h3>
          </div>
          <p className="mt-1.5 text-caption text-ink-500 sm:pl-11">Tell us your preferences to get better job recommendations</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <SelectField label="Notice Period" required value={pref.noticePeriod} onChange={v => set("noticePeriod", v)} options={NOTICE_OPTIONS} />
          <SelectField label="Expected Salary (Annual CTC)" required value={pref.expectedSalary} onChange={v => set("expectedSalary", v)} options={SALARY_OPTIONS} />
          <SelectField label="Salary Type" value={pref.salaryType} onChange={v => set("salaryType", v)} options={SALARY_TYPE} />
        </div>

        <div>
          <label htmlFor={`${uid}-role`} className="field-label">
            Job Role Preferences <span className="text-danger" aria-hidden="true">*</span>
          </label>
          <div className="flex flex-wrap items-center gap-2 px-2.5 py-2 rounded-xl border border-ink-200 bg-white min-h-11 transition-[border-color,box-shadow] hover:border-ink-300 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/10">
            {pref.jobRolePreferences.map(role => (
              <span key={role} className="badge badge-brand h-7 pl-3 pr-1 text-caption">
                {role}
                <button type="button" onClick={() => removeRole(role)} aria-label={`Remove ${role}`}
                  className="grid place-items-center w-5 h-5 rounded-full text-brand-500 hover:text-brand-800 hover:bg-brand-100 transition-colors">
                  <svg aria-hidden="true" width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" /></svg>
                </button>
              </span>
            ))}
            <input id={`${uid}-role`} value={roleInput} onChange={e => setRoleInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addRole(); } }}
              onBlur={addRole}
              placeholder="+ Add Role"
              aria-describedby={`${uid}-role-hint`}
              className="flex-1 min-w-24 h-7 px-1.5 text-body text-ink-700 placeholder:text-ink-400 outline-none bg-transparent" />
          </div>
          <p id={`${uid}-role-hint`} className="field-hint">Press Enter or comma to add a role</p>
        </div>

        <fieldset>
          <legend className="field-label">
            Preferred Work Location <span className="text-danger" aria-hidden="true">*</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {LOCATION_OPTIONS.map(loc => (
              <label key={loc} className={PILL}>
                <input type="checkbox" checked={(pref.preferredLocations ?? []).includes(loc)}
                  onChange={() => toggle("preferredLocations", loc)}
                  className="w-4 h-4 rounded accent-brand-600" />
                <span>{loc}</span>
              </label>
            ))}
            <span aria-hidden="true" className="hidden sm:block w-px self-stretch my-1.5 bg-ink-200" />
            <label className={PILL}>
              <input type="checkbox" checked={pref.openToRelocate} onChange={e => set("openToRelocate", e.target.checked)} className="w-4 h-4 rounded accent-brand-600" />
              <span className="font-medium flex items-center gap-1.5">
                Open to relocate
                <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-ink-400"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6"/><path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </span>
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend className="field-label">Preferred Employment Type</legend>
          <div className="flex flex-wrap gap-2">
            {empOptions.map(({ label, enumName }) => (
              <label key={enumName} className={PILL}>
                <input type="checkbox" checked={pref.employmentTypes.includes(enumName)} onChange={() => toggle("employmentTypes", enumName)} className="w-4 h-4 rounded accent-brand-600" />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="field-label">
            Other Benefits You&apos;re Looking For <span className="text-ink-400 font-normal">(Select all that apply)</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {BENEFIT_OPTIONS.map(b => (
              <label key={b} className={PILL}>
                <input type="checkbox" checked={pref.benefits.includes(b)} onChange={() => toggle("benefits", b)} className="w-4 h-4 rounded accent-brand-600" />
                <span>{b}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor={`${uid}-notes`} className="field-label">
            Additional Preferences / Notes <span className="text-ink-400 font-normal">(Optional)</span>
          </label>
          <textarea id={`${uid}-notes`} value={pref.additionalNotes}
            onChange={e => set("additionalNotes", e.target.value.slice(0, 250))}
            placeholder="Tell us anything else that can help us find the right opportunities for you..."
            rows={3}
            className="field-input resize-none" />
          <p className="mt-1 text-right text-caption text-ink-400 tabular">{pref.additionalNotes.length}/250</p>
        </div>
      </div>
    </section>
  );
}
