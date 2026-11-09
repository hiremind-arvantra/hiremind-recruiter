import { StatCard as KpiCard } from "@/components/ui/StatCard";
import { TrendUpIcon } from "../shared/icons";

/* Recruiter KPI tile — a thin adapter over the shared components/ui/StatCard. */
export function StatCard({ iconBg, icon, value, label, delta }: {
  iconBg: string; icon: React.ReactNode; value: string; label: string; delta?: string;
}) {
  return (
    <KpiCard
      label={label}
      value={value}
      icon={icon}
      iconClassName={iconBg}
      delta={delta ? <><TrendUpIcon /> {delta}</> : undefined}
    />
  );
}
