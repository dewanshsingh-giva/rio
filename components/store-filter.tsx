'use client';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

/**
 * Store-only variant of `Filters`. The coaching endpoints can't be filtered by
 * range (and there's no export route), so this drops both and keeps just the
 * store select — writing `?store=` into the URL for the server component to read.
 */
export default function StoreFilter({ stores }: { stores: { id: string; name: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const store = searchParams.get('store') ?? 'all';

  const update = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') params.delete('store');
    else params.set('store', value);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <select
      value={store}
      onChange={(e) => update(e.target.value)}
      className="text-[12.5px] border border-line rounded-lg px-2.5 py-2 bg-white outline-none focus:border-ink"
    >
      <option value="all">All stores</option>
      {stores.map((s) => (
        <option key={s.id} value={s.id}>{s.name}</option>
      ))}
    </select>
  );
}
