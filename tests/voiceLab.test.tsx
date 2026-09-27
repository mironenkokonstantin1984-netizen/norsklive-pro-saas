// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import VoiceLabClient, {
  selectSupportedAudioMime
} from '../src/app/lab/voice/VoiceLabClient';

describe('Voice Lab UI (Issue #20)', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  test('VoiceLabClient records via MediaRecorder, compares >= 2 models, and displays WER, error-preservation %, and latency', async () => {
    class MockMediaRecorder {
      static lastState = 'inactive';
      static isTypeSupported(mime: string) {
        return mime === 'audio/mp4';
      }
      state = 'inactive';
      mimeType = 'audio/mp4';
      ondataavailable: ((e: { data: Blob }) => void) | null = null;
      onstop: (() => void) | null = null;
      start() {
        this.state = 'recording';
        MockMediaRecorder.lastState = 'recording';
      }
      stop() {
        this.state = 'inactive';
        MockMediaRecorder.lastState = 'inactive';
        if (this.ondataavailable) {
          this.ondataavailable({
            data: new Blob(['audio-bytes'], { type: 'audio/mp4' })
          });
        }
        if (this.onstop) {
          this.onstop();
        }
      }
    }

    vi.stubGlobal('MediaRecorder', MockMediaRecorder);
    expect(selectSupportedAudioMime()).toBe('audio/mp4');

    Object.defineProperty(globalThis.navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: vi.fn() }]
        })
      }
    });

    if (typeof URL.createObjectURL !== 'function') {
      URL.createObjectURL = vi.fn(() => 'blob:mock-audio');
      URL.revokeObjectURL = vi.fn();
    } else {
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-audio');
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    }

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            model: 'gemini-2.5-flash',
            transcript: 'I dag jeg jobber',
            latencyMs: 420
          },
          {
            model: 'gemini-2.5-pro',
            transcript: 'I dag jobber jeg',
            latencyMs: 680
          }
        ]),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const { getByRole, getByLabelText, getByText } = render(
      <VoiceLabClient
        configuredModels={['gemini-2.5-flash', 'gemini-2.5-pro']}
      />
    );

    fireEvent.click(getByRole('button', { name: /Record Clip/i }));
    await waitFor(() => {
      expect(MockMediaRecorder.lastState).toBe('recording');
    });

    fireEvent.click(getByRole('button', { name: /Stop Recording/i }));

    const meantInput = await waitFor(() =>
      getByLabelText(/What I meant to say/i)
    );
    const actualInput = getByLabelText(/What I actually said/i);

    fireEvent.change(meantInput, { target: { value: 'I dag jobber jeg' } });
    fireEvent.change(actualInput, { target: { value: 'I dag jeg jobber' } });

    fireEvent.click(getByRole('button', { name: /Compare Models/i }));

    await waitFor(() => {
      expect(getByText('gemini-2.5-flash')).toBeTruthy();
      expect(getByText('gemini-2.5-pro')).toBeTruthy();
      expect(getByText('100%')).toBeTruthy();
      expect(getByText('0%')).toBeTruthy();
      expect(getByText('420 ms')).toBeTruthy();
      expect(getByText('680 ms')).toBeTruthy();
    });
  });
});
