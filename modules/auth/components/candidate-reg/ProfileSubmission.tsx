"use client";

import Link from "next/link";
import { assetPath } from "@/lib/assetPath";

function BrandLogoImg({ height = 48 }: { height?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={assetPath("/logo.png")}
      alt="HireMind"
      height={height}
      width={Math.round(height * 1.46)}
      style={{ height: `${height}px`, width: "auto", objectFit: "contain" }}
    />
  );
}

interface Props {
  candidateName: string;
}

const NEXT_STEPS = [
  {
    icon: <BriefcaseIcon />,
    iconBg: "bg-brand-50",
    iconColor: "text-brand-600",
    title: "Explore Jobs",
    desc: "Find jobs that match your skills and preferences.",
    href: "/jobs",
  },
  {
    icon: <EyeIcon />,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
    title: "Improve Visibility",
    desc: "Add a profile video or portfolio to stand out.",
    href: "/profile/edit",
  },
  {
    icon: <BellIcon />,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-500",
    title: "Set Job Alerts",
    desc: "Get notified about relevant job opportunities.",
    href: "/settings/notifications",
  },
  {
    icon: <SliderIcon />,
    iconBg: "bg-brand-50",
    iconColor: "text-brand-600",
    title: "Update Preferences",
    desc: "Fine-tune your preferences anytime.",
    href: "/settings",
  },
  {
    icon: <GiftIcon />,
    iconBg: "bg-pink-50",
    iconColor: "text-pink-500",
    title: "Invite & Earn",
    desc: "Invite your friends and earn exciting rewards.",
    href: "/referral",
  },
];

const ENHANCEMENTS = [
  {
    icon: "🎬",
    color: "text-brand-600",
    iconBg: "bg-brand-50",
    title: "Add Profile Video",
    desc: "Introduce yourself to recruiters with a short video.",
    cta: "Add Video",
    ctaStyle: "border-brand-400 text-brand-600 hover:bg-brand-50",
  },
  {
    icon: "📋",
    color: "text-green-600",
    iconBg: "bg-green-50",
    title: "Add Portfolio",
    desc: "Showcase your work and projects to build credibility.",
    cta: "Add Portfolio",
    ctaStyle: "border-green-400 text-green-600 hover:bg-green-50",
  },
  {
    icon: "📄",
    color: "text-orange-500",
    iconBg: "bg-orange-50",
    title: "Upload Resume",
    desc: "Let recruiters download your resume in one click.",
    cta: "Upload Resume",
    ctaStyle: "border-orange-400 text-orange-500 hover:bg-orange-50",
  },
  {
    icon: "👥",
    color: "text-brand-600",
    iconBg: "bg-brand-50",
    title: "Get Endorsed",
    desc: "Get skill endorsements from your colleagues.",
    cta: "Request Endorsements",
    ctaStyle: "border-brand-400 text-brand-600 hover:bg-brand-50",
  },
];

