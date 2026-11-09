const FEATURES = [
  { icon: <TargetIcon />, title: "AI-Powered Job Matching",   desc: "Get personalized job recommendations based on your skills and experience." },
  { icon: <DocIcon />,    title: "Smart Resume Analysis",      desc: "AI analyzes your resume and improves your visibility to recruiters." },
  { icon: <ChartIcon />,  title: "Career Insights",            desc: "Track your profile performance and get actionable career insights." },
  { icon: <LockIcon />,   title: "Secure & Private",           desc: "Your data is encrypted and we never share your information." },
];

export default function SidebarFeatures() {
  return (
    <ul className="card p-2">
      {FEATURES.map((f) => (
        <li key={f.title} className="flex items-start gap-3 rounded-2xl px-3 py-3">
          <span className="icon-tile icon-tile-sm bg-brand-50 text-brand-600 ring-1 ring-brand-100">
            {f.icon}
          </span>
          <div className="min-w-0">
            <div className="font-semibold text-body-sm text-ink-900 leading-snug">{f.title}</div>
            <div className="text-caption text-ink-500 leading-relaxed mt-0.5">{f.desc}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function TargetIcon() {
  return <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6"/><circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.6"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>;
}
function DocIcon() {
  return <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="4" y="2" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="1.6"/><path d="M8 7h8M8 11h8M8 15h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>;
}
function ChartIcon() {
  return <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M3 20h18M6 20v-7M11 20V8M16 20v-4M20 20V5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>;
}
function LockIcon() {
  return <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.6"/><path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>;
}
