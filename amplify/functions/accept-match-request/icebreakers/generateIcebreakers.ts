import Anthropic from '@anthropic-ai/sdk';

export interface IcebreakerProfileContext {
  displayName: string;
  bio?: string | null;
  currentRoleTitle?: string | null;
  industry?: string | null;
}

export interface GenerateIcebreakersInput {
  requester: IcebreakerProfileContext;
  recipient: IcebreakerProfileContext;
  matchedTopics: string[];
}

const ICEBREAKER_MODEL = process.env.ANTHROPIC_ICEBREAKER_MODEL ?? 'claude-opus-4-8';

const SUBMIT_ICEBREAKERS_TOOL: Anthropic.Tool = {
  name: 'submit_icebreakers',
  description: 'Submit 3 tailored conversation-starter questions for a mentorship coffee chat.',
  strict: true,
  input_schema: {
    type: 'object',
    properties: {
      icebreakers: {
        type: 'array',
        description: 'Exactly 3 open-ended conversation-starter questions for the two people to use.',
        items: { type: 'string' },
      },
    },
    required: ['icebreakers'],
    additionalProperties: false,
  },
};

function describe(person: IcebreakerProfileContext): string {
  const parts = [person.displayName];
  if (person.currentRoleTitle) parts.push(person.currentRoleTitle);
  if (person.industry) parts.push(`in ${person.industry}`);
  const header = parts.join(', ');
  return person.bio ? `${header} — ${person.bio}` : header;
}

function buildPrompt(input: GenerateIcebreakersInput): string {
  const topics = input.matchedTopics.length > 0 ? input.matchedTopics.join(', ') : 'general mentorship';

  return (
    'Two people just matched for a mentorship coffee chat (in-person or virtual) through a mentorship-matching app. ' +
    'Suggest 3 open-ended conversation-starter questions to help them build a genuine connection and make the most ' +
    "of their first chat. Ground the questions in what's shared below rather than generic small talk.\n\n" +
    `Person A: ${describe(input.requester)}\n` +
    `Person B: ${describe(input.recipient)}\n` +
    `Shared/complementary topics: ${topics}\n\n` +
    'Call submit_icebreakers with exactly 3 questions.'
  );
}

/** Generates 3 tailored icebreaker questions, or an empty array if Claude doesn't return a usable response. */
export async function generateIcebreakers(
  client: Anthropic,
  input: GenerateIcebreakersInput,
): Promise<string[]> {
  const response = await client.messages.create({
    model: ICEBREAKER_MODEL,
    max_tokens: 1024,
    output_config: { effort: 'low' },
    tools: [SUBMIT_ICEBREAKERS_TOOL],
    tool_choice: { type: 'tool', name: 'submit_icebreakers' },
    messages: [{ role: 'user', content: buildPrompt(input) }],
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
  );
  if (!toolUse) {
    throw new Error('Claude did not return a submit_icebreakers tool call');
  }

  const parsed = toolUse.input as { icebreakers?: unknown };
  if (!Array.isArray(parsed.icebreakers)) return [];

  return parsed.icebreakers.filter((q): q is string => typeof q === 'string' && q.trim().length > 0);
}
