'use client';

import { useStudioState } from './useStudioState';

export function StudioPage() {
  const studio = useStudioState();
  return (
    <div data-testid="studio-root" data-module={studio.state.currentModule}>
      NorskLive Pro Studio
    </div>
  );
}
