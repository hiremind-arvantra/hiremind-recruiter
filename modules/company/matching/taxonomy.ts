/* ─────────────────────────────────────────────────────────────────────────────
 * Matching taxonomy — the normalised vocabularies the semantic matcher reasons over.
 *
 * Nothing here is a hard-coded answer list: every entry is a *concept* with aliases,
 * members (narrower concepts that evidence it) and related concepts. Unknown terms
 * still match through the lexical layer in similarity.ts, so the taxonomy improves
 * precision without being a prerequisite.
 *
 * Extend by adding entries — no matcher code changes are needed.
 * ───────────────────────────────────────────────────────────────────────────── */

/** How a JD requirement relates to the candidate's evidence. Never a boolean. */
export type MatchClass =
  | "EXACT"
  | "STRONG_SEMANTIC"
  | "RELATED"
  | "PARTIAL"
  | "WEAK"
  | "NO_EVIDENCE";

/** Ordered so a higher level satisfies a lower requirement (a PhD satisfies "Master's"). */
export const DEGREE_LEVEL_RANK = {
  secondary: 1,
  diploma: 2,
  bachelors: 3,
  masters: 4,
  doctorate: 5,
} as const;

export type DegreeLevel = keyof typeof DEGREE_LEVEL_RANK;

/**
 * Degree spellings seen in résumés and JDs, normalised (lower case, punctuation
 * stripped, so "M.Tech" arrives as "m tech").
 */
export const DEGREE_ALIASES: Record<DegreeLevel, string[]> = {
  doctorate: ["phd", "ph d", "dphil", "d phil", "doctorate", "doctoral", "doctor of philosophy"],
  masters: [
    "masters", "master", "master s", "masters degree", "post graduate", "postgraduate", "pg",
    "m tech", "mtech", "m e", "me", "m sc", "msc", "m s", "ms", "mca", "mba", "ma", "m com", "mcom",
    "m phil", "mphil", "m arch", "llm", "md",
  ],
  bachelors: [
    "bachelors", "bachelor", "bachelor s", "bachelors degree", "under graduate", "undergraduate", "ug",
    "b tech", "btech", "b e", "be", "b sc", "bsc", "b s", "bs", "bca", "ba", "b com", "bcom",
    "b arch", "llb", "mbbs",
  ],
  diploma: ["diploma", "polytechnic", "advanced diploma", "pg diploma", "pgd", "certificate course"],
  secondary: ["high school", "higher secondary", "hsc", "ssc", "12th", "10th", "intermediate"],
};

/** Field-of-study families. `related` names other families that are adjacent, not equal. */
export interface FieldFamily {
  id: string;
  label: string;
  terms: string[];
  related?: string[];
}

export const FIELD_FAMILIES: FieldFamily[] = [
  {
    id: "computing",
    label: "Computing & Software",
    terms: [
      "computer science", "computer engineering", "cs", "cse", "information technology", "it",
      "software engineering", "computer applications", "computing", "information systems",
    ],
    related: ["data", "electronics"],
  },
  {
    id: "data",
    label: "Data & AI",
    terms: [
      "artificial intelligence", "ai", "machine learning", "ml", "data science", "data analytics",
      "data engineering", "deep learning", "statistics", "applied mathematics",
    ],
    related: ["computing", "mathematics"],
  },
  {
    id: "electronics",
    label: "Electronics & Communication",
    terms: ["electronics", "electronics and communication", "ece", "electrical", "eee", "instrumentation", "embedded systems"],
    related: ["computing"],
  },
  {
    id: "mathematics",
    label: "Mathematics",
    terms: ["mathematics", "maths", "applied mathematics", "statistics", "operations research"],
    related: ["data"],
  },
  {
    id: "business",
    label: "Business & Management",
    terms: ["business administration", "business management", "management", "mba", "commerce", "operations", "human resources", "hr"],
    related: ["finance", "marketing"],
  },
  { id: "finance", label: "Finance & Accounting", terms: ["finance", "accounting", "financial management", "economics", "banking"], related: ["business"] },
  { id: "marketing", label: "Marketing", terms: ["marketing", "digital marketing", "advertising", "communications"], related: ["business", "design"] },
  { id: "design", label: "Design", terms: ["design", "product design", "graphic design", "user experience", "ux", "ui", "interaction design", "fine arts"], related: ["marketing"] },
  { id: "mechanical", label: "Mechanical & Civil", terms: ["mechanical", "mechanical engineering", "civil", "civil engineering", "production", "manufacturing", "automobile"] },
  { id: "life-sciences", label: "Life Sciences & Healthcare", terms: ["biotechnology", "biomedical", "life sciences", "pharmacy", "medicine", "nursing", "healthcare"] },
];

