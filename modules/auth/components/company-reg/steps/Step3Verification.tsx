"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { CompanyData, AdminData } from "../shared/types";
import HorizontalStepper from "../shared/HorizontalStepper";
import VerticalStepper from "../shared/VerticalStepper";
import { authService } from "@/modules/auth/services/auth.service";

interface Props {
  company: CompanyData;
  admin: AdminData;
  onBack: () => void;
  onEdit: (target: 1 | 2) => void;
}

export default function Step3Verification({ company, admin, onBack, onEdit }: Props) {
  const router = useRouter();
  const [isCompleting, setIsCompleting] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  const bothVerified = emailVerified && phoneVerified;

  async function handleComplete() {
    if (!bothVerified) return;
    setIsCompleting(true);
    // Logo is uploaded in Step 2 (right after the company profile is created).
    router.push("/company/dashboard");
  }

  return (
    // Same .site-container column as AuthHeader — see Step 1.
    <div className="site-container flex-1 grid lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)] gap-8 xl:gap-10 items-start pt-6 sm:pt-8 lg:pt-10 pb-16">
      {/* ─────────────── LEFT SIDEBAR ─────────────── */}
      <aside className="hidden lg:block sticky top-[calc(var(--header-h)+40px)] max-h-[calc(100vh-var(--header-h)-56px)] overflow-y-auto pb-2 space-y-5">
        <h2 className="font-display text-title-lg font-extrabold tracking-tight text-ink-900">Create your company account</h2>

        <VerticalStepper
          current={3}
          steps={[
            { n: 1, title: "Company Details", caption: "Completed",                 done: true  },
            { n: 2, title: "Admin Details",   caption: "Completed",                 done: true  },
            { n: 3, title: "Verification",    caption: "Verify your email and phone", done: false },
          ]}
        />

        {/* Account Summary */}
        <div className="card p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="font-display font-bold text-body text-ink-900">Account Summary</div>
            <button onClick={() => onEdit(1)} className="btn btn-ghost btn-sm h-8 -mr-2 text-brand-700">
              <PencilIcon /> Edit
            </button>
          </div>
          <SummaryGroup label="Company">
            <SummaryLine icon={<BuildingIcon />} title={company.companyName || "—"} sub={`${company.industry || "—"} • ${company.companySize || "—"}`} />
          </SummaryGroup>
          <SummaryGroup label="Admin">
            <SummaryLine icon={<UserIcon />} title={admin.fullName || "—"} sub={`${admin.designation || "—"} • ${admin.email || "—"}`} />
          </SummaryGroup>
          <SummaryGroup label="Contact" last>
            <div className="flex items-center gap-2 text-caption text-ink-700 mb-1.5 min-w-0">
              <span className="text-ink-400 shrink-0"><MailIcon /></span> <span className="truncate">{admin.email || "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-caption text-ink-700 tabular">
              <span className="text-ink-400 shrink-0"><PhoneIcon /></span> {admin.countryCode || "+91"} {admin.mobile || "—"}
            </div>
          </SummaryGroup>
        </div>

        {/* Security card */}
        <div className="flex items-start gap-3 px-1">
          <span className="icon-tile w-9 h-9 rounded-xl bg-green-50 text-green-700 ring-1 ring-green-100"><ShieldIcon /></span>
          <div className="min-w-0 leading-snug">
            <div className="text-body-sm font-bold text-ink-900">Your information is secure</div>
            <div className="text-caption text-ink-500 mt-0.5">We use industry-standard security to protect your data.</div>
          </div>
        </div>

        <NeedHelpCard />
      </aside>

      {/* ─────────────── RIGHT FORM ─────────────── */}
      <main id="main" tabIndex={-1} className="min-w-0">
        <div className="card-elevated p-5 sm:p-7 lg:p-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-ink-200/70">
            <div className="flex items-start gap-4 min-w-0">
              <span className="icon-tile w-12 h-12 rounded-2xl bg-cobalt-50 text-cobalt-600 ring-1 ring-cobalt-100">
                <MailCheckIcon />
              </span>
              <div className="min-w-0">
                <h1 className="page-title">Verify your email and phone</h1>
                <p className="page-subtitle mt-1">We&apos;ve sent verification codes to your email and phone number.</p>
              </div>
            </div>
            <HorizontalStepper current={3} />
          </div>

          {/* OTP panel — email | + | phone */}
          <div className="mt-7 grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-4 lg:gap-5 items-stretch">
            <OtpCard
              title="Verify Email Address"
              target={admin.email || "—"}
              helperLeft="Didn't receive the code?"
              helperRight="Resend Code"
              helperRightIcon={<RefreshIcon />}
              canResend
              verified={emailVerified}
              onVerified={() => setEmailVerified(true)}
            />
            <div className="hidden lg:flex items-center justify-center" aria-hidden="true">
              <span className="grid place-items-center w-9 h-9 rounded-full bg-white text-ink-500 border border-ink-200/70 shadow-card text-title font-bold">+</span>
            </div>
            <OtpCard
              title="Verify Phone Number"
              target={`${admin.countryCode || "+91"} ${admin.mobile || "—"}`}
              helperLeft="Wrong number?"
              helperRight="Change Number"
              helperRightIcon={<ArrowRight />}
              onChangeTarget={() => onEdit(2)}
              verified={phoneVerified}
              onVerified={() => setPhoneVerified(true)}
            />
          </div>

          {/* Demo notice — OTP delivery is not wired up yet */}
          <p className="alert alert-info mt-4 justify-center text-center text-caption">
            Demo mode: codes are not sent yet — enter any 6-digit number (except 000000) to verify.
          </p>

          {/* Unlock Powerful Hiring Tools */}
          <div className="mt-6 surface-muted px-4 sm:px-5 py-4 flex flex-col xl:flex-row xl:items-center gap-5">
            <div className="flex items-center gap-3 xl:max-w-[360px]">
              <span className="icon-tile bg-white text-brand-600 border border-ink-200/70"><LockIcon /></span>
              <div className="min-w-0 leading-snug">
                <div className="text-body font-bold text-ink-900">Unlock Powerful Hiring Tools</div>
                <div className="text-caption text-ink-500 mt-0.5">Once verified, you can start posting jobs, managing candidates and collaborating with your team.</div>
              </div>
            </div>
            <ul className="flex-1 grid grid-cols-2 min-[480px]:grid-cols-3 sm:grid-cols-5 gap-3">
              <ToolPill icon={<DocIcon />}     label="Post Jobs" />
              <ToolPill icon={<UsersIcon />}   label="Manage Candidates" />
              <ToolPill icon={<MatchIcon />}   label="AI Matching" />
              <ToolPill icon={<ChartIcon />}   label="Reports & Analytics" />
              <ToolPill icon={<TeamIcon />}    label="Team Collaboration" />
            </ul>
          </div>

          {/* Bottom buttons */}
          <div className="sticky bottom-0 z-10 -mx-5 sm:-mx-7 lg:-mx-8 -mb-5 sm:-mb-7 lg:-mb-8 mt-8 px-5 sm:px-7 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-2 border-t border-ink-200/70 glass rounded-b-card">
            <button onClick={onBack} className="btn btn-outline btn-lg px-4 sm:px-5">
              <ArrowLeft /> Back
            </button>
            <div className="flex items-center gap-2 ml-auto">
              <button className="btn btn-ghost btn-lg px-3 sm:px-5">
                Save & Exit
              </button>
              <button
                onClick={handleComplete}
                disabled={isCompleting || !bothVerified}
                title={bothVerified ? undefined : "Verify both email and phone to continue"}
                className="btn btn-primary btn-lg px-5 sm:px-7">
                {isCompleting
                  ? <><SpinnerIcon /> Setting up…</>
                  : <>Complete Setup <ArrowRight /></>
                }
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ────────────────── Pieces ────────────────── */
function OtpCard({ title, target, helperLeft, helperRight, helperRightIcon, onChangeTarget, canResend, verified, onVerified }: {
  title: string; target: string;
  helperLeft: string; helperRight: string; helperRightIcon?: React.ReactNode;
  onChangeTarget?: () => void;
  canResend?: boolean;
  verified: boolean;
  onVerified: () => void;
}) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [seconds, setSeconds] = useState(300);
  const [verifying, setVerifying] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [resending, setResending] = useState(false);
  const refs = useRef<HTMLInputElement[]>([]);

  useEffect(() => {
    if (verified || seconds <= 0) return;
    const t = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [seconds, verified]);

  const fullOtp = digits.join("");

  useEffect(() => {
    if (fullOtp.length !== 6 || verified || verifying) return;
    void handleVerify(fullOtp);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullOtp]);

  async function handleVerify(otp: string) {
    setVerifying(true);
    setOtpError("");
    try {
      await authService.verifyOtp(target, otp);
      onVerified();
    } catch {
      setOtpError("Invalid code. Please try again.");
      setDigits(["", "", "", "", "", ""]);
      setTimeout(() => refs.current[0]?.focus(), 0);
    } finally {
      setVerifying(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setOtpError("");
    try {
      await authService.resendOtp(target);
    } catch {
      // non-fatal
    } finally {
      setResending(false);
      setSeconds(300);
      setDigits(["", "", "", "", "", ""]);
      setTimeout(() => refs.current[0]?.focus(), 0);
    }
  }

  const setAt = (i: number, v: string) => {
    if (verified || verifying) return;
    const ch = v.replace(/\D/g, "").slice(-1);
    setDigits((arr) => arr.map((d, j) => (j === i ? ch : d)));
    if (ch && i < 5) refs.current[i + 1]?.focus();
  };
  const onKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const expired = seconds <= 0;

  return (
    <div className={`rounded-2xl border p-4 sm:p-5 flex flex-col transition-colors ${verified ? "border-green-200 bg-green-50/50" : "border-ink-200/70 bg-white"}`}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="section-title">{title}</h2>
        {verified
          ? <span className="badge badge-success"><CheckIcon /> Verified</span>
          : <span className="badge badge-success">Sent</span>
        }
      </div>
      <p className="mt-2 text-caption text-ink-500">We&apos;ve sent a 6-digit code to</p>
      <div className="text-body-sm font-semibold text-ink-900 mt-0.5 break-all tabular">{target}</div>

      {verified ? (
        <div role="status" className="mt-4 flex items-center gap-2 text-body-sm text-green-700 font-semibold">
          <CheckIcon /> Successfully verified
        </div>
      ) : (
        <>
          <p className="text-caption text-ink-500 mt-3">Enter the code below to verify.</p>
          <div role="group" aria-label={`${title} code`} className={`mt-2.5 grid grid-cols-6 gap-1.5 sm:gap-2 ${verifying ? "opacity-50 pointer-events-none" : ""}`}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { if (el) refs.current[i] = el; }}
                value={d}
                onChange={(e) => setAt(i, e.target.value)}
                onKeyDown={(e) => onKey(i, e)}
                inputMode="numeric"
                maxLength={1}
                aria-label={`Digit ${i + 1}`}
                aria-invalid={otpError ? true : undefined}
                className={`w-full min-w-0 h-12 rounded-xl border text-center text-title-sm font-semibold tabular outline-none transition-[border-color,box-shadow] focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 ${
                  otpError ? "border-danger/60" : d ? "border-brand-300 bg-brand-50/50" : "border-ink-200 bg-white hover:border-ink-300"
                }`}
              />
            ))}
          </div>
          {verifying && (
            <div role="status" className="mt-2 flex items-center gap-2 text-caption text-brand-700">
              <SpinnerIcon /> <span className="sr-only">Verifying</span>
            </div>
          )}
          {otpError && <p className="field-error" role="alert">{otpError}</p>}
          {!expired
            ? <div className="mt-3 inline-flex items-center gap-1.5 text-caption text-ink-600"><ClockIcon /> Expires in <span className="text-green-700 font-bold tabular">{mm}:{ss}</span></div>
            : <div className="mt-3 text-caption font-medium text-danger">Code expired — please resend.</div>
          }
        </>
      )}

      <div className="mt-auto pt-4">
        <div className="rounded-xl bg-ink-50 border border-ink-200/60 pl-3.5 pr-1.5 py-1.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-caption">
          <span className="flex items-center gap-1.5 text-ink-600">
            <InfoIcon /> {helperLeft}
          </span>
          {canResend ? (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || verified}
              className="btn btn-ghost btn-sm h-8 px-2.5 text-brand-700"
            >
              {resending ? <SpinnerIcon /> : helperRightIcon} {helperRight}
            </button>
          ) : (
            <button
              type="button"
              onClick={onChangeTarget}
              disabled={verified}
              className="btn btn-ghost btn-sm h-8 px-2.5 text-brand-700"
            >
              {helperRight} {helperRightIcon}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ToolPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <li className="flex flex-col items-center text-center gap-1.5">
      <span className="icon-tile w-9 h-9 bg-white text-cobalt-600 border border-ink-200/70">{icon}</span>
      <span className="text-micro text-ink-700 font-medium leading-tight">{label}</span>
    </li>
  );
}

function SummaryGroup({ label, last, children }: { label: string; last?: boolean; children: React.ReactNode }) {
  return (
    <div className={last ? "" : "mb-3 pb-3 border-b border-ink-200/60"}>
      <div className="text-micro font-bold text-ink-500 uppercase tracking-wider mb-2">{label}</div>
      {children}
    </div>
  );
}
function SummaryLine({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="icon-tile w-7 h-7 rounded-lg bg-cobalt-50 text-cobalt-600">{icon}</span>
      <div className="leading-snug flex-1 min-w-0">
        <div className="text-body-sm font-bold text-ink-900 truncate">{title}</div>
        <div className="text-caption text-ink-500 truncate">{sub}</div>
      </div>
    </div>
  );
}
function NeedHelpCard() {
  return (
    <div className="flex items-start gap-3 px-1">
      <span className="icon-tile w-9 h-9 rounded-xl bg-white text-ink-600 border border-ink-200/70"><HeadsetIcon /></span>
      <div className="min-w-0">
        <div className="text-body-sm font-bold text-ink-900">Need help?</div>
        <div className="text-caption text-ink-500">Our support team is here to help you.</div>
        <a className="mt-1 inline-flex items-center gap-1 text-caption font-semibold text-brand-700">Contact Support <ArrowRight /></a>
      </div>
    </div>
  );
}

/* Icons */
function SpinnerIcon() {
  return (
    <svg aria-hidden="true" className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
function CheckIcon() { return (<svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
function PencilIcon() { return (<svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M16 4l4 4-11 11H5v-4L16 4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>); }
function BuildingIcon() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="16" height="18" stroke="currentColor" strokeWidth="1.6" /><path d="M9 8h2M13 8h2M9 12h2M13 12h2M9 16h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>); }
function UserIcon() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="9" r="3.5" stroke="currentColor" strokeWidth="1.6" /><path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5" stroke="currentColor" strokeWidth="1.6" /></svg>); }
function MailIcon() { return (<svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" /><path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="1.6" /></svg>); }
function PhoneIcon() { return (<svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.6" /></svg>); }
function ShieldIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 3l8 4v6c0 4-3 7-8 8-5-1-8-4-8-8V7l8-4z" stroke="currentColor" strokeWidth="1.6" /></svg>); }
function MailCheckIcon() { return (<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" /><path d="M3 7l9 6 9-6M15 17l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
function ClockIcon() { return (<svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" /><path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>); }
function InfoIcon() { return (<svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" /><path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>); }
function RefreshIcon() { return (<svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v4h-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
function ArrowRight() { return (<svg aria-hidden="true" width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 8h10m0 0L8 3m5 5l-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
function ArrowLeft() { return (<svg aria-hidden="true" width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M13 8H3m0 0l5-5m-5 5l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
function HeadsetIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 14v-2a8 8 0 0 1 16 0v2M4 14h3v6H5a1 1 0 0 1-1-1v-5zm16 0h-3v6h2a1 1 0 0 0 1-1v-5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>); }
function LockIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" /><path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.6" /></svg>); }
function DocIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M7 2h8l5 5v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.6" /><path d="M9 12h6M9 16h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>); }
function UsersIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.6" /><circle cx="17" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.6" /><path d="M3 20c0-3 3-5 6-5s6 2 6 5M14 20c0-2 2-3 3.5-3 2 0 3.5 1 3.5 3" stroke="currentColor" strokeWidth="1.6" /></svg>); }
function MatchIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 8h6M4 16h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /><rect x="13" y="5" width="7" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.6" /></svg>); }
function ChartIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 4v16h16" stroke="currentColor" strokeWidth="1.6" /><rect x="7" y="13" width="3" height="5" fill="currentColor" /><rect x="12" y="9" width="3" height="9" fill="currentColor" /><rect x="17" y="6" width="3" height="12" fill="currentColor" /></svg>); }
function TeamIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="9" r="3" stroke="currentColor" strokeWidth="1.6" /><path d="M4 20c0-3 4-5 8-5s8 2 8 5" stroke="currentColor" strokeWidth="1.6" /></svg>); }
