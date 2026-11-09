"use client";

import type { UserRole } from "../types/auth.types";

interface Props {
  value: UserRole;
  onChange: (role: UserRole) => void;
  className?: string;
}

const ROLES: { role: UserRole; label: string; emoji: string }[] = [
  { role: "candidate", label: "Job Seeker", emoji: "👤" },
  { role: "recruiter", label: "Recruiter",  emoji: "🏢" },
];

export default function RoleSelector({ value, onChange, className = "" }: Props) {
  return (
    <div className={`flex p-1 bg-ink-100 rounded-xl ${className}`}>
      {ROLES.map((item) => (
        <button
          key={item.role}
          type="button"
          onClick={() => onChange(item.role)}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-body font-semibold transition-all ${
            value === item.role
              ? "bg-white text-ink-900 shadow-sm"
              : "text-ink-500 hover:text-ink-700"
          }`}
        >
          <span>{item.emoji}</span>
          {item.label}
        </button>
      ))}
    </div>
  );
}
