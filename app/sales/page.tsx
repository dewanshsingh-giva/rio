import { getStores, getSalesMetrics, getSalesStaff } from '@/lib/api';
import type { Range, SalesMetricKey, SalesStaffRow } from '@/lib/api';
import { Card, NoData, Sparkline, Th, Td } from '@/components/ui';
import PageHeader from '@/components/page-header';
import Filters from '@/components/filters';

export const dynamic = 'force-dynamic';

/** Metric definitions: label, one-line source, and whether the value is a
 *  percentage rate or a 0–100 dimension score. */
const METRICS: { key: SalesMetricKey; label: string; sub: string }[] = [
  { key: 'sales', label: 'Sales confidence score', sub: 'discovery, storytelling, objection handling, close' },
  { key: 'hospitality', label: 'Hospitality score', sub: 'warmth, pacing, personalization' },
  { key: 'accuracy', label: 'Accuracy %', sub: 'product / certification / policy info given correctly' },
  { key: 'objection', label: 'Objection resolution rate', sub: "didn't end in a walkout" },
  { key: 'attach', label: 'Upsell / cross-sell rate', sub: 'cross-sell attempted' },
  { key: 'offer', label: 'Offer mentions', sub: 'live offer communicated' },
];

const BAND_HEX = { good: '#146B4B', warn: '#B4780C', bad: '#A82142', neutral: '#3E5C76' } as const;

/** Same thresholds as the prototype's `bandFor`, adapted to real metric keys. */
function band(key: SalesMetricKey, v: number | null): keyof typeof BAND_HEX {
  if (v === null) return 'neutral';
  switch (key) {
    case 'sales': return v >= 75 ? 'good' : v >= 50 ? 'warn' : 'bad';
    case 'hospitality': return v >= 75 ? 'good' : v >= 55 ? 'warn' : 'bad';
    case 'accuracy': return v >= 90 ? 'good' : v >= 75 ? 'warn' : 'bad';
    case 'objection': return v >= 70 ? 'good' : v >= 50 ? 'warn' : 'bad';
    case 'attach': return v >= 40 ? 'good' : v >= 20 ? 'warn' : 'bad';
    case 'offer': return v >= 40 ? 'good' : v >= 20 ? 'warn' : 'bad';
  }
}

/** Direction of the last real point vs the average of the ones before it. */
function momentum(series: (number | null)[]): { up: boolean; pct: number } | null {
  const pts = series.filter((v): v is number => v !== null);
  if (pts.length < 2) return null;
  const current = pts[pts.length - 1];
  const avg = pts.slice(0, -1).reduce((a, b) => a + b, 0) / (pts.length - 1);
  if (avg === 0) return null;
  return { up: current >= avg, pct: Math.abs(((current - avg) / Math.abs(avg)) * 100) };
}

const rangeLabel = (r?: string) => (r === '30d' ? 'last 30 days' : r === 'quarter' ? 'this quarter' : 'last 7 days');

