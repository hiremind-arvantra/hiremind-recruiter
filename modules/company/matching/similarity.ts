/* ─────────────────────────────────────────────────────────────────────────────
 * Semantic similarity — the layer that keeps "Master's" and "M.Tech" from being
 * treated as unrelated strings.
 *
 * Three cooperating signals, strongest first:
 *   1. Concept identity   — both sides resolve to the same taxonomy concept
 *   2. Concept relation   — member-of (TensorFlow evidences ML) or related-to
 *   3. Lexical similarity — token overlap + trigram similarity for unknown terms
 *
 * Everything returns a 0–1 score plus a human-readable relationship, because the
 * UI must be able to explain *why* something matched.
 * ───────────────────────────────────────────────────────────────────────────── */

import {
  INDUSTRY_FAMILIES,
  SKILL_CONCEPTS,
  TITLE_FAMILIES,
  FIELD_FAMILIES,
  WORK_MODES,
  type SkillConcept,
} from "./taxonomy";
import {
  containsTerm,
  diceTrigram,
  jaccard,
  normalizeText,
  overlap,
  parseDegree,
  tokenSet,
} from "./normalize";

export interface SimilarityResult {
  /** 0–1. */
  score: number;
  /** Short phrase shown in the UI, e.g. "Master's-level equivalent". */
  relationship: string;
  /** The candidate text that produced the score, when one item stood out. */
  evidence?: string;
}

/* ── Lexical layer ───────────────────────────────────────────────────────── */

/** Token overlap + trigram similarity, for terms the taxonomy does not know. */
export function lexicalSimilarity(a: string, b: string): number {
  const left = normalizeText(a);
  const right = normalizeText(b);
  if (!left || !right) return 0;
  if (left === right) return 1;
  const leftTokens = tokenSet(left);
  const rightTokens = tokenSet(right);
  // Full containment of a multi-word term is strong evidence ("python" in "python programming").
  if (leftTokens.size && rightTokens.size) {
    if (containsTerm(right, left) || containsTerm(left, right)) return 0.9;
  }
  const tokenScore = Math.max(jaccard(leftTokens, rightTokens), 0.85 * overlap(leftTokens, rightTokens));
  const charScore = diceTrigram(left, right);
  return Math.max(tokenScore, charScore * 0.85);
}

/* ── Skills / technologies ───────────────────────────────────────────────── */

function conceptOf(term: string): SkillConcept | null {
  const normalized = normalizeText(term);
  if (!normalized) return null;
  let best: { concept: SkillConcept; length: number } | null = null;
  for (const concept of SKILL_CONCEPTS) {
    for (const alias of concept.aliases) {
      if (normalized === normalizeText(alias) && (!best || alias.length > best.length)) {
        best = { concept, length: alias.length };
      }
    }
  }
  if (best) return best.concept;
  // Alias appearing inside a longer phrase ("hands-on react development").
  for (const concept of SKILL_CONCEPTS) {
    for (const alias of concept.aliases) {
      if (containsTerm(normalized, alias) && (!best || alias.length > best.length)) {
        best = { concept, length: alias.length };
      }
    }
  }
  return best ? best.concept : null;
}

/** Concepts that list `term` as a member — TensorFlow → Machine Learning, EC2 → Cloud/AWS. */
function conceptsContaining(term: string): SkillConcept[] {
  const normalized = normalizeText(term);
  if (!normalized) return [];
  return SKILL_CONCEPTS.filter((concept) =>
    (concept.members ?? []).some((member) => containsTerm(normalized, member) || normalizeText(member) === normalized),
  );
}

/**
 * How well one candidate skill satisfies one JD skill.
 * Exact alias → 1.0 · same concept → 0.93 · member evidence → 0.86 · related → 0.7 · lexical fallback.
 */
