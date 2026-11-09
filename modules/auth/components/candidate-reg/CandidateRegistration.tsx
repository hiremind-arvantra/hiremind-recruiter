"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AuthHeader from "../AuthHeader";
import CandidateSidebar from "./CandidateSidebar";
import CandidateFormPanel from "./CandidateFormPanel";
import type { CandidateRegData } from "../../types/auth.types";
import { uploadResume, type ResumeParsePreview } from "../../services/candidate.service";
import {
  prefillEducation,
  prefillExperience,
  prefillSkills,
  prefillStep1,
  replaceParsedRows,
  type AutoFilledStep1,
} from "./shared/resumePrefill";

const INITIAL_DATA: CandidateRegData = {
  step1: {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    dateOfBirth: "",
    currentLocation: "",
    professionalSummary: "",
    acceptTerms: false,
  },
  step2: { education: [], experience: [], resumeFileKey: "" },
  step3: {
    skills: [],
    certifications: [],
    noticePeriod: "",
    expectedSalary: "",
    salaryType: "",
    jobRolePreferences: [],
    preferredLocations: [],
    openToRelocate: false,
    employmentTypes: [],
    benefits: [],
    additionalNotes: "",
  },
};

export default function CandidateRegistration() {
  const [step, setStep]           = useState(1);
  const [maxStep, setMaxStep]     = useState(1);
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [data, setData]           = useState<CandidateRegData>(INITIAL_DATA);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const resumePersisted = useRef(false);
  /** What the last parse wrote into step 1, so a replacement knows what it may refresh. */
  const autoFilled = useRef<AutoFilledStep1>({});

  const handleStepChange = (newStep: number) => {
    setStep(newStep);
    setMaxStep((prev) => Math.max(prev, newStep));
  };

  /**
   * Fold a parsed resume into the whole form at once: step 1's own fields plus the
   * education, experience and skill rows that steps 2 and 3 open with.
   *
   * Replacing the resume genuinely refreshes the details: rows the previous parse
   * contributed are swapped for the new file's, and a step-1 field is rewritten when it
   * is empty or still holds exactly what the previous resume put there.
   *
   * What the candidate typed or corrected themselves is never overwritten, and rows they
   * added by hand are kept alongside the new ones.
   */
  const applyParsedResume = (preview: ResumeParsePreview) => {
    setData((prev) => {
      const { data: step1, filled } = prefillStep1(prev.step1, preview, autoFilled.current);
      autoFilled.current = { ...autoFilled.current, ...filled };
      return {
        ...prev,
        step1,
        step2: {
          ...prev.step2,
          education: replaceParsedRows(prev.step2.education, prefillEducation(preview)),
          experience: replaceParsedRows(prev.step2.experience, prefillExperience(preview)),
        },
        step3: {
          ...prev.step3,
          skills: replaceParsedRows(prev.step3.skills, prefillSkills(preview)),
        },
      };
    });
  };

  /**
   * Persist the resume once an account exists. Parse-preview stores nothing, so without
   * this the file the candidate uploaded would never reach their profile. Deliberately
   * best-effort and fired after step 1: a failure here (S3 unconfigured, say) must not
   * block registration, and the guard stops it repeating when they navigate back.
   */
  useEffect(() => {
    if (maxStep < 2 || !resumeFile || resumePersisted.current) return;
    resumePersisted.current = true;
    uploadResume(resumeFile).catch(() => {
      resumePersisted.current = false; // let a later step retry
    });
  }, [maxStep, resumeFile]);

  // Registration lands on the dashboard rather than a confirmation screen. `submitted`
  // still gates the form so the last step cannot be re-submitted while the route change
  // is in flight; the redirect runs in an effect because navigating during render is not
  // allowed.
  useEffect(() => {
    if (submitted) {
      router.replace("/dashboard");
    }
  }, [submitted, router]);

  if (submitted) {
    return (
      <div className="min-h-screen app-canvas flex items-center justify-center px-6">
        <div role="status" className="flex items-center gap-3 text-body-sm text-ink-500">
          <span aria-hidden="true" className="w-4 h-4 rounded-full border-2 border-brand-200 border-t-brand-600 animate-spin" />
          Taking you to your dashboard…
        </div>
      </div>
    );
  }

  const currentStep = Math.min(step, 4);

  return (
    <div className="min-h-screen flex flex-col app-canvas">
      <AuthHeader
        border
        sticky
        preCtaText="Already have an account?"
        cta={{ label: "Login", href: "/login", icon: <SignInIcon /> }}
      />

      {/* .site-container matches AuthHeader: the sidebar copy starts under the logo and the
          form card ends under the Login button. The sidebar stays in view while the form
          scrolls with the page. */}
      <div className="site-container flex-1 grid lg:grid-cols-[288px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)] gap-8 xl:gap-10 items-start pt-6 sm:pt-8 lg:pt-10 pb-16">
        <CandidateSidebar step={currentStep} />
        <CandidateFormPanel
          currentStep={currentStep}
          maxStep={maxStep}
          data={data}
          onStepChange={handleStepChange}
          onDataChange={setData}
          onSubmit={() => setSubmitted(true)}
          resumeFile={resumeFile}
          onResumeChange={setResumeFile}
          onResumeParsed={applyParsedResume}
        />
      </div>
    </div>
  );
}

function SignInIcon() {
  return (
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none">
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
