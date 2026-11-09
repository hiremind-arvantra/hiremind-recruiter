import Image from "next/image";
import { ImageStage, FloatChip } from "@/components/ui/ImageStage";
import SidebarFeatures from "./sections/SidebarFeatures";
import SidebarProgress from "./sections/SidebarProgress";

const STEP_MESSAGES = [
  {
    heading: "Start Your Career Journey",
    sub: "with HireMind",
    desc: "Create your profile, get discovered by top recruiters and find the right opportunities faster with AI.",
  },
  {
    heading: "You're one step",
    sub: "closer!",
    desc: "Complete your professional details to help us personalize your experience.",
  },
  {
    heading: "You're almost",
    sub: "there!",
    desc: "Add your skills and preferences so we can find the best opportunities for you.",
  },
  {
    heading: "You're",
    sub: "all set!",
    desc: "Review your details before submitting. You can edit any section if needed.",
  },
];

function CheckGlyph() {
  return (
    <svg aria-hidden="true" width="11" height="11" viewBox="0 0 16 16" fill="none">
      <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function StarGlyph() {
  return (
    <svg aria-hidden="true" width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3l2.7 5.6 6.3.9-4.5 4.4 1 6.1L12 17l-5.5 3 1-6.1L3 9.5l6.3-.9z" />
    </svg>
  );
}
function TargetGlyph() {
  return (
    <svg aria-hidden="true" width="11" height="11" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2.2" />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
  );
}
function RocketGlyph() {
  return (
    <svg aria-hidden="true" width="11" height="11" viewBox="0 0 24 24" fill="none">
      <path d="M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2M9 15l-3-3c1.5-4 5-8 13-9-1 8-5 11.5-9 13z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

/* chips shown per step — decorative, hidden on the smallest stage */
const STEP_CHIPS: Record<number, React.ReactNode> = {
  2: (
    <>
      <FloatChip className="absolute top-[26%] left-0 z-20 text-center">
        <div className="text-nano font-semibold text-ink-500">Profile</div>
        <div className="text-brand-700 font-extrabold text-body-sm leading-none mt-0.5 tabular">50%</div>
      </FloatChip>
      <FloatChip className="absolute top-[58%] right-0 z-20">
        <div className="text-nano font-semibold text-green-700 flex items-center gap-1"><CheckGlyph /> Step 2</div>
      </FloatChip>
    </>
  ),
  3: (
    <>
      <FloatChip className="absolute top-[26%] left-0 z-20">
        <div className="text-nano font-semibold text-ink-500">Skills Added</div>
        <div className="text-brand-700 font-bold text-micro mt-0.5 flex items-center gap-1"><StarGlyph /> 8 Skills</div>
      </FloatChip>
      <FloatChip className="absolute top-[58%] right-0 z-20">
        <div className="text-nano font-semibold text-brand-700 flex items-center gap-1"><TargetGlyph /> 75%</div>
      </FloatChip>
    </>
  ),
  4: (
    <>
      <FloatChip className="absolute top-[26%] left-0 z-20">
        <div className="text-nano font-semibold text-green-700 flex items-center gap-1"><CheckGlyph /> All Done!</div>
      </FloatChip>
      <FloatChip className="absolute top-[58%] right-0 z-20">
        <div className="text-nano font-semibold text-brand-700 flex items-center gap-1"><RocketGlyph /> Ready</div>
      </FloatChip>
    </>
  ),
};

interface CandidateSidebarProps {
  step: number;
}

export default function CandidateSidebar({ step }: CandidateSidebarProps) {
  const currentStep = Math.min(step, 4);
  const msg = STEP_MESSAGES[currentStep - 1];

  return (
    <aside className="hidden lg:block sticky top-[calc(var(--header-h)+40px)] max-h-[calc(100vh-var(--header-h)-56px)] overflow-y-auto pb-2">
      {/* Step message */}
      <div>
        <h2 className="font-display font-extrabold text-heading xl:text-heading-lg text-ink-900 leading-tight tracking-tight">
          {msg.heading}{" "}
          {msg.sub && <span className="gradient-text">{msg.sub}</span>}
        </h2>
        <p className="mt-2 text-ink-500 text-body-sm leading-relaxed">
          {msg.desc}
        </p>
      </div>

      {/* Illustration on a lit stage */}
      <ImageStage tone="violet" className="relative h-[184px] mt-4 mb-5">
        <Image
          src="/images/candidate.png"
          alt="Candidate"
          fill
          sizes="340px"
          className="object-contain object-bottom z-[1]"
        />
        {STEP_CHIPS[currentStep]}
      </ImageStage>

      {/* Step-specific content */}
      {currentStep === 1 ? (
        <SidebarFeatures />
      ) : (
        <SidebarProgress currentStep={currentStep} />
      )}
    </aside>
  );
}
