"use client";

import ProgressStepper from "./ProgressStepper";
import Step1BasicInfo from "./steps/Step1BasicInfo";
import Step2Professional from "./steps/Step2Professional";
import Step3Skills from "./steps/Step3Skills";
import Step4Review from "./steps/Step4Review";
import type { CandidateRegData } from "../../types/auth.types";
import type { ResumeParsePreview } from "../../services/candidate.service";

interface CandidateFormPanelProps {
  currentStep: number;
  maxStep: number;
  data: CandidateRegData;
  onStepChange: (step: number) => void;
  onDataChange: (data: CandidateRegData) => void;
  onSubmit: () => void;
  resumeFile: File | null;
  onResumeChange: (file: File | null) => void;
  onResumeParsed: (preview: ResumeParsePreview) => void;
}

const FORM_TITLES: Record<number, string> = {
  1: "Candidate Registration",
  2: "Candidate Registration",
  3: "Candidate Registration",
  4: "Review & Submit",
};

export default function CandidateFormPanel({
  currentStep,
  maxStep,
  data,
  onStepChange,
  onDataChange,
  onSubmit,
  resumeFile,
  onResumeChange,
  onResumeParsed,
}: CandidateFormPanelProps) {
  return (
    <main id="main" tabIndex={-1} className="min-w-0">
      <div className="card-elevated p-5 sm:p-7 lg:p-8">
        {/* Panel heading + stepper */}
        <div className="pb-6 mb-6 border-b border-ink-200/70">
          <div className="eyebrow hidden sm:block">Step {currentStep} of 4</div>
          <h1 className="page-title mt-1">{FORM_TITLES[currentStep]}</h1>
          <div className="mt-6">
            <ProgressStepper current={currentStep} />
          </div>
        </div>

        {/* key re-runs the entrance on every step change — a sense of moving forward */}
        <div key={currentStep} className="animate-fade-up">
          {currentStep === 1 && (
            <Step1BasicInfo
              data={data.step1}
              onChange={(step1) => onDataChange({ ...data, step1 })}
              onNext={() => onStepChange(2)}
              isReturning={maxStep > 1}
              resumeFile={resumeFile}
              onResumeChange={onResumeChange}
              onResumeParsed={onResumeParsed}
            />
          )}
          {currentStep === 2 && (
            <Step2Professional
              data={data.step2}
              onChange={(step2) => onDataChange({ ...data, step2 })}
              onNext={() => onStepChange(3)}
              onBack={() => onStepChange(1)}
            />
          )}
          {currentStep === 3 && (
            <Step3Skills
              data={data.step3}
              onChange={(step3) => onDataChange({ ...data, step3 })}
              onNext={() => onStepChange(4)}
              onBack={() => onStepChange(2)}
            />
          )}
          {currentStep === 4 && (
            <Step4Review
              data={data}
              onBack={() => onStepChange(3)}
              onEditStep={onStepChange}
              onSubmit={onSubmit}
            />
          )}
        </div>
      </div>
    </main>
  );
}
