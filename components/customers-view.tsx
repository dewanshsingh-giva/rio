'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { CustomerRow, DemandKeywordRow } from '@/lib/api';
import { Card, Kpi, Pill, SegmentPie, VisitLink, inr } from '@/components/ui';
import WordFrequencyCloud from '@/components/word-frequency-cloud';

const TONE_COLOR = { good: '#146B4B', warn: '#B4780C', bad: '#A82142', mute: '#767268' } as const;

type SegmentKey = 'converted' | 'follow_up' | 'high_intent' | 'low_intent';

const SEGMENTS: { key: SegmentKey; label: string; tone: keyof typeof TONE_COLOR }[] = [
  { key: 'converted', label: 'Purchased', tone: 'good' },
  { key: 'follow_up', label: 'Follow-up required', tone: 'warn' },
  { key: 'high_intent', label: 'High intent, no sale', tone: 'warn' },
  { key: 'low_intent', label: 'Low intent / browse', tone: 'bad' },
];

const humanize = (s: string) => s.replace(/_/g, ' ');

const intentTier = (intent: string): 'high' | 'medium' | 'low' | 'unknown' => {
  const v = intent.toLowerCase();
  if (v.includes('high')) return 'high';
  if (v.includes('medium') || v.includes('moderate')) return 'medium';
  if (v.includes('low')) return 'low';
  return 'unknown';
};

const intentTone = (intent: string): 'good' | 'warn' | 'bad' | 'mute' => {
  const t = intentTier(intent);
  if (t === 'high') return 'good';
  if (t === 'medium') return 'warn';
  if (t === 'low') return 'bad';
  return 'mute';
};

const segmentOf = (r: CustomerRow): SegmentKey => {
  if (r.outcome === 'converted' || r.sale_made) return 'converted';
  if (r.follow_up_open || r.outcome === 'callback') return 'follow_up';
  if (intentTier(r.purchase_intent) === 'high') return 'high_intent';
  return 'low_intent';
};

const fmtDay = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', timeZone: 'UTC' });

const fmtDuration = (sec: number | null) => {
  if (sec === null) return '—';
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
};

