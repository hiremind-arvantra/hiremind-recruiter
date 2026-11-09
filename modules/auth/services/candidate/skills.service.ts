import type { Skill } from "../../types/auth.types";
import { authedFetch, handleResponse } from "./http";

/* ── Candidate Skills ── */

const PROFICIENCY_MAP: Record<string, string> = {
  Beginner: "BEGINNER",
  Intermediate: "INTERMEDIATE",
  Advanced: "ADVANCED",
  Expert: "EXPERT",
  Master: "MASTER",
};

export interface SkillPayload {
  skillName: string;
  proficiencyLevel: string; // BEGINNER | INTERMEDIATE | ADVANCED | EXPERT | MASTER
  experienceYears?: number; // BigDecimal — convert months → fractional years
  lastUsed?: string; // YYYY-MM-DD (first of month)
  topSkill: boolean;
  additionalDetails?: string;
}

/** POST /profile/skills → returns backend-assigned skill id */
export async function addCandidateSkill(payload: SkillPayload, existingIds: string[] = []): Promise<string> {
  const res = await authedFetch("/profile/skills", { method: "POST", body: JSON.stringify(payload) });
  const profile = await handleResponse<{ skills: { id: string }[] }>(res);
  const list = profile.skills ?? [];
  // Identify the new row by diffing against ids the caller already had — the
  // response order isn't guaranteed to put the newest skill last.
  const known = new Set(existingIds);
  const created = list.find((s) => !known.has(s.id));
  return created?.id ?? list[list.length - 1]?.id ?? crypto.randomUUID();
}

/** PUT /profile/skills/:id */
export async function updateCandidateSkill(id: string, payload: SkillPayload): Promise<void> {
  const res = await authedFetch(`/profile/skills/${id}`, { method: "PUT", body: JSON.stringify(payload) });
  await handleResponse<unknown>(res);
}

/** DELETE /profile/skills/:id */
export async function deleteCandidateSkill(id: string): Promise<void> {
  const res = await authedFetch(`/profile/skills/${id}`, { method: "DELETE" });
  await handleResponse<unknown>(res);
}

export function buildSkillPayload(skill: Skill): SkillPayload {
  const expNum = parseFloat(skill.experienceValue) || 0;
  const expYears = skill.experienceUnit === "Months" ? Math.round((expNum / 12) * 10) / 10 : expNum;
  const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let lastUsed: string | undefined;
  if (skill.lastUsed) {
    const parts = skill.lastUsed.split(" ");
    const mIdx = MONTHS_SHORT.indexOf(parts[0]);
    if (mIdx !== -1 && parts[1]) lastUsed = `${parts[1]}-${String(mIdx + 1).padStart(2, "0")}-01`;
  }
  return {
    skillName: skill.name,
    proficiencyLevel: PROFICIENCY_MAP[skill.proficiency] ?? "INTERMEDIATE",
    experienceYears: expYears > 0 ? expYears : undefined,
    lastUsed,
    topSkill: skill.highlighted,
    additionalDetails: skill.additionalDetails || undefined,
  };
}
