/* Publish-success icon set + hero graphic (thin-stroke design, page-local). */
export function SuccessGraphic() {
  return (
    <div className="relative w-35 h-35 shrink-0">
      <svg aria-hidden="true" viewBox="0 0 140 140" width="140" height="140" fill="none">
        {/* Soft halo, lit check disc, and a top highlight for depth */}
        <circle cx="70" cy="70" r="56" className="fill-success" fillOpacity="0.1" />
        <circle cx="70" cy="70" r="45" className="fill-success" />
        <ellipse cx="62" cy="50" rx="24" ry="12" className="fill-white" fillOpacity="0.18" />
        <path d="M53 71l12 12 24-26" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="22" cy="20" r="3" className="fill-warn" /><circle cx="120" cy="22" r="3" className="fill-cobalt-500" /><circle cx="125" cy="60" r="3" className="fill-danger" /><circle cx="18" cy="105" r="3" className="fill-brand-400" /><circle cx="115" cy="115" r="3" className="fill-success" />
        <path d="M30 40l-4-3M110 38l3-2M30 100l-4 3M115 95l3 2" className="stroke-warn" strokeWidth="2" strokeLinecap="round" />
        <path d="M14 65l-3-1M127 80l3 1M70 16l1-4M70 124l1 3" className="stroke-brand-400" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function BriefIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.6" /></svg>); }
export function BuildingIcon() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="16" height="18" stroke="currentColor" strokeWidth="1.6" /><path d="M9 8h2M13 8h2M9 12h2M13 12h2M9 16h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>); }
export function PinIcon() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 22s7-7 7-12a7 7 0 1 0-14 0c0 5 7 12 7 12z" stroke="currentColor" strokeWidth="1.6" /><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.6" /></svg>); }
export function UserIcon() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="9" r="3.5" stroke="currentColor" strokeWidth="1.6" /><path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5" stroke="currentColor" strokeWidth="1.6" /></svg>); }
export function GridIcon() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" /><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" /><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" /><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" /></svg>); }
export function TargetIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" /><circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.6" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /></svg>); }
export function ShortlistIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="1.6" /><path d="M8 9h8M8 13h8M8 17h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>); }
export function ShareIcon() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" /><circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="1.6" /><circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="1.6" /><path d="M9 11l6-4M9 13l6 4" stroke="currentColor" strokeWidth="1.6" /></svg>); }
export function ShieldIcon() { return (<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3l8 4v6c0 4-3 7-8 8-5-1-8-4-8-8V7l8-4z" stroke="currentColor" strokeWidth="1.6" /></svg>); }
export function LinkIcon() { return (<svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M10 14l4-4M14 7l1.5-1.5a4 4 0 1 1 5.7 5.7L19 13M10 17l-1.5 1.5a4 4 0 1 1-5.7-5.7L5 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>); }
export function GlobeIcon() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" stroke="currentColor" strokeWidth="1.6" /></svg>); }
export function BulbIcon() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3 11c1 .6 1.5 1.5 1.5 2.5V17h3v-.5c0-1 .5-1.9 1.5-2.5A6 6 0 0 0 12 3z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
export function MailIcon() { return (<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" /><path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="1.6" /></svg>); }
export function ArrowRight() { return (<svg aria-hidden="true" width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 8h10m0 0L8 3m5 5l-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
export function PaperPlane() { return (<svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M3 11l18-8-8 18-3-7-7-3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>); }
