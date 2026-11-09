"use client";

import { useState } from "react";
import Link from "next/link";
import AuthHeader from "./AuthHeader";

const FAQS = [
  {
    q: "I can't log in. What should I do?",
    a: "First make sure you've selected the correct account type (Candidate or Recruitment Company). If you've forgotten your password, use the \"Forgot Password?\" link on the login page to reset it.",
  },
  {
    q: "How do I reset my password?",
    a: "On the login page click \"Forgot Password?\", enter your registered email and account type and we'll send a reset link that's valid for 30 minutes.",
  },
  {
    q: "How is my match score calculated?",
    a: "Your match score compares your profile (skills, experience, education, location, notice period and salary expectations) plus your résumé against each job. Completing your profile and uploading a résumé improves your matches.",
  },
  {
    q: "My résumé isn't reflected in my matches.",
    a: "After uploading your résumé, give it a moment to process. Once processed, re-open your dashboard and your matches will update to use it.",
  },
  {
    q: "How do I contact support?",
    a: "Email us using the button below and our team will get back to you within one business day.",
  },
];

const SUPPORT_EMAIL = "contactus@arvantra-ai.com";

export default function HelpPage() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="h-screen flex flex-col app-canvas overflow-hidden">
      <AuthHeader cta={{ label: "Back to Login", href: "/login", icon: null }} border />
      <main id="main" tabIndex={-1} className="flex-1 overflow-y-auto min-h-0 px-6 py-10">
        <div className="mx-auto max-w-[720px]">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mx-auto mb-4">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
            </div>
            <h1 className="font-display font-extrabold text-display-sm text-ink-900">How can we help?</h1>
            <p className="text-body text-ink-500 mt-1.5">Find quick answers below, or reach out and we&apos;ll help you directly.</p>
          </div>

          {/* FAQ accordion */}
          <div className="bg-white rounded-2xl border border-ink-100 shadow-sm divide-y divide-ink-100 overflow-hidden">
            {FAQS.map((faq, i) => (
              <div key={faq.q}>
                <button
                  type="button"
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-ink-50/60 transition-colors"
                  aria-expanded={open === i}
                >
                  <span className="font-semibold text-body text-ink-800">{faq.q}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" className={`shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`}><polyline points="6 9 12 15 18 9" /></svg>
                </button>
                {open === i && (
                  <div className="px-5 pb-4 -mt-1 text-body text-ink-600 leading-relaxed">{faq.a}</div>
                )}
              </div>
            ))}
          </div>

          {/* Contact */}
          <div className="mt-6 bg-white rounded-2xl border border-ink-100 shadow-sm p-6 text-center">
            <h2 className="font-display font-bold text-title-sm text-ink-900">Still need help?</h2>
            <p className="text-body text-ink-500 mt-1 mb-4">Our support team typically replies within one business day.</p>
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=HireMind%20Support%20Request`}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-body font-semibold hover:opacity-95 transition btn-gradient-brand"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
              Email {SUPPORT_EMAIL}
            </a>
            <p className="mt-4 text-body-sm text-ink-500">
              Or head back to{" "}
              <Link href="/login" className="text-brand-600 font-semibold hover:text-brand-700">Login</Link>.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
