import { getConversations } from '@/lib/api';
import { Card, NoData } from '@/components/ui';
import PageHeader from '@/components/page-header';
import VisitsListView from '@/components/visits-list-view';

export const dynamic = 'force-dynamic';

export default async function Visits() {
  const items = await getConversations({ limit: 60 });
  if (!items.length) return <><PageHeader title="Conversations" /><Card><NoData /></Card></>;

  return (
    <>
      <PageHeader
        title="Conversations"
        sub={`${items.length} analysed visits · select a row for summary, or open full analysis for transcript & agent evidence`}
      />
      <VisitsListView items={items} />
    </>
  );
}
