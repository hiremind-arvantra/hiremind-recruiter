/* ─────────────────────────────────────────────────────────────────────────────
 * Acceptance tests for the semantic matching engine.
 *
 * Run:  npm run test:matching
 * (compiles this folder with tsc and executes the compiled test — no test runner
 * dependency is added to the app.)
 *
 * Every case here exists because a naive string comparison gets it wrong.
 * ───────────────────────────────────────────────────────────────────────────── */

import { classify } from "./classify";
import { computeMatchAnalysis } from "./engine";
import { splitStatements } from "./normalize";
import { estimateSkillYears, skillKey } from "./skillExperience";
import {
  bestDegreeMatch,
  bestSkillMatch,
  degreeSimilarity,
  industrySimilarity,
  responsibilitySimilarity,
  titleSimilarity,
} from "./similarity";
import { DEFAULT_WEIGHTS, isValidWeights, rebalanceWeights, totalWeight } from "./weights";
import type { CandidateEvidenceInput, JobRequirementsInput, MatchClass } from "./types";

interface Case {
  name: string;
  run: () => { pass: boolean; detail: string };
}

const atLeast = (actual: MatchClass, expected: MatchClass): boolean => {
  const order: MatchClass[] = ["NO_EVIDENCE", "WEAK", "PARTIAL", "RELATED", "STRONG_SEMANTIC", "EXACT"];
  return order.indexOf(actual) >= order.indexOf(expected);
};

