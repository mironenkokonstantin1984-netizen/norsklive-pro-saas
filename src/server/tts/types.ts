export type TtsProviderName = 'google' | 'azure' | 'elevenlabs';

export interface TtsSynthesizeOptions {
  text: string;
  voice: string;
  rate?: number;
}

export interface TtsSynthesizeResult {
  audioBuffer: Buffer;
  mimeType: string;
  latencyMs: number;
  charCount: number;
  provider: TtsProviderName;
  voice: string;
  isOutOfEu: boolean;
}

export interface TtsVoiceInfo {
  provider: TtsProviderName;
  voice: string;
  isConfigured: boolean;
  isOutOfEu: boolean;
  region?: string;
}

export interface TtsAdapter {
  readonly provider: TtsProviderName;
  isConfigured(): boolean;
  isOutOfEu(): boolean;
  synthesize(
    options: TtsSynthesizeOptions,
    fetchFn?: typeof globalThis.fetch
  ): Promise<TtsSynthesizeResult>;
}
