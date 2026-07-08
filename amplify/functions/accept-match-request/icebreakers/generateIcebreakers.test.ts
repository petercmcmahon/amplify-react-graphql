import { describe, expect, it } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';
import { generateIcebreakers } from './generateIcebreakers';

function fakeClient(toolInput: unknown): Anthropic {
  return {
    messages: {
      create: async () => ({
        content: [{ type: 'tool_use', id: 'x', name: 'submit_icebreakers', input: toolInput }],
      }),
    },
  } as unknown as Anthropic;
}

const baseInput = {
  requester: { displayName: 'Alex', bio: 'Wants to grow into engineering leadership' },
  recipient: { displayName: 'Sam', currentRoleTitle: 'Staff Engineer', industry: 'Tech' },
  matchedTopics: ['Engineering leadership'],
};

describe('generateIcebreakers', () => {
  it('returns the 3 questions from a well-formed tool response', async () => {
    const client = fakeClient({
      icebreakers: ['Question one?', 'Question two?', 'Question three?'],
    });

    const result = await generateIcebreakers(client, baseInput);

    expect(result).toEqual(['Question one?', 'Question two?', 'Question three?']);
  });

  it('drops non-string or blank entries instead of failing', async () => {
    const client = fakeClient({ icebreakers: ['Good question?', '', 42, '   '] });

    const result = await generateIcebreakers(client, baseInput);

    expect(result).toEqual(['Good question?']);
  });

  it('returns an empty array when icebreakers is missing or malformed', async () => {
    const client = fakeClient({ notIcebreakers: true });

    const result = await generateIcebreakers(client, baseInput);

    expect(result).toEqual([]);
  });

  it('throws if Claude does not return a tool_use block', async () => {
    const client = {
      messages: { create: async () => ({ content: [{ type: 'text', text: 'no tool call' }] }) },
    } as unknown as Anthropic;

    await expect(generateIcebreakers(client, baseInput)).rejects.toThrow(/submit_icebreakers/);
  });
});
