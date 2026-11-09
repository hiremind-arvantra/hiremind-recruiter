"use client";

import { Tooltip } from "@/modules/auth/components/candidate-reg/shared/ui";
import type { SkillRow } from "./types";

/* ─────────────────────────────────────────────────────────────────────────────
 * Skill rows with the minimum experience asked for each — shared by the Post a
 * Job wizard (step 2) and Edit Job so the two can never drift apart again.
 * The years feed straight into candidate matching: a job that asks for
 * "Python · 3+ yrs" compares that against the candidate's Python experience.
 * ───────────────────────────────────────────────────────────────────────────── */

/* Monogram tints for common skills — palette tokens only. */
const SKILL_COLORS: Record<string, string> = {
  React: "bg-cobalt-50 text-cobalt-600",
  "React.js": "bg-cobalt-50 text-cobalt-600",
  JavaScript: "bg-warn/10 text-[#b45309]",
  TypeScript: "bg-cobalt-50 text-cobalt-700",
  Python: "bg-cobalt-50 text-cobalt-700",
  Java: "bg-danger/10 text-danger",
  AWS: "bg-warn/10 text-[#b45309]",
  Git: "bg-peach-50 text-peach-700",
};

export function SkillsEditor({
  skills,
  onYears,
  onName,
  onDelete,
}: {
  skills: SkillRow[];
  onYears: (id: string, years: number) => void;
  onName: (id: string, name: string) => void;
  onDelete: (skill: SkillRow) => void;
}) {
  return (
    <div className="rounded-2xl border border-ink-100 overflow-hidden">
      <div className="hidden sm:grid grid-cols-[minmax(0,1fr)_11rem_3rem] gap-3 px-3 py-2.5 bg-ink-50 border-b border-ink-100 text-micro font-semibold uppercase tracking-wider text-ink-500">
        <div>Skill</div>
        <div>Minimum Experience</div>
        <div className="text-right pr-1">Action</div>
      </div>
      <ul className="divide-y divide-ink-100">
        {skills.map((skill) => (
          <SkillRowItem
            key={skill.id}
            skill={skill}
            onYears={(years) => onYears(skill.id, years)}
            onName={(name) => onName(skill.id, name)}
            onDelete={() => onDelete(skill)}
          />
        ))}
        {skills.length === 0 && (
          <li className="px-3 py-8 text-center text-body-sm text-ink-500">No skills added yet. Click &quot;+ Add Skill&quot; to begin.</li>
        )}
      </ul>
    </div>
  );
}

function SkillRowItem({
  skill,
  onYears,
  onName,
  onDelete,
}: {
  skill: SkillRow;
  onYears: (years: number) => void;
  onName: (name: string) => void;
  onDelete: () => void;
}) {
  const label = skill.name.trim() || "this skill";
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1fr)_11rem_3rem] gap-x-3 gap-y-2 px-3 py-2.5 items-center bg-white hover:bg-ink-50/60 transition-colors">
      <div className="flex items-center gap-2.5 min-w-0">
        <span aria-hidden="true" className={`w-9 h-9 rounded-xl font-bold text-micro grid place-items-center shrink-0 ${SKILL_COLORS[skill.name] ?? "bg-brand-50 text-brand-700"}`}>
          {(skill.name.trim() || "?").slice(0, 2).toUpperCase()}
        </span>
        <input
          value={skill.name}
          onChange={(e) => onName(e.target.value)}
          placeholder="e.g. React.js"
          aria-label="Skill name"
          autoFocus={skill.name === ""}
          className="flex-1 min-w-0 h-10 px-2.5 rounded-lg border border-transparent hover:border-ink-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 text-body-sm font-semibold text-ink-900 outline-none placeholder:font-normal placeholder:text-ink-400 transition"
        />
      </div>
      <div className="col-start-1 row-start-2 sm:col-start-2 sm:row-start-1 flex items-center gap-2">
        <div className="flex items-center h-10 w-32 rounded-xl border border-ink-200 bg-white">
          <button type="button" aria-label={`Decrease years for ${label}`} onClick={() => onYears(Math.max(0, skill.years - 1))} className="w-10 h-full rounded-l-xl hover:bg-ink-100 text-ink-700">−</button>
          <span className="flex-1 text-center text-body-sm font-bold tabular text-ink-900" aria-live="polite">{skill.years}</span>
          <button type="button" aria-label={`Increase years for ${label}`} onClick={() => onYears(skill.years + 1)} className="w-10 h-full rounded-r-xl hover:bg-ink-100 text-ink-700">+</button>
        </div>
        <span className="text-body-sm text-ink-600">{skill.years === 0 ? "Any" : skill.years === 1 ? "Year" : "Years"}</span>
      </div>
      <div className="flex justify-end">
        <Tooltip label="Delete skill">
          <button type="button" onClick={onDelete} aria-label={`Delete ${label}`} className="text-ink-400 hover:text-danger hover:bg-danger/5 rounded-xl transition w-10 h-10 grid place-items-center">
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
            </svg>
          </button>
        </Tooltip>
      </div>
    </li>
  );
}