export default function ProfileSubmission({ candidateName }: Props) {
  const firstName = candidateName.split(" ")[0] || "User";

  return (
    <div className="min-h-screen flex flex-col app-canvas">
      {/* ── Header ── */}
      <header className="chrome-header sticky top-0 z-20">
        <div className="site-container h-full flex items-center justify-between gap-3">
          <Link href="/">
            <BrandLogoImg height={56} />
          </Link>
          <div className="flex items-center gap-5">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
            >
              <InfoIcon /> Need Help?
            </button>
            <div className="flex items-center gap-2 h-10 px-3 rounded-xl border border-ink-200 bg-white cursor-pointer hover:bg-ink-50 transition-colors min-w-0">
              <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-caption">
                {firstName[0].toUpperCase()}
              </div>
              <span className="text-body font-semibold text-ink-800 truncate max-w-[40vw]">
                {candidateName}
              </span>
              <ChevronDownIcon />
            </div>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main id="main" tabIndex={-1} className="flex-1 site-container pt-8 lg:pt-10 pb-16">
        <div className="mx-auto max-w-[1100px] space-y-5">
          {/* Hero section */}
          <div className="card-elevated overflow-hidden">
            <div className="grid md:grid-cols-[260px_minmax(0,1fr)] lg:grid-cols-[280px_minmax(0,1fr)_300px]">
              {/* Illustration */}
              <div className="bg-ink-50/70 border-b md:border-b-0 md:border-r border-ink-200/60 flex items-center p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={assetPath("/images/profile-submit.png")}
                  alt="Profile submitted"
                  className="relative w-full h-auto object-contain rounded-stage"
                />
              </div>

              {/* Success content */}
              <div className="p-6 flex flex-col justify-center">
                <div className="w-14 h-14 rounded-full bg-green-600 flex items-center justify-center mx-auto mb-4 ring-8 ring-green-100">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M20 6L9 17l-5-5"
                      stroke="white"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h1 className="page-title text-center mb-3">
                  Your profile has been submitted!
                </h1>
                <p className="text-ink-500 text-body leading-relaxed text-center max-w-[400px] mx-auto mb-4">
                  Thank you for completing your profile. Recruiters can now
                  discover you based on your skills and preferences.
                </p>

                {/* Profile Strength */}
                <div className="surface-muted p-4 max-w-[400px] mx-auto w-full">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-body font-bold text-ink-900">
                      Profile Strength
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-body-sm font-bold text-green-600">
                        Excellent
                      </span>
                      <span className="text-body-sm font-bold text-ink-700">
                        100%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-ink-200/70 overflow-hidden mb-3">
                    <div className="h-full rounded-full bg-green-600 w-full" />
                  </div>
                  <div className="alert alert-success items-center">
                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M12 21s-8-4.35-8-11.5a8 8 0 0 1 16 0C20 16.65 12 21 12 21z"
                          stroke="currentColor"
                          strokeWidth="1.6"
                        />
                      </svg>
                    </div>
                    <p className="text-body-sm text-green-700 leading-snug">
                      A complete profile increases your chances of getting
                      noticed by top recruiters.
                    </p>
                  </div>
                </div>
              </div>

              {/* What's Next */}
              <div className="md:col-span-2 lg:col-span-1 border-t lg:border-t-0 lg:border-l border-ink-200/60 p-6">
                <h3 className="font-display font-extrabold text-title-sm text-ink-900 mb-4">
                  What&apos;s Next?
                </h3>
                <div className="space-y-1">
                  {NEXT_STEPS.map((item) => (
                    <Link
                      key={item.title}
                      href={item.href}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-ink-50 transition-colors group"
                    >
                      <div
                        className={`w-9 h-9 rounded-xl ${item.iconBg} ${item.iconColor} flex items-center justify-center shrink-0`}
                      >
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-body font-semibold text-ink-900 group-hover:text-brand-600 transition">
                          {item.title}
                        </div>
                        <div className="text-caption text-ink-400 leading-tight truncate">
                          {item.desc}
                        </div>
                      </div>
                      <ChevronRightIcon />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Make the most of your profile */}
          <div className="card p-5 sm:p-6">
            <div className="text-center mb-4">
              <h2 className="section-title text-title">
                Make the most of your profile
              </h2>
              <p className="text-ink-500 text-body mt-1">
                Enhance your profile and get better opportunities
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {ENHANCEMENTS.map((item) => (
                <div
                  key={item.title}
                  className="surface-muted p-4 flex flex-col"
                >
                  <div
                    className={`w-11 h-11 rounded-xl ${item.iconBg} flex items-center justify-center text-title-lg mb-4`}
                  >
                    {item.icon}
                  </div>
                  <h3 className={`font-bold text-body mb-1.5 ${item.color}`}>
                    {item.title}
                  </h3>
                  <p className="text-ink-500 text-body-sm leading-relaxed flex-1 mb-4">
                    {item.desc}
                  </p>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm w-full"
                  >
                    {item.cta}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Footer CTAs */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
            <Link
              href="/dashboard"
              className="btn btn-outline btn-lg"
            >
              <DashboardIcon /> Go to Dashboard
            </Link>
            <Link
              href="/jobs"
              className="btn btn-primary btn-lg px-8"
            >
              Explore Jobs <ArrowRightIcon />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ── Icons ── */
function InfoIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 8v4M12 16h.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function ChevronRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path
        d="M9 18l6-6-6-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function BriefcaseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect
        x="2"
        y="7"
        width="20"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8S2 12 2 12z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4l2-2zM10 20a2 2 0 0 0 4 0"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function SliderIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 6h16M4 12h16M4 18h16"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle
        cx="9"
        cy="6"
        r="2"
        fill="white"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle
        cx="15"
        cy="12"
        r="2"
        fill="white"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle
        cx="9"
        cy="18"
        r="2"
        fill="white"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}
function GiftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect
        x="2"
        y="9"
        width="20"
        height="13"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M12 9v13M2 13h20"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M8 9c0-2 2-4 4-4s4 2 4 4M8 9C6 9 4 8 4 6s2-3 4-1c.7.7 4 4 4 4M16 9c2 0 4-1 4-3s-2-3-4-1c-.7.7-4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
function DashboardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect
        x="3"
        y="3"
        width="7"
        height="7"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <rect
        x="3"
        y="14"
        width="7"
        height="7"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <rect
        x="14"
        y="3"
        width="7"
        height="7"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <rect
        x="14"
        y="14"
        width="7"
        height="7"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}
function ArrowRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
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