/**
 * Skill / technology concepts.
 *  - `aliases`  — other spellings of the *same* concept (React ≡ React.js)
 *  - `members`  — narrower things that constitute evidence for it (TensorFlow evidences ML)
 *  - `related`  — adjacent concepts (transferable, not equivalent)
 */
export interface SkillConcept {
  id: string;
  label: string;
  aliases: string[];
  members?: string[];
  related?: string[];
}

export const SKILL_CONCEPTS: SkillConcept[] = [
  // ── Languages ──────────────────────────────────────────────────────────────
  { id: "python", label: "Python", aliases: ["python", "python programming", "python3", "py"], related: ["ml", "backend", "data-eng"] },
  { id: "javascript", label: "JavaScript", aliases: ["javascript", "js", "es6", "ecmascript"], related: ["typescript", "frontend", "node"] },
  { id: "typescript", label: "TypeScript", aliases: ["typescript", "ts"], related: ["javascript", "frontend"] },
  { id: "java", label: "Java", aliases: ["java", "core java", "java se"], members: ["spring", "spring boot", "hibernate", "jpa"], related: ["backend"] },
  { id: "csharp", label: "C#", aliases: ["c sharp", "c#", "dotnet", ".net", "asp net"], related: ["backend"] },
  { id: "go", label: "Go", aliases: ["go", "golang"], related: ["backend"] },

  // ── Frontend ───────────────────────────────────────────────────────────────
  { id: "react", label: "React", aliases: ["react", "react js", "reactjs", "react.js"], members: ["next js", "nextjs", "redux", "react hooks", "react native"], related: ["frontend", "javascript", "typescript"] },
  { id: "angular", label: "Angular", aliases: ["angular", "angular js", "angularjs"], related: ["frontend", "typescript"] },
  { id: "vue", label: "Vue", aliases: ["vue", "vue js", "vuejs"], related: ["frontend", "javascript"] },
  {
    id: "frontend",
    label: "Frontend development",
    aliases: ["frontend", "front end", "front end development", "ui development", "web development", "client side development"],
    members: ["react", "angular", "vue", "html", "css", "tailwind", "next js", "svelte", "javascript"],
  },

  // ── Backend & APIs ─────────────────────────────────────────────────────────
  {
    id: "restapi",
    label: "REST API development",
    aliases: ["rest api", "rest apis", "restful api", "restful apis", "rest api development", "api development", "web services"],
    members: ["fastapi", "flask", "django rest framework", "express", "express js", "spring boot", "graphql", "grpc", "openapi", "swagger"],
    related: ["backend", "microservices"],
  },
  {
    id: "backend",
    label: "Backend development",
    aliases: ["backend", "back end", "back end development", "server side development", "server side"],
    members: ["restapi", "microservices", "node", "spring boot", "django", "fastapi", "flask", "express"],
  },
  { id: "node", label: "Node.js", aliases: ["node", "node js", "nodejs", "node.js"], members: ["express", "nest js", "nestjs"], related: ["javascript", "backend"] },
  { id: "microservices", label: "Microservices", aliases: ["microservices", "micro services", "service oriented architecture", "soa"], related: ["backend", "cloud", "devops"] },

  // ── Data & AI ──────────────────────────────────────────────────────────────
  {
    id: "ml",
    label: "Machine Learning",
    aliases: ["machine learning", "ml", "applied machine learning", "predictive modelling", "predictive modeling"],
    members: ["scikit learn", "sklearn", "tensorflow", "pytorch", "keras", "xgboost", "model training", "model deployment", "deep learning", "nlp", "natural language processing", "computer vision", "llm", "mlops"],
    related: ["python", "data-science", "data-eng"],
  },
  { id: "data-science", label: "Data Science", aliases: ["data science", "data scientist", "data analysis", "data analytics", "analytics"], members: ["pandas", "numpy", "statistics", "a b testing", "visualisation", "visualization", "power bi", "tableau"], related: ["ml", "data-eng"] },
  { id: "data-eng", label: "Data Engineering", aliases: ["data engineering", "etl", "elt", "data pipelines", "big data"], members: ["spark", "airflow", "kafka", "hadoop", "dbt", "snowflake", "databricks"], related: ["data-science", "cloud", "sql"] },
  { id: "sql", label: "SQL", aliases: ["sql", "structured query language", "relational databases", "rdbms"], members: ["postgres", "mysql", "oracle", "sql server", "t sql", "pl sql"], related: ["data-eng"] },
  { id: "postgres", label: "PostgreSQL", aliases: ["postgresql", "postgres", "psql", "postgre sql"], related: ["sql"] },
  { id: "nosql", label: "NoSQL", aliases: ["nosql", "no sql", "document database"], members: ["mongodb", "mongo", "dynamodb", "cassandra", "redis", "elasticsearch"], related: ["sql"] },

  // ── Cloud & platform ───────────────────────────────────────────────────────
  {
    id: "cloud",
    label: "Cloud",
    aliases: ["cloud", "cloud computing", "cloud experience", "cloud platforms", "cloud native"],
    members: ["aws", "amazon web services", "ec2", "s3", "lambda", "azure", "gcp", "google cloud", "cloud formation", "cloudfront", "eks", "rds"],
    related: ["devops", "microservices"],
  },
  { id: "aws", label: "AWS", aliases: ["aws", "amazon web services"], members: ["ec2", "s3", "lambda", "rds", "eks", "cloudwatch", "sqs", "sns", "dynamodb"], related: ["cloud", "devops"] },
  { id: "devops", label: "DevOps", aliases: ["devops", "dev ops", "site reliability engineering", "sre", "ci cd", "continuous integration", "continuous delivery"], members: ["docker", "kubernetes", "k8s", "jenkins", "github actions", "gitlab ci", "terraform", "ansible", "helm"], related: ["cloud"] },
  { id: "kubernetes", label: "Kubernetes", aliases: ["kubernetes", "k8s", "container orchestration"], related: ["devops", "docker"] },
  { id: "docker", label: "Docker", aliases: ["docker", "containers", "containerisation", "containerization"], related: ["devops", "kubernetes"] },

  // ── Ways of working / functional ───────────────────────────────────────────
  { id: "agile", label: "Agile delivery", aliases: ["agile", "scrum", "kanban", "sprint planning", "agile methodology", "safe"], related: ["project-management"] },
  { id: "project-management", label: "Project management", aliases: ["project management", "project delivery", "delivery management", "programme management", "program management"], members: ["agile", "risk management", "stakeholder management", "budget management", "resource planning", "jira", "ms project"], related: ["leadership", "product-management"] },
  { id: "product-management", label: "Product management", aliases: ["product management", "product ownership", "product owner", "roadmap"], related: ["project-management", "stakeholder"] },
  { id: "leadership", label: "Leadership", aliases: ["leadership", "team leadership", "people management", "team management", "mentoring", "coaching", "line management"], members: ["hiring", "performance reviews", "one on ones", "team building"], related: ["project-management", "stakeholder"] },
  { id: "stakeholder", label: "Stakeholder management", aliases: ["stakeholder management", "client management", "customer engagement", "account management", "vendor management", "client communication"], related: ["leadership", "project-management"] },
  { id: "testing", label: "Testing & QA", aliases: ["testing", "qa", "quality assurance", "test automation", "unit testing", "automation testing"], members: ["jest", "pytest", "selenium", "cypress", "junit", "playwright"] },
  { id: "security", label: "Security", aliases: ["security", "application security", "cyber security", "infosec", "appsec"], members: ["owasp", "penetration testing", "iam", "encryption"] },
  { id: "design-skill", label: "Product design", aliases: ["ui design", "ux design", "user experience", "product design", "interaction design", "wireframing", "prototyping"], members: ["figma", "sketch", "adobe xd", "design systems"] },
];

