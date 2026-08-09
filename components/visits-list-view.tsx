'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { ConversationFeedItem } from '@/lib/api';

type Tone = 'good' | 'warn' | 'bad' | 'neutral';
const DOT: Record<Tone, string> = { good: '#146B4B', warn: '#B4780C', bad: '#A82142', neutral: '#3E5C76' };

type SortKey = 'time' | 'store' | 'associate' | 'duration' | 'hospitality' | 'accuracy' | 'objection' | 'upsell' | 'intent';
type SortDir = 'asc' | 'desc';

const scoreTone = (v: number | null): Tone => (v === null ? 'neutral' : v >= 75 ? 'good' : v >= 55 ? 'warn' : 'bad');
const objectionTone = (v: ConversationFeedItem['objection']): Tone => (v === 'yes' ? 'good' : v === 'no' ? 'bad' : 'neutral');
const upsellTone = (v: ConversationFeedItem['upsell']): Tone => (v === 'Yes' ? 'good' : v === 'No' ? 'bad' : 'neutral');
const intentTone = (v: string | null): Tone => (v === 'high' ? 'good' : v === 'medium' ? 'warn' : v === 'low' ? 'bad' : 'neutral');

function summaryItems(c: ConversationFeedItem) {
  return [
    { label: 'Objection handling', text: c.summary.objection, tone: objectionTone(c.objection) },
    { label: 'Hospitality', text: c.summary.hospitality, tone: scoreTone(c.hospitality) },
    { label: 'Upsell / cross-sell', text: c.summary.upsell, tone: upsellTone(c.upsell) },
    { label: 'Customer intent', text: c.summary.intent, tone: intentTone(c.intent) },
  ];
}

function SummaryGrid({ c }: { c: ConversationFeedItem }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
      {summaryItems(c).map((it) => (
        <div key={it.label} className="bg-paper rounded-lg px-3.5 py-3">
          <div className="flex items-center gap-2 text-[12.5px] font-semibold mb-1.5">
            <span className="w-2 h-2 rounded-full flex-none" style={{ background: DOT[it.tone] }} />
            {it.label}
          </div>
          <div className="text-[12.5px] text-muted leading-relaxed">{it.text}</div>
        </div>
      ))}
    </div>
  );
}

function compareRows(a: ConversationFeedItem, b: ConversationFeedItem, key: SortKey, dir: SortDir): number {
  const mul = dir === 'asc' ? 1 : -1;
  switch (key) {
    case 'time':
      return mul * (Date.parse(a.started_at) - Date.parse(b.started_at));
    case 'store':
      return mul * a.store.localeCompare(b.store);
    case 'associate':
      return mul * a.associate.localeCompare(b.associate);
    case 'duration':
      return mul * ((a.duration_sec ?? 0) - (b.duration_sec ?? 0));
    case 'hospitality':
      return mul * ((a.hospitality ?? -1) - (b.hospitality ?? -1));
    case 'accuracy':
      return mul * ((a.accuracy ?? -1) - (b.accuracy ?? -1));
    case 'objection': {
      const rank = (v: ConversationFeedItem['objection']) => (v === 'yes' ? 2 : v === 'no' ? 0 : 1);
      return mul * (rank(a.objection) - rank(b.objection));
    }
    case 'upsell': {
      const rank = (v: ConversationFeedItem['upsell']) => (v === 'Yes' ? 2 : v === 'No' ? 0 : 1);
      return mul * (rank(a.upsell) - rank(b.upsell));
    }
    case 'intent': {
      const rank = (v: string | null) => (v === 'high' ? 2 : v === 'medium' ? 1 : v === 'low' ? 0 : -1);
      return mul * (rank(a.intent) - rank(b.intent));
    }
    default:
      return 0;
  }
}

