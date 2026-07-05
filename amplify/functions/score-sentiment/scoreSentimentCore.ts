import type Anthropic from '@anthropic-ai/sdk';
import type { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../data/resource';
import { scoreHeadlineBatch, SENTIMENT_MODEL_VERSION } from './claudeSentimentClient';

type DataClient = ReturnType<typeof generateClient<Schema>>;

const BATCH_SIZE = 15;

export interface ScoreSentimentInput {
  tickers: string[];
  startDate: string;
  endDate: string;
}

export interface ScoreSentimentOutput {
  scored: number;
  cacheHits: number;
}

export async function scoreSentimentCore(
  client: DataClient,
  anthropic: Anthropic,
  input: ScoreSentimentInput,
): Promise<ScoreSentimentOutput> {
  let scored = 0;
  let cacheHits = 0;

  for (const ticker of input.tickers) {
    const { data: headlines } = await client.models.Headline.list({
      filter: {
        ticker: { eq: ticker },
        publishedAt: { ge: input.startDate, le: input.endDate },
      },
    });

    const unscored = headlines.filter((h) => h.sentimentModel !== SENTIMENT_MODEL_VERSION);
    cacheHits += headlines.length - unscored.length;

    for (let i = 0; i < unscored.length; i += BATCH_SIZE) {
      const batch = unscored.slice(i, i + BATCH_SIZE);
      const results = await scoreHeadlineBatch(
        anthropic,
        batch.map((h) => ({ headlineHash: h.headlineHash, ticker: h.ticker, text: h.text })),
      );

      const resultByHash = new Map(results.map((r) => [r.headlineHash, r]));
      for (const headline of batch) {
        const result = resultByHash.get(headline.headlineHash);
        if (!result) continue;
        await client.models.Headline.update({
          headlineHash: headline.headlineHash,
          sentimentScore: result.sentimentScore,
          relevanceScore: result.relevanceScore,
          sentimentModel: SENTIMENT_MODEL_VERSION,
          scoredAt: new Date().toISOString(),
        });
        scored += 1;
      }
    }
  }

  return { scored, cacheHits };
}