const cases: Case[] = [
  {
    name: "CASE 1 — JD 'Master's degree' vs résumé 'M.Tech' is a strong match, not 0%",
    run: () => {
      const result = degreeSimilarity("Master's degree", "M.Tech");
      const matchClass = classify(result.score);
      return {
        pass: result.levelScore === 1 && atLeast(matchClass, "RELATED") && result.score > 0.6,
        detail: `score=${result.score.toFixed(2)} class=${matchClass} level="${result.levelRelationship}"`,
      };
    },
  },
  {
    name: "CASE 2 — 'Bachelor's in Computer Science' vs 'B.Tech Computer Science' is strong",
    run: () => {
      const result = degreeSimilarity("Bachelor's degree in Computer Science", "B.Tech Computer Science");
      return {
        pass: atLeast(classify(result.score), "STRONG_SEMANTIC"),
        detail: `score=${result.score.toFixed(2)} level="${result.levelRelationship}" field="${result.fieldRelationship}"`,
      };
    },
  },
  {
    name: "CASE 2b — Master's in CS vs M.Tech in AI: master's level holds, field is related",
    run: () => {
      const result = degreeSimilarity("Master's degree in Computer Science", "M.Tech in Artificial Intelligence and Data Science");
      return {
        pass: result.levelScore === 1 && result.fieldScore >= 0.6 && result.score >= 0.7,
        detail: `score=${result.score.toFixed(2)} levelScore=${result.levelScore} fieldScore=${result.fieldScore.toFixed(2)} (${result.fieldRelationship})`,
      };
    },
  },
  {
    name: "CASE 2c — Master's in CS vs M.Tech Mechanical: level matches, field does not",
    run: () => {
      const result = degreeSimilarity("Master's degree in Computer Science", "M.Tech in Mechanical Engineering");
      return {
        pass: result.levelScore === 1 && result.fieldScore <= 0.5,
        detail: `levelScore=${result.levelScore} fieldScore=${result.fieldScore.toFixed(2)} (${result.fieldRelationship})`,
      };
    },
  },
  {
    name: "CASE 3 — 'Python' vs 'Python programming' is a strong match",
    run: () => {
      const result = bestSkillMatch("Python", ["Python programming", "Excel"]);
      return { pass: atLeast(classify(result.score), "STRONG_SEMANTIC"), detail: `score=${result.score.toFixed(2)} (${result.relationship})` };
    },
  },
  {
    name: "CASE 4 — 'React' vs 'React.js' is a strong match",
    run: () => {
      const result = bestSkillMatch("React", ["React.js"]);
      return { pass: atLeast(classify(result.score), "STRONG_SEMANTIC"), detail: `score=${result.score.toFixed(2)} (${result.relationship})` };
    },
  },
  {
    name: "CASE 4b — 'PostgreSQL' vs 'Postgres' is a strong match",
    run: () => {
      const result = bestSkillMatch("PostgreSQL", ["Postgres"]);
      return { pass: atLeast(classify(result.score), "STRONG_SEMANTIC"), detail: `score=${result.score.toFixed(2)} (${result.relationship})` };
    },
  },
  {
    name: "CASE 5 — 'REST API development' vs 'FastAPI backend development' is related or better",
    run: () => {
      const result = bestSkillMatch("REST API development", ["FastAPI backend development"]);
      return { pass: atLeast(classify(result.score), "RELATED"), detail: `score=${result.score.toFixed(2)} (${result.relationship})` };
    },
  },
  {
    name: "CASE 5b — 'Machine Learning' is evidenced by scikit-learn / TensorFlow / PyTorch",
    run: () => {
      const result = bestSkillMatch("Machine Learning", ["scikit-learn", "TensorFlow", "PyTorch", "model training"]);
      return { pass: atLeast(classify(result.score), "STRONG_SEMANTIC"), detail: `score=${result.score.toFixed(2)} (${result.relationship})` };
    },
  },
  {
    name: "CASE 5c — 'Cloud experience' is evidenced by AWS EC2, S3, Lambda",
    run: () => {
      const result = bestSkillMatch("Cloud experience", ["AWS EC2", "S3", "Lambda"]);
      return { pass: atLeast(classify(result.score), "RELATED"), detail: `score=${result.score.toFixed(2)} (${result.relationship})` };
    },
  },
  {
    name: "CASE 6 — 5+ yrs PM required, 7 yrs total with 5 yrs PM → strong experience match",
    run: () => {
      const analysis = analyse({ experienceMinYears: 5, title: "Project Manager" }, {
        currentRole: "Project Manager",
        experienceYears: 7,
        relevantExperienceYears: 5,
      });
      const experience = category(analysis, "experience");
      return { pass: experience.score >= 85, detail: `score=${experience.score} — ${experience.summary}` };
    },
  },
  {
    name: "CASE 7 — 5+ yrs PM required, 10 yrs dev with 1 yr PM → partial experience match",
    run: () => {
      const analysis = analyse({ experienceMinYears: 5, title: "Project Manager" }, {
        currentRole: "Software Developer",
        experienceYears: 10,
        relevantExperienceYears: 1,
      });
      const experience = category(analysis, "experience");
      return {
        pass: experience.score >= 30 && experience.score <= 70,
        detail: `score=${experience.score} — ${experience.summary}`,
      };
    },
  },
  {
    name: "CASE 8 — healthcare required, FinTech SaaS résumé → adjacent, never claimed as healthcare",
    run: () => {
      const result = industrySimilarity("Healthcare", "FinTech SaaS platform for insurance clients");
      const claimsHealthcare = /same industry/i.test(result.relationship);
      return {
        pass: !claimsHealthcare && result.score > 0 && result.score < 0.8,
        detail: `score=${result.score.toFixed(2)} (${result.relationship})`,
      };
    },
  },
  {
    name: "CASE 9 — PMP required, not in résumé → 'not found in the available résumé evidence'",
    run: () => {
      const analysis = analyse(
        { title: "Project Manager", description: "PMP certification required for this role." },
        { currentRole: "Project Manager", experienceYears: 8, skills: ["Agile", "Jira"] },
      );
      const qualifications = category(analysis, "qualifications");
      const pmp = qualifications.matches.find((match) => /pmp/i.test(match.requirement));
      const wording = pmp?.relationship ?? "";
      return {
        pass: Boolean(pmp) && pmp!.matchClass === "NO_EVIDENCE" && /not found in the available résumé evidence/i.test(wording),
        detail: pmp ? `"${pmp.requirement}" → ${pmp.matchClass}: ${wording}` : "PMP requirement was not extracted from the JD",
      };
    },
  },
  {
    name: "CASE 9b — a certification is named from its own sentence, not the previous one",
    run: () => {
      const analysis = analyse(
        { title: "Senior Software Engineer", description: "We are hiring a senior engineer. AWS certification preferred." },
        { currentRole: "Software Engineer", experienceYears: 8, skills: ["Python"] },
      );
      const labels = category(analysis, "qualifications").matches.map((match) => match.requirement);
      return {
        pass: labels.some((label) => /^AWS certification$/i.test(label)) && !labels.some((label) => /engineer/i.test(label)),
        detail: `requirements=[${labels.join(" | ")}]`,
      };
    },
  },
  {
    name: "CASE 9c — using AWS is not evidence of holding an AWS certification",
    run: () => {
      const job = { title: "Solution Architect", description: "We are hiring an architect. AWS certification preferred." };
      const usesAws = analyse(job, {
        currentRole: "Software Developer",
        experienceYears: 8,
        skills: ["AWS"],
        summary: "Built cloud-native applications on AWS and Azure.",
      });
      const certified = analyse(job, {
        currentRole: "Software Developer",
        experienceYears: 8,
        skills: ["AWS"],
        summary: "AWS Certified Solutions Architect with 8 years on AWS.",
      });
      const find = (analysis: ReturnType<typeof analyse>) =>
        category(analysis, "qualifications").matches.find((match) => /aws certification/i.test(match.requirement));
      const bare = find(usesAws);
      const named = find(certified);
      return {
        pass: bare?.matchClass === "NO_EVIDENCE" && Boolean(named) && named!.score >= 0.9,
        detail: `uses AWS → ${bare?.matchClass}; states certification → ${named?.matchClass}`,
      };
    },
  },
  {
    name: "JD TEXT — headings, HTML, lone CRs and glued headings split into clean statements",
    run: () => {
      const inputs = [
        "Role Overview\rThe Solution Architect bridges business and technology teams.\rDesign scalable cloud solutions",
        "<p><strong>Role Overview</strong></p><p>The Solution Architect bridges business and technology teams.</p><ul><li>Design scalable cloud solutions</li></ul>",
        "Role OverviewThe Solution Architect bridges business and technology teams. Design scalable cloud solutions",
        "**Key Responsibilities:**\\n- Design scalable cloud solutions\\n- Build JavaScript and TypeScript services on GitLab CI",
      ];
      const outputs = inputs.map((input) => splitStatements(input));
      const clean = outputs.every(
        (lines) =>
          lines.length > 0 &&
          lines.every((line) => !/overview|responsibilities|<|\*|\r|\\/i.test(line)) &&
          lines.includes("Design scalable cloud solutions"),
      );
      const keepsCamelCase = outputs[3].includes("Build JavaScript and TypeScript services on GitLab CI");
      return {
        pass: clean && keepsCamelCase,
        detail: outputs.map((lines) => `[${lines.join(" | ")}]`).join(" "),
      };
    },
  },
  {
    name: "JD TEXT — description prose is not treated as a responsibility to evidence",
    run: () => {
      const analysis = analyse(
        {
          title: "Solution Architect",
          description: [
            "Role Overview",
            "The Solution Architect bridges business and technology teams.",
            "We are a fast-growing SaaS company.",
            "Design and develop scalable cloud solutions on AWS",
            "Mentor junior developers",
          ].join("\n"),
        },
        { currentRole: "Software Developer", experienceYears: 8, summary: "Built cloud solutions on AWS." },
      );
      const requirements = category(analysis, "responsibilities").matches.map((match) => match.requirement);
      const prose = requirements.filter((line) => /^(the solution architect|we are|role overview)/i.test(line));
      return {
        pass: prose.length === 0 && requirements.includes("Mentor junior developers") && requirements.length === 2,
        detail: `responsibilities=[${requirements.join(" | ")}]`,
      };
    },
  },
  {
    name: "JD TEXT — a description with its line breaks stripped still splits into duties",
    run: () => {
      const flattened =
        "Department: Information Technology / EngineeringReporting to: Director of Enterprise Architecture / Chief Technology Officer (CTO)" +
        "Employment Type: Full-timeKey Responsibilities1Architecture Design & StrategyTechnical Blueprints: Design end-to-end, high-performance, " +
        "secure, and resilient architectural frameworks for both cloud and hybrid environments.System Integration: Map data flows and outline " +
        "integrations between new software, legacy internal systems, and third-party SaaS platforms.Tech Stack Evaluation: Research and select " +
        "tools, languages, and frameworks that balance cost, efficiency, and scale.Future-Proofing: Define transition roadmaps from legacy " +
        "architectures to scalable modern target states.2Stakeholder CollaborationGuide JavaScript and TypeScript teams on GitHub.";
      const lines = splitStatements(flattened).map((line) => line.replace(/\.$/, ""));
      const expected = [
        "Design end-to-end, high-performance, secure, and resilient architectural frameworks for both cloud and hybrid environments.",
        "Map data flows and outline integrations between new software, legacy internal systems, and third-party SaaS platforms.",
        "Research and select tools, languages, and frameworks that balance cost, efficiency, and scale.",
        "Define transition roadmaps from legacy architectures to scalable modern target states.",
        "Guide JavaScript and TypeScript teams on GitHub.",
      ];
      const noise = lines.filter((line) => /department|reporting to|employment type|key responsibilities|architecture design & strategy|stakeholder collaboration$/i.test(line));
      return {
        pass:
          expected.every((line) => lines.includes(line.replace(/\.$/, ""))) &&
          noise.length === 0 &&
          lines.length === expected.length,
        detail: `[${lines.join(" | ")}]`,
      };
    },
  },
  {
    name: "SKILL YEARS — a skill never listed is found in dated work, with overlaps merged",
    run: () => {
      const now = new Date("2026-01-01");
      const years = estimateSkillYears(
        ["Python", "PostgreSQL"],
        [{ name: "Excel", experienceYears: 5 }],
        [
          { label: "Acme", text: "Data Engineer. Built ingestion pipelines in Python for the analytics team", start: "2019-01-01", end: "2023-01-01", ongoing: false },
          // Overlaps the Acme role for a year: must not be counted twice.
          { label: "Pipeline rewrite", text: "Pipeline rewrite. Technologies used: Python, FastAPI, Postgres", start: "2022-01-01", end: "2024-01-01", ongoing: false },
        ],
        now,
      );
      const python = years[skillKey("Python")];
      const postgres = years[skillKey("PostgreSQL")];
      return {
        pass:
          python?.source === "work-history" && Math.abs(python.years - 5) < 0.1 &&
          postgres?.source === "work-history" && Math.abs(postgres.years - 2) < 0.1,
        detail: `python=${python?.years} (${python?.basis}) · postgres=${postgres?.years}`,
      };
    },
  },
  {
    name: "SKILL YEARS — time with a related tool is not credited to the family (Terraform ≠ CI/CD)",
    run: () => {
      const years = estimateSkillYears(
        ["CI/CD", "AWS"],
        [],
        [{ label: "Acme", text: "Led infrastructure-as-code with Terraform and built AWS landing zones", start: "2020-01-01", end: "2024-01-01", ongoing: false }],
        new Date("2026-01-01"),
      );
      return {
        pass: years[skillKey("CI/CD")] === undefined && Math.abs((years[skillKey("AWS")]?.years ?? 0) - 4) < 0.1,
        detail: `ci/cd=${years[skillKey("CI/CD")]?.years ?? "none"} aws=${years[skillKey("AWS")]?.years}`,
      };
    },
  },
  {
    name: "SKILL YEARS — the candidate's stated years win over the estimate",
    run: () => {
      const years = estimateSkillYears(
        ["React"],
        [{ name: "React.js", experienceYears: 3 }],
        [{ label: "Orbit", text: "Frontend Developer. Built dashboards in React", start: "2015-01-01", end: null, ongoing: true }],
        new Date("2026-01-01"),
      );
      const react = years[skillKey("React")];
      return { pass: react?.source === "stated" && react.years === 3, detail: `react=${react?.years} ${react?.source}` };
    },
  },
  {
    name: "SKILL YEARS — too few years for a skill lowers its match; enough years keeps it strong",
    run: () => {
      const job = { title: "Backend Engineer", skills: [{ name: "Python", minExperience: 5, mandatory: true }] };
      const short = analyse(job, { skills: ["Python"], skillYears: { [skillKey("Python")]: { years: 2, source: "stated", basis: "stated" } } });
      const long = analyse(job, { skills: ["Python"], skillYears: { [skillKey("Python")]: { years: 6, source: "stated", basis: "stated" } } });
      const unknown = analyse(job, { skills: ["Python"] });
      const pick = (analysis: ReturnType<typeof analyse>) => category(analysis, "skills").matches[0];
      const s = pick(short);
      const l = pick(long);
      const u = pick(unknown);
      return {
        pass:
          s.score < l.score && s.score >= 0.6 && l.score >= 0.95 &&
          /2 years stated against 5\+ asked/.test(s.relationship) &&
          /years of use not evidenced/.test(u.relationship),
        detail: `2y=${s.score.toFixed(2)} "${s.relationship}" · 6y=${l.score.toFixed(2)} · unknown="${u.relationship}"`,
      };
    },
  },
  {
    name: "CASE 10 — 'Lead cross-functional engineering teams' vs 'Managed a 15-member engineering team'",
    run: () => {
      const result = responsibilitySimilarity(
        "Lead cross-functional engineering teams",
        "Managed a 15-member engineering team across engineering, product and design",
      );
      return { pass: atLeast(classify(result.score), "RELATED"), detail: `score=${result.score.toFixed(2)} (${result.relationship})` };
    },
  },
  {
    name: "TITLES — 'Software Engineer' vs 'Software Developer' is a strong relationship",
    run: () => {
      const result = titleSimilarity("Software Engineer", "Software Developer");
      return { pass: atLeast(classify(result.score), "STRONG_SEMANTIC"), detail: `score=${result.score.toFixed(2)} (${result.relationship})` };
    },
  },
  {
    name: "TITLES — 'Project Manager' vs 'Program Manager' is related, not identical",
    run: () => {
      const result = titleSimilarity("Project Manager", "Program Manager");
      return { pass: atLeast(classify(result.score), "RELATED"), detail: `score=${result.score.toFixed(2)} (${result.relationship})` };
    },
  },
  {
    name: "NO EVIDENCE — a silent profile does not score zero, it is marked unassessable",
    run: () => {
      const analysis = analyse(
        { title: "Software Engineer", responsibilities: "Build APIs\nMentor engineers", experienceMinYears: 3 },
        { currentRole: "Software Engineer", experienceYears: 5, skills: [] },
      );
      const responsibilities = category(analysis, "responsibilities");
      return {
        pass: !responsibilities.assessable && analysis.overall > 0,
        detail: `assessable=${responsibilities.assessable} overall=${analysis.overall} verdict="${analysis.verdict}"`,
      };
    },
  },
  {
    name: "WEIGHTS — defaults total 100 and rebalancing keeps the total at 100",
    run: () => {
      const rebalanced = rebalanceWeights(DEFAULT_WEIGHTS, "skills", 25);
      return {
        pass: isValidWeights(DEFAULT_WEIGHTS) && rebalanced.skills === 25 && Math.round(totalWeight(rebalanced)) === 100,
        detail: `default=${totalWeight(DEFAULT_WEIGHTS)} afterRebalance=${totalWeight(rebalanced)} skills=${rebalanced.skills}`,
      };
    },
  },
  {
    name: "WEIGHTS — repeated adjustments keep the total at 100 without draining a category",
    run: () => {
      let weights = { ...DEFAULT_WEIGHTS };
      for (let step = 1; step <= 6; step++) {
        weights = rebalanceWeights(weights, "skills", DEFAULT_WEIGHTS.skills + step);
      }
      const zeroed = Object.entries(weights).filter(([, value]) => value === 0).map(([id]) => id);
      return {
        pass: Math.round(totalWeight(weights)) === 100 && zeroed.length === 0 && weights.skills === 21,
        detail: `total=${totalWeight(weights)} skills=${weights.skills} professional=${weights.professional} zeroed=[${zeroed.join(",")}]`,
      };
    },
  },
  {
    name: "WEIGHTS — the configured weights actually change the overall score",
    run: () => {
      const job: JobRequirementsInput = {
        id: "job-w",
        title: "Software Engineer",
        responsibilities: "Build and ship backend services\nMentor junior engineers",
        skills: [{ name: "Python", mandatory: true }, { name: "Kubernetes", mandatory: true }],
        experienceMinYears: 4,
        educationQualification: "Bachelor's degree in Computer Science",
      };
      const candidate: CandidateEvidenceInput = {
        candidateUserId: "cand-w",
        currentRole: "Software Engineer",
        experienceYears: 6,
        skills: ["Python", "Django"],
        educationDegrees: ["B.Tech Computer Science"],
        statements: ["Built and shipped backend services for a payments platform", "Mentored two junior engineers"],
      };
      const skillHeavy = computeMatchAnalysis(job, candidate, { ...DEFAULT_WEIGHTS, skills: 40, responsibilities: 5, experience: 5 });
      const responsibilityHeavy = computeMatchAnalysis(job, candidate, { ...DEFAULT_WEIGHTS, skills: 5, responsibilities: 40, experience: 5 });
      return {
        pass: skillHeavy.overall !== responsibilityHeavy.overall,
        detail: `skill-heavy=${skillHeavy.overall} responsibility-heavy=${responsibilityHeavy.overall}`,
      };
    },
  },
  {
    name: "END TO END — a well-evidenced senior candidate scores strongly with explanations",
    run: () => {
      const analysis = computeMatchAnalysis(
        {
          id: "job-e2e",
          title: "Senior Software Engineer",
          seniorityLevel: "Senior",
          industry: "SaaS",
          educationQualification: "Master's degree",
          experienceMinYears: 6,
          workplaceLocation: "Bengaluru",
          workMode: "Hybrid",
          responsibilities: [
            "Lead cross-functional engineering teams",
            "Design and build REST APIs",
            "Work directly with enterprise customers",
            "Prepare technical documentation",
          ].join("\n"),
          skills: [
            { name: "Python", mandatory: true },
            { name: "Machine Learning", mandatory: true },
            { name: "PostgreSQL", mandatory: false },
            { name: "Cloud experience", mandatory: false },
          ],
        },
        {
          candidateUserId: "cand-e2e",
          fullName: "Test Candidate",
          currentRole: "Software Engineer",
          currentCompany: "SaaS analytics company",
          currentLocation: "Bengaluru",
          experienceYears: 7.4,
          relevantExperienceYears: 7,
          skills: ["Python programming", "TensorFlow", "Postgres", "AWS EC2", "FastAPI"],
          educationDegrees: ["M.Tech in Artificial Intelligence and Data Science"],
          certifications: [],
          industries: ["SaaS"],
          statements: [
            "Managed a 15-member engineering team across engineering, product and design",
            "Built REST APIs with FastAPI serving 2 million requests per day",
            "Worked directly with enterprise clients on delivery timelines",
            "Reduced model training time by 40% through pipeline optimisation",
            "Created architecture and technical documentation for the platform",
            "Mentored four junior engineers",
          ],
        },
        DEFAULT_WEIGHTS,
      );
      const hasEvidence = analysis.categories.every((category) =>
        category.matches.every((match) => match.score === 0 || match.evidence !== null),
      );
      return {
        pass: analysis.overall >= 75 && analysis.highlights.length >= 3 && analysis.interviewFocus.length >= 1 && hasEvidence,
        detail: `overall=${analysis.overall} confidence=${Math.round(analysis.confidence * 100)}% highlights=${analysis.highlights.length} gaps=${analysis.gaps.length} focus=${analysis.interviewFocus.length}`,
      };
    },
  },
];

