'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { VisitDetail } from '@/lib/api';
import { Pill, ScoreRing, inr, mmss, scoreBg } from '@/components/ui';

const ROLE_COLOR: Record<string, string> = {
  staff: 'text-info',
  customer: 'text-accent',
  companion: 'text-purple-700',
  unknown: 'text-muted',
};

const TURN_BAR: Record<string, string> = {
  staff: 'bg-info',
  customer: 'bg-accent',
  companion: 'bg-purple-600',
  unknown: 'bg-stone-300',
};

const DIMENSION_LABELS: Record<string, string> = {
  hospitality: 'Hospitality',
  sales: 'Sales effectiveness',
  accuracy: 'Accuracy & compliance',
};

const AGENT_SECTIONS = [
  { key: 'hospitality', title: 'Hospitality' },
  { key: 'sales', title: 'Sales effectiveness' },
  { key: 'accuracy', title: 'Accuracy & compliance' },
] as const;

type TranscriptFilter = 'all' | 'misses';

function conversationDurationSec(utterances: VisitDetail['utterances'], fallback: number | null): number | null {
  if (!utterances.length) return fallback;
  const first = utterances[0]!.start_ms;
  const last = utterances[utterances.length - 1]!;
  const endMs = last.end_ms ?? last.start_ms;
  return Math.max(1, Math.round((endMs - first) / 1000));
}

