"use client";

import { useState } from "react";
import { Social } from "./pieces";
import { ArrowRight, BulbIcon, GlobeIcon, LinkIcon, ShareIcon } from "./icons";

/* Right-rail of the publish-success page: share + copy link, live-on, tips. */
export function SuccessRail() {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    if (typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — ignore */
    }
  };

  return (
    <aside className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-4 items-start">
      <div className="card-elevated p-5 md:col-span-2 xl:col-span-1">
        <RailTitle icon={<ShareIcon />} tint="bg-brand-50 text-brand-600">Share Your Job</RailTitle>
        <p className="text-body-sm text-ink-500 mt-2 mb-4">Increase your reach by sharing your job on multiple platforms.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          <Social icon="in" label="LinkedIn" bg="bg-cobalt-50 text-cobalt-700" />
          <Social icon="f" label="Facebook" bg="bg-cobalt-50 text-cobalt-700" />
          <Social icon="x" label="Twitter" bg="bg-ink-100 text-ink-800" />
          <Social icon="w" label="WhatsApp" bg="bg-success/10 text-success" />
        </div>
        <button
          type="button"
          onClick={copyLink}
          aria-live="polite"
          className={`btn w-full text-body-sm ${copied ? "border border-success/30 bg-success/10 text-success" : "btn-outline"}`}
        >
          <LinkIcon /> {copied ? "Link Copied!" : "Copy Link"}
        </button>
      </div>

      <div className="card p-5">
        <RailTitle icon={<GlobeIcon />} tint="bg-cobalt-50 text-cobalt-600">Job Post is Live On</RailTitle>
        <ul className="mt-3 space-y-2 text-body-sm text-ink-700">
          <li className="flex items-start gap-2.5"><CheckIcon /> HireMind Job Board</li>
          <li className="flex items-start gap-2.5"><CheckIcon /> Email Alerts to Subscribers</li>
          <li className="flex items-start gap-2.5"><CheckIcon /> Partner Job Boards (Indeed, Naukri, LinkedIn, etc.)</li>
        </ul>
      </div>

      <div className="card p-5">
        <RailTitle icon={<BulbIcon />} tint="bg-warn/10 text-warn">Tips to get more applications</RailTitle>
        <ul className="mt-3 space-y-2 text-body-sm text-ink-700">
          <li className="flex items-start gap-2.5"><CheckIcon /> Share your job on social media</li>
          <li className="flex items-start gap-2.5"><CheckIcon /> Add relevant skills for better matches</li>
          <li className="flex items-start gap-2.5"><CheckIcon /> Respond quickly to applicants</li>
        </ul>
        <a className="mt-3 inline-flex items-center gap-1.5 text-body-sm text-success font-semibold">View Best Practices <ArrowRight /></a>
      </div>
    </aside>
  );
}

function RailTitle({ icon, tint, children }: { icon: React.ReactNode; tint: string; children: React.ReactNode }) {
  return (
    <h3 className="section-title flex items-center gap-2.5">
      <span className={`icon-tile icon-tile-sm ${tint}`}>{icon}</span>
      {children}
    </h3>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0 text-success">
      <circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity="0.12" />
      <path d="M8 12.5l2.5 2.5L16 9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