export function skillSimilarity(required: string, candidateSkill: string): SimilarityResult {
  const requiredNorm = normalizeText(required);
  const candidateNorm = normalizeText(candidateSkill);
  if (!requiredNorm || !candidateNorm) return { score: 0, relationship: "No evidence" };
  if (requiredNorm === candidateNorm) return { score: 1, relationship: "Exact match", evidence: candidateSkill };

  const requiredConcept = conceptOf(required);
  const candidateConcept = conceptOf(candidateSkill);

  if (requiredConcept && candidateConcept && requiredConcept.id === candidateConcept.id) {
    return { score: 0.93, relationship: `Same technology (${requiredConcept.label})`, evidence: candidateSkill };
  }
  // Candidate's skill is a member of the required concept: JD "Machine Learning" ← "TensorFlow".
  if (requiredConcept && (requiredConcept.members ?? []).some((member) => containsTerm(candidateNorm, member))) {
    return { score: 0.86, relationship: `Direct evidence for ${requiredConcept.label}`, evidence: candidateSkill };
  }
  // The reverse: JD asks for "FastAPI", candidate lists the broader "REST API development".
  if (candidateConcept && (candidateConcept.members ?? []).some((member) => containsTerm(requiredNorm, member))) {
    return { score: 0.78, relationship: `Broader experience covering ${required}`, evidence: candidateSkill };
  }
  // Both are members of one concept (EC2 and S3 both evidence AWS).
  const sharedParents = conceptsContaining(required).filter((parent) =>
    conceptsContaining(candidateSkill).some((other) => other.id === parent.id),
  );
  if (sharedParents.length) {
    return { score: 0.74, relationship: `Related within ${sharedParents[0].label}`, evidence: candidateSkill };
  }
  if (requiredConcept && candidateConcept) {
    const related =
      (requiredConcept.related ?? []).includes(candidateConcept.id) ||
      (candidateConcept.related ?? []).includes(requiredConcept.id);
    if (related) {
      return { score: 0.68, relationship: `Adjacent skill (${candidateConcept.label})`, evidence: candidateSkill };
    }
  }

  const lexical = lexicalSimilarity(required, candidateSkill);
  if (lexical >= 0.85) return { score: Math.min(0.95, lexical), relationship: "Same skill, different wording", evidence: candidateSkill };
  if (lexical >= 0.6) return { score: lexical, relationship: "Similar wording", evidence: candidateSkill };
  return { score: lexical, relationship: lexical > 0 ? "Weak textual similarity" : "No evidence", evidence: lexical > 0 ? candidateSkill : undefined };
}

/** Best candidate skill for a required skill, searching every evidence string. */
export function bestSkillMatch(required: string, candidateSkills: string[]): SimilarityResult {
  let best: SimilarityResult = { score: 0, relationship: "Not found in the available résumé evidence" };
  for (const skill of candidateSkills) {
    const result = skillSimilarity(required, skill);
    if (result.score > best.score) best = result;
  }
  return best;
}

/* ── Education ───────────────────────────────────────────────────────────── */

export interface DegreeSimilarity extends SimilarityResult {
  levelScore: number;
  fieldScore: number;
  levelRelationship: string;
  fieldRelationship: string;
}

/**
 * Compares a JD education requirement with one candidate degree, scoring the
 * *level* and the *field* separately so "Master's-level match, different field"
 * can be stated instead of a single misleading number.
 */