export default function CustomersView({
  rows,
  keywords,
}: {
  rows: CustomerRow[];
  keywords: DemandKeywordRow[];
}) {
  const [segment, setSegment] = useState<SegmentKey | null>(null);
  const [intentFilter, setIntentFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [outcomeFilter, setOutcomeFilter] = useState<'all' | CustomerRow['outcome']>('all');

  const segmentCounts = useMemo(() => {
    const m = new Map<SegmentKey, number>();
    for (const s of SEGMENTS) m.set(s.key, 0);
    for (const r of rows) m.set(segmentOf(r), (m.get(segmentOf(r)) ?? 0) + 1);
    return m;
  }, [rows]);

  const total = rows.length || 1;
  const pieSegments = SEGMENTS.map((s) => ({
    key: s.key,
    label: s.label,
    pct: Math.round(((segmentCounts.get(s.key) ?? 0) / total) * 100),
    color: TONE_COLOR[s.tone],
  }));

  const filtered = useMemo(() => rows.filter((r) => {
    if (segment && segmentOf(r) !== segment) return false;
    if (intentFilter !== 'all' && intentTier(r.purchase_intent) !== intentFilter) return false;
    if (outcomeFilter !== 'all' && r.outcome !== outcomeFilter) return false;
    return true;
  }), [rows, segment, intentFilter, outcomeFilter]);

  const highIntent = rows.filter((r) => intentTier(r.purchase_intent) === 'high').length;
  const openFollowUps = rows.filter((r) => r.follow_up_open).length;
  const opportunity = rows
    .filter((r) => r.outcome !== 'converted')
    .reduce((sum, r) => sum + (r.estimated_value_inr ?? 0), 0);

  const wordItems = keywords
    .filter((k) => k.by_customer > 0)
    .slice(0, 24)
    .map((k) => ({ term: k.term, count: k.by_customer }));

  const toggleSegment = (key: string) => setSegment((cur) => (cur === key ? null : (key as SegmentKey)));

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4">
        <Kpi label="Visits with signal" value={rows.length} detail="intent captured in window" />
        <Kpi label="High intent" value={highIntent} detail={`${openFollowUps} open follow-ups`} />
        <Kpi label="Converted" value={segmentCounts.get('converted') ?? 0} detail="purchased this window" />
        <Kpi label="Open opportunity" value={inr(opportunity)} detail="est. value not yet converted" />
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-[11px] uppercase tracking-wider text-muted font-semibold mr-1">Filter</span>
        <select
          value={intentFilter}
          onChange={(e) => setIntentFilter(e.target.value as typeof intentFilter)}
          className="text-[12.5px] border border-line rounded-lg px-2.5 py-2 bg-white outline-none focus:border-ink"
        >
          <option value="all">All intent</option>
          <option value="high">High intent</option>
          <option value="medium">Medium intent</option>
          <option value="low">Low intent</option>
        </select>
        <select
          value={outcomeFilter}
          onChange={(e) => setOutcomeFilter(e.target.value as typeof outcomeFilter)}
          className="text-[12.5px] border border-line rounded-lg px-2.5 py-2 bg-white outline-none focus:border-ink"
        >
          <option value="all">All outcomes</option>
          <option value="converted">Purchased</option>
          <option value="callback">Follow-up</option>
          <option value="not_converted">No purchase</option>
          <option value="unknown">Unknown</option>
        </select>
        {(segment || intentFilter !== 'all' || outcomeFilter !== 'all') && (
          <button
            type="button"
            onClick={() => { setSegment(null); setIntentFilter('all'); setOutcomeFilter('all'); }}
            className="text-[12px] text-info underline"
          >
            Clear filters
          </button>
        )}
        <span className="text-[12px] text-muted ml-auto">{filtered.length} of {rows.length} visits</span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.05fr_1fr] gap-3.5 mb-4">
        <Card title="Outcome breakdown" note="click a slice or row to filter visits">
          <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1fr] gap-4 items-center">
            <SegmentPie segments={pieSegments} selected={segment} onSelect={toggleSegment} />
            <div className="flex flex-col gap-1">
              {SEGMENTS.map((s) => {
                const count = segmentCounts.get(s.key) ?? 0;
                const pct = Math.round((count / total) * 100);
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => toggleSegment(s.key)}
                    className={`flex items-center gap-2 px-2.5 py-2.5 rounded-lg text-[13px] text-left transition-colors ${
                      segment === s.key ? 'bg-paper font-semibold' : 'hover:bg-paper'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full flex-none" style={{ background: TONE_COLOR[s.tone] }} />
                    <span className="flex-1">{s.label}</span>
                    <span className="font-mono text-muted text-[12.5px]">{count}</span>
                    <span className="font-mono text-[12.5px] w-9 text-right">{pct}%</span>
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        <Card title="What customers are talking about" note="customer-raised mentions · hover for counts">
          <WordFrequencyCloud items={wordItems} empty="No demand mentions in this window — run visits through the demand agent." />
        </Card>
      </div>

      <div className="flex items-baseline justify-between gap-2 flex-wrap mb-3">
        <h2 className="font-serif text-[15px] font-semibold tracking-tight">
          {segment ? SEGMENTS.find((s) => s.key === segment)?.label : 'All customer visits'}
        </h2>
        <span className="text-[12px] text-muted">signal-agent output per visit</span>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <div className="py-10 text-center text-[13px] text-muted">No visits match these filters.</div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {filtered.map((r) => (
            <article
              key={r.visit_id}
              className="bg-white border border-line rounded-xl shadow-sm p-4 flex flex-col gap-3 hover:border-stone-400 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-[13.5px] capitalize">{humanize(r.occasion)} visit</div>
                  <div className="text-[11.5px] text-muted mt-0.5">
                    {r.store} · {r.associate ?? 'Unassigned'} · {fmtDay(r.visited_at)} · {fmtDuration(r.duration_sec)}
                  </div>
                </div>
                <Pill tone={intentTone(r.purchase_intent)}>{humanize(r.purchase_intent)}</Pill>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[12px]">
                <div className="bg-paper rounded-lg px-2.5 py-2">
                  <div className="text-[10px] uppercase tracking-wide text-muted">Blocker</div>
                  <div className="font-medium capitalize mt-0.5">{humanize(r.primary_blocker)}</div>
                </div>
                <div className="bg-paper rounded-lg px-2.5 py-2">
                  <div className="text-[10px] uppercase tracking-wide text-muted">Est. value</div>
                  <div className="font-medium mt-0.5 tabular-nums">{inr(r.estimated_value_inr)}</div>
                </div>
              </div>

              <p className="text-[12.5px] text-muted leading-snug line-clamp-3">{r.recommended_action}</p>

              <div className="flex items-center justify-between gap-2 mt-auto pt-1 border-t border-stone-100">
                <div className="flex flex-wrap gap-1.5">
                  <Pill tone={r.outcome === 'converted' ? 'good' : r.outcome === 'callback' ? 'warn' : r.outcome === 'not_converted' ? 'bad' : 'mute'}>
                    {r.outcome === 'converted' ? 'Purchased' : r.outcome === 'callback' ? 'Follow-up' : r.outcome === 'not_converted' ? 'No purchase' : 'Unknown'}
                  </Pill>
                  {r.sale_made || r.contact_on_file ? (
                    <Pill tone="good">Contact on file</Pill>
                  ) : (
                    <Pill tone="warn">No contact</Pill>
                  )}
                </div>
                <Link href={`/visits/${r.visit_id}`} className="text-[12px] font-medium text-info hover:underline whitespace-nowrap">
                  Open visit →
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
