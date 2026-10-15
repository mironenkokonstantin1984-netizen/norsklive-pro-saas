import { notFound } from 'next/navigation';
import { getTtsLabVoices, getVoiceLabModels, isVoiceLabEnabled } from '../../../server/voiceLab';
import VoiceLabClient from './VoiceLabClient';

export const dynamic = 'force-dynamic';

export default function VoiceLabPage() {
  if (!isVoiceLabEnabled()) {
    notFound();
  }

  const configuredModels = getVoiceLabModels();
  const ttsVoices = getTtsLabVoices();
  return <VoiceLabClient configuredModels={configuredModels} ttsVoices={ttsVoices} />;
}
