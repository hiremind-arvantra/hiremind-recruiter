/* Mock comparison data (no candidate-compare API yet). */
export interface Candidate {
  id: string;
  name: string;
  initials: string;
  company: string;
  location: string;
  exp: string;
  match: number;
  strengths: string[];
  skills: { name: string; pct: number }[];
  experience: { total: string; relevant: string; tenure: string; tenureCo: string; companies: number };
  education: { degree: string; inst: string; year: string };
  overview: string;
}

export const JOB_TITLE = "Senior Software Engineer";

/** 200px label column + one column per candidate. */
export const GRID = "grid grid-cols-[200px_repeat(4,minmax(0,1fr))]";

export const CANDIDATES: Candidate[] = [
  {
    id: "c1",
    name: "Arjun Mehta",
    initials: "AM",
    company: "Microsoft",
    location: "Bangalore, India",
    exp: "6.2 yrs exp.",
    match: 92,
    strengths: ["Strong in System Design", "Excellent problem solving", "Azure & AWS expertise"],
    skills: [
      { name: "Java", pct: 95 },
      { name: "System Design", pct: 90 },
      { name: "AWS", pct: 90 },
      { name: "Microservices", pct: 85 },
      { name: "Spring Boot", pct: 85 },
    ],
    experience: {
      total: "6.2 yrs",
      relevant: "5.6 yrs",
      tenure: "3.1 yrs",
      tenureCo: "Microsoft",
      companies: 3,
    },
    education: { degree: "B.Tech in Computer Science", inst: "IIT Bombay", year: "2016" },
    overview:
      "Strong backend developer with excellent system design skills and cloud expertise. Proven track record in building scalable applications.",
  },
  {
    id: "c2",
    name: "Neha Kulkarni",
    initials: "NK",
    company: "Google",
    location: "Pune, India",
    exp: "5.4 yrs exp.",
    match: 88,
    strengths: ["Strong DSA skills", "Microservices experience", "Good communicator"],
    skills: [
      { name: "Java", pct: 90 },
      { name: "DSA", pct: 90 },
      { name: "Spring Boot", pct: 85 },
      { name: "Microservices", pct: 80 },
      { name: "SQL", pct: 80 },
    ],
    experience: {
      total: "5.4 yrs",
      relevant: "5.0 yrs",
      tenure: "2.6 yrs",
      tenureCo: "Google",
      companies: 3,
    },
    education: { degree: "B.E. in Computer Engineering", inst: "COEP Pune", year: "2017" },
    overview:
      "Detail-oriented engineer with strong coding fundamentals and good experience in microservices and teamwork.",
  },
  {
    id: "c3",
    name: "Rohan Das",
    initials: "RD",
    company: "Amazon",
    location: "Bangalore, India",
    exp: "7.1 yrs exp.",
    match: 85,
    strengths: ["Full stack expertise", "Leadership experience", "Scalability focus"],
    skills: [
      { name: "Java", pct: 90 },
      { name: "AWS", pct: 85 },
      { name: "React", pct: 85 },
      { name: "System Design", pct: 80 },
      { name: "Docker", pct: 75 },
    ],
    experience: {
      total: "7.1 yrs",
      relevant: "6.3 yrs",
      tenure: "2.8 yrs",
      tenureCo: "Amazon",
      companies: 4,
    },
    education: { degree: "B.Tech in Information Technology", inst: "NIT Surathkal", year: "2015" },
    overview:
      "Experienced full stack developer with leadership experience and passion for solving complex problems.",
  },
  {
    id: "c4",
    name: "Vikram Singh",
    initials: "VS",
    company: "Infosys",
    location: "Hyderabad, India",
    exp: "4.8 yrs exp.",
    match: 78,
    strengths: ["Good technical skills", "Agile & DevOps knowledge", "Quick learner"],
    skills: [
      { name: "Spring Boot", pct: 70 },
      { name: "SQL", pct: 65 },
      { name: "AWS", pct: 60 },
      { name: "Microservices", pct: 55 },
      { name: "Java", pct: 50 },
    ],
    experience: {
      total: "4.8 yrs",
      relevant: "3.6 yrs",
      tenure: "2.3 yrs",
      tenureCo: "Infosys",
      companies: 3,
    },
    education: { degree: "B.Tech in Computer Science", inst: "JNTU Hyderabad", year: "2018" },
    overview:
      "Eager learner with solid programming skills and good understanding of modern development practices.",
  },
];

export const AI_RECOMMENDATIONS = [
  "Arjun Mehta is the top choice for immediate impact.",
  "Neha Kulkarni is a strong contender with excellent technical skills.",
  "Rohan Das brings valuable experience and leadership potential.",
  "Vikram Singh has good potential and can grow with the right guidance.",
];

/* score → colour / label */
export function matchHex(pct: number): string {
  return pct >= 80 ? "#16a34a" : pct >= 60 ? "#f59e0b" : "#ef4444";
}
export function matchText(pct: number): string {
  return pct >= 80 ? "text-green-600" : pct >= 60 ? "text-orange-500" : "text-red-500";
}
export function matchLabel(pct: number): string {
  return pct >= 80 ? "Excellent Match" : pct >= 60 ? "Good Match" : "Needs Improvement";
}
