"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Tooltip } from "@/modules/auth/components/candidate-reg/shared/ui";
import type { Client } from "./model";
import { EditIcon, TrashIcon, LockIcon, UnlockIcon, ChevronRight } from "./icons";

/* Truncates to one line; surfaces the full text as a hover tooltip only when
 * the text is actually clipped (scrollWidth > clientWidth). Re-measures on
 * container resize. */
export function TruncatedText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setOverflowing(el.scrollWidth > el.clientWidth);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text]);

  return (
    <div ref={ref} className={`truncate ${className ?? ""}`} title={overflowing ? text : undefined}>
      {text}
    </div>
  );
}

export function ClientRow({
  client,
  onEdit,
  onDelete,
}: {
  client: Client;
  onEdit: (id: string) => void;
  onDelete: (client: Client) => void;
}) {
  return (
    <div className="grid grid-cols-[1.4fr_1fr_1.1fr_0.8fr_1fr_0.9fr_0.9fr] items-center px-5 py-3 border-b border-ink-100 last:border-0 text-[0.8125rem] text-ink-700">
      <TruncatedText text={client.name} className="font-semibold text-ink-900" />
      <TruncatedText text={client.industry} />
      <div className="truncate">{client.accountManager}</div>
      <div>
        {client.openJobs > 0 ? (
          <span className="inline-flex items-center gap-1 text-[0.71875rem] font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">
            {client.openJobs} open
          </span>
        ) : (
          <span className="text-ink-400">0</span>
        )}
      </div>
      <div className="truncate">{client.lastActivity}</div>
      <div>{client.status}</div>
      <div className="flex items-center gap-1">
        <RowAction
          label="Edit"
          onClick={() => onEdit(client.id)}
          className="text-ink-400 hover:text-brand-600 hover:bg-brand-50"
        >
          <EditIcon />
        </RowAction>
        <RowAction
          label="Delete"
          onClick={() => onDelete(client)}
          className="text-ink-400 hover:text-red-600 hover:bg-red-50"
        >
          <TrashIcon />
        </RowAction>
        <RowAction label="Lock" className="text-ink-400 hover:text-amber-600 hover:bg-amber-50">
          <LockIcon />
        </RowAction>
        <RowAction label="Unlock" className="text-ink-400 hover:text-green-600 hover:bg-green-50">
          <UnlockIcon />
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

/** Conic-gradient string for the status donut (Active / Inactive / Prospect). */
export function statusDonut(active: number, inactive: number, prospects: number, total: number): string {
  if (total === 0) return "#e5e7eb";
  const a = (active / total) * 100;
  const i = a + (inactive / total) * 100;
  const p = i + (prospects / total) * 100;
  return `conic-gradient(#22c55e 0 ${a}%, #f97316 ${a}% ${i}%, #3b82f6 ${i}% ${p}%, #e5e7eb ${p}% 100%)`;
}

export function EmptyRailCard({
  title,
  icon,
  heading,
  sub,
}: {
  title: string;
  icon: React.ReactNode;
  heading: string;
  sub: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-bold text-[0.9375rem] text-ink-900">{title}</h3>
        <button className="text-[0.75rem] font-semibold text-brand-600 hover:text-brand-800 transition-colors">
          View All
        </button>
      </div>
      <div className="py-6 flex flex-col items-center text-center">
        <span className="w-12 h-12 rounded-full bg-brand-50 text-brand-300 grid place-items-center mb-2.5">
          {icon}
        </span>
        <div className="text-[0.8125rem] font-semibold text-ink-700">{heading}</div>
        <div className="text-[0.71875rem] text-ink-400 mt-0.5">{sub}</div>
      </div>
    </div>
  );
}

export function QuickAction({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-[0.8125rem] text-ink-700 hover:bg-ink-100 transition-colors"
      >
        <span className="text-brand-600">{icon}</span>
        <span className="flex-1">{label}</span>
        <span className="text-ink-300">
          <ChevronRight />
        </span>
      </Link>
    </li>
  );
}
