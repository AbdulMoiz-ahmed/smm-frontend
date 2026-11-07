import React from 'react';

/** Codexia Team Planner brand mark: calendar with a check, on an orange tile. */
export function LogoMark({ className = 'w-9 h-9' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Codexia Team Planner logo">
      <defs>
        <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fb923c" />
          <stop offset="1" stopColor="#ea580c" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill="url(#logo-g)" />
      <rect x="14" y="17" width="36" height="32" rx="6" fill="#fff" />
      <rect x="14" y="17" width="36" height="9" rx="4" fill="#fed7aa" />
      <rect x="21" y="12" width="4" height="10" rx="2" fill="#fff" />
      <rect x="39" y="12" width="4" height="10" rx="2" fill="#fff" />
      <path d="M23 37.5l6 5.5 12-12" fill="none" stroke="#ea580c" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Logo({ dark = false, compact = false, className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 min-w-0 ${className}`}>
      <LogoMark className="w-9 h-9 shrink-0 drop-shadow-sm" />
      {!compact && (
        <div className="leading-tight min-w-0">
          <div className={`font-extrabold tracking-tight text-[15px] truncate ${dark ? 'text-white' : 'text-slate-900'}`}>
            Codexia <span className="text-orange-500">Team</span>
          </div>
          <div className={`text-[10px] font-semibold uppercase tracking-[0.14em] truncate ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
            Content Planner
          </div>
        </div>
      )}
    </div>
  );
}