export function degreeSimilarity(requirement: string, candidateDegree: string): DegreeSimilarity {
  const required = parseDegree(requirement);
  const held = parseDegree(candidateDegree);

  let levelScore = 0;
  let levelRelationship = "Degree level not recognised";
  if (!required.level) {
    levelScore = held.level ? 0.9 : 0.5;
    levelRelationship = "No specific level required";
  } else if (held.level) {
    if (held.levelRank === required.levelRank) {
      const sameWording = normalizeText(held.raw) === normalizeText(required.raw);
      levelScore = 1;
      levelRelationship = sameWording ? "Exact degree level" : `${titleCase(required.level)}-level equivalent`;
    } else if (held.levelRank > required.levelRank) {
      levelScore = 1;
      levelRelationship = `Higher than required (${titleCase(held.level)})`;
    } else if (required.levelRank - held.levelRank === 1) {
      levelScore = 0.45;
      levelRelationship = `One level below (${titleCase(held.level)})`;
    } else {
      levelScore = 0.2;
      levelRelationship = `Below the required level (${titleCase(held.level)})`;
    }
  }

  let fieldScore = 0.5;
  let fieldRelationship = "Field not specified in the requirement";
  const requiredField = required.fieldId;
  const heldField = held.fieldId;
  if (requiredField) {
    if (heldField && heldField === requiredField) {
      fieldScore = 1;
      fieldRelationship = "Same field of study";
    } else if (heldField && isRelatedField(requiredField, heldField)) {
      fieldScore = 0.8;
      fieldRelationship = `Related field (${familyLabel(heldField)})`;
    } else {
      const lexical = lexicalSimilarity(required.fieldText, held.fieldText);
      if (lexical >= 0.75) {
        fieldScore = 0.9;
        fieldRelationship = "Same field, different wording";
      } else if (lexical >= 0.45) {
        fieldScore = 0.6;
        fieldRelationship = "Partially related field";
      } else {
        fieldScore = heldField || held.fieldText ? 0.25 : 0.4;
        fieldRelationship = heldField ? `Different field (${familyLabel(heldField)})` : "Field not evidenced";
      }
    }
  }

  // Level dominates: a Master's in another field still satisfies "Master's degree required".
  const score = levelScore * 0.7 + fieldScore * 0.3;
  return {
    score,
    levelScore,
    fieldScore,
    levelRelationship,
    fieldRelationship,
    relationship: `${levelRelationship}; ${fieldRelationship.toLowerCase()}`,
    evidence: candidateDegree,
  };
}

export function bestDegreeMatch(requirement: string, degrees: string[]): DegreeSimilarity {
  let best: DegreeSimilarity = {
    score: 0,
    levelScore: 0,
    fieldScore: 0,
    levelRelationship: "No degree found in the available résumé evidence",
    fieldRelationship: "No field evidence",
    relationship: "Not found in the available résumé evidence",
  };
  for (const degree of degrees) {
    const result = degreeSimilarity(requirement, degree);
    if (result.score > best.score) best = result;
  }
  return best;
}

function isRelatedField(a: string, b: string): boolean {
  const familyA = FIELD_FAMILIES.find((family) => family.id === a);
  const familyB = FIELD_FAMILIES.find((family) => family.id === b);
  return Boolean(
    (familyA?.related ?? []).includes(b) || (familyB?.related ?? []).includes(a),
  );
}

