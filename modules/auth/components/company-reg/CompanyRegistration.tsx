"use client";

import { useState } from "react";
import AuthHeader from "@/modules/auth/components/AuthHeader";
import Step1CompanyDetails from "./steps/Step1CompanyDetails";
import Step2AdminDetails from "./steps/Step2AdminDetails";
import Step3Verification from "./steps/Step3Verification";
import type { CompanyData, AdminData } from "./shared/types";

const LOGIN_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function CompanyRegistration() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [company, setCompany] = useState<CompanyData>({} as CompanyData);
  const [admin, setAdmin] = useState<AdminData>({} as AdminData);
  // Once the account is created in Step 2, returning must not re-register it.
  const [registered, setRegistered] = useState(false);

  return (
    <div className="min-h-screen flex flex-col app-canvas">
      <AuthHeader
        cta={{ label: "Login", href: "/login", icon: LOGIN_ICON }}
        border={false}
        sticky
        preCtaText={step === 1 ? "Already have an account?" : undefined}
      />
      {step === 1 && (
        <Step1CompanyDetails
          data={company}
          onChange={setCompany}
          onContinue={() => setStep(2)}
        />
      )}
      {step === 2 && (
        <Step2AdminDetails
          data={admin}
          company={company}
          registered={registered}
          onRegistered={() => setRegistered(true)}
          onChange={setAdmin}
          onBack={() => setStep(1)}
          onContinue={() => setStep(3)}
        />
      )}
      {step === 3 && (
        <Step3Verification
          company={company}
          admin={admin}
          onBack={() => setStep(2)}
          onEdit={(target) => setStep(target)}
        />
      )}
    </div>
  );
}
