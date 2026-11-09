import Image from "next/image";
import AuthHeader from "./AuthHeader";
import RoleCard from "./role-selection/RoleCard";
import AIPlatformStrip from "./role-selection/AIPlatformStrip";
import TrustStrip from "./role-selection/TrustStrip";
import { FloatChip } from "@/components/ui/ImageStage";

const CANDIDATE_FEATURES = [
  "Smart Job Matching",
  "AI Resume Analysis",
  "Improve Your Match",
  "Application Tracking",
  "Daily Job Alerts",
];

const COMPANY_FEATURES = [
  "Resume Parsing & Screening",
  "Verified Email & Mobile",
  "India-Ready Candidate Data",
];

interface Props {
  /**
   * "signup" sends each role to its registration form; "login" sends it to its own
   * login page. The apex serves this chooser for both, because the session token lives
   * in localStorage and so has to be created on the subdomain that will use it — which
   * means the apex cannot host a working login form of its own.
   */
  mode?: "signup" | "login";
  /** Absolute URLs when the targets live on another hostname. */
  candidateHref?: string;
  recruiterHref?: string;
}

export default function RoleSelectionPage({ mode = "signup", candidateHref, recruiterHref }: Props) {
  const loggingIn = mode === "login";
  const candidateTarget = candidateHref ?? (loggingIn ? "/login" : "/register/candidate");
  const recruiterTarget = recruiterHref ?? (loggingIn ? "/login" : "/register/company");

  return (
    <div className="min-h-screen flex flex-col app-canvas">
      {/* ── Header ── */}
      <AuthHeader
        border
        cta={
          loggingIn
            ? { label: "Create Account", href: "/signup", icon: <SignInIcon /> }
            : { label: "Login", href: "/login", icon: <SignInIcon /> }
        }
      />

      {/* ── Main ── */}
      <main id="main" tabIndex={-1} className="flex-1 pt-10 lg:pt-16 pb-12">
        <div className="site-container">
          {/* Title */}
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h1 className="hero-title">
              {loggingIn ? "Log in to HireMind" : "Create Your Account"}
            </h1>
            <p className="hero-lead mt-4">
              {loggingIn
                ? "Candidates and recruitment companies each have their own workspace. Choose yours to sign in."
                : "Choose the option that best describes you to get started with HireMind"}
            </p>
          </div>

          {/* ── Role cards ── */}
          <div className="grid md:grid-cols-2 gap-5 xl:gap-6">
            <RoleCard
              tone="violet"
              illustration={<CandidateIllustration />}
              icon={<CandidateIcon size={20} />}
              title="Candidate"
              description="Find the best jobs matched to your skills and advance your career."
              features={CANDIDATE_FEATURES}
              ctaLabel={loggingIn ? "Log in as a Candidate" : "I'm a Candidate"}
              ctaHref={candidateTarget}
              ctaClass="btn-gradient-brand"
              footerIcon={<CandidateIcon size={12} />}
              footerLabel="For job seekers looking for opportunities"
            />
            <RoleCard
              tone="cobalt"
              illustration={<CompanyIllustration />}
              icon={<CompanyIcon size={20} />}
              title="Recruitment Company"
              description="Source, screen and hire top talent faster with the power of AI."
              features={COMPANY_FEATURES}
              ctaLabel={loggingIn ? "Log in as a Recruitment Company" : "I'm a Recruitment Company"}
              ctaHref={recruiterTarget}
              ctaClass="btn-gradient-company"
              footerIcon={<CompanyIcon size={12} />}
              footerLabel="For recruitment agencies and hiring teams"
            />
          </div>

          <AIPlatformStrip />
          <TrustStrip />
        </div>
      </main>
    </div>
  );
}

/* ── Illustrations ── */
function CandidateIllustration() {
  return (
    <Image
      src="/images/create-candidate.png"
      alt="Candidate"
      fill
      sizes="(max-width: 768px) 50vw, 25vw"
      className="object-contain object-bottom z-[1] px-4 pt-6"
    />
  );
}

function CompanyIllustration() {
  return (
    <>
      <Image
        src="/images/recruiter.png"
        alt="Recruiter"
        fill
        sizes="(max-width: 768px) 50vw, 25vw"
        className="object-contain object-bottom z-[1] px-4 pt-6"
      />
      {/* chips */}
      <FloatChip className="absolute top-[34%] left-3 z-20 flex flex-col items-center">
        <div className="text-nano font-semibold text-ink-500">AI Match</div>
        <div className="text-brand-700 font-extrabold text-body-lg leading-none mt-0.5 tabular">
          95%
        </div>
      </FloatChip>
      <FloatChip className="absolute top-[56%] right-3 z-20 flex flex-col items-center">
        <div className="text-nano font-semibold text-ink-500">Shortlisted</div>
        <div className="text-cobalt-700 font-bold text-micro mt-0.5 flex items-center gap-1 tabular">
          <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="8" r="3.5" /><circle cx="17" cy="9" r="2.5" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6zM16 20c0-2.2-.7-3.9-1.8-5.1 3.6-.6 7.3 1.2 7.3 5.1z" /></svg>
          125
        </div>
      </FloatChip>
    </>
  );
}

/* ── Icons ── */
function SignInIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function CandidateIcon({ size = 16 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="7" r="4" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 21c0-3.866 4.029-7 9-7s9 3.134 9 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function CompanyIcon({ size = 16 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="3" width="20" height="18" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M2 9h20" stroke="currentColor" strokeWidth="1.6" />
      <rect x="6" y="13" width="3" height="3" rx="0.5" fill="currentColor" fillOpacity="0.5" />
      <rect x="10.5" y="13" width="3" height="3" rx="0.5" fill="currentColor" fillOpacity="0.5" />
      <rect x="15" y="13" width="3" height="3" rx="0.5" fill="currentColor" fillOpacity="0.5" />
      <rect x="8" y="17" width="8" height="4" rx="0.5" fill="currentColor" fillOpacity="0.3" />
    </svg>
  );
}
