'use client';
import { useState } from 'react';
import type { HomeTrend } from '@/lib/api';

/**
 * Combined, indexed trend chart for the home page.
 *
 * The four headline metrics live on wildly different scales (a handful of
 * visits, a 0–100 score, a percentage, thousands of rupees), so they cannot
 * share a raw axis. Each series is indexed to its own window average = 100,
 * which puts them on one comparable "% of normal" axis — the chart answers
 * "which of these is above or below its own trend", not "which is bigger".
 *
 * The legend is interactive: each metric is a toggle (multi-select), plus an
 * "All" control. Pick one to isolate its trend, several to compare, or All to
 * see everything.
 */

type MetricKey = 'visits' | 'storeHealth' | 'conversion' | 'opportunityRevenue';

interface Metric {
  key: MetricKey;
  label: string;
  color: string;
  fmt: (v: number) => string;
}

const METRICS: Metric[] = [
  { key: 'visits', label: 'Visits', color: '#146B4B', fmt: (v) => Math.round(v).toString() },
  { key: 'storeHealth', label: 'Store health score', color: '#3E5C76', fmt: (v) => Math.round(v).toString() },
  { key: 'conversion', label: 'Conversion rate', color: '#B4780C', fmt: (v) => `${Math.round(v)}%` },
  { key: 'opportunityRevenue', label: 'Opportunity revenue', color: '#8B3FA0', fmt: (v) => `₹${(v / 1000).toFixed(1)}K` },
];

/**
 * Index a raw series to its own average = 100, considering only real activity.
 *
 * Only non-zero values are plotted: a 0 (a day with no visits / no lost-visit
 * revenue) carries no trend signal on an indexed axis, so it is treated as a
 * gap rather than a point at index 0. The average is taken over those same
 * non-zero values, and a series that is entirely zero draws nothing at all —
 * no fabricated flat line at index 100.
 */
function indexed(raw: (number | null)[]): (number | null)[] {
  const present = raw.filter((v): v is number => v !== null && v !== 0);
  if (!present.length) return raw.map(() => null);
  const avg = present.reduce((a, b) => a + b, 0) / present.length;
  return raw.map((v) => (v === null || v === 0 ? null : (v / avg) * 100));
}

