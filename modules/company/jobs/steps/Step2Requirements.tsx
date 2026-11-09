"use client";

import { useId } from "react";
import RightRail from "../shared/RightRail";
import { WIZARD_GRID, WizardHeader, FormCard, WizardFooter } from "../shared/wizard";
import { EXPERIENCE_LEVELS } from "../shared/constants";
import type { JobDraft, RequirementsData, SkillRow } from "../shared/types";
import { SkillsEditor } from "../shared/SkillsEditor";
import { useConfirmDelete } from "@/modules/auth/components/candidate-reg/shared/hooks";
import { ConfirmDialog } from "@/modules/auth/components/candidate-reg/shared/ui";
import { MatchWeightsEditor } from "@/modules/company/matching/components/MatchWeightsEditor";

interface Props {
  data: JobDraft;
  onChange: (d: JobDraft) => void;
  onBack: () => void;
  onContinue: () => void;
}


export default function Step2Requirements({ data, onChange, onBack, onContinue }: Props) {
  const r = data.requirements;
  const minExpId = useId();
  const responsibilitiesId = useId();
  const { confirm, triggerDelete, resetConfirm } = useConfirmDelete();
  const set = <K extends keyof RequirementsData>(k: K, v: RequirementsData[K]) =>
    onChange({ ...data, requirements: { ...r, [k]: v } });

  const setSkillYears = (id: string, years: number) =>
    set("skills", r.skills.map((s) => (s.id === id ? { ...s, years: Math.max(0, years) } : s)));
  const setSkillName = (id: string, name: string) =>
    set("skills", r.skills.map((s) => (s.id === id ? { ...s, name } : s)));
  const removeSkill = (id: string) => set("skills", r.skills.filter((s) => s.id !== id));
  const confirmRemoveSkill = (skill: SkillRow) =>
    triggerDelete(`Delete "${skill.name.trim() || "this skill"}"?`, async () => {
      resetConfirm();
      removeSkill(skill.id);
    });
  const addSkill = () => {
    const id = `${Date.now()}`;
    set("skills", [...r.skills, { id, name: "", years: 1 }]);
  };

  return (
    <div>
      {confirm.open && (
        <ConfirmDialog label={confirm.label} onConfirm={confirm.onConfirm} onCancel={resetConfirm} />
      )}
      <WizardHeader
        current={2}
        subtitle="Define the requirements and skills needed for this role."
        onBack={onBack}
        actions={
          <button type="button" onClick={onContinue} className="btn btn-primary">
            Next: Compensation <ArrowRight />
          </button>
        }
      />

      <div className={WIZARD_GRID}>
        <div className="min-w-0 space-y-5">
          {/* Job Requirements */}
          <FormCard icon={<ChecklistIcon />} title="Job Requirements" subtitle="Add the key requirements for candidates applying to this role.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label required htmlFor={minExpId}>Minimum Experience</Label>
                <div className="grid grid-cols-[minmax(0,1fr)_120px] gap-2 max-w-sm">
                  <div className="relative">
                    <span aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"><BriefIcon /></span>
                    <input id={minExpId} type="number" min={0} value={r.minExperience}
                      onChange={(e) => set("minExperience", Number(e.target.value))}
                      className="field-input pl-10 tabular" />
                  </div>
                  <Select value={r.experienceUnit} onChange={(v) => set("experienceUnit", v)} options={["Years", "Months"]} ariaLabel="Experience unit" />
                </div>
              </div>
              <Select label="Experience Level" required value={r.experienceLevel} onChange={(v) => set("experienceLevel", v)}
                options={EXPERIENCE_LEVELS} />
            </div>

            <div className="mt-5">
              <Label required htmlFor={responsibilitiesId}>Key Responsibilities</Label>
              <RichTextStub />
              <textarea id={responsibilitiesId} value={r.responsibilities} onChange={(e) => set("responsibilities", e.target.value)}
                className="field-input min-h-36 rounded-t-none resize-y"
                placeholder="• Develop and maintain scalable web applications.&#10;• Collaborate with cross-functional teams to define and ship new features.&#10;• Write clean, efficient, and well-documented code.&#10;• Ensure performance, quality, and responsiveness of applications.&#10;• Troubleshoot and fix issues across the stack."
                maxLength={3000} />
              <div className="text-right text-micro text-ink-500 mt-1 tabular">{r.responsibilities.length}/3000</div>
            </div>
          </FormCard>

          {/* Skills & Experience */}
          <FormCard
            icon={<SkillsIcon />}
            iconClassName="bg-cobalt-50 text-cobalt-600"
            title="Skills & Experience"
            subtitle="Add the essential skills required for this role along with the expected experience for each."
            action={
              <button type="button" onClick={addSkill} className="btn btn-secondary">
                + Add Skill
              </button>
            }
          >
            <SkillsEditor
              skills={r.skills}
              onYears={setSkillYears}
              onName={setSkillName}
              onDelete={confirmRemoveSkill}
            />
          </FormCard>

          {/* Candidate Matching Preferences */}
          <FormCard
            icon={<SlidersIcon />}
            iconClassName="bg-brand-50 text-brand-600"
            title="Candidate Matching Preferences"
            subtitle="Decide how much each category counts when candidates are scored against this job. Starts from your company defaults."
          >
            <MatchWeightsEditor
              variant="compact"
              value={data.matching}
              onChange={(matching) => onChange({ ...data, matching })}
            />
          </FormCard>

          <WizardFooter>
            <button type="button" onClick={onBack} className="btn btn-ghost"><ArrowLeft /> Back</button>
            <button type="button" onClick={onContinue} className="btn btn-primary">
              Next: Compensation <ArrowRight />
            </button>
          </WizardFooter>
        </div>

        <RightRail
          current={2}
          data={data}
          showProgress={false}
          tips={{
            title: "Tips for a great job post",
            tips: ["Add clear and specific requirements", "List key skills with relevant experience", "Keep responsibilities concise and outcome-focused", "Mention must-have vs. preferred skills", "Review before moving to next step"],
          }}
        />
      </div>
    </div>
  );
}


