/* Mock data for the View Applications page — shaped for a future
 * GET /company/jobs/{id}/applications. */

export type AppStatus = "Applied" | "Shortlisted" | "Interview" | "Offered" | "Rejected";

export interface Candidate {
  id: string;
  /** The candidate's user id — used to fetch their full profile. */
  candidateUserId?: string;
  name: string;
  verified: boolean;
  email: string;
  phone: string;
  avatarBg: string;
  experience: string;
  company: string;
  companyRole: string;
  companyChar: string;
  appliedDate: string;
  appliedTime: string;
  match: number;
  /**
   * Where `match` came from: the match analysis (the same figure the Candidate Match
   * Analysis page shows) or, when the profile could not be analysed, the score stored
   * with the application.
   */
  matchSource?: "analysis" | "stored";
  status: AppStatus;
  fake?: boolean;
}

export const JOB = {
  title: "Senior Software Engineer",
  company: "Microsoft",
  status: "Active",
  location: "Bangalore, India",
  type: "Full Time",
  experience: "5 – 8 yrs",
  salary: "₹ 18 – 28 LPA",
  skills: ["Java", "Spring Boot", "AWS", "Microservices", "+3"],
  postedOn: "10 Jun 2026",
  applications: 24,
};

export const CANDIDATES: Candidate[] = [
  {
    id: "1",
    name: "Arjun Mehta",
    verified: true,
    email: "arjun.mehta@email.com",
    phone: "+91 98765 43210",
    avatarBg: "bg-brand-100",
    experience: "6.2 yrs",
    company: "Microsoft",
    companyRole: "Software Engineer",
    companyChar: "M",
    appliedDate: "10 Jun 2026",
    appliedTime: "2:30 PM",
    match: 92,
    status: "Interview",
  },
  {
    id: "2",
    name: "Neha Kulkarni",
    verified: true,
    email: "neha.kulkarni@email.com",
    phone: "+91 91234 56789",
    avatarBg: "bg-green-100",
    experience: "5.4 yrs",
    company: "Google",
    companyRole: "Software Engineer",
    companyChar: "G",
    appliedDate: "10 Jun 2026",
    appliedTime: "11:15 AM",
    match: 88,
    status: "Shortlisted",
  },
  {
    id: "3",
    name: "Rohan Das",
    verified: true,
    email: "rohan.das@email.com",
    phone: "+91 99876 54321",
    avatarBg: "bg-orange-100",
    experience: "7.1 yrs",
    company: "Amazon",
    companyRole: "Senior Developer",
    companyChar: "a",
    appliedDate: "09 Jun 2026",
    appliedTime: "6:45 PM",
    match: 85,
    status: "Shortlisted",
  },
  {
    id: "4",
    name: "Vikram Singh",
    verified: true,
    email: "vikram.singh@email.com",
    phone: "+91 88990 11223",
    avatarBg: "bg-blue-100",
    experience: "4.8 yrs",
    company: "Infosys",
    companyRole: "Software Engineer",
    companyChar: "I",
    appliedDate: "09 Jun 2026",
    appliedTime: "3:20 PM",
    match: 78,
    status: "Applied",
  },
  {
    id: "5",
    name: "Ananya Iyer",
    verified: true,
    email: "ananya.iyer@email.com",
    phone: "+91 77665 44322",
    avatarBg: "bg-brand-100",
    experience: "6.5 yrs",
    company: "TCS",
    companyRole: "Developer",
    companyChar: "T",
    appliedDate: "09 Jun 2026",
    appliedTime: "10:05 AM",
    match: 76,
    status: "Applied",
  },
  {
    id: "6",
    name: "Siddharth Rao",
    verified: true,
    email: "siddharth.rao@email.com",
    phone: "+91 66554 33221",
    avatarBg: "bg-green-100",
    experience: "5.9 yrs",
    company: "Zoho",
    companyRole: "Software Developer",
    companyChar: "Z",
    appliedDate: "08 Jun 2026",
    appliedTime: "9:40 PM",
    match: 70,
    status: "Applied",
  },
  {
    id: "7",
    name: "Karan Verma",
    verified: false,
    email: "karan.verma@email.com",
    phone: "+91 70000 00000",
    avatarBg: "bg-ink-100",
    experience: "4.0 yrs",
    company: "Not Specified",
    companyRole: "",
    companyChar: "?",
    appliedDate: "08 Jun 2026",
    appliedTime: "5:10 PM",
    match: 34,
    status: "Applied",
    fake: true,
  },
  {
    id: "8",
    name: "Pooja Sharma",
    verified: false,
    email: "pooja.sharma@email.com",
    phone: "+91 81111 11111",
    avatarBg: "bg-ink-100",
    experience: "3.2 yrs",
    company: "Not Specified",
    companyRole: "",
    companyChar: "?",
    appliedDate: "07 Jun 2026",
    appliedTime: "4:35 PM",
    match: 28,
    status: "Applied",
    fake: true,
  },
];

export const TABS = [
  { key: "All", count: 24 },
  { key: "Applied", count: 12 },
  { key: "Shortlisted", count: 6 },
  { key: "Interview", count: 4 },
  { key: "Offered", count: 1 },
  { key: "Rejected", count: 1 },
] as const;

export const DISTRIBUTION = [
  { label: "Less than 60%", count: 3, pct: 13, color: "var(--color-danger)" },
  { label: "60% – 75%", count: 7, pct: 29, color: "var(--color-warn)" },
  { label: "75% – 89%", count: 10, pct: 42, color: "var(--color-success)" },
  { label: "Above 90%", count: 4, pct: 16, color: "var(--color-info)" },
];

export const SUMMARY = [
  { label: "Applied", count: 12, pct: 50, color: "var(--color-info)" },
  { label: "Shortlisted", count: 6, pct: 25, color: "var(--color-success)" },
  { label: "Interview", count: 4, pct: 17, color: "var(--color-brand-500)" },
  { label: "Offered", count: 1, pct: 4, color: "var(--color-warn)" },
  { label: "Rejected", count: 1, pct: 4, color: "var(--color-danger)" },
];