export default function HomeTrends({ trend }: { trend: HomeTrend }) {
  const [selected, setSelected] = useState<MetricKey[]>(METRICS.map((m) => m.key));
  const [hover, setHover] = useState<number | null>(null);

  const toggle = (key: MetricKey) =>
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  const allOn = selected.length === METRICS.length;

  const labels = trend.labels;
  const visible = METRICS.filter((m) => selected.includes(m.key)).map((m) => ({
    m,
    idxRaw: trend[m.key] as (number | null)[],
    idx: indexed(trend[m.key] as (number | null)[]),
  }));

  const w = 680, pl = 48, pr = 12, pt = 14, pb = 26, h = 260;
  const iw = w - pl - pr, ih = h - pt - pb;
  const allVals = visible.flatMap((s) => s.idx.filter((v): v is number => v !== null));
  // Round the index axis out to nice 10s around the 100 baseline, then draw
  // evenly-spaced labelled ticks — an index chart is only readable if you can
  // see where "100 = normal" sits.
  const minY = Math.floor(Math.min(90, ...allVals) / 10) * 10;
  const maxY = Math.ceil(Math.max(110, ...allVals) / 10) * 10;
  const span = maxY - minY;
  const step = span <= 40 ? 10 : span <= 100 ? 20 : 50;
  const ticks: number[] = [];
  for (let t = minY; t <= maxY + 0.001; t += step) ticks.push(t);
  const x = (i: number) => pl + (labels.length > 1 ? (i / (labels.length - 1)) * iw : iw / 2);
  const y = (v: number) => pt + (1 - (v - minY) / (maxY - minY || 1)) * ih;
  const labelStep = Math.max(1, Math.ceil(labels.length / 8));

  return (
    <div>
      {visible.length === 0 ? (
        <div className="py-14 text-center text-[13px] text-muted">Select at least one metric below to see its trend.</div>
      ) : (
        <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto', display: 'block' }} onMouseLeave={() => setHover(null)}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pl} y1={y(t)} x2={w - pr} y2={y(t)} stroke="#EDEAE1" strokeWidth={1} />
              <text x={pl - 8} y={y(t) + 3.5} textAnchor="end" fontSize={9.5} fill="#A19B8C">{t}</text>
            </g>
          ))}
          <text transform={`translate(13 ${pt + ih / 2}) rotate(-90)`} textAnchor="middle" fontSize={10} fill="#767268">index</text>
          {labels.map((l, i) =>
            i % labelStep !== 0 && i !== labels.length - 1 ? null : (
              <text key={i} x={x(i)} y={h - 6} textAnchor="middle" fontSize={9.5} fill="#A19B8C">{l}</text>
            ),
          )}
          {visible.map((s) => {
            // Draw one continuous line through every real (non-zero) point, in
            // order — a zero/gap day in the middle is bridged over rather than
            // breaking the line.
            const pts = s.idx
              .map((v, i) => ({ i, v }))
              .filter((p): p is { i: number; v: number } => p.v !== null);
            return (
              <g key={s.m.key}>
                {pts.length > 0 && (
                  <path
                    d={pts.map((p, k) => `${k ? 'L' : 'M'}${x(p.i).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ')}
                    fill="none" stroke={s.m.color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"
                  />
                )}
                {pts.map((p) => (
                  <circle key={p.i} cx={x(p.i)} cy={y(p.v)} r={3} fill="#fff" stroke={s.m.color} strokeWidth={2} />
                ))}
              </g>
            );
          })}

          {/* vertical guide line through the focused day, with its points emphasised */}
          {hover !== null && (
            <g style={{ pointerEvents: 'none' }}>
              <line x1={x(hover)} y1={pt} x2={x(hover)} y2={h - pb} stroke="#C9C3B4" strokeWidth={1} strokeDasharray="3 3" />
              {visible.map((s) => s.idx[hover] === null ? null : (
                <circle key={s.m.key} cx={x(hover)} cy={y(s.idx[hover] as number)} r={4.5} fill={s.m.color} stroke="#fff" strokeWidth={1.5} />
              ))}
            </g>
          )}

          {/* transparent per-day bands that drive the hover tooltip */}
          {labels.map((_, i) => {
            const bw = iw / labels.length;
            return <rect key={i} x={x(i) - bw / 2} y={pt} width={bw} height={ih} fill="transparent" onMouseEnter={() => setHover(i)} />;
          })}

          {/* dated tooltip: every visible metric's value + index for the focused day */}
          {hover !== null && (() => {
            const rows = visible.filter((s) => s.idx[hover] !== null);
            if (!rows.length) return null;
            const rowH = 14, headH = 16, padX = 8, padY = 7, boxW = 190;
            const boxH = padY * 2 + headH + rows.length * rowH;
            const hx = x(hover);
            const bx = hx + 12 + boxW > w - pr ? Math.max(pl, hx - 12 - boxW) : hx + 12;
            const by = Math.min(pt + 4, h - pb - boxH);
            return (
              <g style={{ pointerEvents: 'none' }}>
                <rect x={bx} y={by} width={boxW} height={boxH} rx={7} fill="#fff" stroke="#E7E3D9" strokeWidth={1} />
                <text x={bx + padX} y={by + padY + 10} fontSize={10.5} fontWeight={700} fill="#1D1B18">{labels[hover]}</text>
                {rows.map((s, r) => {
                  const ty = by + padY + headH + r * rowH + 8;
                  return (
                    <text key={s.m.key} x={bx + padX} y={ty} fontSize={9.5} fill={s.m.color}>
                      {s.m.label} : {s.m.fmt(s.idxRaw[hover] as number)} (index {(s.idx[hover] as number).toFixed(1)})
                    </text>
                  );
                })}
              </g>
            );
          })()}
        </svg>
      )}

      <div className="flex flex-wrap gap-2 mt-3">
        <button
          type="button"
          onClick={() => setSelected(METRICS.map((m) => m.key))}
          aria-pressed={allOn}
          className={`inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full border transition-colors ${
            allOn ? 'border-ink bg-ink text-white' : 'border-line text-muted hover:border-muted'
          }`}
        >
          All
        </button>
        {METRICS.map((m) => {
          const on = selected.includes(m.key);
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => toggle(m.key)}
              aria-pressed={on}
              className={`inline-flex items-center gap-2 text-[12px] font-medium px-3 py-1.5 rounded-full border transition-colors ${
                on ? 'bg-white' : 'border-line text-muted hover:border-muted'
              }`}
              style={on ? { borderColor: m.color, color: m.color } : undefined}
            >
              <span
                className="w-3.5 h-3.5 rounded-[4px] border grid place-items-center text-[9px] leading-none text-white"
                style={{ borderColor: on ? m.color : '#D8D3C4', background: on ? m.color : 'transparent' }}
              >
                {on ? '✓' : ''}
              </span>
              {m.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
