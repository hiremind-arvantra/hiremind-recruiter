"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { loadDefaultWeights, saveJobWeights } from "@/modules/company/matching";
import Step1JobDetails from "./steps/Step1JobDetails";
import Step2Requirements from "./steps/Step2Requirements";
import Step3Compensation from "./steps/Step3Compensation";
import Step5ReviewPublish from "./steps/Step5ReviewPublish";
import { encodeId } from "@/lib/urlId";
import { publishJob, saveDraftJob } from "./services/job.service";
import { EMPTY_JOB, type JobDraft, type StepNum } from "./shared/types";

export default function JobPostingWizard() {
  const router = useRouter();
  const [step, setStep] = useState<StepNum>(1);
  const [draft, setDraft] = useState<JobDraft>(EMPTY_JOB);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const seededWeights = useRef(false);

  // A new job starts from the company's default matching criteria (Settings → Matching).
  useEffect(() => {
    if (seededWeights.current) return; // guard React StrictMode double-invoke
    seededWeights.current = true;
    loadDefaultWeights()
      .then((matching) => setDraft((prev) => ({ ...prev, matching })))
      .catch(() => {}); // non-fatal — the product defaults are already in place
  }, []);

  const go = (n: StepNum) => {
    setStep(n);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const publish = async () => {
    setPublishing(true);
    setPublishError(null);
    try {
      const { id } = await publishJob(draft);
      // Weights live with the matching module, not the job payload.
      await saveJobWeights(id, draft.matching).catch(() => {});
      router.push(`/company/jobs/published?jobId=${encodeId(id)}`);
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : "Failed to publish job");
    } finally {
      setPublishing(false);
    }
  };

  const saveDraft = async () => {
    setSavingDraft(true);
    setPublishError(null);
    try {
      const { id } = await saveDraftJob(draft);
      await saveJobWeights(id, draft.matching).catch(() => {});
      router.push("/company/jobs");
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : "Failed to save draft");
    } finally {
      setSavingDraft(false);
    }
  };

  return (
    <div>
      {step === 1 && <Step1JobDetails  data={draft} onChange={setDraft} onCancel={() => router.push("/company/jobs")} onContinue={() => go(2)} />}
      {step === 2 && <Step2Requirements data={draft} onChange={setDraft} onBack={() => go(1)} onContinue={() => go(3)} />}
      {step === 3 && <Step3Compensation data={draft} onChange={setDraft} onBack={() => go(2)} onContinue={() => go(4)} />}
      {step === 4 && (
        <Step5ReviewPublish
          data={draft}
          onBack={() => go(3)}
          onEdit={(t) => go(t)}
          onPublish={publish}
          onSaveDraft={saveDraft}
          publishing={publishing}
          savingDraft={savingDraft}
          publishError={publishError}
        />
      )}
    </div>
  );
}
