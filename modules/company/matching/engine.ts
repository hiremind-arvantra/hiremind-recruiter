/* ─────────────────────────────────────────────────────────────────────────────
 * The matching engine.
 *
 * Pipeline, in order — evidence first, score second, explanation from the evidence:
 *   extractRequirements()  what the job asks for
 *   extractEvidence()      what the résumé actually shows
 *   per category           compare each requirement semantically (similarity.ts)
 *   classify()             EXACT … NO_EVIDENCE + confidence from evidence quality
 *   weighted score         using the recruiter's configured weights
 *   explanation            highlights, gaps and interview focus built from the matches
 *
 * A category with nothing to judge (no résumé statements, or the job says nothing
 * about it) is marked `assessable: false` and left out of the weighted average
 * instead of scoring zero — a silent profile is not a weak candidate.
 * ───────────────────────────────────────────────────────────────────────────── */

import { classify, clamp, estimateConfidence, toPercent } from "./classify";
import { extractEvidence, mentionsCertification, type ExtractedEvidence } from "./evidence";
import { containsTerm, normalizeText } from "./normalize";
import { extractRequirements, type ExtractedRequirements } from "./requirements";
import {
  bestDegreeMatch,
  bestResponsibilityMatch,
  bestSkillMatch,
  industrySimilarity,
  locationSimilarity,
  seniorityRank,
  titleSimilarity,
  type SimilarityResult,
} from "./similarity";
import { skillKey } from "./skillExperience";
import type {
  CandidateEvidenceInput,
  CategoryId,
  CategoryResult,
  Gap,
  Highlight,
  InterviewFocusArea,
  JobRequirementsInput,
  MatchAnalysis,
  MatchWeights,
  RequirementMatch,
  SkillYears,
} from "./types";
import { CATEGORY_DEFINITIONS, DEFAULT_WEIGHTS, categoryDefinition, normalizeWeights } from "./weights";

interface CategoryDraft {
  score: number;
  assessable: boolean;
  summary: string;
  matches: RequirementMatch[];
}

let sequence = 0;
function makeMatch(
  category: CategoryId,
  requirement: string,
  result: { score: number; relationship: string; evidence?: string },
  options: { qualifier?: string; importance?: number; evidenceCount: number; dataQuality: number; explicit?: boolean },
): RequirementMatch {
  const score = clamp(result.score);
  return {
    id: `${category}-${(sequence += 1)}`,
    category,
    requirement,
    qualifier: options.qualifier,
    evidence: result.evidence ?? null,
    relationship: result.relationship,
    matchClass: classify(score),
    score,
    confidence: estimateConfidence({
      score,
      evidenceCount: options.evidenceCount,
      dataQuality: options.dataQuality,
      explicitRequirement: options.explicit ?? true,
    }),
    importance: options.importance ?? 1,
  };
}

function weightedAverage(matches: RequirementMatch[]): number {
  const totalImportance = matches.reduce((sum, match) => sum + match.importance, 0);
  if (totalImportance === 0) return 0;
  return matches.reduce((sum, match) => sum + match.score * match.importance, 0) / totalImportance;
}

/* ── Category builders ───────────────────────────────────────────────────── */

function buildResponsibilities(req: ExtractedRequirements, ev: ExtractedEvidence): CategoryDraft {
  if (req.responsibilities.length === 0) {
    return { score: 0, assessable: false, summary: "This job does not list responsibilities to compare against.", matches: [] };
  }
  if (ev.statements.length === 0) {
    return {
      score: 0,
      assessable: false,
      summary: "No résumé statements are available for this candidate, so responsibilities could not be compared.",
      matches: req.responsibilities.slice(0, 6).map((responsibility) =>
        makeMatch("responsibilities", responsibility, { score: 0, relationship: "Not found in the available résumé evidence" }, {
          evidenceCount: 0,
          dataQuality: ev.dataQuality,
        }),
      ),
    };
  }
  const matches = req.responsibilities.slice(0, 8).map((responsibility) =>
    makeMatch("responsibilities", responsibility, bestResponsibilityMatch(responsibility, ev.statements), {
      evidenceCount: ev.statements.length,
      dataQuality: ev.dataQuality,
    }),
  );
  const score = weightedAverage(matches);
  const strong = matches.filter((match) => match.score >= 0.6).length;
  return {
    score,
    assessable: true,
    summary: `${strong} of ${matches.length} listed responsibilities have matching evidence in the résumé.`,
    matches,
  };
}

