import { getProductDemand } from '@/lib/api';
import { Card, Pill, LabeledBar, Th, Td, NoData, inr } from '@/components/ui';
import PageHeader from '@/components/page-header';

export const dynamic = 'force-dynamic';

/**
 * DEMAND ANALYSIS.
 *
 * The one merchandising screen: what customers asked for, ranked by demand,
 * against whether it was on the floor. Green = in stock, red = we could not
 * supply it — and a red bar high on the list is a lost-sales opportunity that
 * never reaches head office today.
 */
export default async function Demand() {

  const products = await getProductDemand();
  if (!products.length) {
    return (
      <>
        <PageHeader title="Demand analysis" />
        <Card>
          <div className="py-10 px-6 text-center text-[13px]">
            <div className="font-medium">No demand data yet</div>
            <div className="text-xs text-muted mt-2 max-w-lg mx-auto leading-relaxed">
              Run <code className="bg-stone-100 px-1 rounded">npm run push</code> so the demand agent output lands.
            </div>
          </div>
        </Card>
      </>
    );
  }

  const top = products.slice(0, 8);
  const maxMentions = Math.max(1, ...products.map((p) => p.mentions));
  const isOpportunity = (p: (typeof products)[number]) =>
    !p.inStock && (p.lostVisits > 0 || p.mentions >= Math.max(3, maxMentions * 0.4));

  return (
    <>
      <PageHeader
        title="Demand analysis"
        sub="what customers are asking for vs. what's on the floor"
      />

      <Card title="Top demanded products" note="customer-raised mentions" className="mb-5">
        {top.map((p) => (
          <LabeledBar
            key={p.product}
            label={<span className="capitalize">{p.product}</span>}
            value={p.mentions}
            max={maxMentions}
            color={p.inStock ? '#146B4B' : '#A82142'}
          />
        ))}
        <div className="mt-3 text-[11.5px] text-muted leading-relaxed">
          Only customer-raised mentions are counted — staff-introduced mentions measure your own sales script, not
          demand. <span className="text-good font-medium">Green</span> was in stock;{' '}
          <span className="text-bad font-medium">red</span> is something a customer asked for that we could not supply.
        </div>
      </Card>

      <div className="flex items-baseline justify-between gap-2 flex-wrap mb-3">
        <h2 className="font-serif text-[15px] font-semibold tracking-tight">All products mentioned</h2>
        <span className="text-[12px] text-muted">every product, with stock status</span>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px] border-collapse">
            <thead>
              <tr>
                <Th>Product</Th><Th>Category</Th><Th right>Demand mentions</Th><Th>In store</Th><Th></Th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.product} className="hover:bg-stone-50/60">
                  <Td className="font-medium capitalize whitespace-nowrap">{p.product}</Td>
                  <Td className="capitalize text-muted whitespace-nowrap">{p.category}</Td>
                  <Td right className="tabular-nums">{p.mentions}</Td>
                  <Td><Pill tone={p.inStock ? 'good' : 'bad'}>{p.inStock ? 'In stock' : 'Out of stock'}</Pill></Td>
                  <Td>
                    {isOpportunity(p) && (
                      <Pill tone="bad">
                        Opportunity — lost sales{p.lostValueInr > 0 ? ` · ${inr(p.lostValueInr)}` : ''}
                      </Pill>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
