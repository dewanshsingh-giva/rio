import { getFollowUps } from '@/lib/api';
import { Card, Pill, Th, Td, VisitLink, NoData } from '@/components/ui';
import PageHeader from '@/components/page-header';

export const dynamic = 'force-dynamic';

const fmtDay = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', timeZone: 'UTC' });
const fmtDateTime = (iso: string) =>
  `${new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', timeZone: 'UTC' })}, ${new Date(iso)
    .toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' })
    .toUpperCase()}`;

export default async function FollowUps() {
  const rows = await getFollowUps();
  const overdue = rows.filter((r) => r.status === 'overdue').length;

  return (
    <>
      <PageHeader
        title="Follow-up customers"
        right={<span className="text-[12.5px] text-muted">{rows.length} scheduled · {overdue} overdue</span>}
      />
      <Card>
        {rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px] border-collapse">
              <thead>
                <tr>
                  <Th>Visit</Th><Th>Mobile</Th><Th>Store</Th><Th>Reason</Th><Th>Last visit</Th>
                  <Th>Scheduled call</Th><Th>Assigned to</Th><Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.visit_id} className="hover:bg-stone-50/60">
                    <Td><VisitLink id={r.visit_id} /></Td>
                    <Td className="whitespace-nowrap font-mono text-[11.5px]">
                      {r.contact_on_file
                        ? <span title="Number captured; redacted in the UI per DPDP">+91 XXXXX XXXXX</span>
                        : <span className="text-muted">Not captured</span>}
                    </Td>
                    <Td className="text-muted whitespace-nowrap">{r.store}</Td>
                    <Td className="max-w-md">{r.reason ?? '—'}</Td>
                    <Td className="text-muted whitespace-nowrap">{fmtDay(r.last_visit)}</Td>
                    <Td className="whitespace-nowrap">{r.scheduled ? fmtDateTime(r.scheduled) : '—'}</Td>
                    <Td className="whitespace-nowrap">{r.associate ?? '—'}</Td>
                    <Td><Pill tone={r.status === 'overdue' ? 'bad' : 'warn'}>{r.status === 'overdue' ? 'Overdue' : 'Pending'}</Pill></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-[13px] text-muted py-6 text-center">No open follow-ups.</div>
        )}
      </Card>
    </>
  );
}
