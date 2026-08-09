import { getCustomers, getDemandKeywords, getStores } from '@/lib/api';
import type { Range } from '@/lib/api';
import { Card, NoData } from '@/components/ui';
import PageHeader from '@/components/page-header';
import Filters from '@/components/filters';
import CustomersView from '@/components/customers-view';

export const dynamic = 'force-dynamic';

export default async function Customers({ searchParams }: { searchParams: Promise<{ store?: string; range?: string }> }) {
  const sp = await searchParams;
  const range = (sp.range as Range | undefined) ?? '7d';
  const filter = { store: sp.store, range };

  const [stores, rows, keywords] = await Promise.all([
    getStores(),
    getCustomers({ ...filter, limit: 200 }),
    getDemandKeywords(filter),
  ]);

  return (
    <>
      <PageHeader
        title="Customer signals"
        sub="Intent, blockers, and what the floor is talking about — scoped by store and date"
        right={<Filters stores={stores} />}
      />
      {!rows.length ? (
        <Card><NoData /></Card>
      ) : (
        <CustomersView rows={rows} keywords={keywords} />
      )}
    </>
  );
}
