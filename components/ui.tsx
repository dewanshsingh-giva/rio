import Link from 'next/link';
import type { ReactNode } from 'react';

export const scoreColor = (v: number | null | undefined) =>
  v === null || v === undefined ? 'text-muted' : v >= 85 ? 'text-good' : v >= 70 ? 'text-warn' : 'text-bad';
export const scoreBg = (v: number | null | undefined) =>
  v === null || v === undefined ? '#D8D3C4' : v >= 85 ? '#146B4B' : v >= 70 ? '#B4780C' : '#A82142';

export const inr = (n: number | null | undefined) =>
  n === null || n === undefined ? '—' : `₹${Math.round(n).toLocaleString('en-IN')}`;
export const inrShort = (n: number) =>
  n >= 1e7 ? `₹${(n / 1e7).toFixed(1)}Cr` : n >= 1e5 ? `₹${(n / 1e5).toFixed(1)}L` : `₹${Math.round(n / 1000)}k`;
export const mmss = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}`;

export function Card({ title, note, children, className = '' }: { title?: string; note?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-line rounded-lg shadow-sm ${className}`}>
      {title && (
        <div className="px-4 py-3 border-b border-line flex items-center justify-between gap-3">
          <h3 className="text-[13px] font-semibold tracking-tight">{title}</h3>
          {note && <span className="text-[11.5px] text-muted">{note}</span>}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

export function Kpi({ label, value, detail }: { label: string; value: ReactNode; detail?: ReactNode }) {
  return (
    <div className="bg-white border border-line rounded-lg shadow-sm px-4 py-4">
      <div className="text-[11px] uppercase tracking-wider text-muted font-mono font-semibold">{label}</div>
      <div className="text-[27px] font-serif font-semibold tracking-tight tabular-nums my-1.5">{value}</div>
      {detail && <div className="text-xs text-muted">{detail}</div>}
    </div>
  );
}

export function Pill({ tone = 'mute', children }: { tone?: 'good' | 'warn' | 'bad' | 'info' | 'mute'; children: ReactNode }) {
  const map = {
    good: 'bg-good-soft text-good', warn: 'bg-warn-soft text-warn', bad: 'bg-bad-soft text-bad',
    info: 'bg-info-soft text-info', mute: 'bg-stone-100 text-muted',
  } as const;
  return <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-[3px] rounded-full whitespace-nowrap ${map[tone]}`}>{children}</span>;
}

export const scoreTone = (v: number | null | undefined) =>
  (v === null || v === undefined ? 'mute' : v >= 85 ? 'good' : v >= 70 ? 'warn' : 'bad') as 'good' | 'warn' | 'bad' | 'mute';

export function Bar({ value, color, className = '' }: { value: number; color?: string; className?: string }) {
  return (
    <div className={`h-1.5 rounded-full bg-stone-100 overflow-hidden min-w-[52px] ${className}`}>
      <div className="h-full rounded-full" style={{ width: `${Math.max(2, Math.min(100, value))}%`, background: color ?? scoreBg(value) }} />
    </div>
  );
}

export function Donut({ value, size = 120 }: { value: number | null; size?: number }) {
  const v = value ?? 0;
  const r = size / 2 - 11;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EDEAE1" strokeWidth={11} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={scoreBg(value)} strokeWidth={11} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x="50%" y="50%" textAnchor="middle" dy="7" fontSize="27" fontWeight="700" fontFamily="var(--font-serif)" fill="#1D1B18">{value ?? '—'}</text>
    </svg>
  );
}

/** Compact score ring for headers and inline use. */
export function ScoreRing({ value, size = 72 }: { value: number | null; size?: number }) {
  const v = value ?? 0;
  const stroke = 6;
  const r = (size - stroke) / 2 - 1;
  const c = 2 * Math.PI * r;
  const color = scoreBg(value);
  const cx = size / 2;
  return (
    <div
      className="relative grid place-items-center shrink-0 rounded-full bg-white shadow-sm"
      style={{ width: size, height: size }}
      title={value !== null ? `Overall score ${value}` : 'Score unavailable'}
    >
      <svg width={size} height={size} className="absolute inset-0" aria-hidden>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="#EDEAE1" strokeWidth={stroke} />
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v / 100)}
          transform={`rotate(-90 ${cx} ${cx})`}
        />
      </svg>
      <span className="font-serif font-bold tabular-nums relative leading-none" style={{ fontSize: Math.round(size * 0.31), color }}>
        {value ?? '—'}
      </span>
    </div>
  );
}

export interface LineSeries {
  data: (number | null)[];
  color: string;
  label: string;
}

export function LineChart({ labels, series, height = 190 }: { labels: string[]; series: LineSeries[]; height?: number }) {
  const w = 680, pl = 34, pr = 10, pt = 12, pb = 24;
  const iw = w - pl - pr, ih = height - pt - pb, min = 50, max = 100;
  const x = (i: number) => pl + (labels.length > 1 ? (i / (labels.length - 1)) * iw : iw / 2);
  const y = (v: number) => pt + (1 - (v - min) / (max - min)) * ih;
  const labelStep = Math.max(1, Math.ceil(labels.length / 8));

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {Array.from({ length: (max - min) / 10 + 1 }, (_, k) => min + k * 10).map((v) => (
          <g key={v}>
            <line x1={pl} y1={y(v)} x2={w - pr} y2={y(v)} stroke="#EDEAE1" strokeWidth={1} />
            <text x={pl - 7} y={y(v) + 3.5} textAnchor="end" fontSize={9.5} fill="#A19B8C">{v}</text>
          </g>
        ))}
        {series.map((s, si) => {
          const segments: { i: number; v: number }[][] = [];
          let cur: { i: number; v: number }[] = [];
          s.data.forEach((v, i) => {
            if (v === null) {
              if (cur.length) segments.push(cur);
              cur = [];
            } else {
              cur.push({ i, v });
            }
          });
          if (cur.length) segments.push(cur);
          return (
            <g key={si}>
              {segments.map((seg, gi) => (
                <path
                  key={gi}
                  d={seg.map((p, idx) => `${idx ? 'L' : 'M'}${x(p.i).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ')}
                  fill="none" stroke={s.color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"
                />
              ))}
              {s.data.map((v, i) => v === null ? null : (
                <circle key={i} cx={x(i)} cy={y(v)} r={3} fill="#fff" stroke={s.color} strokeWidth={2} />
              ))}
            </g>
          );
        })}
        {labels.map((l, i) => (i % labelStep !== 0 && i !== labels.length - 1) ? null : (
          <text key={i} x={x(i)} y={height - 6} textAnchor="middle" fontSize={9.5} fill="#A19B8C">{l}</text>
        ))}
      </svg>
      <div className="flex gap-4 mt-2 text-[11.5px] text-muted">
        {series.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5">
            <i className="w-2 h-2 rounded-full inline-block" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Tiny inline trend line for a metric card. Connects the real (non-null)
 *  points continuously, bridging over gap days; auto-scales to its own range. */
export function Sparkline({ data, color, height = 44 }: { data: (number | null)[]; color: string; height?: number }) {
  const w = 240;
  const pts = data.map((v, i) => ({ v, i })).filter((p): p is { v: number; i: number } => p.v !== null);
  const pad = height * 0.16;
  if (pts.length < 2) {
    return (
      <svg viewBox={`0 0 ${w} ${height}`} width="100%" height={height} preserveAspectRatio="none" style={{ display: 'block' }}>
        <line x1={0} y1={height / 2} x2={w} y2={height / 2} stroke="#EDEAE1" strokeWidth={1.5} />
        {pts.map((p) => <circle key={p.i} cx={data.length > 1 ? (p.i / (data.length - 1)) * w : w / 2} cy={height / 2} r={2.5} fill={color} />)}
      </svg>
    );
  }
  const vals = pts.map((p) => p.v);
  const min = Math.min(...vals), range = Math.max(...vals) - min || 1;
  const X = (i: number) => (i / (data.length - 1)) * w;
  const Y = (v: number) => height - pad - ((v - min) / range) * (height - pad * 2);
  const d = pts.map((p, k) => `${k ? 'L' : 'M'}${X(p.i).toFixed(1)},${Y(p.v).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${height}`} width="100%" height={height} preserveAspectRatio="none" style={{ display: 'block' }}>
      <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function Empty({ title, hint }: { title: string; hint?: ReactNode }) {
  return (
    <div className="text-center py-12 px-6">
      <div className="text-[13px] font-medium">{title}</div>
      {hint && <div className="text-xs text-muted mt-2 max-w-md mx-auto leading-relaxed">{hint}</div>}
    </div>
  );
}

export function NoData() {
  return (
    <Empty
      title="No visits analysed yet"
      hint={
        <>
          Upload a recording to S3, then submit its URI on the{' '}
          <a href="/ingest" className="text-info underline">
            Ingest
          </a>{' '}
          page. The synthetic transcript generator is gone — every visit here comes from a real conversation now.
        </>
      }
    />
  );
}

export function Th({ children, right }: { children?: ReactNode; right?: boolean }) {
  return <th className={`text-[10.5px] uppercase tracking-wider text-muted font-mono font-medium px-3 py-2.5 border-b border-line bg-stone-50/60 ${right ? 'text-right' : 'text-left'}`}>{children}</th>;
}
export function Td({ children, right, className = '' }: { children: ReactNode; right?: boolean; className?: string }) {
  return <td className={`px-3 py-2.5 border-b border-stone-100 align-middle ${right ? 'text-right tabular-nums' : ''} ${className}`}>{children}</td>;
}

export function VisitLink({ id }: { id: string }) {
  return <Link href={`/visits/${id}`} className="font-mono text-xs text-info hover:underline">{id}</Link>;
}

export function LabeledBar({ label, value, max, display, color }: { label: ReactNode; value: number; max: number; display?: ReactNode; color?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <div className="w-[190px] flex-none text-[12px] truncate" title={typeof label === 'string' ? label : undefined}>{label}</div>
      <div className="flex-1 h-4 rounded bg-paper overflow-hidden">
        <div className="h-full rounded" style={{ width: `${Math.max(2, Math.min(100, pct))}%`, background: color ?? '#146B4B' }} />
      </div>
      <div className="w-9 flex-none text-right text-[12px] font-mono text-muted tabular-nums">{display ?? value}</div>
    </div>
  );
}

export interface PieSegment {
  key: string;
  label: string;
  pct: number;
  color: string;
}

export function SegmentPie({ segments, selected, onSelect, size = 220 }: { segments: PieSegment[]; selected?: string | null; onSelect?: (key: string) => void; size?: number }) {
  const cx = size / 2, cy = size / 2, rOuter = size * 0.42, rInner = size * 0.24;
  const polar = (r: number, angleDeg: number) => {
    const a = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  };
  const slicePath = (start: number, end: number) => {
    const p1 = polar(rOuter, end), p2 = polar(rOuter, start), p3 = polar(rInner, start), p4 = polar(rInner, end);
    const largeArc = end - start <= 180 ? 0 : 1;
    return `M ${p1.x} ${p1.y} A ${rOuter} ${rOuter} 0 ${largeArc} 0 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${rInner} ${rInner} 0 ${largeArc} 1 ${p4.x} ${p4.y} Z`;
  };
  let angle = 0;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%">
      {segments.map((s) => {
        const start = angle, end = angle + (s.pct / 100) * 360;
        angle = end;
        const dimmed = selected && selected !== s.key;
        return (
          <path key={s.key} d={slicePath(start, end)} fill={s.color} opacity={dimmed ? 0.4 : 1}
            stroke="#fff" strokeWidth={selected === s.key ? 3 : 1}
            style={{ cursor: onSelect ? 'pointer' : undefined, transition: 'opacity .15s' }}
            onClick={onSelect ? () => onSelect(s.key) : undefined}>
            <title>{s.label}: {s.pct}%</title>
          </path>
        );
      })}
    </svg>
  );
}