function Label({ children, required, htmlFor }: { children: React.ReactNode; required?: boolean; htmlFor?: string }) { return <label htmlFor={htmlFor} className="field-label">{children} {required && <span className="text-danger" aria-hidden="true">*</span>}</label>; }
function Select({ label, required, value, onChange, options, ariaLabel }: { label?: string; required?: boolean; value: string; onChange: (v: string) => void; options: string[]; ariaLabel?: string }) {
  const id = useId();
  return (
    <div>
      {label && <Label required={required} htmlFor={id}>{label}</Label>}
      <div className="relative">
        <select id={id} value={value ?? ""} onChange={(e) => onChange(e.target.value)} aria-label={label ? undefined : ariaLabel}
          className="field-input pr-9 appearance-none cursor-pointer">
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
    </div>
  );
}
/* Decorative formatting toolbar attached to the textarea (not wired). */
function RichTextStub() {
  return (
    <div aria-hidden="true" className="flex items-center gap-0.5 px-2 py-1.5 border border-ink-200 border-b-0 rounded-t-xl bg-ink-50 text-ink-500 text-body-sm overflow-x-auto">
      {["B", "I", "U"].map((c) => <button key={c} type="button" tabIndex={-1} className="w-8 h-8 shrink-0 hover:bg-white hover:text-ink-900 rounded-lg font-semibold">{c}</button>)}
      <span className="w-px h-4 bg-ink-200 mx-1 shrink-0" />
      {["≡", "≣", "⫶", "≣"].map((c, i) => <button key={i} type="button" tabIndex={-1} className="w-8 h-8 shrink-0 hover:bg-white hover:text-ink-900 rounded-lg">{c}</button>)}
      <span className="w-px h-4 bg-ink-200 mx-1 shrink-0" />
      <button type="button" tabIndex={-1} className="w-8 h-8 shrink-0 hover:bg-white hover:text-ink-900 rounded-lg">🔗</button>
    </div>
  );
}

function BriefIcon() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.6"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.6"/></svg>); }
function ChecklistIcon() { return (<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="1.6"/><path d="M8 9l1.5 1.5L12 8M8 15l1.5 1.5L12 14M14.5 9.5H16M14.5 15.5H16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>); }
function SkillsIcon() { return (<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 15.4l-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>); }
function SlidersIcon() { return (<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 4v6M5 14v6M12 4v3M12 11v9M19 4v9M19 17v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><circle cx="5" cy="12" r="2" stroke="currentColor" strokeWidth="1.7"/><circle cx="12" cy="9" r="2" stroke="currentColor" strokeWidth="1.7"/><circle cx="19" cy="15" r="2" stroke="currentColor" strokeWidth="1.7"/></svg>); }
function ArrowRight() { return (<svg aria-hidden="true" width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 8h10m0 0L8 3m5 5l-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>); }
function ArrowLeft() { return (<svg aria-hidden="true" width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M13 8H3m0 0l5-5m-5 5l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>); }