function familyLabel(id: string): string {
  return FIELD_FAMILIES.find((family) => family.id === id)?.label ?? id;
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/* ── Job titles ──────────────────────────────────────────────────────────── */

function titleFamilyOf(title: string): { id: string; label: string } | null {
  const normalized = normalizeText(title);
  if (!normalized) return null;
  let best: { id: string; label: string; length: number } | null = null;
  for (const family of TITLE_FAMILIES) {
    for (const term of family.terms) {
      if (containsTerm(normalized, term) && (!best || term.length > best.length)) {
        best = { id: family.id, label: family.label, length: term.length };
      }
    }
  }
  return best ? { id: best.id, label: best.label } : null;
}

/** Role-title comparison. The title alone never decides a match — it is one signal. */
export function titleSimilarity(jobTitle: string, candidateTitle: string): SimilarityResult {
  const left = normalizeText(jobTitle);
  const right = normalizeText(candidateTitle);
  if (!left || !right) return { score: 0, relationship: "No current role found in the available résumé evidence" };
  if (left === right) return { score: 1, relationship: "Same role title", evidence: candidateTitle };

  const jobFamily = titleFamilyOf(jobTitle);
  const candidateFamily = titleFamilyOf(candidateTitle);
  if (jobFamily && candidateFamily) {
    if (jobFamily.id === candidateFamily.id) {
      return { score: 0.92, relationship: `Same role family (${jobFamily.label})`, evidence: candidateTitle };
    }
    const related = TITLE_FAMILIES.find((family) => family.id === jobFamily.id)?.related ?? [];
    const reverse = TITLE_FAMILIES.find((family) => family.id === candidateFamily.id)?.related ?? [];
    if (related.includes(candidateFamily.id) || reverse.includes(jobFamily.id)) {
      return { score: 0.74, relationship: `Adjacent role (${candidateFamily.label})`, evidence: candidateTitle };
    }
  }
  const lexical = lexicalSimilarity(jobTitle, candidateTitle);
  if (lexical >= 0.7) return { score: lexical, relationship: "Similar role title", evidence: candidateTitle };
  return {
    score: lexical,
    relationship: candidateFamily ? `Different role family (${candidateFamily.label})` : "Different role title",
    evidence: candidateTitle,
  };
}

/** Seniority comparison, used to temper a title match ("Senior" vs "Junior"). */
const SENIORITY_RANK: { terms: string[]; rank: number }[] = [
  { terms: ["intern", "trainee", "fresher", "graduate"], rank: 1 },
  { terms: ["junior", "associate", "entry level", "entry"], rank: 2 },
  { terms: ["mid level", "mid", "engineer ii", "level 2"], rank: 3 },
  { terms: ["senior", "sr", "specialist", "lead engineer"], rank: 4 },
  { terms: ["lead", "principal", "staff", "manager", "head", "director", "vp", "chief"], rank: 5 },
];

export function seniorityRank(text: string | null | undefined): number | null {
  const normalized = normalizeText(text);
  if (!normalized) return null;
  let rank: number | null = null;
  for (const level of SENIORITY_RANK) {
    for (const term of level.terms) {
      if (containsTerm(normalized, term)) rank = Math.max(rank ?? 0, level.rank);
    }
  }
  return rank;
}

/* ── Industry / domain ───────────────────────────────────────────────────── */

function industryFamilyOf(text: string): { id: string; label: string } | null {
  const normalized = normalizeText(text);
  if (!normalized) return null;
  let best: { id: string; label: string; length: number } | null = null;
  for (const family of INDUSTRY_FAMILIES) {
    for (const term of family.terms) {
      if (containsTerm(normalized, term) && (!best || term.length > best.length)) {
        best = { id: family.id, label: family.label, length: term.length };
      }
    }
  }
  return best ? { id: best.id, label: best.label } : null;
}

/** Domain comparison. Adjacent domains are transferable experience, never a claim of the required domain. */
export function industrySimilarity(required: string, candidateContext: string): SimilarityResult {
  const requiredFamily = industryFamilyOf(required);
  const candidateFamily = industryFamilyOf(candidateContext);
  if (!normalizeText(required)) return { score: 1, relationship: "No specific industry required" };
  if (!candidateFamily) {
    const lexical = lexicalSimilarity(required, candidateContext);
    if (lexical >= 0.7) return { score: lexical, relationship: "Industry named in the résumé evidence", evidence: candidateContext };
    return { score: 0, relationship: "Industry not found in the available résumé evidence" };
  }
  if (requiredFamily && candidateFamily.id === requiredFamily.id) {
    return { score: 1, relationship: `Same industry (${candidateFamily.label})`, evidence: candidateContext };
  }
  if (requiredFamily) {
    const related = INDUSTRY_FAMILIES.find((family) => family.id === requiredFamily.id)?.related ?? [];
    const reverse = INDUSTRY_FAMILIES.find((family) => family.id === candidateFamily.id)?.related ?? [];
    if (related.includes(candidateFamily.id) || reverse.includes(requiredFamily.id)) {
      return { score: 0.6, relationship: `Adjacent domain experience (${candidateFamily.label})`, evidence: candidateContext };
    }
  }
  return { score: 0.3, relationship: `Different domain (${candidateFamily.label})`, evidence: candidateContext };
}

/* ── Responsibilities ────────────────────────────────────────────────────── */

/** Canonical action verbs produced by the synonym folding in normalize.ts. */
const CANONICAL_VERBS = new Set([
  "lead", "own", "build", "design", "deliver", "deploy", "collaborate", "mentor", "hire",
  "track", "report", "plan", "document", "test", "review", "improve", "automate", "scale", "migrate",
]);

/**
 * Compares one JD responsibility with one résumé statement. Synonym folding in
 * normalize.ts means "Managed a 15-member engineering team" and "Lead
 * cross-functional engineering teams" share the tokens lead + team + engineer.
 */
export function responsibilitySimilarity(requirement: string, evidence: string): SimilarityResult {
  const required = tokenSet(requirement);
  const found = tokenSet(evidence);
  if (required.size === 0 || found.size === 0) return { score: 0, relationship: "No evidence" };

  const coverage = overlap(required, found);          // how much of the requirement is covered
  const balance = jaccard(required, found);           // penalises wildly different statements
  const lexical = diceTrigram(requirement, evidence);
  let score = Math.min(1, coverage * 0.65 + balance * 0.2 + lexical * 0.15);

  /* Same action on the same object is the same responsibility, however it is phrased:
     "Lead cross-functional engineering teams" ↔ "Managed a 15-member engineering team".
     Token overlap alone under-credits this, because the descriptive words differ. */
  const sharedVerb = [...required].some((token) => CANONICAL_VERBS.has(token) && found.has(token));
  const sharedObject = [...required].some((token) => !CANONICAL_VERBS.has(token) && found.has(token));
  if (sharedVerb && sharedObject) {
    score = Math.max(score, Math.min(0.95, 0.72 + coverage * 0.18));
  }

  let relationship = "No meaningful overlap";
  if (score >= 0.8) relationship = "Same responsibility, different wording";
  else if (score >= 0.6) relationship = "Strong overlap with this responsibility";
  else if (score >= 0.4) relationship = "Partially overlapping responsibility";
  else if (score >= 0.2) relationship = "Loosely related activity";
  return { score, relationship, evidence: score > 0.2 ? evidence : undefined };
}

export function bestResponsibilityMatch(requirement: string, statements: string[]): SimilarityResult {
  let best: SimilarityResult = { score: 0, relationship: "Not found in the available résumé evidence" };
  for (const statement of statements) {
    const result = responsibilitySimilarity(requirement, statement);
    if (result.score > best.score) best = result;
  }
  return best;
}

/* ── Location & work mode ────────────────────────────────────────────────── */

export function workModeOf(text: string | null | undefined): string | null {
  const normalized = normalizeText(text);
  if (!normalized) return null;
  for (const [mode, terms] of Object.entries(WORK_MODES)) {
    if (terms.some((term) => containsTerm(normalized, term))) return mode;
  }
  return null;
}

/** City / region comparison with a remote-work override. */
export function locationSimilarity(
  jobLocation: string | null | undefined,
  jobWorkMode: string | null | undefined,
  candidateLocations: string[],
): SimilarityResult {
  const mode = workModeOf(jobWorkMode);
  if (mode === "remote") return { score: 1, relationship: "Remote role — location not a constraint" };
  if (!normalizeText(jobLocation)) return { score: 1, relationship: "No location requirement" };

  let best: SimilarityResult = { score: 0, relationship: "Location not found in the available résumé evidence" };
  for (const location of candidateLocations) {
    if (!normalizeText(location)) continue;
    const lexical = lexicalSimilarity(jobLocation ?? "", location);
    if (containsTerm(location, jobLocation ?? "") || containsTerm(jobLocation ?? "", location)) {
      return { score: 1, relationship: "Based in the job location", evidence: location };
    }
    if (lexical > best.score) {
      best = {
        score: lexical,
        relationship: lexical >= 0.6 ? "Nearby or similarly named location" : "Different location",
        evidence: location,
      };
    }
  }
  if (mode === "hybrid" && best.score < 0.5) {
    return { ...best, score: Math.max(best.score, 0.4), relationship: `${best.relationship} — hybrid role, confirm relocation` };
  }
  return best;
}
