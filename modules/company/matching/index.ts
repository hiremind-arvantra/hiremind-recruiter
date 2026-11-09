/* Public surface of the candidate ↔ job matching module.
 * UI code should import from here, never from the internals. */

export { computeMatchAnalysis, summarizeMatch, type MatchSummary } from "./engine";
export {
  CATEGORY_DEFINITIONS,
  CATEGORY_IDS,
  DEFAULT_WEIGHTS,
  categoryDefinition,
  importanceLabel,
  isValidWeights,
  normalizeWeights,
  rebalanceWeights,
  totalWeight,
  type CategoryDefinition,
} from "./weights";
export { CLASS_LABEL, CLASS_TONE, classify, toPercent } from "./classify";
export {
  getMatchAnalysis,
  getMatchSummary,
  relevantExperienceYears,
  localMatchAnalysisProvider,
  setMatchAnalysisProvider,
  currentProviderIsLocal,
  toCandidateEvidence,
  toJobRequirements,
  type MatchAnalysisProvider,
} from "./matchAnalysis.service";
export {
  browserMatchConfigStore,
  loadDefaultWeights,
  loadJobWeights,
  saveDefaultWeights,
  saveJobWeights,
  setMatchConfigStore,
  type MatchConfigStore,
  type ResolvedWeights,
} from "./matchConfig.service";
export type {
  CandidateEvidenceInput,
  CategoryId,
  CategoryResult,
  Gap,
  Highlight,
  InterviewFocusArea,
  JobRequirementsInput,
  MatchAnalysis,
  MatchClass,
  MatchWeights,
  RequirementMatch,
} from "./types";
