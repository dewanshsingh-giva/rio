'use client';

import { useMemo } from 'react';

export interface WordFreqItem {
  term: string;
  count: number;
}

type Emphasis = 'hero' | 'high' | 'mid' | 'low';

function FreqCapsule({
  term,
  count,
  emphasis,
}: {
  term: string;
  count: number;
  emphasis: Emphasis;
}) {
  const styles = {
    hero: 'gap-2.5 border-good/40 bg-good-soft px-5 py-2.5 text-[17px] font-bold text-good shadow-sm',
    high: 'gap-2 border-good/25 bg-white px-3.5 py-1.5 text-[14px] font-semibold text-ink',
    mid: 'gap-1.5 border-line bg-white px-3 py-1.5 text-[13px] font-medium text-stone-700',
    low: 'gap-1.5 border-line/80 bg-paper px-2.5 py-1 text-[12px] font-normal text-muted',
  } as const;

  const badgeStyles = {
    hero: 'bg-good text-white text-[11px] px-2 py-0.5 min-w-[1.75rem]',
    high: 'bg-good-soft text-good text-[10px] px-1.5 py-px',
    mid: 'bg-paper text-stone-600 text-[10px] px-1.5 py-px',
    low: 'bg-paper text-muted text-[9px] px-1.5 py-px',
  } as const;

  const opacity = { hero: 1, high: 0.92, mid: 0.72, low: 0.48 }[emphasis];

  return (
    <span
      role="listitem"
      className={`inline-flex items-center capitalize rounded-full border select-none whitespace-nowrap ${styles[emphasis]}`}
      style={{ opacity }}
    >
      <span>{term}</span>
      <span className={`rounded-full font-mono tabular-nums font-semibold text-center ${badgeStyles[emphasis]}`}>
        {count}
      </span>
    </span>
  );
}

function emphasisForRank(rank: number, total: number): Emphasis {
  if (rank === 0) return 'hero';
  if (total <= 4) return rank <= 2 ? 'high' : 'mid';
  const t = rank / (total - 1);
  if (t <= 0.2) return 'high';
  if (t <= 0.55) return 'mid';
  return 'low';
}

/**
 * Demand terms as capsules — top mention centered on its own row; rest wrap below, fading by rank.
 */
export default function WordFrequencyCloud({
  items,
  empty = 'No mention data in this window.',
  maxWords = 24,
}: {
  items: WordFreqItem[];
  empty?: string;
  maxWords?: number;
}) {
  const words = useMemo(
    () => [...items].sort((a, b) => b.count - a.count).slice(0, maxWords),
    [items, maxWords],
  );

  if (!words.length) {
    return <div className="text-[13px] text-muted py-10 text-center">{empty}</div>;
  }

  const [hero, ...rest] = words;

  return (
    <div className="py-6 px-3">
      <div className="flex justify-center mb-4" role="list" aria-label="Word frequency">
        <FreqCapsule term={hero.term} count={hero.count} emphasis="hero" />
      </div>

      {rest.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-[560px] mx-auto">
          {rest.map((w, i) => (
            <FreqCapsule
              key={w.term}
              term={w.term}
              count={w.count}
              emphasis={emphasisForRank(i + 1, words.length)}
            />
          ))}
        </div>
      )}

      <div className="mt-4 text-center text-[10.5px] text-muted">
        {words.length} term{words.length === 1 ? '' : 's'} · counts are customer-raised mentions
      </div>
    </div>
  );
}
