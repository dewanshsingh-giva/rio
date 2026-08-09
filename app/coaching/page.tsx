import { getCoaching, getObservationStats, getStaffPerformance } from '@/lib/api';
import { Card, Pill, Bar, Th, Td, VisitLink, NoData } from '@/components/ui';
import PageHeader from '@/components/page-header';

export const dynamic = 'force-dynamic';

export default async function Coaching() {
  const [items, stats, staff] = await Promise.all([getCoaching(), getObservationStats(), getStaffPerformance()]);
  if (!items.length && !stats.length) return <><PageHeader title="Coaching" /><Card><NoData /></Card></>;

  // `label` and `inverted` come down on the response. The observation
  // catalogue is the single source of truth and it lives in Big Ears — RIO
  // holding its own copy is exactly the drift the split is meant to prevent.
  const rolled = new Map<string, { label: string; no: number; yesNo: number }>();
  for (const s of stats) {
    if (s.inverted) continue;
    const c = rolled.get(s.observation_id) ?? { label: s.label, no: 0, yesNo: 0 };
    c.no += s.no_count; c.yesNo += s.yes_count + s.no_count;
    rolled.set(s.observation_id, c);
  }
  const misses = [...rolled.entries()].filter(([, v]) => v.yesNo >= 5)
    .map(([id, v]) => ({ id, label: v.label, count: v.no, rate: Math.round((v.no / v.yesNo) * 100) }))
    .sort((a, b) => b.count - a.count).slice(0, 8);
  const maxCount = Math.max(1, ...misses.map((m) => m.count));

  const byStaff = new Map<string, typeof items>();
  for (const i of items) {
    const k = i.staff_id ?? 'unassigned';
    byStaff.set(k, [...(byStaff.get(k) ?? []), i]);
  }
  const staffName = new Map(staff.map((s) => [s.staff_id, s.staff_name]));
  const highPriority = items.filter((i) => i.priority === 'high');

  return (
    <>
      <PageHeader title="Coaching" sub="What to fix, who to fix it with, and the exact line to use instead" />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-3.5 mb-3.5">
        <Card title="Most frequent misses" note="across all analysed visits">
          {misses.map((m) => (
            <div key={m.id} className="py-2.5 border-b border-stone-100 last:border-0">
              <div className="flex justify-between text-[12.5px] font-semibold mb-1.5">
                <span>{m.label}</span><span className="tabular-nums">{m.count} visits · {m.rate}%</span>
              </div>
              <Bar value={(m.count / maxCount) * 100} color="#B4780C" />
            </div>
          ))}
        </Card>

        <Card title="Coaching load by staff" note={`${items.length} open items`}>
          <table className="w-full text-[13px] border-collapse">
            <thead><tr><Th>Staff</Th><Th right>Items</Th><Th right>High priority</Th><Th>Top category</Th></tr></thead>
            <tbody>
              {[...byStaff.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 10).map(([id, list]) => {
                const cats = new Map<string, number>();
                for (const i of list) cats.set(i.category, (cats.get(i.category) ?? 0) + 1);
                const top = [...cats.entries()].sort((a, b) => b[1] - a[1])[0];
                return (
                  <tr key={id}>
                    <Td className="font-medium">{staffName.get(id) ?? id}</Td>
                    <Td right>{list.length}</Td>
                    <Td right>{list.filter((i) => i.priority === 'high').length}</Td>
                    <Td className="text-muted">{top?.[0] ?? '—'}</Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>

      <Card title="High-priority coaching" note={`${highPriority.length} items · these plausibly changed the outcome of a visit`}>
        {highPriority.length ? highPriority.slice(0, 15).map((c) => (
          <div key={c.id} className="flex gap-3 py-3 border-b border-stone-100 last:border-0">
            <Pill tone="bad">{c.priority}</Pill>
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-semibold">
                {c.category} <span className="font-normal text-muted">· {staffName.get(c.staff_id ?? '') ?? 'unassigned'} · </span>
                <VisitLink id={c.visit_id} />
              </div>
              <div className="text-[12.5px] text-muted mt-1">{c.observation}</div>
              {c.suggested_alternative && (
                <div className="text-[12.5px] mt-2 bg-good-soft border-l-2 border-good pl-2.5 pr-2 py-1.5 rounded-r-md">
                  <b className="text-[10.5px] uppercase tracking-wide text-good block">Say instead</b>
                  {c.suggested_alternative}
                </div>
              )}
            </div>
          </div>
        )) : <div className="text-[13px] text-muted py-4">No high-priority coaching items.</div>}
      </Card>
    </>
  );
}