function buildExperience(req: ExtractedRequirements, ev: ExtractedEvidence): CategoryDraft {
  const matches: RequirementMatch[] = [];
  const required = req.minYears;
  const total = ev.totalYears;

  if (required == null) {
    return {
      score: total != null ? 1 : 0.6,
      assessable: true,
      summary: total != null
        ? `No minimum experience is set on this job; the candidate has ${formatYears(total)}.`
        : "No minimum experience is set on this job, and the candidate's total experience is not stated.",
      matches: [],
    };
  }
  if (total == null) {
    return {
      score: 0,
      assessable: false,
      summary: "The candidate's total experience is not stated in the available profile.",
      matches: [
        makeMatch("experience", `${required}+ years of experience`, {
          score: 0,
          relationship: "Not found in the available résumé evidence",
        }, { evidenceCount: 0, dataQuality: ev.dataQuality }),
      ],
    };
  }

  // Relevant years: stated if we have them, otherwise estimated from role alignment.
  const roleAlignment = req.title && ev.currentRole ? titleSimilarity(req.title, ev.currentRole).score : 0.6;
  const estimated = ev.relevantYears == null;
  const relevant = ev.relevantYears ?? total * clamp(roleAlignment, 0.35, 1);

  const totalRatio = clamp(total / required);
  const relevantRatio = clamp(relevant / required);
  const score = clamp(relevantRatio * 0.75 + totalRatio * 0.25);

  matches.push(
    makeMatch("experience", `${required}+ years of relevant experience`, {
      score: relevantRatio,
      relationship: relevantRatio >= 1
        ? `${formatYears(relevant)} of relevant experience against ${required} requested`
        : `${formatYears(relevant)} of relevant experience against ${required} requested`,
      evidence: estimated
        ? `${formatYears(total)} total experience as ${ev.currentRole ?? "stated on the profile"} (relevant time estimated from role alignment)`
        : `${formatYears(relevant)} in comparable roles`,
    }, { qualifier: estimated ? "Estimated from role alignment" : undefined, evidenceCount: 2, dataQuality: ev.dataQuality }),
  );
  matches.push(
    makeMatch("experience", "Total professional experience", {
      score: totalRatio,
      relationship: total >= required ? "Above the requested minimum" : "Below the requested minimum",
      evidence: `${formatYears(total)} total`,
    }, { evidenceCount: 1, dataQuality: ev.dataQuality }),
  );

  const summary = relevantRatio >= 1
    ? `${formatYears(relevant)} of relevant experience against the ${required} requested.`
    : `${formatYears(relevant)} of the ${required} years of relevant experience requested; ${formatYears(total)} total.`;
  return { score, assessable: true, summary, matches };
}

function buildSkills(req: ExtractedRequirements, ev: ExtractedEvidence): CategoryDraft {
  if (req.skills.length === 0) {
    return { score: 0, assessable: false, summary: "No skills are listed on this job.", matches: [] };
  }
  // Skills can be evidenced by the skill list or by a résumé statement.
  const haystack = [...ev.skills, ...ev.statements];
  const matches = req.skills.slice(0, 16).map((skill) =>
    makeMatch("skills", skill.name, withYears(bestSkillMatch(skill.name, haystack), skill.minExperience, ev.skillYears[skillKey(skill.name)]), {
      qualifier: skill.mandatory ? "Mandatory" : "Preferred",
      importance: skill.mandatory ? 1.5 : 1,
      evidenceCount: ev.skills.length,
      dataQuality: ev.dataQuality,
    }),
  );
  const evidenced = matches.filter((match) => match.score >= 0.65).length;
  return {
    score: weightedAverage(matches),
    assessable: ev.skills.length > 0 || ev.statements.length > 0,
    summary: `${evidenced} of ${matches.length} listed skills have supporting evidence.`,
    matches,
  };
}

