'use client';

import type { ReactNode } from 'react';

export default function PillSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="relative inline-flex items-center rounded-full border border-brand/40 transition-colors hover:border-brand hover:bg-brand/5 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/30">
      <select
        aria-label={label}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none cursor-pointer min-h-11 rounded-full bg-transparent border-0 pl-4 pr-10 text-sm font-medium text-brand outline-none"
      >
        {children}
      </select>
      <svg
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-brand"
        width="12"
        height="12"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
      </svg>
    </div>
  );
}