import { describe, expect, it } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';
import { scoreHeadlineBatch } from './claudeSentimentClient';

function fakeClient(toolInput: unknown): Anthropic {
  return {
    messages: {
      create: async () => ({
        content: [{ type: 'tool_use', id: 'x', name: 'submit_scores', input: toolInput }],
      }),
    },
  } as unknown as Anthropic;
}

describe('scoreHeadlineBatch', () => {
  it('returns an empty array without calling the API for an empty batch', async () => {
    const result = await scoreHeadlineBatch(fakeClient({ scores: [] }), []);
    expect(result).toEqual([]);
  });

  it('maps a well-formed tool response to ScoredResult[]', async () => {
    const client = fakeClient({
      scores: [
        { headlineHash: 'h1', sentimentScore: 0.8, relevanceScore: 0.9 },
        { headlineHash: 'h2', sentimentScore: -0.5, relevanceScore: 0.4 },
      ],
    });

    const result = await scoreHeadlineBatch(client, [
      { headlineHash: 'h1', ticker: 'NVDA', text: 'Nvidia rallies' },
      { headlineHash: 'h2', ticker: 'NVDA', text: 'Nvidia falls' },
    ]);

    expect(result).toEqual([
      { headlineHash: 'h1', sentimentScore: 0.8, relevanceScore: 0.9 },
      { headlineHash: 'h2', sentimentScore: -0.5, relevanceScore: 0.4 },
    ]);
  });

  it('drops malformed entries instead of discarding the whole batch', async () => {
    const client = fakeClient({
      scores: [
        { headlineHash: 'h1', sentimentScore: 0.8, relevanceScore: 0.9 },
        { headlineHash: 'h2', sentimentScore: 'not-a-number', relevanceScore: 0.4 },
        { sentimentScore: 0.1, relevanceScore: 0.1 }, // missing headlineHash
      ],
    });

    const result = await scoreHeadlineBatch(client, [
      { headlineHash: 'h1', ticker: 'NVDA', text: 'a' },
      { headlineHash: 'h2', ticker: 'NVDA', text: 'b' },
    ]);

    expect(result).toEqual([{ headlineHash: 'h1', sentimentScore: 0.8, relevanceScore: 0.9 }]);
  });

  it('throws if Claude does not return a tool_use block', async () => {
    const client = {
      messages: { create: async () => ({ content: [{ type: 'text', text: 'no tool call' }] }) },
    } as unknown as Anthropic;

    await expect(
      scoreHeadlineBatch(client, [{ headlineHash: 'h1', ticker: 'NVDA', text: 'a' }]),
    ).rejects.toThrow(/submit_scores/);
  });
});
