import Link from 'next/link';
import { getOverview, getHomeTrend, getStores, getDemandKeywords, isBackendUp } from '@/lib/api';
import type { Range } from '@/lib/api';
import { Card, Kpi, NoData, inrShort } from '@/components/ui';
import PageHeader from '@/components/page-header';
import Filters from '@/components/filters';
import HomeTrends from '@/components/home-trends';
import WordFrequencyCloud from '@/components/word-frequency-cloud';

export const dynamic = 'force-dynamic';

/** Direction + magnitude of a series' last point against the average of the
 *  points before it — a light "momentum" hint shown under each KPI. */
function momentum(series: (number | null)[]): { up: boolean; pct: number } | null {
  const pts = series.filter((v): v is number => v !== null);
  if (pts.length < 2) return null;
  const current = pts[pts.length - 1];
  const rest = pts.slice(0, -1);
  const avg = rest.reduce((a, b) => a + b, 0) / rest.length;
  if (avg === 0) return null;
  const pct = ((current - avg) / Math.abs(avg)) * 100;
  return { up: pct >= 0, pct: Math.abs(pct) };
}

function Delta({ m, tone }: { m: { up: boolean; pct: number } | null; tone: 'neutral' | 'banded' }) {
  if (!m || m.pct < 1) return <span className="text-muted">→ steady vs trailing avg</span>;
  const color = tone === 'neutral' ? 'text-muted' : m.up ? 'text-good' : 'text-bad';
  return <span className={color}>{m.up ? '↑' : '↓'} {m.pct.toFixed(0)}% vs trailing avg</span>;
}

export default async function Home({ searchParams }: { searchParams: Promise<{ store?: string; range?: string }> }) {
  const sp = await searchParams;
  // The store/range window is resolved by Big Ears now — RIO forwards the
  // filter rather than computing dates and shipping them back.
  const filter = { store: sp.store, range: (sp.range as Range | undefined) ?? '7d' };
  const [stores, o, trend, keywords] = await Promise.all([
    getStores(),
    getOverview(filter),
    getHomeTrend(filter),
    getDemandKeywords(filter),
  ]);

  if (!o.totalVisits && !(await isBackendUp())) return <BackendDown />;

  if (!o.totalVisits) {
    return (
      <>
        <PageHeader title="Home" right={<Filters stores={stores} />} />
        <Card><NoData /></Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Home"
        sub={`${o.totalVisits} visits analysed across ${o.storePerf.length} stores`}
        right={<Filters stores={stores} />}
      />

      {o.needsReview > 0 && (
        <div className="bg-accent-soft border border-accent-line rounded-lg px-4 py-3 text-[12.5px] mb-4 flex gap-2.5">
          <span>⚑</span>
          <div>
            <b className="text-accent">{o.needsReview} visits need review.</b> Speaker identification or observation confidence fell below
            threshold. Their scores are shown but excluded from team averages —{' '}
            <Link href="/review" className="text-info underline">see the queue</Link>.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5 mb-3.5">
        <Kpi label="Visits" value={o.totalVisits} detail={<Delta m={momentum(trend.visits)} tone="neutral" />} />
        <Kpi label="Store health score" value={o.overall ?? '—'} detail={<Delta m={momentum(trend.storeHealth)} tone="banded" />} />
        <Kpi label="Conversion rate" value={o.conversion !== null ? `${o.conversion}%` : '—'} detail={<Delta m={momentum(trend.conversion)} tone="banded" />} />
        <Kpi label="Opportunity revenue" value={inrShort(o.opportunity)} detail={<Delta m={momentum(trend.opportunityRevenue)} tone="neutral" />} />
      </div>

      <Card
        title="Trends"
        note="indexed to each metric's own average = 100 — scales differ (visits, score, %, ₹)"
        className="mb-3.5"
      >
        <HomeTrends trend={trend} />
      </Card>

      <Card
        title="What customers are talking about"
        note="customer-raised mentions from the demand agent · hover words for counts"
        className="mb-3.5"
      >
        <WordFrequencyCloud
          items={keywords
            .filter((k) => k.by_customer > 0)
            .slice(0, 24)
            .map((k) => ({
              term: k.term,
              count: k.by_customer,
            }))}
          empty="No customer mentions in this window."
        />
      </Card>
    </>
  );
}

/** RIO has no database. When there is nothing to show, the question is no
 *  longer "is MONGODB_URI set" but "can we reach Big Ears". */
function BackendDown() {
  return (
    <>
      <PageHeader title="Home" />
      <Card>
        <div className="py-10 px-6 text-center">
          <div className="text-[13px] font-medium">Cannot reach Big Ears</div>
          <div className="text-xs text-muted mt-2 max-w-lg mx-auto leading-relaxed">
            Set <code className="bg-stone-100 px-1 rounded">BIG_EARS_API_URL</code> and{' '}
            <code className="bg-stone-100 px-1 rounded">BIG_EARS_API_KEY</code>, and check that the engine is
            running and its <code className="bg-stone-100 px-1 rounded">/ready</code> endpoint is green.
          </div>
        </div>
      </Card>
    </>
  );
}
