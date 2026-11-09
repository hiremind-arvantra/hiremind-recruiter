const AI_FEATURES = [
  { icon: <AiTargetIcon />, label: "Smart Matching",        tone: "text-brand-600" },
  { icon: <AiDocIcon />,    label: "Resume AI",             tone: "text-cobalt-600" },
  { icon: <AiShieldIcon />, label: "Fraud Detection",       tone: "text-green-600" },
  { icon: <AiChartIcon />,  label: "Predictive Analytics",  tone: "text-amber-600" },
];

export default function AIPlatformStrip() {
  return (
    <section className="mt-6 card p-5 sm:p-6">
      <div className="flex flex-col lg:flex-row lg:items-center gap-5">
        <div className="flex items-start gap-3.5 lg:max-w-sm">
          <span className="icon-tile bg-[image:var(--gradient-brand-soft)] text-brand-600 ring-1 ring-brand-100">
            <SparkleIcon />
          </span>
          <div className="min-w-0">
            <h2 className="section-title">AI-Powered Platform</h2>
            <p className="section-subtitle">
              Leverage AI to find the right opportunities, connect with the right people, and make smarter hiring decisions.
            </p>
          </div>
        </div>
        <ul className="grid grid-cols-1 min-[400px]:grid-cols-2 sm:flex sm:flex-wrap gap-2 lg:ml-auto lg:justify-end">
          {AI_FEATURES.map((f) => (
            <li key={f.label} className="inline-flex items-center gap-2 min-h-10 px-3.5 rounded-xl border border-ink-200/70 bg-ink-50 text-body-sm font-semibold text-ink-700">
              <span className={f.tone}>{f.icon}</span>{f.label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function SparkleIcon() {
  return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>;
}
function AiTargetIcon() {
  return <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6"/><circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.6"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>;
}
function AiDocIcon() {
  return <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="4" y="2" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="1.6"/><path d="M8 7h8M8 11h8M8 15h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>;
}
function AiShieldIcon() {
  return <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 3l8 4v6c0 4-3 7-8 8-5-1-8-4-8-8V7l8-4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function AiChartIcon() {
  return <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M3 20h18M5 20V12M9 20V8M13 20V4M17 20v-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>;
}