/**
 * Folds the experience asked for a skill into its match. Having the skill is most of
 * the score; falling short on years lowers it in proportion, never to zero. When the
 * years are unknown the presence score stands and the relationship says so.
 */
function withYears(
  presence: SimilarityResult,
  minYears: number | undefined,
  years: SkillYears | undefined,
): SimilarityResult {
  if (presence.score <= 0 || !minYears || minYears <= 0) {
    if (presence.score > 0 && years) {
      return { ...presence, relationship: `${presence.relationship} · ${formatYears(years.years)} (${years.source === "stated" ? "stated" : "from work history"})` };
    }
    return presence;
  }
  if (!years) {
    return { ...presence, relationship: `${presence.relationship} · years of use not evidenced (${minYears}+ asked)` };
  }
  const ratio = clamp(years.years / minYears);
  const note = years.source === "stated" ? "stated" : "from work history";
  return {
    ...presence,
    score: presence.score * (0.55 + 0.45 * ratio),
    relationship: `${presence.relationship} · ${formatYears(years.years)} ${note} against ${minYears}+ asked`,
  };
}

function buildQualifications(req: ExtractedRequirements, ev: ExtractedEvidence): CategoryDraft {
  const matches: RequirementMatch[] = [];

  if (req.education) {
    if (ev.degrees.length === 0) {
      matches.push(
        makeMatch("qualifications", req.education, {
          score: 0,
          relationship: "No degree found in the available résumé evidence",
        }, { qualifier: "Education", evidenceCount: 0, dataQuality: ev.dataQuality }),
      );
    } else {
      const degree = bestDegreeMatch(req.education, ev.degrees);
      matches.push(
        makeMatch("qualifications", req.education, degree, {
          qualifier: "Education",
          importance: 1.5,
          evidenceCount: ev.degrees.length,
          dataQuality: ev.dataQuality,
        }),
      );
    }
  }

  for (const certification of req.certifications) {
    const found =
      ev.certifications.find((held) => containsTerm(held, certification) || containsTerm(certification, held)) ??
      (mentionsCertification(ev, certification) ? certification : null);
    matches.push(
      makeMatch("qualifications", `${certification} certification`, found
        ? { score: 0.95, relationship: "Certification named in the résumé evidence", evidence: found }
        : { score: 0, relationship: "Not found in the available résumé evidence" },
        { qualifier: "Certification", evidenceCount: ev.certifications.length, dataQuality: ev.dataQuality }),
    );
  }

  if (matches.length === 0) {
    return {
      score: 1,
      assessable: true,
      summary: "No formal qualification is required for this job.",
      matches: [],
    };
  }
  const score = weightedAverage(matches);
  return {
    score,
    assessable: true,
    summary: matches
      .map((match) => `${match.requirement}: ${match.relationship.toLowerCase()}`)
      .slice(0, 2)
      .join(" · "),
    matches,
  };
}

function buildIndustry(req: ExtractedRequirements, ev: ExtractedEvidence): CategoryDraft {
  if (!req.industry) {
    return { score: 1, assessable: true, summary: "No specific industry is required for this job.", matches: [] };
  }
  const context = [...ev.industries, ...ev.statements].join(" • ");
  const result = industrySimilarity(req.industry, context);
  const match = makeMatch("industry", `${req.industry} industry experience`, result, {
    evidenceCount: ev.industries.length,
    dataQuality: ev.dataQuality,
  });
  return {
    score: result.score,
    assessable: ev.industries.length > 0 || ev.statements.length > 0,
    summary: result.relationship,
    matches: [match],
  };
}

