"use client";

import type React from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tooltip } from "@/modules/auth/components/candidate-reg/shared/ui";
import { type Member, ROLE_BADGE, STATUS_BADGE, avatarColor, initials } from "./model";
import { UsersMiniIcon, SpinnerMini, KeyIcon, EditIcon, TrashIcon, UsersLargeIcon } from "./icons";

/* ── Pieces ───────────────────────────────────────────────────────────── */
export function MemberRow({
  member,
  checked,
  onToggle,
  onEdit,
  onDelete,
  onReset,
  resetting,
}: {
  member: Member;
  checked: boolean;
  onToggle: () => void;
  onEdit: (id: string) => void;
  onDelete: (member: Member) => void;
  onReset: (member: Member) => void;
  resetting: boolean;
}) {
  return (
    <div className="grid grid-cols-[32px_1.6fr_0.9fr_1fr_1.3fr_0.8fr_1fr_104px] items-center px-5 py-3 border-b border-ink-100 last:border-0 text-[0.8125rem] text-ink-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        aria-label={`Select ${member.name}`}
        className="w-4 h-4 rounded accent-brand-600"
      />
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={`w-9 h-9 rounded-full grid place-items-center shrink-0 text-[0.75rem] font-bold ${avatarColor(member.name)}`}
        >
          {initials(member.name)}
        </span>
        <div className="min-w-0">
          <div className="font-semibold text-ink-900 truncate">{member.name}</div>
          <div className="text-[0.75rem] text-ink-400 truncate">{member.email}</div>
        </div>
      </div>
      <div>
        <span
          className={`text-[0.71875rem] font-semibold px-2 py-0.5 rounded-full ${ROLE_BADGE[member.role]}`}
        >
          {member.role}
        </span>
      </div>
      <div className="truncate">{member.department}</div>
      <div className="flex items-center gap-1.5 min-w-0 text-ink-600">
        <span className="text-ink-400 shrink-0">
          <UsersMiniIcon />
        </span>
        <span className="truncate">{member.accessScope}</span>
      </div>
      <div>
        <span
          className={`text-[0.71875rem] font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[member.status]}`}
        >
          {member.status}
        </span>
      </div>
      <div className="text-[0.78125rem] text-ink-500 truncate">{member.lastActive}</div>
      <div className="flex items-center justify-end gap-1">
        <RowAction
          label={resetting ? "Resetting…" : "Reset password"}
          onClick={() => !resetting && onReset(member)}
          className="text-ink-400 hover:text-amber-600 hover:bg-amber-50"
        >
          {resetting ? <SpinnerMini /> : <KeyIcon />}
        </RowAction>
        <RowAction
          label="Edit"
          onClick={() => onEdit(member.id)}
          className="text-ink-400 hover:text-brand-600 hover:bg-brand-50"
        >
          <EditIcon />
        </RowAction>
        <RowAction
          label="Delete"
          onClick={() => onDelete(member)}
          className="text-ink-400 hover:text-red-600 hover:bg-red-50"
        >
          <TrashIcon />
        </RowAction>
      </div>
    </div>
  );
}

export function RowAction({
  label,
  onClick,
  className,
  children,
}: {
  label: string;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip label={label}>
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={`w-7 h-7 grid place-items-center rounded-lg transition-colors ${className ?? ""}`}
      >
        {children}
      </button>
    </Tooltip>
  );
}

export function EmptyTeam({ onAdd }: { onAdd: () => void }) {
  return (
    <EmptyState
      className="py-16 px-6"
      icon={<UsersLargeIcon />}
      title="Your team is ready to grow!"
      description="Get started by adding your first team member. Invite your team and collaborate seamlessly."
      action={
        <Button variant="primary" onClick={onAdd}>
          <span>+</span> Add Team Member
        </Button>
      }
    />
  );
}

export function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="relative inline-flex items-center">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-2 bg-ink-100/60 rounded-xl text-[0.8125rem] text-ink-600 outline-none border-0 cursor-pointer"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <span className="absolute right-3 text-ink-400 pointer-events-none text-[0.625rem]">▾</span>
    </div>
  );
}

/** Conic-gradient for the Team Overview donut (Active / Invited / Inactive). */
export function overviewDonut(active: number, invited: number, inactive: number, total: number): string {
  if (total === 0) return "#e5e7eb";
  const a = (active / total) * 100;
  const i = a + (invited / total) * 100;
  const n = i + (inactive / total) * 100;
  return `conic-gradient(#22c55e 0 ${a}%, #3b82f6 ${a}% ${i}%, #f97316 ${i}% ${n}%, #e5e7eb ${n}% 100%)`;
}