export default function VisitsListView({ items }: { items: ConversationFeedItem[] }) {
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? '');
  const [storeFilter, setStoreFilter] = useState('all');
  const [staffFilter, setStaffFilter] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('time');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const stores = useMemo(() => [...new Set(items.map((i) => i.store))].sort(), [items]);
  const staff = useMemo(() => [...new Set(items.map((i) => i.associate))].sort(), [items]);

  const filtered = useMemo(() => {
    let rows = items.filter((row) => {
      if (storeFilter !== 'all' && row.store !== storeFilter) return false;
      if (staffFilter !== 'all' && row.associate !== staffFilter) return false;
      return true;
    });
    rows = [...rows].sort((a, b) => compareRows(a, b, sortKey, sortDir));
    return rows;
  }, [items, storeFilter, staffFilter, sortKey, sortDir]);

  const selected = filtered.find((r) => r.id === selectedId) ?? filtered[0] ?? items[0];

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir(key === 'time' ? 'desc' : 'asc');
    }
  }

  function SortTh({ label, col }: { label: string; col: SortKey }) {
    const active = sortKey === col;
    return (
      <th className="text-left font-mono text-[10px] uppercase tracking-wider text-muted font-medium px-2.5 py-2.5 border-b border-line whitespace-nowrap">
        <button type="button" onClick={() => toggleSort(col)} className="hover:text-ink inline-flex items-center gap-1">
          {label}
          {active && <span className="text-[9px]">{sortDir === 'asc' ? '↑' : '↓'}</span>}
        </button>
      </th>
    );
  }

  if (!selected) return null;

  return (
    <div>
      <div className="bg-white border border-line rounded-lg shadow-sm p-4 mb-5">
        <div className="flex justify-between items-start gap-3 flex-wrap">
          <div>
            <div className="text-[13px] font-semibold">Conversation summary</div>
            <div className="text-[11.5px] text-muted mt-0.5">
              {selected.associate} · {selected.store} · {selected.time} · {selected.duration}
              {selected.needsReview && <span className="ml-1.5 text-warn" title="flagged for review">⚑</span>}
            </div>
          </div>
          <Link
            href={`/visits/${selected.id}`}
            className="text-[12px] text-info font-medium hover:underline whitespace-nowrap"
          >
            Full analysis →
          </Link>
        </div>
        <SummaryGrid c={selected} />
      </div>

      <div className="flex flex-wrap items-end gap-3 mb-3">
        <label className="text-[11px] text-muted">
          <span className="block mb-1 font-medium uppercase tracking-wide">Store</span>
          <select
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value)}
            className="text-[12.5px] border border-line rounded-md px-2.5 py-1.5 bg-white min-w-[160px]"
          >
            <option value="all">All stores</option>
            {stores.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="text-[11px] text-muted">
          <span className="block mb-1 font-medium uppercase tracking-wide">Associate</span>
          <select
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
            className="text-[12.5px] border border-line rounded-md px-2.5 py-1.5 bg-white min-w-[160px]"
          >
            <option value="all">All associates</option>
            {staff.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <div className="text-[12px] text-muted pb-1.5">{filtered.length} of {items.length} conversations</div>
      </div>

      <div className="flex items-baseline justify-between gap-2 flex-wrap mb-3">
        <h2 className="font-serif text-[15px] font-semibold tracking-tight">All conversations</h2>
        <span className="text-[12px] text-muted">click a row for summary · column headers sort</span>
      </div>

      <div className="bg-white border border-line rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <SortTh label="Date / time" col="time" />
              <SortTh label="Store" col="store" />
              <SortTh label="Associate" col="associate" />
              <SortTh label="Duration" col="duration" />
              <SortTh label="Hosp" col="hospitality" />
              <SortTh label="Acc" col="accuracy" />
              <SortTh label="Objection" col="objection" />
              <SortTh label="Upsell" col="upsell" />
              <SortTh label="Intent" col="intent" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr
                key={row.id}
                onClick={() => setSelectedId(row.id)}
                className={`cursor-pointer text-[12.5px] ${selected.id === row.id ? 'bg-accent-soft/60' : 'hover:bg-paper'}`}
              >
                <Cell>
                  {row.time}
                  {row.needsReview && <span className="ml-1 text-warn" title="flagged for review">⚑</span>}
                </Cell>
                <Cell>{row.store}</Cell>
                <Cell>{row.associate}</Cell>
                <Cell>{row.duration}</Cell>
                <Cell>{row.hospitality === null ? '—' : `${row.hospitality}%`}</Cell>
                <Cell>{row.accuracy === null ? '—' : `${row.accuracy}%`}</Cell>
                <Cell>
                  {row.objection === null ? '—' : row.objection === 'yes' ? 'Yes' : row.objection === 'no' ? 'No' : 'Unclear'}
                </Cell>
                <Cell>{row.upsell}</Cell>
                <Cell className="capitalize">{row.intent ?? '—'}</Cell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Cell({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-2.5 py-2.5 border-b border-stone-100 whitespace-nowrap ${className}`}>{children}</td>;
}
