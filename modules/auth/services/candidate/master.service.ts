import { API } from "@/lib/api/config";

/* ── Master data (public — no auth required) ── */

export interface DegreeCourse {
  name: string;
  category: string;
}
export interface EducationTypeItem {
  name: string;
}

export async function fetchDegreeCourses(): Promise<DegreeCourse[]> {
  const res = await fetch(`${API.CANDIDATE}/master/degrees`);
  const json = await res.json().catch(() => ({}));
  return (json.data ?? []) as DegreeCourse[];
}

export async function fetchEducationTypes(): Promise<EducationTypeItem[]> {
  const res = await fetch(`${API.CANDIDATE}/master/education-types`);
  const json = await res.json().catch(() => ({}));
  return (json.data ?? []) as EducationTypeItem[];
}

export interface EmploymentTypeItem {
  name: string;
}

/** GET /master/employment-types — public, no auth required */
export async function fetchEmploymentTypes(): Promise<EmploymentTypeItem[]> {
  const res = await fetch(`${API.CANDIDATE}/master/employment-types`);
  const json = await res.json().catch(() => ({}));
  return (json.data ?? []) as EmploymentTypeItem[];
}

/* ── Skill Catalog ── */

export interface SkillCatalogItem {
  id: string;
  name: string;
  category: string;
}

/** GET /skills?q= — public, no auth */
export async function fetchSkills(q = ""): Promise<SkillCatalogItem[]> {
  const url = `${API.CANDIDATE}/skills${q ? `?q=${encodeURIComponent(q)}` : ""}`;
  const res = await fetch(url);
  const json = await res.json().catch(() => ({}));
  return (json.data ?? []) as SkillCatalogItem[];
}
