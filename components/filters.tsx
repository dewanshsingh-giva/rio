'use client';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export default function Filters({ stores }: { stores: { id: string; name: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const store = searchParams.get('store') ?? 'all';
  const range = searchParams.get('range') ?? '7d';

  const update = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={store}
        onChange={(e) => update('store', e.target.value)}
        className="text-[12.5px] border border-line rounded-lg px-2.5 py-2 bg-white outline-none focus:border-ink"
      >
        <option value="all">All stores</option>
        {stores.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
      <select
        value={range}
        onChange={(e) => update('range', e.target.value)}
        className="text-[12.5px] border border-line rounded-lg px-2.5 py-2 bg-white outline-none focus:border-ink"
      >
        <option value="7d">Last 7 days</option>
        <option value="30d">Last 30 days</option>
        <option value="quarter">This quarter</option>
      </select>
      <a
        href={`/api/export?store=${store}&range=${range}`}
        className="bg-ink text-white text-[12.5px] font-medium px-4 py-2 rounded-lg hover:bg-stone-800"
      >
        Export
      </a>
    </div>
  );
}
