import type { ReactNode } from 'react';

export default function PageHeader({ title, sub, right }: { title: string; sub?: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4 flex-wrap mb-5">
      <div>
        <h1 className="text-[21px] font-serif font-semibold tracking-tight m-0">{title}</h1>
        {sub && <div className="text-[13px] text-muted mt-1">{sub}</div>}
      </div>
      {right}
    </div>
  );
}