/* ── helpers ─────────────────────────────────────────────────────────────── */

function analyse(job: Partial<JobRequirementsInput>, candidate: Partial<CandidateEvidenceInput>) {
  return computeMatchAnalysis(
    { id: "job", title: "Role", ...job },
    { candidateUserId: "candidate", ...candidate },
    DEFAULT_WEIGHTS,
  );
}

function category(analysis: ReturnType<typeof computeMatchAnalysis>, id: string) {
  const found = analysis.categories.find((entry) => entry.id === id);
  if (!found) throw new Error(`category ${id} missing`);
  return found;
}

export function runMatchingTests(): { passed: number; failed: number } {
  let passed = 0;
  let failed = 0;
  for (const testCase of cases) {
    let result: { pass: boolean; detail: string };
    try {
      result = testCase.run();
    } catch (error) {
      result = { pass: false, detail: `threw: ${(error as Error).message}` };
    }
    if (result.pass) {
      passed += 1;
      console.log(`  PASS  ${testCase.name}\n        ${result.detail}`);
    } else {
      failed += 1;
      console.log(`  FAIL  ${testCase.name}\n        ${result.detail}`);
    }
  }
  console.log(`\n${passed} passed, ${failed} failed, ${cases.length} total`);
  return { passed, failed };
}

runMatchingTests();
