import Anthropic from '@anthropic-ai/sdk';

export interface HeadlineToScore {
  headlineHash: string;
  ticker: string;
  text: string;
}

export interface ScoredResult {
  headlineHash: string;
  sentimentScore: number; // -1..1
  relevanceScore: number; // 0..1
}

const SENTIMENT_MODEL = process.env.ANTHROPIC_SENTIMENT_MODEL ?? 'claude-opus-4-8';
const PROMPT_VERSION = 'v1';
export const SENTIMENT_MODEL_VERSION = `${SENTIMENT_MODEL}:${PROMPT_VERSION}`;

const SUBMIT_SCORES_TOOL: Anthropic.Tool = {
  name: 'submit_scores',
  description: 'Submit sentiment and relevance scores for a batch of financial news headlines.',
  strict: true,
  input_schema: {
    type: 'object',
    properties: {
      scores: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            headlineHash: { type: 'string' },
            sentimentScore: {
              type: 'number',
              description: 'Sentiment toward the ticker\'s stock, from -1 (very bearish) to 1 (very bullish).',
            },
            relevanceScore: {
              type: 'number',
              description:
                'How relevant this headline is to the ticker and the AI/tech industry theme, from 0 (unrelated) to 1 (highly relevant, material news).',
            },
          },
          required: ['headlineHash', 'sentimentScore', 'relevanceScore'],
          additionalProperties: false,
        },
      },
    },
    required: ['scores'],
    additionalProperties: false,
  },
};

function buildPrompt(headlines: HeadlineToScore[]): string {
  const listText = headlines
    .map((h) => `- headlineHash: ${h.headlineHash}\n  ticker: ${h.ticker}\n  text: ${h.text}`)
    .join('\n');

  return (
    'You are scoring financial news headlines for a stock-market sentiment research tool. ' +
    'This is for historical backtesting only, not live trading advice. ' +
    "For each headline below, call submit_scores with one entry per headlineHash (preserve every hash exactly), " +
    'a sentimentScore from -1 to 1, and a relevanceScore from 0 to 1.\n\n' +
    listText
  );
}

/** Scores one batch (~10-20) of headlines per Claude call. Returns only well-formed entries. */
export async function scoreHeadlineBatch(
  client: Anthropic,
  headlines: HeadlineToScore[],
): Promise<ScoredResult[]> {
  if (headlines.length === 0) return [];

  const response = await client.messages.create({
    model: SENTIMENT_MODEL,
    max_tokens: 4096,
    output_config: { effort: 'low' },
    tools: [SUBMIT_SCORES_TOOL],
    tool_choice: { type: 'tool', name: 'submit_scores' },
    messages: [{ role: 'user', content: buildPrompt(headlines) }],
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
  );
  if (!toolUse) {
    throw new Error('Claude did not return a submit_scores tool call while scoring headlines');
  }

  const parsed = toolUse.input as { scores?: unknown };
  if (!Array.isArray(parsed.scores)) return [];

  return parsed.scores.filter(
    (s): s is ScoredResult =>
      typeof s === 'object' &&
      s !== null &&
      typeof (s as ScoredResult).headlineHash === 'string' &&
      Number.isFinite((s as ScoredResult).sentimentScore) &&
      Number.isFinite((s as ScoredResult).relevanceScore),
  );
}
