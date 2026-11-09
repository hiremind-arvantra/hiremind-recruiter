"use client";

interface StepActionsProps {
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  isLoading?: boolean;
}

function ArrowLeftIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M13 8H3m0 0l5-5M3 8l5 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M3 8h10m0 0L8 3m5 5l-5 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Sticky footer bar for a registration step: Back on the left, primary action on the right. */
export default function StepActions({
  onBack,
  onNext,
  nextLabel = "Save & Continue",
  isLoading = false,
}: StepActionsProps) {
  return (
    <div className="sticky bottom-0 z-10 -mx-5 sm:-mx-7 lg:-mx-8 -mb-5 sm:-mb-7 lg:-mb-8 mt-2 px-5 sm:px-7 lg:px-8 py-4 flex items-center justify-between gap-3 border-t border-ink-200/70 glass rounded-b-card">
      {onBack ? (
        <button type="button" onClick={onBack} className="btn btn-outline btn-lg px-4 sm:px-6">
          <ArrowLeftIcon /> Back
        </button>
      ) : (
        <span />
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={isLoading}
        className="btn btn-primary btn-lg px-5 sm:px-8"
      >
        {nextLabel} <ArrowRightIcon />
      </button>
    </div>
  );
}