function buildAchievements(req: ExtractedRequirements, ev: ExtractedEvidence): CategoryDraft {
  if (ev.statements.length === 0) {
    return {
      score: 0,
      assessable: false,
      summary: "No résumé statements are available, so measurable outcomes could not be assessed.",
      matches: [],
    };
  }
  const found = ev.quantifiedStatements.slice(0, 4);
  const score = clamp(found.length / 3);
  const matches = found.map((statement) =>
    makeMatch("achievements", "Measurable business or delivery outcome", {
      score: 0.9,
      relationship: "Quantified outcome stated in the résumé",
      evidence: statement,
    }, { evidenceCount: found.length, dataQuality: ev.dataQuality, explicit: false }),
  );
  if (found.length === 0) {
    matches.push(
      makeMatch("achievements", "Measurable business or delivery outcome", {
        score: 0,
        relationship: "No quantified outcomes found in the available résumé evidence",
      }, { evidenceCount: 0, dataQuality: ev.dataQuality, explicit: false }),
    );
  }
  return {
    score,
    assessable: true,
    summary: found.length
      ? `${found.length} quantified outcome${found.length === 1 ? "" : "s"} found in the résumé.`
      : "No quantified outcomes found in the available résumé evidence.",
    matches,
  };
}

function buildLeadership(req: ExtractedRequirements, ev: ExtractedEvidence): CategoryDraft {
  const cues = [...req.leadershipCues, ...req.stakeholderCues];
  if (cues.length === 0) {
    return {
      score: 0,
      assessable: false,
      summary: "This job does not describe leadership or stakeholder responsibilities.",
      matches: [],
    };
  }
  const haystack = [...ev.leadershipStatements, ...ev.professionalStatements, ...ev.statements];
  if (haystack.length === 0) {
    return {
      score: 0,
      assessable: false,
      summary: "No résumé statements are available to evidence leadership or stakeholder work.",
      matches: cues.slice(0, 4).map((cue) =>
        makeMatch("leadership", cue, { score: 0, relationship: "Not found in the available résumé evidence" }, {
          evidenceCount: 0,
          dataQuality: ev.dataQuality,
        }),
      ),
    };
  }
  const matches = cues.slice(0, 6).map((cue) =>
    makeMatch("leadership", cue, bestResponsibilityMatch(cue, haystack), {
      evidenceCount: haystack.length,
      dataQuality: ev.dataQuality,
    }),
  );
  const summary = ev.teamSize
    ? `Team leadership evidenced, including a team of ${ev.teamSize}.`
    : `${matches.filter((match) => match.score >= 0.6).length} of ${matches.length} leadership expectations have supporting evidence.`;
  return { score: weightedAverage(matches), assessable: true, summary, matches };
}

function buildCareer(req: ExtractedRequirements, ev: ExtractedEvidence): CategoryDraft {
  if (!req.title || !ev.currentRole) {
    return {
      score: 0,
      assessable: false,
      summary: ev.currentRole ? "This job has no title to compare against." : "The candidate's current role is not stated.",
      matches: [],
    };
  }
  const title = titleSimilarity(req.title, ev.currentRole);
  const matches = [
    makeMatch("career", `Role alignment with ${req.title}`, title, {
      evidenceCount: ev.titles.length || 1,
      dataQuality: ev.dataQuality,
    }),
  ];

  const requiredRank = seniorityRank(req.seniority ?? req.title);
  const candidateRank = seniorityRank(ev.currentRole);
  let seniorityScore = title.score;
  if (requiredRank != null && candidateRank != null) {
    const gap = Math.abs(requiredRank - candidateRank);
    seniorityScore = gap === 0 ? 1 : gap === 1 ? 0.75 : 0.45;
    matches.push(
      makeMatch("career", `Seniority: ${req.seniority ?? req.title}`, {
        score: seniorityScore,
        relationship: gap === 0 ? "Same seniority level" : gap === 1 ? "One level apart" : "Different seniority level",
        evidence: ev.currentRole,
      }, { evidenceCount: 1, dataQuality: ev.dataQuality }),
    );
  }
  return {
    score: weightedAverage(matches),
    assessable: true,
    summary: `${title.relationship}${ev.currentCompany ? ` at ${ev.currentCompany}` : ""}.`,
    matches,
  };
}

