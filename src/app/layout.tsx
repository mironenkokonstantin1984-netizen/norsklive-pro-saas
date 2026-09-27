import type { ReactNode } from 'react';
import { Manrope } from 'next/font/google';
import '../styles/tokens.css';
import './studio/studio.css';

const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-manrope'
});

export const metadata = {
  title: 'NorskLive',
  description:
    'NorskLive Pro — AI-powered Norwegian oral exam (Norskprøve Muntlig) and career interview trainer'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="nb-NO" className={manrope.variable}>
      <body>{children}</body>
    </html>
  );
}