/** Job-title families. Titles inside a family describe the same kind of work. */
export interface TitleFamily {
  id: string;
  label: string;
  terms: string[];
  related?: string[];
}

export const TITLE_FAMILIES: TitleFamily[] = [
  { id: "swe", label: "Software engineering", terms: ["software engineer", "software developer", "developer", "programmer", "sde", "application developer", "full stack engineer", "full stack developer", "backend engineer", "backend developer", "frontend engineer", "frontend developer", "web developer"], related: ["ml-eng", "devops-eng", "architect"] },
  { id: "ml-eng", label: "Machine learning engineering", terms: ["ml engineer", "machine learning engineer", "ai engineer", "deep learning engineer", "mlops engineer"], related: ["swe", "data-sci"] },
  { id: "data-sci", label: "Data science", terms: ["data scientist", "applied scientist", "research scientist", "data analyst", "business analyst", "analytics engineer"], related: ["ml-eng", "data-eng-role"] },
  { id: "data-eng-role", label: "Data engineering", terms: ["data engineer", "etl developer", "big data engineer", "analytics engineer"], related: ["data-sci", "swe"] },
  { id: "devops-eng", label: "DevOps & platform", terms: ["devops engineer", "site reliability engineer", "sre", "platform engineer", "infrastructure engineer", "cloud engineer"], related: ["swe"] },
  { id: "architect", label: "Architecture", terms: ["software architect", "solution architect", "technical architect", "principal engineer", "staff engineer"], related: ["swe", "eng-lead"] },
  { id: "eng-lead", label: "Engineering leadership", terms: ["engineering manager", "technical lead", "tech lead", "team lead", "development manager", "head of engineering", "director of engineering", "vp engineering"], related: ["architect", "delivery"] },
  { id: "delivery", label: "Project & programme delivery", terms: ["project manager", "programme manager", "program manager", "delivery manager", "scrum master", "project lead", "pmo"], related: ["eng-lead", "product"] },
  { id: "product", label: "Product", terms: ["product manager", "product owner", "associate product manager", "head of product"], related: ["delivery", "design-role"] },
  { id: "design-role", label: "Design", terms: ["ux designer", "ui designer", "product designer", "interaction designer", "visual designer"], related: ["product"] },
  { id: "qa-role", label: "Quality engineering", terms: ["qa engineer", "test engineer", "sdet", "automation engineer", "quality analyst"], related: ["swe"] },
  { id: "recruiting", label: "Talent & HR", terms: ["recruiter", "talent acquisition specialist", "hr manager", "hr business partner", "talent partner"] },
];

