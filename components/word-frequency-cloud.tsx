'use client';

import { useMemo } from 'react';

export interface WordFreqItem {
  term: string;
  count: number;
}

const COLORS = ['#146B4B', '#3E5C76', '#B4780C', '#8B3FA0', '#0F766E', '#767268'] as const;

function scaleFont(count: number, min: number, max: number): number {
  if (max === min) return 20;
  const t = (count - min) / (max - min);
  return Math.round(13 + t * 17); // 13px – 30px
}

/**
 * Flex-wrap word cloud — font size scales with mention count.
 * Same data shape as WordFrequencyGrid; used on Home and Customers.
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
  const words = useMemo(() => {
    const sorted = [...items].sort((a, b) => b.count - a.count).slice(0, maxWords);
    if (!sorted.length) return [];
    const counts = sorted.map((w) => w.count);
    const min = Math.min(...counts);
    const max = Math.max(...counts);
    return sorted.map((w, i) => ({
      ...w,
      fontSize: scaleFont(w.count, min, max),
      color: COLORS[i % COLORS.length],
      weight: i < 3 ? 700 : i < 8 ? 600 : 500,
    }));
  }, [items, maxWords]);

  if (!words.length) {
    return <div className="text-[13px] text-muted py-10 text-center">{empty}</div>;
  }

  const top = words[0]?.count ?? 1;

  return (
    <div className="relative min-h-[200px] py-5 px-3">
      <div
        className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 text-center leading-snug"
        role="list"
        aria-label="Word frequency cloud"
      >
        {words.map((w) => (
          <span
            key={w.term}
            role="listitem"
            title={`${w.term}: ${w.count} mention${w.count === 1 ? '' : 's'}`}
            className="inline-block capitalize transition-opacity hover:opacity-80 cursor-default select-none"
            style={{
              fontSize: w.fontSize,
              color: w.color,
              fontWeight: w.weight,
              fontFamily: w.fontSize >= 22 ? 'var(--font-serif)' : 'inherit',
              opacity: 0.55 + (w.count / top) * 0.45,
            }}
          >
            {w.term}
          </span>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-3 text-[10.5px] text-muted">
        <span>Larger = more mentions</span>
        <span>·</span>
        <span>{words.length} terms</span>
      </div>
    </div>
  );
}
