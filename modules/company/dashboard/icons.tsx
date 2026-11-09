/* Dashboard icon barrel. Job icons are re-exported from the canonical jobs
 * icon set (never redefined). Only glyphs absent there are declared locally. */
export {
  BriefIcon,
  CalendarIcon,
  DocIcon,
  UsersIcon,
  ArrowRightLong,
} from "@/modules/company/jobs/shared/icons";

import type { IconProps } from "@/modules/company/jobs/shared/icons";

export function UserCheckIcon({ size = 20, className }: IconProps) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <polyline points="16 11 18 13 22 9" />
    </svg>
  );
}
