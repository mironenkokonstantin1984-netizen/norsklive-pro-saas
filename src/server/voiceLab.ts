export function isVoiceLabEnabled(): boolean {
  return process.env.VOICE_LAB_ENABLED === 'true';
}

export function getVoiceLabModels(): string[] {
  const raw = process.env.VOICE_LAB_MODELS ?? '';
  return raw
    .split(',')
    .map((m) => m.trim())
    .filter((m) => m.length > 0);
}
