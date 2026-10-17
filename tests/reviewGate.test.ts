import { describe, expect, it } from 'vitest';
import { decide, isAcceptance, isAgentBranch } from '../scripts/review-gate.mjs';

const HEAD = '2026-10-16T06:00:00Z';
const agent = 'agent/issue-56';

describe('review gate', () => {
  it('recognises acceptance comments only when they start with the check mark', () => {
    expect(isAcceptance('✅ Review accepted at 6e9ab7f')).toBe(true);
    expect(isAcceptance('  ✅ accepted')).toBe(true);
    expect(isAcceptance('Review round 1: not accepted yet')).toBe(false);
    expect(isAcceptance('✅ tests pass')).toBe(false);
    expect(isAcceptance(undefined)).toBe(false);
  });

  it('only gates agent branches', () => {
    expect(isAgentBranch('agent/issue-56')).toBe(true);
    expect(isAgentBranch('claude/gracious-ptolemy')).toBe(false);
    expect(decide({ comments: [], headCommittedAt: HEAD, branch: 'claude/x' }).state).toBe(
      'success'
    );
  });

  it('waits when there is no acceptance', () => {
    const result = decide({ comments: [], headCommittedAt: HEAD, branch: agent });
    expect(result.state).toBe('pending');
  });

  it('passes when the acceptance is newer than the latest commit', () => {
    const comments = [{ body: '✅ Review accepted', created_at: '2026-10-16T07:00:00Z' }];
    expect(decide({ comments, headCommittedAt: HEAD, branch: agent }).state).toBe('success');
  });

  it('does not pass on an acceptance that predates the latest commit', () => {
    const comments = [{ body: '✅ Review accepted', created_at: '2026-10-16T05:00:00Z' }];
    expect(decide({ comments, headCommittedAt: HEAD, branch: agent }).state).toBe('pending');
  });
});
