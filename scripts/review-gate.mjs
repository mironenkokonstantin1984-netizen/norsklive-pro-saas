/* global console, fetch */
// Review gate: an agent PR is "accepted" only when the reviewer posted a comment that starts with
// "✅" and contains "accepted" AFTER the latest commit of the PR. Publishes the result as the
// commit status `review-gate`. See docs/REVIEW_POLICY.md.
import process from 'node:process';
import { pathToFileURL } from 'node:url';

export const GATE_CONTEXT = 'review-gate';

export function isAgentBranch(branch) {
  return /^agent\/issue-\d+/.test(branch ?? '');
}

export function isAcceptance(body) {
  const text = String(body ?? '').trimStart();
  return text.startsWith('✅') && /accepted/i.test(text);
}

/**
 * @param {{ comments: { body: string, created_at: string }[], headCommittedAt: string, branch: string }} input
 * @returns {{ state: 'success' | 'pending', description: string }}
 */
export function decide({ comments, headCommittedAt, branch }) {
  if (!isAgentBranch(branch)) {
    return { state: 'success', description: 'Not an agent PR: no reviewer acceptance required' };
  }
  const headTime = Date.parse(headCommittedAt);
  const accepted = comments.some(
    (comment) => isAcceptance(comment.body) && Date.parse(comment.created_at) > headTime
  );
  return accepted
    ? { state: 'success', description: 'Reviewer accepted the latest commit' }
    : { state: 'pending', description: 'Waiting for "✅ … accepted" on the latest commit' };
}

async function github(path, options = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.GH_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...options.headers
    }
  });
  if (!response.ok) {
    throw new Error(`GitHub API ${response.status} for ${path}`);
  }
  return response.json();
}

async function allComments(repo, number) {
  const comments = [];
  for (let page = 1; ; page += 1) {
    const batch = await github(
      `/repos/${repo}/issues/${number}/comments?per_page=100&page=${page}`
    );
    comments.push(...batch);
    if (batch.length < 100) return comments;
  }
}

async function main() {
  const repo = process.env.REPO;
  const number = process.env.PR_NUMBER;
  if (!repo || !number || !process.env.GH_TOKEN) {
    throw new Error('REPO, PR_NUMBER and GH_TOKEN are required');
  }
  const pull = await github(`/repos/${repo}/pulls/${number}`);
  const headSha = pull.head.sha;
  const commit = await github(`/repos/${repo}/commits/${headSha}`);
  const result = decide({
    comments: await allComments(repo, number),
    headCommittedAt: commit.commit.committer.date,
    branch: pull.head.ref
  });
  await github(`/repos/${repo}/statuses/${headSha}`, {
    method: 'POST',
    body: JSON.stringify({ ...result, context: GATE_CONTEXT })
  });
  console.log(`${GATE_CONTEXT} on ${headSha.slice(0, 7)}: ${result.state} — ${result.description}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