function buildLocation(req: ExtractedRequirements, ev: ExtractedEvidence): CategoryDraft {
  const matches: RequirementMatch[] = [];
  const location = locationSimilarity(req.location, req.workMode, ev.locations);
  matches.push(
    makeMatch("location", req.location ? `Based in or near ${req.location}` : "Location", location, {
      qualifier: req.workMode ?? undefined,
      evidenceCount: ev.locations.length,
      dataQuality: ev.dataQuality,
    }),
  );

  if (req.noticePeriod && ev.availability) {
    const same = normalizeText(req.noticePeriod) === normalizeText(ev.availability);
    matches.push(
      makeMatch("location", `Notice period: ${req.noticePeriod}`, {
        score: same ? 1 : 0.6,
        relationship: same ? "Matches the requested notice period" : "Different notice period — confirm with the candidate",
        evidence: ev.availability,
      }, { evidenceCount: 1, dataQuality: ev.dataQuality }),
    );
  } else if (req.noticePeriod) {
    matches.push(
      makeMatch("location", `Notice period: ${req.noticePeriod}`, {
        score: 0,
        relationship: "Not found in the available résumé evidence",
      }, { evidenceCount: 0, dataQuality: ev.dataQuality }),
    );
  }

  return {
    score: weightedAverage(matches),
    assessable: ev.locations.length > 0 || !req.location,
    summary: location.relationship,
    matches,
  };
}

function buildProfessional(req: ExtractedRequirements, ev: ExtractedEvidence): CategoryDraft {
  if (ev.statements.length === 0) {
    return {
      score: 0,
      assessable: false,
      summary: "No résumé statements are available — validate ways of working during the interview.",
      matches: [],
    };
  }
  const found = ev.professionalStatements.slice(0, 4);
  const score = clamp(found.length / 3);
  const matches = found.map((statement) =>
    makeMatch("professional", "Observable professional behaviour", {
      score: 0.85,
      relationship: "Collaboration, mentoring or ownership evidenced in the résumé",
      evidence: statement,
    }, { evidenceCount: found.length, dataQuality: ev.dataQuality, explicit: false }),
  );
  if (found.length === 0) {
    matches.push(
      makeMatch("professional", "Observable professional behaviour", {
        score: 0,
        relationship: "Insufficient evidence in the résumé — validate during the interview",
      }, { evidenceCount: 0, dataQuality: ev.dataQuality, explicit: false }),
    );
  }
  return {
    score,
    assessable: true,
    summary: found.length
      ? `${found.length} statement${found.length === 1 ? "" : "s"} evidencing collaboration, mentoring or ownership.`
      : "Insufficient evidence in the résumé — validate during the interview.",
    matches,
  };
}

const BUILDERS: Record<CategoryId, (req: ExtractedRequirements, ev: ExtractedEvidence) => CategoryDraft> = {
  responsibilities: buildResponsibilities,
  experience: buildExperience,
  skills: buildSkills,
  qualifications: buildQualifications,
  industry: buildIndustry,
  achievements: buildAchievements,
  leadership: buildLeadership,
  career: buildCareer,
  location: buildLocation,
  professional: buildProfessional,
};

/* ── Public entry point ──────────────────────────────────────────────────── */

