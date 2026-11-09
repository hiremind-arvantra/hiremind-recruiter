/* ── Shared Constants ── */

/* ── Date / Month Arrays ── */
export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const CURRENT_YEAR = new Date().getFullYear();
export const PAST_YEARS = Array.from({ length: CURRENT_YEAR - 1989 }, (_, i) => String(CURRENT_YEAR - i));
export const FUTURE_YEARS = Array.from({ length: CURRENT_YEAR - 1989 + 10 }, (_, i) =>
  String(CURRENT_YEAR + 10 - i),
);

const _now = new Date();
export const LAST_USED_OPTIONS: string[] = [];
for (let y = _now.getFullYear(); y >= _now.getFullYear() - 10; y--) {
  for (let m = 11; m >= 0; m--) {
    if (y === _now.getFullYear() && m > _now.getMonth()) continue;
    LAST_USED_OPTIONS.push(`${MONTHS[m]} ${y}`);
  }
}

/* ── Skill Color Palette (used for DB-fetched skills without preset colors) ── */
export const SKILL_PALETTE = [
  "#E76F00",
  "#3572A5",
  "#F7DF1E",
  "#61DAFB",
  "#6DB33F",
  "#3A76AD",
  "#FF9900",
  "#2496ED",
  "#326CE5",
  "#6B5B95",
  "#4479A1",
  "#F05032",
  "#10b981",
  "#a855f7",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#06b6d4",
  "#84cc16",
  "#8b5cf6",
];

/* ── Skill Constants ── */
export const PROFICIENCY_LEVELS = [
  { label: "Beginner", dots: 1 },
  { label: "Intermediate", dots: 2 },
  { label: "Advanced", dots: 3 },
  { label: "Expert", dots: 4 },
  { label: "Master", dots: 5 },
];

export const PROFICIENCY_DOTS: Record<string, number> = {
  Beginner: 1,
  Intermediate: 2,
  Advanced: 3,
  Expert: 4,
  Master: 5,
};

export const POPULAR_SKILLS = [
  { name: "Java", color: "#E76F00" },
  { name: "Python", color: "#3572A5" },
  { name: "JavaScript", color: "#F7DF1E" },
  { name: "React.js", color: "#61DAFB" },
  { name: "Spring Boot", color: "#6DB33F" },
  { name: "SQL", color: "#3A76AD" },
  { name: "AWS", color: "#FF9900" },
  { name: "Docker", color: "#2496ED" },
  { name: "Kubernetes", color: "#326CE5" },
  { name: "Microservices", color: "#6B5B95" },
  { name: "MySQL", color: "#4479A1" },
  { name: "Git", color: "#F05032" },
];

export const POPULAR_SKILL_COLORS: Record<string, string> = Object.fromEntries(
  POPULAR_SKILLS.map((s) => [s.name, s.color]),
);

/** Skill catalog categories treated as "soft" skills; everything else is technical. */
export const SOFT_SKILL_CATEGORIES = new Set([
  "Communication", "Leadership", "Collaboration", "Cognitive",
  "Personal Effectiveness", "Management", "Soft Skill", "Soft",
]);

/**
 * Degree / course options — mirrors candidate_api's `degree_courses` master so the
 * recruiter job form and the candidate education form offer the same list.
 */
export const DEGREE_OPTIONS = [
  "B.Tech / B.E.", "M.Tech / M.E.", "B.Sc", "M.Sc", "BCA", "MCA", "BBA", "MBA",
  "B.Com", "M.Com", "BA", "MA", "B.Arch", "LLB", "LLM", "MBBS", "BDS",
  "B.Pharm", "M.Pharm", "Ph.D", "Diploma", "Post Graduate Diploma",
  "12th (Science)", "12th (Commerce)", "12th (Arts)", "10th", "Other",
];

/* ── Experience Constants ── */
export const EMPLOYMENT_TYPE_MAP: Record<string, string> = {
  "Full-time": "FULL_TIME",
  "Part-time": "PART_TIME",
  Contract: "CONTRACT",
  Freelance: "FREELANCE",
  Internship: "INTERNSHIP",
  Remote: "REMOTE",
  Hybrid: "HYBRID",
};
export const EMPLOYMENT_TYPES = Object.keys(EMPLOYMENT_TYPE_MAP);

/* ── Preference / Step3 Options ── */
export const NOTICE_OPTIONS = ["Immediate", "15 Days", "30 Days", "45 Days", "60 Days", "90 Days"];
export const SALARY_OPTIONS = [
  "Below 5 LPA",
  "5 – 10 LPA",
  "10 – 15 LPA",
  "15 – 20 LPA",
  "20 – 30 LPA",
  "30+ LPA",
];
export const SALARY_TYPE = ["Fixed", "Fixed + Variable", "Variable"];
export const LOCATION_OPTIONS = [
  "Bangalore",
  "Mumbai",
  "Delhi NCR",
  "Hyderabad",
  "Pune",
  "Chennai",
  "Remote",
];
export const BENEFIT_OPTIONS = [
  "Health Insurance",
  "Performance Bonus",
  "Flexible Working Hours",
  "Work From Home",
  "Stock Options",
  "Other",
];

/* ── Step1 Constants ── */
export const HEAR_OPTIONS = [
  "Google Search",
  "LinkedIn",
  "Friend / Colleague",
  "Social Media",
  "Job Portal",
  "Other",
];
