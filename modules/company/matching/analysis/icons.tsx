/* Line icons for the match analysis screens — 1.8px strokes, currentColor. */

import type { CategoryId } from "../types";

type IconProps = { size?: number; className?: string };

function Svg({ size = 18, className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  );
}

export const TargetIcon = (p: IconProps) => (
  <Svg {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" /></Svg>
);
export const SkillsIcon = (p: IconProps) => (
  <Svg {...p}><circle cx="12" cy="6.5" r="3" /><circle cx="6.5" cy="16.5" r="3" /><circle cx="17.5" cy="16.5" r="3" /></Svg>
);
export const CalendarCheckIcon = (p: IconProps) => (
  <Svg {...p}><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M8 3v4M16 3v4M3.5 10h17M9 15l2 2 4-4" /></Svg>
);
export const CapIcon = (p: IconProps) => (
  <Svg {...p}><path d="m2 9 10-5 10 5-10 5z" /><path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" /></Svg>
);
export const BarsIcon = (p: IconProps) => (
  <Svg {...p}><path d="M4 20V10h4v10M10 20V4h4v16M16 20v-7h4v7M3 20h18" /></Svg>
);
export const InsightIcon = (p: IconProps) => (
  <Svg {...p}><circle cx="12" cy="7" r="3" /><path d="M6 21v-2a6 6 0 0 1 12 0v2" /><path d="M4 4l1.5 1.5M20 4l-1.5 1.5M12 1v1" /></Svg>
);
export const ShieldCheckIcon = (p: IconProps) => (
  <Svg {...p}><path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6z" /><path d="m9 12 2 2 4-4" /></Svg>
);
export const DocIcon = (p: IconProps) => (
  <Svg {...p}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></Svg>
);
export const ListIcon = (p: IconProps) => (
  <Svg {...p}><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r="1" /><circle cx="4.5" cy="12" r="1" /><circle cx="4.5" cy="18" r="1" /></Svg>
);
export const SparkleIcon = (p: IconProps) => (
  <Svg {...p}><path d="M12 3c.6 4.2 2.8 6.4 7 7-4.2.6-6.4 2.8-7 7-.6-4.2-2.8-6.4-7-7 4.2-.6 6.4-2.8 7-7z" /><path d="M19 2.5v3M17.5 4h3M5 17v3M3.5 18.5h3" /></Svg>
);
export const BulbIcon = (p: IconProps) => (
  <Svg {...p}><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" /></Svg>
);
export const TrophyIcon = (p: IconProps) => (
  <Svg {...p}><path d="M8 4h8v5a4 4 0 0 1-8 0z" /><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 21h8M9 17h6" /></Svg>
);
export const BuildingIcon = (p: IconProps) => (
  <Svg {...p}><rect x="5" y="3" width="10" height="18" rx="1" /><path d="M15 9h4v12h-4M8 7h1M11 7h1M8 11h1M11 11h1M8 15h1M11 15h1M3 21h18" /></Svg>
);
export const ChartUpIcon = (p: IconProps) => (
  <Svg {...p}><path d="M4 20h16" /><path d="M7 16v-3M11 16V9M15 16v-5M19 16V6" /></Svg>
);
export const BriefcaseIcon = (p: IconProps) => (
  <Svg {...p}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18" /></Svg>
);
export const CertIcon = (p: IconProps) => (
  <Svg {...p}><circle cx="12" cy="9" r="5" /><path d="m9 13.5-1.5 7.5 4.5-2.5 4.5 2.5-1.5-7.5" /><path d="m10 9 1.5 1.5L14 8" /></Svg>
);
export const BookIcon = (p: IconProps) => (
  <Svg {...p}><path d="M3 5h6a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H3zM21 5h-6a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h7z" /></Svg>
);
export const ClipboardIcon = (p: IconProps) => (
  <Svg {...p}><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3" /></Svg>
);
export const ThumbIcon = (p: IconProps) => (
  <Svg {...p}><path d="M7 11v9H4v-9zM7 11l4-8c1.5 0 2.5 1 2.5 2.5V9h5a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 17.3 20H7" /></Svg>
);
export const ClockIcon = (p: IconProps) => (
  <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>
);
export const MailIcon = (p: IconProps) => (
  <Svg {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></Svg>
);
export const PhoneIcon = (p: IconProps) => (
  <Svg {...p}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" /></Svg>
);
export const PinIcon = (p: IconProps) => (
  <Svg {...p}><path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z" /><circle cx="12" cy="9" r="2.5" /></Svg>
);
export const CalendarIcon = (p: IconProps) => (
  <Svg {...p}><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M8 3v4M16 3v4M3.5 10h17" /></Svg>
);
export const ChevronLeft = (p: IconProps) => <Svg {...p}><path d="m15 18-6-6 6-6" /></Svg>;
export const ChevronDown = (p: IconProps) => <Svg {...p}><path d="m6 9 6 6 6-6" /></Svg>;
export const ChevronUp = (p: IconProps) => <Svg {...p}><path d="m6 15 6-6 6 6" /></Svg>;
export const ArrowRight = (p: IconProps) => <Svg {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Svg>;
export const ArrowLeft = (p: IconProps) => <Svg {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></Svg>;
export const PlusIcon = (p: IconProps) => <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>;
export const XCircleIcon = (p: IconProps) => (
  <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6M15 9l-6 6" /></Svg>
);
export const DotsIcon = (p: IconProps) => (
  <Svg {...p}><circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" /></Svg>
);
export const InfoIcon = (p: IconProps) => (
  <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></Svg>
);
export const CheckboxIcon = (p: IconProps) => (
  <Svg {...p}><rect x="4" y="4" width="16" height="16" rx="3" /><path d="m8.5 12 2.5 2.5 4.5-5" /></Svg>
);
export const GridIcon = (p: IconProps) => (
  <Svg {...p}><rect x="4" y="4" width="6" height="6" rx="1.5" /><rect x="14" y="4" width="6" height="6" rx="1.5" /><rect x="4" y="14" width="6" height="6" rx="1.5" /><rect x="14" y="14" width="6" height="6" rx="1.5" /></Svg>
);
export const MonitorIcon = (p: IconProps) => (
  <Svg {...p}><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8M12 17v4M9 10l2 2 4-4" /></Svg>
);
export const TasksIcon = (p: IconProps) => (
  <Svg {...p}><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></Svg>
);
export const ImpactIcon = (p: IconProps) => (
  <Svg {...p}><path d="M4 20 10 14l3 3 7-8" /><path d="M15 9h5v5" /><path d="M4 4l3 3M7 4 4 7" /></Svg>
);
export const PeopleIcon = (p: IconProps) => (
  <Svg {...p}><circle cx="9" cy="8" r="3" /><path d="M3 20v-1a5 5 0 0 1 10 0v1" /><circle cx="17" cy="9" r="2.5" /><path d="M15.5 14.2A4 4 0 0 1 21 18v1" /></Svg>
);
export const LadderIcon = (p: IconProps) => (
  <Svg {...p}><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 16h3v-3h3v-3h3" /></Svg>
);
export const CompassIcon = (p: IconProps) => (
  <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5z" /></Svg>
);
export const BadgeIcon = (p: IconProps) => (
  <Svg {...p}><path d="M4 10h16v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" /><path d="M9 10V6a3 3 0 0 1 6 0v4" /><circle cx="12" cy="15" r="1.5" /></Svg>
);

/* Solid status glyphs — filled discs with a white mark, as in the mockups. */

export function CheckDot({ size = 20, className = "" }: IconProps) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" className={className}>
      <circle cx="12" cy="12" r="11" fill="currentColor" />
      <path d="m7.5 12.3 3 3 6-6.3" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AlertDot({ size = 20, className = "" }: IconProps) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" className={className}>
      <circle cx="12" cy="12" r="11" fill="currentColor" />
      <path d="M12 6.5v7" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1.4" fill="#fff" />
    </svg>
  );
}

export function StarSolid({ size = 18, className = "" }: IconProps) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" className={className}>
      <path
        fill="currentColor"
        d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"
      />
    </svg>
  );
}

/** One icon per scoring category, matching the mockups' category rows. */
export const CATEGORY_ICON: Record<CategoryId, (p: IconProps) => React.ReactElement> = {
  responsibilities: GridIcon,
  experience: MonitorIcon,
  skills: TasksIcon,
  qualifications: DocIcon,
  industry: BuildingIcon,
  achievements: ImpactIcon,
  leadership: PeopleIcon,
  career: LadderIcon,
  location: CompassIcon,
  professional: BadgeIcon,
};