export function computeMatchAnalysis(
  job: JobRequirementsInput,
  candidate: CandidateEvidenceInput,
  weights: MatchWeights = DEFAULT_WEIGHTS,
): MatchAnalysis {
  const requirements = extractRequirements(job);
  const evidence = extractEvidence(candidate);
  const effectiveWeights = normalizeWeights(weights);

  const categories: CategoryResult[] = CATEGORY_DEFINITIONS.map((definition) => {
    const draft = BUILDERS[definition.id](requirements, evidence);
    const confidence = draft.matches.length
      ? draft.matches.reduce((sum, match) => sum + match.confidence, 0) / draft.matches.length
      : clamp(0.4 + evidence.dataQuality * 0.4);
    return {
      id: definition.id,
      label: definition.label,
      description: definition.description,
      weight: Math.round(weights[definition.id] ?? definition.defaultWeight),
      score: toPercent(draft.score),
      confidence,
      assessable: draft.assessable,
      summary: draft.summary,
      matches: draft.matches,
    };
  });

  const assessable = categories.filter((category) => category.assessable);
  const weightSum = assessable.reduce((sum, category) => sum + effectiveWeights[category.id], 0);
  const overall = weightSum > 0
    ? Math.round(assessable.reduce((sum, category) => sum + (category.score * effectiveWeights[category.id]), 0) / weightSum)
    : 0;
  const confidence = weightSum > 0
    ? clamp(
        assessable.reduce((sum, category) => sum + category.confidence * effectiveWeights[category.id], 0) / weightSum,
      ) * clamp(0.65 + evidence.dataQuality * 0.35)
    : clamp(evidence.dataQuality * 0.5);

  return {
    jobId: job.id,
    candidateUserId: candidate.candidateUserId,
    generatedAt: new Date().toISOString(),
    overall,
    confidence,
    verdict: verdictFor(overall, assessable.length, categories.length),
    categories,
    highlights: buildHighlights(categories, requirements, evidence),
    gaps: buildGaps(categories, effectiveWeights),
    interviewFocus: buildInterviewFocus(categories),
    evidenceCoverage: evidence.dataQuality,
    source: "local-engine",
    weights: { ...weights },
  };
}

function verdictFor(overall: number, assessableCount: number, total: number): string {
  const caveat = assessableCount < total
    ? ` ${total - assessableCount} of ${total} categories could not be assessed from the available evidence.`
    : "";
  if (overall >= 85) return `Strong alignment based on available evidence.${caveat}`;
  if (overall >= 70) return `Good alignment based on available evidence, with some areas to validate.${caveat}`;
  if (overall >= 55) return `Partial alignment — several requirements need validation.${caveat}`;
  return `Limited alignment based on the available evidence.${caveat}`;
}

/* ── Explanations ────────────────────────────────────────────────────────── */

function buildHighlights(
  categories: CategoryResult[],
  requirements: ExtractedRequirements,
  evidence: ExtractedEvidence,
): Highlight[] {
  const highlights: Highlight[] = [];
  const byId = (id: CategoryId) => categories.find((category) => category.id === id);

  const responsibilities = byId("responsibilities");
  if (responsibilities?.assessable && responsibilities.score >= 70) {
    highlights.push({
      title: "Strong responsibility overlap",
      detail: `${responsibilities.summary} ${topEvidence(responsibilities)}`.trim(),
    });
  }

  const experience = byId("experience");
  if (experience?.assessable && experience.score >= 70) {
    highlights.push({ title: "Relevant experience", detail: experience.summary });
  }

  const skills = byId("skills");
  if (skills?.assessable) {
    const evidenced = skills.matches.filter((match) => match.score >= 0.65).map((match) => match.requirement);
    if (evidenced.length >= 2) {
      highlights.push({
        title: "Technical alignment",
        detail: `Evidence found for ${listPhrase(evidenced.slice(0, 5))}.`,
      });
    }
  }

  const qualifications = byId("qualifications");
  const degreeMatch = qualifications?.matches.find((match) => match.qualifier === "Education");
  if (degreeMatch && degreeMatch.score >= 0.7 && degreeMatch.evidence) {
    highlights.push({
      title: "Qualification satisfied",
      detail: `${degreeMatch.evidence} — ${degreeMatch.relationship.toLowerCase()}.`,
    });
  }

  if (evidence.teamSize) {
    highlights.push({
      title: "Leadership evidence",
      detail: `Résumé states leading a team of ${evidence.teamSize}.`,
    });
  } else {
    const leadership = byId("leadership");
    if (leadership?.assessable && leadership.score >= 70) {
      highlights.push({ title: "Leadership evidence", detail: leadership.summary });
    }
  }

  if (evidence.quantifiedStatements.length > 0) {
    highlights.push({
      title: "Quantified impact",
      detail: `Résumé contains measurable outcomes, for example: "${truncate(evidence.quantifiedStatements[0], 120)}"`,
    });
  }

  const industry = byId("industry");
  if (industry?.assessable && industry.score >= 85 && requirements.industry) {
    highlights.push({ title: "Domain experience", detail: `${industry.summary}.` });
  }

  return highlights.slice(0, 6);
}

