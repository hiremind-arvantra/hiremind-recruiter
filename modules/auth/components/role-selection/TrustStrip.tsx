const TRUST_LOGOS = ["TATA", "Infosys", "Wipro", "Tech Mahindra", "HCL", "Accenture", "Cognizant"];

export default function TrustStrip() {
  return (
    <div className="mt-10 pb-2 text-center">
      <p className="text-caption text-ink-500 font-medium mb-4">
        Trusted by 10,000+ Users &amp; 500+ Companies
      </p>
      <ul className="flex items-center justify-center flex-wrap gap-x-8 gap-y-3">
        {TRUST_LOGOS.map((logo) => (
          <li key={logo} className="text-body-sm font-bold text-ink-400/80 tracking-wider uppercase">
            {logo}
          </li>
        ))}
      </ul>
    </div>
  );
}
