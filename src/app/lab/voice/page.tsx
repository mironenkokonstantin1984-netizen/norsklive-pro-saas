import { notFound } from 'next/navigation';
import { getVoiceLabModels, isVoiceLabEnabled } from '../../../server/voiceLab';
import VoiceLabClient from './VoiceLabClient';

export const dynamic = 'force-dynamic';

export default function VoiceLabPage() {
  if (!isVoiceLabEnabled()) {
    notFound();
  }

  const configuredModels = getVoiceLabModels();
  return <VoiceLabClient configuredModels={configuredModels} />;
}
