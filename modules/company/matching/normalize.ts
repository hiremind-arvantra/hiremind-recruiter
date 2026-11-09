/* ─────────────────────────────────────────────────────────────────────────────
 * Text normalisation for the semantic matcher.
 *
 * Everything the matcher compares passes through here first, so "M.Tech",
 * "M Tech" and "mtech" become the same token stream, and "Managed a 15-member
 * engineering team" and "Lead cross-functional engineering teams" share tokens
 * ("manage/lead" → lead, "team" → team).
 * ───────────────────────────────────────────────────────────────────────────── */

import { DEGREE_ALIASES, DEGREE_LEVEL_RANK, FIELD_FAMILIES, type DegreeLevel } from "./taxonomy";

const STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "of", "for", "to", "in", "on", "with", "by", "at", "as", "is", "are",
  "be", "been", "was", "were", "from", "that", "this", "these", "those", "it", "its", "into", "across",
  "over", "under", "per", "via", "using", "use", "used", "within", "their", "our", "your", "you", "we",
  "will", "must", "should", "can", "able", "strong", "good", "excellent", "proven", "hands", "plus",
  "etc", "including", "include", "includes", "such", "other", "others", "years", "year", "yrs", "yr",
  "experience", "experienced", "knowledge", "understanding", "familiarity", "ability", "skills", "skill",
  "work", "working", "role", "job", "candidate", "candidates", "requirement", "requirements", "preferred",
  "required", "min", "minimum", "least", "more", "most", "well", "also", "new", "end",
]);

/**
 * Verbs and nouns that mean the same thing in a JD and a résumé. Both sides expand
 * to the canonical form, so "Managed a 15-member engineering team" matches
 * "Lead cross-functional engineering teams".
 */
const SYNONYMS: Record<string, string> = {
  // leading / owning
  managed: "lead", manage: "lead", managing: "lead", management: "lead", led: "lead", leads: "lead",
  leading: "lead", headed: "lead", head: "lead", heading: "lead", supervised: "lead", supervising: "lead",
  directed: "lead", directing: "lead", drove: "lead", drive: "lead", driving: "lead", spearheaded: "lead",
  owned: "own", own: "own", owning: "own", ownership: "own", accountable: "own", responsible: "own",
  // building
  built: "build", build: "build", building: "build", developed: "build", develop: "build",
  developing: "build", implemented: "build", implement: "build", implementing: "build", created: "build",
  create: "build", creating: "build", designed: "design", design: "design", designing: "design",
  architected: "design", architecture: "design", engineered: "build",
  prepared: "build", prepare: "build", preparing: "build", produced: "build", produce: "build",
  wrote: "document", write: "document", writing: "document", authored: "document",
  maintained: "own", maintain: "own", maintaining: "own",
  // delivery
  delivered: "deliver", deliver: "deliver", delivering: "deliver", delivery: "deliver",
  shipped: "deliver", ship: "deliver", launched: "deliver", launch: "deliver", released: "deliver",
  deployed: "deploy", deploy: "deploy", deployment: "deploy",
  // collaboration
  collaborated: "collaborate", collaborate: "collaborate", collaboration: "collaborate",
  partnered: "collaborate", partner: "collaborate", coordinated: "collaborate", coordinate: "collaborate",
  liaised: "collaborate", worked: "collaborate", cross: "crossfunctional", functional: "crossfunctional",
  crossfunctional: "crossfunctional", interdisciplinary: "crossfunctional",
  // people
  team: "team", teams: "team", squad: "team", squads: "team", group: "team", groups: "team",
  member: "team", members: "team", engineers: "engineer", engineer: "engineer", developers: "engineer",
  developer: "engineer", mentored: "mentor", mentor: "mentor", mentoring: "mentor", coached: "mentor",
  coaching: "mentor", trained: "mentor", training: "mentor", hiring: "hire", hired: "hire", recruit: "hire",
  // stakeholders
  customer: "client", customers: "client", clients: "client", client: "client", stakeholder: "client",
  stakeholders: "client", vendor: "client", vendors: "client", account: "client", accounts: "client",
  // planning / tracking
  timeline: "schedule", timelines: "schedule", schedule: "schedule", schedules: "schedule",
  scheduling: "schedule", roadmap: "schedule", roadmaps: "schedule", milestone: "schedule",
  milestones: "schedule", sprint: "schedule", sprints: "schedule", backlog: "schedule",
  tracked: "track", track: "track", tracking: "track", monitored: "track", monitor: "track",
  monitoring: "track", reported: "report", report: "report", reporting: "report", dashboards: "report",
  planned: "plan", plan: "plan", planning: "plan", estimation: "plan", estimating: "plan",
  // documentation & quality
  documentation: "document", documented: "document", document: "document", documenting: "document",
  specs: "document", specification: "document", specifications: "document",
  tested: "test", test: "test", testing: "test", qa: "test", quality: "test",
  reviewed: "review", review: "review", reviews: "review", reviewing: "review",
  // improvement & impact
  improved: "improve", improve: "improve", improving: "improve", optimised: "improve",
  optimized: "improve", optimising: "improve", optimizing: "improve", optimisation: "improve",
  optimization: "improve", enhanced: "improve", increased: "improve", reduced: "improve",
  automated: "automate", automate: "automate", automation: "automate", streamlined: "improve",
  scaled: "scale", scale: "scale", scaling: "scale", migrated: "migrate", migration: "migrate",
  // product / project words
  project: "project", projects: "project", programme: "project", programmes: "project",
  program: "project", programs: "project", product: "product", products: "product",
  feature: "product", features: "product", platform: "platform", platforms: "platform",
  system: "system", systems: "system", service: "service", services: "service",
  application: "application", applications: "application", apps: "application", app: "application",
  // budget & business
  budget: "budget", budgets: "budget", budgeting: "budget", cost: "budget", costs: "budget",
  revenue: "revenue", profit: "revenue", growth: "revenue", roi: "revenue",
};