/** Industry / domain families. */
export interface IndustryFamily {
  id: string;
  label: string;
  terms: string[];
  related?: string[];
}

export const INDUSTRY_FAMILIES: IndustryFamily[] = [
  { id: "fintech", label: "Financial services & FinTech", terms: ["fintech", "financial services", "banking", "insurance", "insurtech", "payments", "capital markets", "wealth management"], related: ["saas", "ecommerce"] },
  { id: "healthcare", label: "Healthcare & Life sciences", terms: ["healthcare", "health care", "healthtech", "medical", "hospital", "pharma", "pharmaceutical", "life sciences", "clinical", "biotech"], related: ["saas"] },
  { id: "saas", label: "Software & SaaS", terms: ["saas", "software", "product company", "technology", "it services", "enterprise software", "b2b software", "cloud software"], related: ["fintech", "ecommerce", "healthcare"] },
  { id: "ecommerce", label: "E-commerce & Retail", terms: ["ecommerce", "e commerce", "retail", "marketplace", "d2c", "consumer internet", "quick commerce"], related: ["saas", "logistics"] },
  { id: "logistics", label: "Logistics & Supply chain", terms: ["logistics", "supply chain", "transportation", "shipping", "warehousing", "mobility"], related: ["ecommerce", "manufacturing"] },
  { id: "manufacturing", label: "Manufacturing & Industrial", terms: ["manufacturing", "industrial", "automotive", "aerospace", "energy", "oil and gas", "utilities"], related: ["logistics"] },
  { id: "edtech", label: "Education & EdTech", terms: ["edtech", "education", "e learning", "university", "training"], related: ["saas"] },
  { id: "media", label: "Media & Entertainment", terms: ["media", "entertainment", "gaming", "streaming", "publishing", "advertising"], related: ["saas"] },
  { id: "consulting", label: "Consulting & Services", terms: ["consulting", "professional services", "advisory", "staffing", "recruitment", "outsourcing"], related: ["saas"] },
  { id: "public", label: "Public sector & Non-profit", terms: ["government", "public sector", "defence", "defense", "non profit", "ngo"] },
];

/** Certifications recognised by name, so "PMP" in a JD can be looked for precisely. */
export const CERTIFICATION_HINTS: string[] = [
  "pmp", "prince2", "csm", "certified scrum master", "safe", "itil", "cissp", "ceh", "comptia",
  "aws certified", "azure certified", "gcp certified", "google cloud certified", "cka", "ckad",
  "tensorflow developer", "databricks certified", "snowflake certified", "cfa", "cpa", "six sigma",
  "togaf", "pmi acp", "oracle certified", "salesforce certified",
];

/** Work-mode vocabulary (JD "Remote" vs candidate "Open to remote"). */
export const WORK_MODES: Record<string, string[]> = {
  remote: ["remote", "work from home", "wfh", "fully remote", "distributed"],
  hybrid: ["hybrid", "partly remote", "flexible"],
  onsite: ["on site", "onsite", "in office", "office based", "work from office"],
};
