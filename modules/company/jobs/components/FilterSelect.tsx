/* Labeled dropdown filter. `tinted` (default) matches the Jobs list toolbar;
 * `outline` matches the bordered filters on the applications page.
 * Pass `value`/`onChange` to make it controlled (drives a real filter). */
export function FilterSelect({ label, options, variant = "tinted", value, onChange }: {
  label: string;
  options: string[];
  variant?: "tinted" | "outline";
  value?: string;
  onChange?: (value: string) => void;
}) {
  const fieldCls =
    variant === "outline"
      ? "bg-white border border-ink-200 hover:border-ink-300 shadow-card"
      : "bg-ink-50 border border-ink-200/70 hover:bg-white hover:border-ink-300";
  const controlled = onChange !== undefined;
  const hasValue = controlled && Boolean(value);
  return (
    <div className="relative inline-flex items-center max-w-full">
      <select
        aria-label={label}
        className={`appearance-none h-10 max-w-full pl-3.5 pr-9 rounded-xl text-body-sm font-medium cursor-pointer outline-none transition-[border-color,box-shadow,background-color] focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 ${hasValue ? "text-ink-900" : "text-ink-600"} ${fieldCls}`}
        value={controlled ? (value ?? "") : undefined}
        defaultValue={controlled ? undefined : ""}
        onChange={(e) => onChange?.(e.target.value)}
      >
        <option value="" disabled>{label}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" className="absolute right-3 text-ink-400 pointer-events-none">
        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
