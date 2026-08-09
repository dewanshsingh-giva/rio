import './globals.css';
import type { Metadata } from 'next';
import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import Shell from '@/components/shell';

const fraunces = Fraunces({ subsets: ['latin'], weight: ['500', '600'], variable: '--font-serif' });
const plexSans = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-sans' });
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'Retail Intelligence OS',
  description: 'AI-powered in-store conversation analytics',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable}`}>
      <body className="bg-paper text-ink antialiased font-sans">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
