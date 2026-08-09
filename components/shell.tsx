'use client';

import { usePathname } from 'next/navigation';
import Nav from '@/components/nav';

/**
 * The landing page is a marketing surface and gets no sidebar or content
 * gutter; everything else is the product and gets both. Doing this with a
 * pathname check rather than route groups keeps every existing route file
 * exactly where it is.
 */
export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  if (path === '/') return <>{children}</>;

  const isVisitDetail = /^\/visits\/[^/]+$/.test(path);

  return (
    <div className="flex min-h-screen">
      <Nav />
      <main
        className={
          isVisitDetail
            ? 'flex-1 min-w-0 max-w-none'
            : 'flex-1 min-w-0 px-7 pt-6 pb-16 max-w-[1400px]'
        }
      >
        {children}
      </main>
    </div>
  );
}
