import type { ReactNode } from 'react';

export const metadata = {
  title: 'NorskLive Pro — Multi-Agent Norskprøve · Jobbintervju · CEFR Teleprompter',
  description: 'AI-powered Norwegian oral exam (Norskprøve Muntlig) and career interview trainer'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="nb-NO">
      <body>{children}</body>
    </html>
  );
}