function formatDurationSec(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

type VisitOutcomeCtx = Pick<VisitDetail['visit'], 'outcome' | 'sale_made'>;

function outcomeCtx(visit: VisitDetail['visit']): VisitOutcomeCtx {
  return { outcome: visit.outcome, sale_made: visit.sale_made };
}

function skipContactMiss(ctx: VisitOutcomeCtx, observationId: string, value: string): boolean {
  return (ctx.sale_made === true || ctx.outcome === 'purchased') && observationId === 'contact_captured' && value === 'no';
}

function observationGood(
  o: VisitDetail['observations'][number],
  ctx: VisitOutcomeCtx,
): boolean | 'neutral' {
  if (skipContactMiss(ctx, o.observation_id, o.value)) return 'neutral';
  if (o.value === 'unclear') return false;
  return o.inverted ? o.value === 'no' : o.value === 'yes';
}

function observationPillTone(
  o: VisitDetail['observations'][number],
  ctx: VisitOutcomeCtx,
): 'good' | 'warn' | 'bad' | 'mute' {
  if (skipContactMiss(ctx, o.observation_id, o.value)) return 'mute';
  if (o.value === 'yes') return o.inverted ? 'bad' : 'good';
  if (o.value === 'unclear') return 'warn';
  return 'bad';
}

function isMiss(o: VisitDetail['observations'][number], ctx: VisitOutcomeCtx): boolean {
  if (o.observation_id === 'sale_made') return false;
  return observationGood(o, ctx) === false;
}

function speakerLabel(
  speakerId: string | null,
  speakers: VisitDetail['speakers'],
  staffName: string | null,
): string {
  const sp = speakerId ? speakers.find((s) => s.id === speakerId) : undefined;
  const role = sp?.role ?? 'unknown';
  if (role === 'staff') return staffName ?? 'Staff';
  if (role === 'customer') return 'Customer';
  if (role === 'companion') return 'Companion';
  return 'Unknown';
}

function formatPhase(phase: string): string {
  return phase.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function outcomePill(visit: VisitDetail['visit']): { label: string; tone: 'good' | 'mute' | 'warn' } {
  const sold = visit.sale_made === true || visit.outcome === 'purchased';
  const notSold = visit.sale_made === false || visit.outcome === 'no_purchase';
  if (sold) {
    return { label: `Purchased · ${inr(visit.outcome_value_inr)}`, tone: 'good' };
  }
  if (notSold) {
    return { label: 'No purchase', tone: 'mute' };
  }
  return { label: 'Outcome unknown', tone: 'warn' };
}

function visitHeadline(visit: VisitDetail['visit'], signal: VisitDetail['customer_signal']): string {
  const staff = visit.staff_name ?? 'Unknown associate';
  if (signal?.occasion && signal.occasion !== 'unknown' && signal.occasion !== 'none') {
    return `${staff} · ${signal.occasion.replace(/_/g, ' ')}`;
  }
  return staff;
}

function pillClass(tone: 'good' | 'warn' | 'bad' | 'mute'): string {
  if (tone === 'good') return 'bg-good-soft text-good';
  if (tone === 'bad') return 'bg-bad-soft text-bad';
  if (tone === 'warn') return 'bg-warn-soft text-warn';
  return 'bg-stone-100 text-muted';
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={`text-muted transition-transform ${open ? 'rotate-180' : ''}`}
      aria-hidden
    >
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function TranscriptColumn({
  utterances,
  speakers,
  visit,
  byIndex,
  filter,
  onFilterChange,
  segments,
  observations,
  missLineCount,
  excluded,
}: {
  utterances: VisitDetail['utterances'];
  speakers: VisitDetail['speakers'];
  visit: VisitDetail['visit'];
  byIndex: Map<number, VisitDetail['observations']>;
  filter: TranscriptFilter;
  onFilterChange: (f: TranscriptFilter) => void;
  segments: VisitDetail['segments'];
  observations: VisitDetail['observations'];
  missLineCount: number;
  excluded: VisitDetail['excluded_utterances'];
}) {
  const [showRemoved, setShowRemoved] = useState(false);
  const roleOf = useMemo(() => new Map(speakers.map((s) => [s.id, s.role])), [speakers]);
  const ctx = outcomeCtx(visit);

  const moments = useMemo(() => {
    return segments.map((seg) => {
      const utt = utterances[seg.start_index];
      const startMs = utt?.start_ms ?? 0;
      const missObs = observations.find(
        (o) =>
          o.utterance_index !== null &&
          o.utterance_index >= seg.start_index &&
          o.utterance_index <= seg.end_index &&
          isMiss(o, ctx),
      );
      return {
        shortLabel: formatPhase(seg.phase),
        time: mmss(startMs),
        idx: seg.start_index,
        bad: Boolean(missObs),
      };
    });
  }, [segments, utterances, observations, ctx]);

  const visibleUtterances = useMemo(() => {
    if (filter !== 'misses') return utterances;
    return utterances.filter((u) => (byIndex.get(u.idx) ?? []).some((f) => isMiss(f, ctx)));
  }, [utterances, byIndex, filter, ctx]);

  const scrollTo = (idx: number) => {
    document.getElementById(`utt-${idx}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <section className="border-r border-line px-5 sm:px-6 py-5 min-h-[50vh]">
      <div className="text-[10px] uppercase tracking-wider text-muted font-semibold mb-2.5">Conversation</div>

      {moments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {moments.map((m) => (
            <button
              key={`${m.idx}-${m.shortLabel}`}
              type="button"
              onClick={() => scrollTo(m.idx)}
              className={`text-[11px] px-2.5 py-1 rounded-full border cursor-pointer transition-colors ${
                m.bad
                  ? 'border-bad/25 bg-bad-soft text-bad hover:border-bad/40'
                  : 'border-line bg-white text-info hover:bg-info-soft/40'
              }`}
            >
              <span className="font-mono tabular-nums opacity-80">{m.time}</span> {m.shortLabel}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="inline-flex rounded-full border border-line overflow-hidden bg-white">
          <button
            type="button"
            onClick={() => onFilterChange('all')}
            className={`px-3 py-1.5 text-[11px] font-semibold cursor-pointer ${
              filter === 'all' ? 'bg-ink text-white' : 'text-muted hover:text-ink'
            }`}
          >
            All lines
          </button>
          <button
            type="button"
            onClick={() => onFilterChange('misses')}
            className={`px-3 py-1.5 text-[11px] font-semibold cursor-pointer ${
              filter === 'misses' ? 'bg-ink text-white' : 'text-muted hover:text-ink'
            }`}
          >
            Misses only{missLineCount > 0 ? ` (${missLineCount})` : ''}
          </button>
        </div>
        <span className="text-[11px] text-muted">Flags only on coaching gaps</span>
      </div>

      <div className="bg-white border border-line rounded-xl overflow-hidden shadow-sm">
        {visibleUtterances.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-[13px] font-medium">No lines match this filter</div>
            <div className="text-[12px] text-muted mt-1">Try &ldquo;All lines&rdquo;.</div>
          </div>
        ) : (
          visibleUtterances.map((u) => {
            const allFlags = (byIndex.get(u.idx) ?? []).filter(
              (f) => f.observation_id !== 'sale_made' && !skipContactMiss(ctx, f.observation_id, f.value),
            );
            const flags = allFlags.filter((f) => {
              const tone = observationPillTone(f, ctx);
              return tone === 'bad' || tone === 'warn';
            });
            const role = u.speaker_id ? roleOf.get(u.speaker_id) ?? 'unknown' : 'unknown';
            const hasMiss = allFlags.some((f) => isMiss(f, ctx));

            return (
              <div
                key={u.idx}
                id={`utt-${u.idx}`}
                className={`group grid grid-cols-[48px_1fr] gap-3 px-4 py-3 border-b border-stone-100/80 last:border-0 relative scroll-mt-32 ${
                  hasMiss ? 'bg-bad-soft/25' : 'hover:bg-paper/60'
                }`}
              >
                <div
                  className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full opacity-40 group-hover:opacity-70 ${TURN_BAR[role] ?? TURN_BAR.unknown}`}
                />
                <div className="font-mono text-[11px] text-muted pt-0.5 tabular-nums">{mmss(u.start_ms)}</div>
                <div>
                  <div className={`text-[10px] font-bold uppercase tracking-wide mb-1 ${ROLE_COLOR[role] ?? ROLE_COLOR.unknown}`}>
                    {speakerLabel(u.speaker_id, speakers, visit.staff_name)}
                  </div>
                  <div className="text-[13px] leading-[1.55] text-ink/90">{u.text_redacted ?? u.text}</div>
                  {flags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {flags.map((f) => {
                        const tone = observationPillTone(f, ctx);
                        return (
                          <span key={f.observation_id} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${pillClass(tone)}`}>
                            {f.label}
                            {tone === 'warn' ? `: ${f.value}` : ''}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {excluded.length > 0 && (
        <div className="mt-3.5 text-[11px] text-muted">
          {excluded.length} utterance{excluded.length === 1 ? '' : 's'} removed before scoring ·{' '}
          <button type="button" onClick={() => setShowRemoved((v) => !v)} className="text-info hover:underline cursor-pointer">
            {showRemoved ? 'Hide removed' : 'Show removed'}
          </button>
          {showRemoved && (
            <div className="mt-2 bg-white border border-line rounded-xl overflow-hidden shadow-sm">
              {excluded.map((u) => (
                <div key={u.original_index} className="px-4 py-2.5 border-b border-stone-50 last:border-0">
                  <div className="text-[12px]">
                    <span className="text-muted tabular-nums">#{u.original_index}</span>{' '}
                    <span className="font-medium">{u.speaker}</span>{' '}
                    <span className="text-stone-400">· {u.excluded_by.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="text-xs text-muted mt-0.5 line-through">{u.text}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function ManagerSidebar({
  visit,
  customer_signal,
  coaching,
  speakers,
}: {
  visit: VisitDetail['visit'];
  customer_signal: VisitDetail['customer_signal'];
  coaching: VisitDetail['coaching'];
  speakers: VisitDetail['speakers'];
}) {
  const sortedCoaching = useMemo(() => {
    const rank = (p: string) => (p === 'high' ? 0 : p === 'medium' ? 1 : 2);
    return [...coaching].sort((a, b) => rank(a.priority) - rank(b.priority));
  }, [coaching]);

  const highCount = sortedCoaching.filter((c) => c.priority === 'high').length;

  return (
    <aside className="lg:sticky lg:top-[var(--visit-chrome-h,140px)] lg:max-h-[calc(100vh-var(--visit-chrome-h,140px)-12px)] lg:overflow-y-auto px-4 sm:px-5 py-5 space-y-3">
      <div className="bg-white border border-line rounded-xl p-3.5 shadow-sm">
        <h3 className="text-[10px] uppercase tracking-wider text-muted font-semibold mb-2">Summary</h3>
        {visit.headline && (
          <p className="font-serif text-[15px] font-semibold leading-snug mb-2">{visit.headline}</p>
        )}
        <p className="text-[13px] leading-[1.6]">{visit.manager_summary ?? 'Summary not yet generated.'}</p>
      </div>

      {customer_signal && (
        <div className="bg-white border border-line rounded-xl p-3.5 shadow-sm">
          <h3 className="text-[10px] uppercase tracking-wider text-muted font-semibold mb-2">Customer signal</h3>
          <div className="font-serif text-lg font-bold capitalize mb-2">{customer_signal.purchase_intent}</div>
          <dl className="space-y-0">
            {[
              ['Occasion', customer_signal.occasion.replace(/_/g, ' ')],
              ['Budget', customer_signal.budget_band ?? '—'],
              ['Blocker', customer_signal.primary_blocker.replace(/_/g, ' ')],
              ['Est. value', customer_signal.estimated_value_inr ? inr(customer_signal.estimated_value_inr) : '—'],
              ['Next action', customer_signal.recommended_action],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-3 py-1.5 border-b border-stone-100 last:border-0 text-[12px]">
                <dt className="text-[10px] uppercase text-muted">{label}</dt>
                <dd className="font-semibold m-0 text-right">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {sortedCoaching.length > 0 && (
        <div className="bg-white border border-line rounded-xl p-3.5 shadow-sm">
          <h3 className="text-[10px] uppercase tracking-wider text-muted font-semibold mb-2">
            Coaching{highCount > 0 ? ` · ${highCount} high priority` : ` · ${sortedCoaching.length}`}
          </h3>
          {sortedCoaching.map((c, i) => (
            <div key={c.id} className={`py-2.5 ${i > 0 ? 'border-t border-line' : ''}`}>
              <div
                className={`text-[10px] font-bold uppercase mb-0.5 ${
                  c.priority === 'high' ? 'text-bad' : c.priority === 'medium' ? 'text-warn' : 'text-muted'
                }`}
              >
                {c.priority}
              </div>
              <div className="font-semibold text-[13px] leading-snug">{c.category}</div>
              <div className="text-[12px] text-muted mt-1 leading-relaxed">{c.observation}</div>
              {c.suggested_alternative && (
                <div className="mt-2 pl-3 pr-2 py-2 bg-good-soft border-l-[3px] border-good rounded-r-lg text-[12px] leading-relaxed">
                  <b className="block text-[10px] uppercase text-good mb-0.5">Say instead</b>
                  {c.suggested_alternative}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {speakers.length > 0 && (
        <div className="bg-white border border-line rounded-xl p-3.5 shadow-sm">
          <h3 className="text-[10px] uppercase tracking-wider text-muted font-semibold mb-2">Speakers</h3>
          <div className="text-[12px] space-y-1.5">
            {speakers.map((s) => (
              <div key={s.id} className="flex justify-between gap-2">
                <span className={ROLE_COLOR[s.role] ?? ROLE_COLOR.unknown}>
                  {s.diarization_label} → {s.role}
                </span>
                <span className="text-muted tabular-nums">{(s.confidence ?? 0).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

function DimensionScoreCard({
  dimension,
  score,
  observations,
  outcome,
  onClick,
}: {
  dimension: string;
  score: number | null;
  observations: VisitDetail['observations'];
  outcome: VisitOutcomeCtx;
  onClick: () => void;
}) {
  const obs = observations.filter(
    (o) => o.agent_name === dimension && o.observation_id !== 'sale_made',
  );

  return (
    <button
      type="button"
      onClick={onClick}
      title={`Jump to ${DIMENSION_LABELS[dimension] ?? dimension} evidence`}
      className="flex-1 min-w-[200px] px-3 py-2.5 border border-line rounded-[10px] bg-white hover:border-stone-300 hover:shadow-sm transition-all cursor-pointer text-left"
    >
      <div className="text-[10px] uppercase tracking-wider text-muted font-semibold mb-2">
        {DIMENSION_LABELS[dimension] ?? dimension}
      </div>
      <ScoreRing value={score} size={52} />
      {obs.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2.5">
          {obs.map((o) => {
            const tone = observationPillTone(o, outcome);
            return (
              <span
                key={o.observation_id}
                title={o.label}
                className={`text-[10px] font-semibold leading-tight px-1.5 py-0.5 rounded-full ${pillClass(tone)}`}
              >
                {o.label}
              </span>
            );
          })}
        </div>
      )}
    </button>
  );
}

function ObservationRows({
  rows,
  outcome,
}: {
  rows: VisitDetail['observations'];
  outcome: VisitOutcomeCtx;
}) {
  if (!rows.length) return <div className="text-[12.5px] text-muted py-2">No observations.</div>;
  return (
    <>
      {rows.map((o) => {
        const isSaleMade = o.observation_id === 'sale_made';
        const good = isSaleMade ? 'neutral' : observationGood(o, outcome);
        return (
          <div key={o.observation_id} className="flex gap-2.5 py-2 border-b border-stone-50 last:border-0 text-[12.5px]">
            <div className="w-[18px] flex-none text-center">
              {good === 'neutral' ? <span className="text-muted">—</span>
                : o.value === 'unclear' ? <span className="text-warn">◐</span>
                : good ? <span className="text-good">✓</span>
                : <span className="text-bad">✕</span>}
            </div>
            <div className="flex-1 min-w-0">
              <strong>{o.label}</strong>
              {!isSaleMade && <span className="text-muted"> — {o.value}</span>}
              {isSaleMade && <span className="text-muted"> — {o.value} (outcome, not scored)</span>}
              {o.evidence_quote && (
                <div className="text-xs text-muted italic mt-1">&ldquo;{o.evidence_quote}&rdquo;</div>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}

function EvidenceSection({
  detail,
  openSections,
  onToggle,
  focusSection,
}: {
  detail: VisitDetail;
  openSections: Set<string>;
  onToggle: (key: string) => void;
  focusSection: string | null;
}) {
  const { visit, observations, scores } = detail;
  const scoreFor = (dim: string) => scores.find((s) => s.dimension === dim)?.value;

  return (
    <section id="evidence" className="border-t border-line bg-white px-5 sm:px-6 py-5 pb-12">
      <div className="mb-3">
        <h2 className="font-serif text-lg font-bold">Agent evidence</h2>
        <p className="text-[12px] text-muted mt-1 max-w-xl">
          Scored observations only. Expand a dimension to audit — collapsed by default except the weakest score.
        </p>
      </div>
      <div className="border border-line rounded-xl overflow-hidden bg-paper max-w-4xl">
        {AGENT_SECTIONS.map(({ key, title }) => {
          const open = openSections.has(key) || focusSection === key;
          const score = scoreFor(key);
          const obs = observations.filter((o) => o.agent_name === key);
          return (
            <div key={key} id={`evidence-${key}`} className="border-b border-line last:border-0 scroll-mt-[var(--visit-chrome-h,140px)]">
              <button
                type="button"
                onClick={() => onToggle(key)}
                className="w-full flex justify-between items-center gap-3 px-4 py-3 text-left cursor-pointer hover:bg-stone-100/80 transition-colors bg-paper"
              >
                <span className="font-semibold text-[13px]">
                  {title}{' '}
                  <span className="font-normal text-[11px] text-muted">{obs.length} obs</span>
                </span>
                <span className="flex items-center gap-2 shrink-0">
                  <span className="font-serif text-lg tabular-nums" style={{ color: scoreBg(score) }}>
                    {score ?? '—'}
                  </span>
                  <Chevron open={open} />
                </span>
              </button>
              {open && (
                <div className="px-4 pb-3 bg-white border-t border-stone-100">
                  <ObservationRows rows={obs} outcome={outcomeCtx(visit)} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function VisitDetailView({ detail }: { detail: VisitDetail }) {
  const {
    visit,
    customer_signal,
    utterances,
    excluded_utterances: excluded,
    speakers,
    observations,
    scores,
    coaching,
    segments,
  } = detail;

  const [filter, setFilter] = useState<TranscriptFilter>('all');
  const [focusSection, setFocusSection] = useState<string | null>(null);
  const chromeRef = useRef<HTMLDivElement>(null);
  const [chromeH, setChromeH] = useState(140);
  const [openSections, setOpenSections] = useState<Set<string>>(() => {
    const lowest = [...scores].sort((a, b) => (a.value ?? 100) - (b.value ?? 100))[0];
    return new Set([lowest?.dimension ?? 'sales']);
  });

  const byIndex = useMemo(() => {
    const map = new Map<number, VisitDetail['observations']>();
    for (const o of observations) {
      if (o.utterance_index === null) continue;
      const arr = map.get(o.utterance_index) ?? [];
      arr.push(o);
      map.set(o.utterance_index, arr);
    }
    return map;
  }, [observations]);

  const missLineCount = useMemo(
    () => utterances.filter((u) => (byIndex.get(u.idx) ?? []).some((f) => isMiss(f, outcomeCtx(visit)))).length,
    [utterances, byIndex, visit.outcome, visit.sale_made],
  );

  const convSec = conversationDurationSec(utterances, visit.duration_sec);
  const durationLabel = convSec ? formatDurationSec(convSec) : '—';
  const outcomeDisplay = outcomePill(visit);

  const scrollToEvidence = useCallback((dimension: string) => {
    setFocusSection(dimension);
    setOpenSections((prev) => new Set(prev).add(dimension));
    requestAnimationFrame(() => {
      document.getElementById(`evidence-${dimension}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  const outcome = outcomeCtx(visit);

  useEffect(() => {
    const el = chromeRef.current;
    if (!el) return;
    const measure = () => setChromeH(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [visit.needs_review, scores.length, observations.length]);

  const toggleSection = (key: string) => {
    setFocusSection(null);
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div
      className="flex flex-col min-h-screen bg-paper"
      style={{ '--visit-chrome-h': `${chromeH}px` } as React.CSSProperties}
    >
      <div
        ref={chromeRef}
        className="sticky top-0 z-30 bg-paper/95 backdrop-blur-md border-b border-line shadow-[0_1px_0_rgba(0,0,0,0.04)]"
      >
        <header className="px-5 sm:px-6 pt-3 pb-2">
          <Link href="/visits" className="inline-flex items-center gap-1 text-[13px] font-medium text-info hover:opacity-70 mb-2">
            ← Conversations
          </Link>
          <div className="flex flex-wrap items-center gap-4 sm:gap-5">
            <div className="flex-1 min-w-[180px]">
              <h1 className="font-serif text-[20px] sm:text-[21px] font-bold tracking-tight leading-tight">
                {visitHeadline(visit, customer_signal)}
              </h1>
              <div className="text-[12px] text-muted mt-1">
                {visit.store_name}
                <span className="text-stone-300 mx-1.5">·</span>
                {new Date(visit.started_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                <span className="text-stone-300 mx-1.5">·</span>
                {durationLabel}
              </div>
            </div>
            <ScoreRing value={visit.overall_score} size={64} />
            <div className="text-right">
              <Pill tone={outcomeDisplay.tone}>{outcomeDisplay.label}</Pill>
              <div className="text-[11px] text-muted mt-1.5">
                Role ID {Math.round((visit.role_confidence ?? 0) * 100)}%
                {visit.needs_review && <span className="text-warn"> · Needs review</span>}
              </div>
            </div>
          </div>
        </header>

        {visit.needs_review && (
          <div className="mx-5 sm:mx-6 mb-2.5 bg-accent-soft border border-accent-line rounded-lg px-3 py-1.5 text-[12px]">
            <b className="text-accent">Flagged for review</b> — excluded from team averages until confirmed.
          </div>
        )}

        <div className="flex gap-2 px-5 sm:px-6 pb-3 overflow-x-auto">
          {scores.map((s) => (
            <DimensionScoreCard
              key={s.dimension}
              dimension={s.dimension}
              score={s.value}
              observations={observations}
              outcome={outcome}
              onClick={() => scrollToEvidence(s.dimension)}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] items-start flex-1">
        <TranscriptColumn
          utterances={utterances}
          speakers={speakers}
          visit={visit}
          byIndex={byIndex}
          filter={filter}
          onFilterChange={setFilter}
          segments={segments}
          observations={observations}
          missLineCount={missLineCount}
          excluded={excluded}
        />
        <ManagerSidebar
          visit={visit}
          customer_signal={customer_signal}
          coaching={coaching}
          speakers={speakers}
        />
      </div>

      <EvidenceSection
        detail={detail}
        openSections={openSections}
        onToggle={toggleSection}
        focusSection={focusSection}
      />
    </div>
  );
}
