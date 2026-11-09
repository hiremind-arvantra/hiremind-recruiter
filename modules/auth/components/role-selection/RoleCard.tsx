import Link from "next/link";
import { ImageStage } from "@/components/ui/ImageStage";

interface RoleCardProps {
  illustration: React.ReactNode;
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  ctaClass: string;
  footerIcon: React.ReactNode;
  footerLabel: string;
  /** Stage tint for the illustration and accent for the icon + checks. */
  tone?: "violet" | "cobalt";
}

export default function RoleCard({
  illustration,
  icon,
  title,
  description,
  features,
  ctaLabel,
  ctaHref,
  ctaClass,
  footerIcon,
  footerLabel,
  tone = "violet",
}: RoleCardProps) {
  const accent =
    tone === "cobalt"
      ? { tile: "bg-cobalt-50 text-cobalt-600 ring-cobalt-100", check: "bg-cobalt-50 text-cobalt-600" }
      : { tile: "bg-brand-50 text-brand-600 ring-brand-100", check: "bg-brand-50 text-brand-600" };

  return (
    <article className="card-elevated card-interactive overflow-hidden flex flex-col">
      {/* ── Top: illustration + content ── */}
      <div className="grid sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] flex-1">
        {/* Left – character illustration on a lit stage */}
        <ImageStage
          tone={tone}
          className="relative min-h-[240px] sm:min-h-[300px] bg-ink-50/70 border-b sm:border-b-0 sm:border-r border-ink-200/60"
        >
          {illustration}
        </ImageStage>

        {/* Right – content */}
        <div className="min-w-0 p-6 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-3">
            <span className={`icon-tile ring-1 ${accent.tile}`}>
              {icon}
            </span>
            <h2 className="font-display font-extrabold text-title-lg text-ink-900 leading-tight">
              {title}
            </h2>
          </div>
          <p className="text-ink-500 text-body-sm mb-4 leading-relaxed">
            {description}
          </p>
          <ul className="space-y-2.5">
            {features.map((f) => (
              <li
                key={f}
                className="flex items-center gap-2.5 text-body-sm text-ink-700"
              >
                <CheckIcon className={accent.check} /> {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Bottom: CTA ── */}
      <div className="px-6 pb-5 pt-4 border-t border-ink-200/60">
        <Link
          href={ctaHref}
          className={`btn btn-lg w-full text-white font-bold hover:brightness-105 ${ctaClass}`}
        >
          {ctaLabel} <ArrowRightIcon />
        </Link>
        <p className="mt-3 text-center text-caption text-ink-500 flex items-center justify-center gap-1.5">
          {footerIcon} {footerLabel}
        </p>
      </div>
    </article>
  );
}

function CheckIcon({ className }: { className: string }) {
  return (
    <span aria-hidden="true" className={`w-5 h-5 rounded-full grid place-items-center shrink-0 ${className}`}>
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
        <path
          d="M2 6l3 3 5-5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function ArrowRightIcon() {
  return (
    <svg aria-hidden="true" width="15" height="15" viewBox="0 0 16 16" fill="none">
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
