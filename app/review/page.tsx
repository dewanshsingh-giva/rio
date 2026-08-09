import { getVisits } from '@/lib/api';
import { Card, Pill, Th, Td, VisitLink, NoData } from '@/components/ui';
import PageHeader from '@/components/page-header';

export const dynamic = 'force-dynamic';

export default async function Review() {
  // Both counts come from the backend; the flagged set is a filtered query
  // rather than 500 rows fetched and thrown away client-side.
  const [all, flagged] = await Promise.all([
    getVisits({ limit: 500 }),
    getVisits({ limit: 500, needsReview: true }),
  ]);

  return (
    <>
      <PageHeader title="Needs Review" sub={`${flagged.length} of ${all.length} visits fell below a confidence threshold`} />

      <div className="bg-amber-50 border border-amber-300 rounded-lg px-4 py-3 text-[12.5px] mb-4 leading-relaxed">
        Visits land here when speaker identification or an observation falls below its confidence threshold, when a
        manager disputes an output, or when an agent run fails. <b>Nothing is silently discarded, and nothing
        uncertain is silently counted.</b>
      </div>

      <Card title="Review queue">
        {flagged.length ? (
          <table className="w-full text-[13px] border-collapse">
            <thead><tr><Th>Visit</Th><Th>Staff</Th><Th>Store</Th><Th right>Role confidence</Th><Th right>Score</Th><Th>Headline</Th></tr></thead>
            <tbody>
              {flagged.map((v) => (
                <tr key={v.id} className="hover:bg-stone-50/60">
                  <Td><VisitLink id={v.id} /></Td>
                  <Td>{v.staff_name ?? '—'}</Td>
                  <Td className="text-muted">{v.store_name}</Td>
                  <Td right><Pill tone="warn">{(v.role_confidence ?? 0).toFixed(2)}</Pill></Td>
                  <Td right>{v.overall_score ?? '—'}</Td>
                  <Td className="text-muted max-w-sm truncate">{v.headline ?? '—'}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div className="text-[13px] text-muted py-4">Nothing flagged — every visit cleared its confidence thresholds.</div>}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-3.5">
        <Card title="Why unclear is not failure">
          <p className="text-[13px] leading-relaxed">
            An agent that returns <code className="bg-stone-100 px-1 rounded">unclear</code> when the audio was
            unintelligible is working correctly. <b>Unclear observations are excluded from the score denominator</b>{' '}
            rather than counted as misses — a staff member is never penalised for a bad microphone.
          </p>
        </Card>
        <Card title="Manager corrections">
          <p className="text-[13px] leading-relaxed">
            Corrections are stored as <b>labelled evaluation data</b>, not injected back into prompts. An unbounded
            correction log fed into a prompt degrades it silently. Instead they measure whether agents are drifting,
            and get hand-curated into few-shot examples with an eval run either side.
          </p>
        </Card>
        <Card title="Staff-first visibility">
          <p className="text-[13px] leading-relaxed">
            Staff see their own scores and the underlying quotes <b>before their manager does</b>, and can dispute any
            observation. Adoption depends on the people being measured trusting the measurement.
          </p>
        </Card>
      </div>
    </>
  );
}
