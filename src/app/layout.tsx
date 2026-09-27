import type { ReactNode } from 'react';
import './studio/studio.css';

export const metadata = {
  title: 'NorskLive Pro — Multi-Agent Norskprøve · Jobbintervju · CEFR Teleprompter',
  description:
    'AI-powered Norwegian oral exam (Norskprøve Muntlig) and career interview trainer'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="nb-NO">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
