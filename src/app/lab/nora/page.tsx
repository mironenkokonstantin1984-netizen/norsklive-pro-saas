import { notFound } from 'next/navigation';
import { NoraLabClient } from './NoraLabClient';

export const dynamic = 'force-dynamic';

export function isNoraLabEnabled(): boolean {
  return process.env.NORA_LAB_ENABLED === 'true';
}

export default function NoraLabPage() {
  if (!isNoraLabEnabled()) {
    notFound();
  }

  return <NoraLabClient />;
}