export default async function Sales({ searchParams }: { searchParams: Promise<{ store?: string; range?: string }> }) {
  const sp = await searchParams;
  const range = (sp.range as Range | undefined) ?? '7d';
  const [stores, metrics, staff] = await Promise.all([
    getStores(),
    getSalesMetrics({ store: sp.store, range }),
    getSalesStaff(sp.store),
  ]);

  if (!staff.length) {
    return (
      <>
        <PageHeader title="Sales" right={<Filters stores={stores} />} />
        <Card><NoData /></Card>
      </>
    );
  }

  const storeLabel = sp.store ? stores.find((s) => s.id === sp.store)?.name ?? 'store' : 'all associates';
  const top5 = staff.slice(0, 5);

  return (
    <>
      <PageHeader
        title="Sales"
        sub="Sales-floor metrics computed from conversation evidence · flagged visits excluded"
        right={<Filters stores={stores} />}
      />

      {/* ── Sales metrics ─────────────────────────────────────────────── */}
      <SectionHead title="Sales metrics" note={`across ${storeLabel}, ${rangeLabel(sp.range)}`} />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 mb-6">
        {METRICS.map((m) => {
          const s = metrics.series[m.key];
          const hex = BAND_HEX[band(m.key, s.current)];
          const mo = momentum(s.trend);
          const deltaColor = !mo || mo.pct < 2 ? '#767268' : mo.up ? '#146B4B' : '#A82142';
          return (
            <div key={m.key} className="bg-white border border-line rounded-xl shadow-sm p-4">
              <div className="text-[12.5px] font-semibold">{m.label}</div>
              <div className="text-[10.5px] text-muted leading-snug">{m.sub}</div>
              <div className="flex items-baseline gap-2 mt-2 mb-1.5">
                <span className="font-serif font-semibold text-[22px] tabular-nums" style={{ color: hex }}>
                  {s.current === null ? '—' : `${s.current}%`}
                </span>
                {mo && (
                  <span className="font-mono text-[11px]" style={{ color: deltaColor }}>
                    {mo.up ? '↑' : '↓'} {mo.pct.toFixed(0)}%
                  </span>
                )}
              </div>
              <Sparkline data={s.trend} color={hex} />
            </div>
          );
        })}
      </div>

      {/* ── Top performers ────────────────────────────────────────────── */}
      <SectionHead title="Top performers" note="ranked by composite score" />
      <div className="bg-white border border-line rounded-xl shadow-sm px-4 mb-6">
        {top5.map((s, i) => (
          <div key={s.staff_id} className="flex items-center gap-3 py-3 border-b border-stone-100 last:border-0">
            <span className="font-serif font-semibold text-[15px] text-muted w-4 flex-none">{i + 1}</span>
            <span className="font-semibold text-[13.5px] w-28 flex-none truncate">{s.staff_name}</span>
            <span className="text-[12px] text-muted w-36 flex-none truncate">{s.store_name}</span>
            <div className="flex-1 h-[7px] rounded-full bg-stone-100 overflow-hidden">
              <div className="h-full rounded-full bg-good" style={{ width: `${Math.max(2, Math.min(100, s.composite ?? 0))}%` }} />
            </div>
            <span className="font-mono text-[13px] w-8 flex-none text-right">{s.composite ?? '—'}</span>
          </div>
        ))}
      </div>

      {/* ── All staff ─────────────────────────────────────────────────── */}
      <SectionHead title="All staff" note="sorted by composite score" />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px] border-collapse">
            <thead>
              <tr>
                <Th>Associate</Th><Th>Store</Th>
                <Th right>Sale confidence</Th><Th right>Hospitality</Th><Th right>Accuracy %</Th>
                <Th right>Objection res.</Th><Th right>Attach rate</Th><Th right>Offer mentions</Th>
                <Th right>Score</Th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.staff_id} className="hover:bg-stone-50/60">
                  <Td className="font-semibold whitespace-nowrap">{s.staff_name}</Td>
                  <Td className="text-muted whitespace-nowrap">{s.store_name}</Td>
                  <BandCell k="sales" v={s.sales} />
                  <BandCell k="hospitality" v={s.hospitality} />
                  <BandCell k="accuracy" v={s.accuracy} />
                  <BandCell k="objection" v={s.objection} />
                  <BandCell k="attach" v={s.attach} />
                  <BandCell k="offer" v={s.offer} />
                  <Td right><b>{s.composite ?? '—'}</b></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

function SectionHead({ title, note }: { title: string; note?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 flex-wrap mb-3">
      <h2 className="font-serif text-[15px] font-semibold tracking-tight">{title}</h2>
      {note && <span className="text-[12px] text-muted">{note}</span>}
    </div>
  );
}

function BandCell({ k, v }: { k: SalesMetricKey; v: SalesStaffRow[SalesMetricKey] }) {
  return (
    <Td right>
      <span style={{ color: v === null ? '#767268' : BAND_HEX[band(k, v)] }}>{v === null ? '—' : `${v}%`}</span>
    </Td>
  );
}
