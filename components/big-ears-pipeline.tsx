'use client';

import type { ReactNode } from 'react';

type AgentChip = {
  id: string;
  label: string;
  icon: string;
  desc: string;
  accent?: string;
};

const PREP: AgentChip[] = [
  { id: 'reconciliation', label: 'Reconcile', icon: '🔗', desc: 'Match to visits', accent: '#767268' },
  { id: 'clean', label: 'Clean', icon: '🧹', desc: 'Strip STT noise', accent: '#3E5C76' },
  { id: 'context', label: 'Context', icon: '🎯', desc: 'On-topic filter', accent: '#3E5C76' },
  { id: 'speakers', label: 'Speakers', icon: '👥', desc: 'Staff vs customer', accent: '#0F766E' },
  { id: 'timeline', label: 'Timeline', icon: '📍', desc: 'Visit phases', accent: '#0F766E' },
];

const SPECIALISTS: AgentChip[] = [
  { id: 'hospitality', label: 'Hospitality', icon: '☕', desc: 'Floor experience', accent: '#146B4B' },
  { id: 'sales', label: 'Sales', icon: '🛍️', desc: 'Selling moves', accent: '#146B4B' },
  { id: 'accuracy', label: 'Accuracy', icon: '✅', desc: 'Policy & facts', accent: '#146B4B' },
  { id: 'signal', label: 'Signal', icon: '📡', desc: 'Customer intent', accent: '#0F766E' },
  { id: 'coaching', label: 'Coaching', icon: '💬', desc: 'Say-instead lines', accent: '#B4780C' },
  { id: 'demand', label: 'Demand', icon: '📊', desc: 'What they wanted', accent: '#8B3FA0' },
];

const FINISH: AgentChip[] = [
  { id: 'scoring', label: 'Score', icon: '⚖️', desc: 'Weighted code', accent: '#1D1B18' },
  { id: 'aggregation', label: 'Aggregate', icon: '📋', desc: 'Final narrative', accent: '#146B4B' },
];

function FlowArrow({ dir = 'right', className = '' }: { dir?: 'right' | 'down'; className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 text-good/70 ${dir === 'right' ? 'animate-flow-right px-0.5' : 'animate-flow-down py-0.5'} ${className}`}
      aria-hidden
    >
      {dir === 'right' ? '→' : '↓'}
    </span>
  );
}

function AgentFace({ agent }: { agent: AgentChip }) {
  return (
    <div className="flex flex-col items-center gap-1.5 min-w-[68px] max-w-[88px]">
      <div
        className="w-11 h-11 rounded-full bg-white border-2 grid place-items-center text-[19px] shadow-sm"
        style={{ borderColor: `${agent.accent ?? '#E7E3D9'}99` }}
        title={agent.desc}
      >
        <span role="img" aria-hidden>{agent.icon}</span>
      </div>
      <span className="text-[10px] font-semibold text-ink text-center leading-tight">{agent.label}</span>
      <span className="text-[9px] text-muted text-center leading-snug hidden sm:block">{agent.desc}</span>
    </div>
  );
}

function StageLabel({ children }: { children: ReactNode }) {
  return (
    <div className="text-[9px] font-bold uppercase tracking-widest text-muted mb-2">{children}</div>
  );
}

export default function BigEarsPipeline() {
  return (
    <div className="mt-5 space-y-5">
      {/* Prep — sequential */}
      <div>
        <StageLabel>1 · Preprocess</StageLabel>
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin">
          {PREP.map((a, i) => (
            <div key={a.id} className="flex items-center shrink-0">
              <AgentFace agent={a} />
              {i < PREP.length - 1 && <FlowArrow dir="right" />}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <FlowArrow dir="down" />
      </div>

      {/* Specialists — parallel */}
      <div>
        <StageLabel>2 · Specialists · parallel</StageLabel>
        <div className="relative rounded-xl border border-good/20 bg-good-soft/40 px-3 py-4">
          <div className="hidden sm:flex justify-center mb-2" aria-hidden>
            <svg width="280" height="20" viewBox="0 0 280 20" className="text-good/40 overflow-visible">
              <path d="M140 0 V8 M40 8 H240 M40 8 V16 M100 8 V16 M140 8 V16 M180 8 V16 M240 8 V16" stroke="currentColor" strokeWidth="1.5" fill="none" className="animate-flow-dash" />
            </svg>
          </div>
          <div className="flex flex-wrap items-start justify-center gap-x-2 gap-y-4 sm:gap-x-3">
            {SPECIALISTS.map((a) => (
              <AgentFace key={a.id} agent={a} />
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <FlowArrow dir="down" />
      </div>

      {/* Score + aggregate */}
      <div>
        <StageLabel>3 · Synthesize</StageLabel>
        <div className="flex items-center justify-center gap-1 flex-wrap">
          {FINISH.map((a, i) => (
            <div key={a.id} className="flex items-center">
              <AgentFace agent={a} />
              {i < FINISH.length - 1 && <FlowArrow dir="right" className="mx-1" />}
            </div>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-muted text-center pt-1">
        Transcript in → 12 LLM agents → structured visit document out · REST API + MongoDB
      </p>
    </div>
  );
}