/** Lower-cases, strips punctuation and collapses whitespace. "M.Tech, AI" → "m tech ai". */
export function normalizeText(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .toLowerCase()
    .replace(/[‘’“”]/g, "")
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .replace(/\.(?=\s|$)/g, " ")
    .replace(/[._/\\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Very small suffix stemmer — enough to join "engineering"/"engineers"/"engineered". */
export function stem(token: string): string {
  if (token.length <= 4) return token;
  for (const suffix of ["ations", "ation", "ingly", "ing", "edly", "ed", "ers", "er", "ies", "es", "s", "ment"]) {
    if (token.endsWith(suffix) && token.length - suffix.length >= 4) {
      const base = token.slice(0, token.length - suffix.length);
      return suffix === "ies" ? `${base}y` : base;
    }
  }
  return token;
}

/** Content tokens: normalised, stop-worded, synonym-folded and stemmed. */
export function tokens(value: string | null | undefined): string[] {
  const normalized = normalizeText(value);
  if (!normalized) return [];
  return normalized
    .split(" ")
    .filter((word) => word.length > 1 && !STOPWORDS.has(word))
    .map((word) => SYNONYMS[word] ?? word)
    .map((word) => SYNONYMS[word] ?? stem(word))
    .filter(Boolean);
}

export function tokenSet(value: string | null | undefined): Set<string> {
  return new Set(tokens(value));
}

/** Character trigrams of the normalised string — catches typos and joined words. */
export function trigrams(value: string): Set<string> {
  const padded = ` ${normalizeText(value).replace(/\s+/g, " ")} `;
  const grams = new Set<string>();
  for (let i = 0; i < padded.length - 2; i++) grams.add(padded.slice(i, i + 3));
  return grams;
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const value of a) if (b.has(value)) intersection++;
  return intersection / (a.size + b.size - intersection);
}

/** Overlap coefficient — how much of the *smaller* set is covered. */
export function overlap(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const value of a) if (b.has(value)) intersection++;
  return intersection / Math.min(a.size, b.size);
}

export function diceTrigram(a: string, b: string): number {
  const left = trigrams(a);
  const right = trigrams(b);
  if (left.size === 0 || right.size === 0) return 0;
  let shared = 0;
  for (const gram of left) if (right.has(gram)) shared++;
  return (2 * shared) / (left.size + right.size);
}

/** True when `phrase` contains `term` as whole words ("aws" hits "aws ec2", not "laws"). */
export function containsTerm(phrase: string, term: string): boolean {
  const haystack = ` ${normalizeText(phrase)} `;
  const needle = ` ${normalizeText(term)} `;
  return needle.trim().length > 0 && haystack.includes(needle);
}

/* ── Degrees ─────────────────────────────────────────────────────────────── */

export interface ParsedDegree {
  raw: string;
  level: DegreeLevel | null;
  levelRank: number;
  /** Field family id (see FIELD_FAMILIES), when the field of study is recognised. */
  fieldId: string | null;
  fieldText: string;
}

/**
 * "M.Tech in Artificial Intelligence and Data Science"
 *   → { level: "masters", levelRank: 4, fieldId: "data", fieldText: "artificial intelligence and data science" }
 */
export function parseDegree(value: string | null | undefined): ParsedDegree {
  const raw = (value ?? "").trim();
  const normalized = normalizeText(raw);
  const parsed: ParsedDegree = { raw, level: null, levelRank: 0, fieldId: null, fieldText: "" };
  if (!normalized) return parsed;

  // Longest alias first, so "m tech" wins over "me".
  let bestAliasLength = 0;
  for (const [level, aliases] of Object.entries(DEGREE_ALIASES) as [DegreeLevel, string[]][]) {
    for (const alias of aliases) {
      if (containsTerm(normalized, alias) && alias.length > bestAliasLength) {
        parsed.level = level;
        parsed.levelRank = DEGREE_LEVEL_RANK[level];
        bestAliasLength = alias.length;
      }
    }
  }

  // Field of study: text after "in"/"of", else the whole string minus the degree alias.
  const fieldMatch = normalized.match(/\b(?:in|of)\b\s+(.+)$/);
  parsed.fieldText = (fieldMatch ? fieldMatch[1] : normalized).trim();
  parsed.fieldId = matchFieldFamily(parsed.fieldText);
  return parsed;
}

/** Field family whose terms best cover the text, or null when unrecognised. */
export function matchFieldFamily(text: string | null | undefined): string | null {
  const normalized = normalizeText(text);
  if (!normalized) return null;
  let best: { id: string; length: number } | null = null;
  for (const family of FIELD_FAMILIES) {
    for (const term of family.terms) {
      if (containsTerm(normalized, term) && (!best || term.length > best.length)) {
        best = { id: family.id, length: term.length };
      }
    }
  }
  return best ? best.id : null;
}

/* ── Experience ──────────────────────────────────────────────────────────── */

/** Pulls a year count out of free text: "5+ years", "7 yrs", "minimum 3 years". */
export function parseYears(value: string | null | undefined): number | null {
  const normalized = normalizeText(value);
  if (!normalized) return null;
  const match = normalized.match(/(\d+(?:\.\d+)?)\s*(?:\+)?\s*(?:years?|yrs?|y)\b/);
  if (match) return Number(match[1]);
  const bare = normalized.match(/^(\d+(?:\.\d+)?)\s*\+?$/);
  return bare ? Number(bare[1]) : null;
}

/** CR, CRLF and the Unicode line/paragraph separators (built from char codes so the source stays ASCII). */
const LINE_BREAKS = new RegExp(`\\r\\n?|[${String.fromCharCode(0x2028, 0x2029)}]`, "g");

/** Section headings a JD often carries — structure, not requirements. */
const HEADING =
  /^(?:role|job|position)?\s*(?:overview|summary|description|purpose)$|^about(?: (?:the|this|us|our))?(?: (?:job|role|company|team|position))?$|^(?:key |main |core |primary )?(?:responsibilities|duties|requirements|qualifications|skills|benefits|perks)(?: and \w+)?$|^what (?:you(?:'|’)?ll|you will|we) (?:do|offer|bring|need|look for)$|^(?:who|what) (?:we are|you are)(?: looking for)?$|^(?:nice|good) to have$|^must haves?$/i;

/** Splits a responsibilities blob into individual statements. */
export function splitStatements(value: string | null | undefined): string[] {
  if (!value) return [];
  const text = value
    // Escaped line breaks from serialised or pasted text ("\n" as two characters).
    .replace(/\\r\\n|\\n|\\r/g, "\n")
    // HTML from rich-text sources: block ends and <br> are line breaks, other tags vanish.
    .replace(/<\s*br\s*\/?>|<\/\s*(?:p|li|div|h[1-6]|ul|ol)\s*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    // Old-Mac and Unicode line separators.
    .replace(LINE_BREAKS, "\n")
    // Markdown emphasis and heading markers.
    .replace(/\*\*|__/g, "\n")
    .replace(/^\s*#{1,6}\s*/gm, "")
    // A heading glued to its first sentence: "Role OverviewThe architect…".
    .replace(/([a-z])(?=(?:The|This|These|You|Your|We|Our|About)\s)/g, "$1\n")
    // Sentences whose space was lost: "environments.System Integration".
    .replace(/(?<=[a-z0-9)])\.(?=[A-Z][a-z])/g, ".\n")
    // List numbers glued between items: "states.2Stakeholder", "Responsibilities1Architecture".
    .replace(/(?<=[a-z.)])\d{1,2}\.?(?=[A-Z][a-z])/g, "\n");

  const lines = splitFlattened(text, isFlattened(value))
    .split(/\n|•|·|•|;|(?<=[a-z0-9])\.\s+(?=[A-Z])/)
    .map((line) => line.replace(/^\s*[-*\d.)\]]+\s*/, "").trim())
    .filter((line) => !METADATA.test(line))
    .map((line) =>
      line
        // "Technical Blueprints: Design end-to-end…" → the duty itself.
        .replace(/^[A-Z][\w/&-]*(?:\s+(?:[A-Z&][\w/&-]*|of|and|to|for)){0,4}:\s+(?=[A-Z])/, "")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter((line) => line.length > 8 && line.split(" ").length >= 3)
    .filter((line) => !HEADING.test(line.replace(/[:.\s]+$/, "")));

  // A short Title Case line among other lines is a section heading ("Architecture Design & Strategy").
  return lines.length > 1 ? lines.filter((line) => !isTitleCaseHeading(line)) : lines;
}

/** "Department: …", "Reporting to: …" — facts about the posting, not duties. */
const METADATA =
  /^(?:department|reporting to|reports to|employment type|job type|work (?:mode|type|location)|location|salary|compensation|ctc|experience|notice period|openings|shift|industry|job id|start date)\s*:/i;

function isTitleCaseHeading(line: string): boolean {
  const words = line.replace(/[:.]+$/, "").split(" ");
  if (words.length > 5 || /[,.;:]/.test(line.replace(/[:.]+$/, ""))) return false;
  return words.every((word) => /^[A-Z0-9&/(-]/.test(word) || /^(?:and|of|to|for|the|in|&)$/.test(word));
}

/**
 * Tech names written in camel case. Protected before splitting glued text so
 * "JavaScript" never becomes "Java" + "Script".
 */
const CAMEL_TERMS = [
  "JavaScript", "TypeScript", "CoffeeScript", "GitHub", "GitLab", "BitBucket", "PowerShell", "PowerPoint", "PowerBI",
  "LinkedIn", "DevOps", "DevSecOps", "MLOps", "DataOps", "FinOps", "GitOps", "CloudFormation", "CloudWatch", "CloudFront",
  "SageMaker", "BigQuery", "OpenShift", "WebSocket", "WebSockets", "SharePoint", "QuickBooks", "SalesForce", "HubSpot",
  "WordPress", "YouTube", "NumPy", "SciPy", "PyTorch", "TensorFlow", "DataBricks", "NetSuite", "ServiceNow", "JetBrains",
  "WebLogic", "WebSphere", "AppDynamics", "NewRelic", "TeamCity", "EventBridge", "ElasticSearch", "OpenSearch", "SnowFlake",
  "PagerDuty", "SonarQube", "DynamoDB", "MongoDB", "CouchDB", "RethinkDB", "InfluxDB", "CockroachDB", "PostgreSQL",
  "MySQL", "NoSQL", "GraphQL", "OAuth", "OpenAPI", "OpenAI", "FastAPI", "AngularJS", "NodeJS", "NextJS", "VueJS",
  "ReactJS", "ExpressJS", "NestJS", "JQuery", "iOS", "macOS", "iPhone", "iPad", "SaaS", "PaaS", "IaaS", "FinTech",
  "EdTech", "HealthTech", "InsurTech", "PropTech", "eCommerce", "ReactNative", "RabbitMQ", "ActiveMQ", "ZeroMQ",
  "HashiCorp", "LangChain", "LlamaIndex", "HuggingFace", "OpenTelemetry", "SolarWinds", "AutoCAD", "SolidWorks",
];
/** Placeholder delimiter for protected terms (a private-use character, built from its code). */
const MARK = String.fromCharCode(0xe000);
const MARKED = new RegExp(`${MARK}(\\d+)${MARK}`, "g");
const CAMEL_PATTERN = new RegExp(`\\b(?:${CAMEL_TERMS.join("|")})\\b`, "g");

/**
 * Text whose line breaks were stripped runs headings into sentences
 * ("EngineeringReporting to", "Full-timeKey Responsibilities"). Only such text —
 * a long run with no line breaks at all — is split at lower→Upper boundaries.
 */
/** A long block with no line breaks at all — its headings are almost certainly glued on. */
function isFlattened(value: string): boolean {
  return value.length > 240 && !/[\r\n]/.test(value) && !/<\s*(?:br|p|li)\b/i.test(value);
}

function splitFlattened(text: string, flattened: boolean): string {
  if (!flattened) return text;
  const kept: string[] = [];
  const shielded = text.replace(CAMEL_PATTERN, (term) => {
    kept.push(term);
    return `${MARK}${kept.length - 1}${MARK}`;
  });
  return shielded
    .replace(/(?<=[a-z)])(?=[A-Z][a-z]{2,})/g, "\n")
    .replace(MARKED, (_, index: string) => kept[Number(index)]);
}
