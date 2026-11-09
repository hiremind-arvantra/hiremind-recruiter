import type React from "react";

export function FeatureCard({
  icon,
  iconBg,
  iconColor,
  title,
  desc,
  titleColor,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  desc: string;
  titleColor: string;
}) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl border border-ink-100 bg-white">
      <div
        className={`w-11 h-11 rounded-full ${iconBg} ${iconColor} flex items-center justify-center shrink-0`}
      >
        {icon}
      </div>
      <div>
        <div className={`font-bold text-[0.875rem] ${titleColor}`}>{title}</div>
        <div className="text-[0.78125rem] text-ink-500 mt-0.5 leading-relaxed">{desc}</div>
      </div>
    </div>
  );
}
