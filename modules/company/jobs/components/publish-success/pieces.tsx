import Link from "next/link";
import { ArrowRight } from "./icons";

export function NextCard({ icon, title, body, action, tint, href, onClick }: {
  icon: React.ReactNode; title: string; body: string; action: string; tint: string;
  href?: string; onClick?: () => void;
}) {
  const actionCls = "inline-flex items-center gap-1.5 h-10 text-body-sm text-brand-700 font-semibold hover:text-brand-900 transition-colors";
  return (
    <div className="card p-5 flex flex-col">
      <span className={`icon-tile ${tint}`}>{icon}</span>
      <h3 className="section-title mt-3">{title}</h3>
      <p className="text-body-sm text-ink-500 mt-1 leading-relaxed flex-1">{body}</p>
      <div className="mt-2">
        {href ? (
          <Link href={href} className={actionCls}>{action} <ArrowRight /></Link>
        ) : onClick ? (
          <button type="button" onClick={onClick} className={actionCls}>{action} <ArrowRight /></button>
        ) : (
          <span className={actionCls}>{action} <ArrowRight /></span>
        )}
      </div>
    </div>
  );
}

export function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-caption font-medium text-ink-500">{label}</dt>
      <dd className="text-body-sm font-semibold text-ink-900 mt-1 wrap-break-word">{value}</dd>
    </div>
  );
}

export function Social({ icon, label, bg }: { icon: string; label: string; bg: string }) {
  return (
    <button type="button" className={`flex flex-col items-center justify-center gap-1 min-h-16 px-2 py-2.5 rounded-xl border border-transparent transition-colors hover:border-ink-200 ${bg}`}>
      <span aria-hidden="true" className="w-7 h-7 rounded-lg bg-white/80 grid place-items-center text-body-sm font-extrabold shadow-card">{icon}</span>
      <span className="text-micro font-semibold">{label}</span>
    </button>
  );
}
