'use client';

import Link from 'next/link';
import { RioLogoMark } from '@/components/rio-logo';

const SURFACES = [
  { id: 'dashboard', icon: '◉', label: 'Dashboard', desc: 'Trends & store KPIs', href: '/dashboard' },
  { id: 'visits', icon: '◎', label: 'Visits', desc: 'Transcript + evidence', href: '/visits' },
  { id: 'customers', icon: '◍', label: 'Customers', desc: 'Intent & demand', href: '/customers' },
  { id: 'ingest', icon: '⏺', label: 'Capture', desc: 'Record or upload', href: '/ingest' },
  { id: 'coaching', icon: '◈', label: 'Coaching', desc: 'Scripts for the floor', href: '/coaching' },
  { id: 'copilot', icon: '✦', label: 'Copilot', desc: 'Ask in plain language', href: '/copilot' },
] as const;

function FlowArrow({ dir = 'down' }: { dir?: 'right' | 'down' }) {
  return (
    <span
      className={`inline-flex shrink-0 text-good/60 ${dir === 'right' ? 'animate-flow-right' : 'animate-flow-down'}`}
      aria-hidden
    >
      {dir === 'right' ? '→' : '↓'}
    </span>
  );
}

function SurfaceChip({ surface }: { surface: (typeof SURFACES)[number] }) {
  return (
    <Link
      href={surface.href}
      className="group flex flex-col items-center gap-1.5 min-w-[72px] max-w-[92px] no-underline text-inherit"
    >
      <div className="w-11 h-11 rounded-full bg-white border-2 border-good/25 grid place-items-center text-base shadow-sm transition-colors group-hover:border-good group-hover:bg-good-soft/30">
        <span aria-hidden>{surface.icon}</span>
      </div>
      <span className="text-[10px] font-semibold text-ink text-center leading-tight group-hover:text-good">{surface.label}</span>
      <span className="text-[9px] text-muted text-center leading-snug">{surface.desc}</span>
    </Link>
  );
}

export default function RioSurface() {
  const row1 = SURFACES.slice(0, 3);
  const row2 = SURFACES.slice(3, 6);

  return (
    <div className="mt-5 flex flex-col flex-1">
      <div className="rounded-xl border border-good/20 bg-white/80 px-3 py-4 flex-1">
        <div className="text-[9px] font-bold uppercase tracking-widest text-muted mb-3 text-center">
          Surfaces · reads Big Ears only
        </div>

        <div className="flex justify-center mb-2">
          <FlowArrow dir="down" />
        </div>

        <div className="flex flex-wrap items-start justify-center gap-x-2 gap-y-4 sm:gap-x-3">
          {row1.map((s) => (
            <SurfaceChip key={s.id} surface={s} />
          ))}
        </div>

        <div className="flex justify-center my-2">
          <FlowArrow dir="down" />
        </div>

        <div className="flex flex-wrap items-start justify-center gap-x-2 gap-y-4 sm:gap-x-3">
          {row2.map((s) => (
            <SurfaceChip key={s.id} surface={s} />
          ))}
        </div>
      </div>

      <p className="text-[11px] text-muted text-center pt-3 mt-auto">
        No database of its own · every screen pulls live from the Big Ears API
      </p>
    </div>
  );
}

export function RioSurfaceHeader() {
  return (
    <div className="flex items-center gap-3 mb-1">
      <RioLogoMark size={36} variant="light" />
      <div>
        <h3 className="text-[15px] font-semibold">
          RIO <span className="text-good font-normal text-[13px]">· Retail Intelligence OS</span>
        </h3>
        <p className="text-[11px] text-muted">Frontend OS · insight on screen, evidence one click away</p>
      </div>
    </div>
  );
}