function buildGaps(categories: CategoryResult[], weights: MatchWeights): Gap[] {
  const gaps: Gap[] = [];

  for (const category of categories) {
    if (!category.assessable) {
      gaps.push({
        title: `${category.label} could not be assessed`,
        detail: category.summary,
        severity: weights[category.id] >= 12 ? "medium" : "low",
      });
      continue;
    }
    // Specific missing requirements read better than a category-level verdict.
    const missing = category.matches.filter((match) => match.matchClass === "NO_EVIDENCE");
    for (const match of missing.slice(0, 3)) {
      gaps.push({
        title: match.requirement,
        detail: `${match.relationship}.${match.qualifier === "Mandatory" ? " Listed as mandatory on this job." : ""}`,
        severity: match.qualifier === "Mandatory" || weights[category.id] >= 15 ? "high" : "medium",
      });
    }
    const partial = category.matches.filter((match) => match.matchClass === "PARTIAL" || match.matchClass === "WEAK");
    for (const match of partial.slice(0, 2)) {
      gaps.push({
        title: match.requirement,
        detail: `${match.relationship}${match.evidence ? ` — closest evidence: "${truncate(match.evidence, 90)}"` : ""}.`,
        severity: weights[category.id] >= 15 ? "medium" : "low",
      });
    }
  }

  return dedupe(gaps, (gap) => gap.title).slice(0, 8);
}

function buildInterviewFocus(categories: CategoryResult[]): InterviewFocusArea[] {
  const focus: InterviewFocusArea[] = [];

  for (const category of categories) {
    if (!category.assessable) {
      focus.push({
        title: `Explore ${category.label.toLowerCase()}`,
        reason: category.summary,
      });
      continue;
    }
    for (const match of category.matches) {
      if (match.matchClass === "NO_EVIDENCE" && match.qualifier !== "Preferred") {
        focus.push({
          title: `Validate ${match.requirement.toLowerCase()}`,
          reason: "Not found in the available résumé evidence — confirm directly with the candidate.",
        });
      } else if (match.matchClass === "PARTIAL" || match.matchClass === "RELATED") {
        focus.push({
          title: `Probe depth of ${match.requirement.toLowerCase()}`,
          reason: `${match.relationship} — check how directly this transfers to the role.`,
        });
      }
    }
  }

  return dedupe(focus, (item) => item.title).slice(0, 6);
}

/* ── Compact summary for list screens ────────────────────────────────────── */

export interface MatchSummary {
  overall: number;
  confidence: number;
  strongAreas: string[];
  gapAreas: string[];
}

/** The applicants list shows this next to each candidate. */
export function summarizeMatch(analysis: MatchAnalysis): MatchSummary {
  const assessable = analysis.categories.filter((category) => category.assessable);
  return {
    overall: analysis.overall,
    confidence: analysis.confidence,
    strongAreas: assessable
      .filter((category) => category.score >= 75)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((category) => category.label),
    gapAreas: analysis.gaps.filter((gap) => gap.severity !== "low").slice(0, 2).map((gap) => gap.title),
  };
}

/* ── helpers ─────────────────────────────────────────────────────────────── */

function topEvidence(category: CategoryResult): string {
  const best = [...category.matches].sort((a, b) => b.score - a.score)[0];
  return best?.evidence ? `Closest evidence: "${truncate(best.evidence, 110)}".` : "";
}

function listPhrase(values: string[]): string {
  if (values.length <= 1) return values[0] ?? "";
  return `${values.slice(0, -1).join(", ")} and ${values[values.length - 1]}`;
}

function truncate(value: string, max: number): string {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1)}…`;
}

function dedupe<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  const output: T[] = [];
  for (const item of items) {
    const id = normalizeText(key(item));
    if (id && !seen.has(id)) {
      seen.add(id);
      output.push(item);
    }
  }
  return output;
}

function formatYears(years: number): string {
  const rounded = Math.round(years * 10) / 10;
  return `${rounded} year${rounded === 1 ? "" : "s"}`;
}

export { categoryDefinition };
