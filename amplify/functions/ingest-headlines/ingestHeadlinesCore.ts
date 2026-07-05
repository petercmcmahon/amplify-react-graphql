import type { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../data/resource';
import { getNewsSource } from './newsSources/registry';
import { hashHeadline } from './hashHeadline';

type DataClient = ReturnType<typeof generateClient<Schema>>;

export interface IngestHeadlinesInput {
  tickers: string[];
  startDate: string;
  endDate: string;
  adapter: string;
}

export interface IngestHeadlinesOutput {
  headlinesIngested: number;
}

/**
 * Fetches raw headlines from the configured news source adapter and
 * upserts them into the Headline cache table (deduped by content hash).
 * Deliberately does not score sentiment itself — that's score-sentiment's
 * job, so ingestion and scoring can be retried/rerun independently.
 */
export async function ingestHeadlinesCore(
  client: DataClient,
  input: IngestHeadlinesInput,
): Promise<IngestHeadlinesOutput> {
  const source = getNewsSource(input.adapter);
  const rawHeadlines = await source.fetchHeadlines({
    tickers: input.tickers,
    startDate: input.startDate,
    endDate: input.endDate,
  });

  let ingested = 0;
  for (const raw of rawHeadlines) {
    const headlineHash = hashHeadline(raw);
    const { data: existing } = await client.models.Headline.get({ headlineHash });
    if (existing) continue;

    await client.models.Headline.create({
      headlineHash,
      ticker: raw.ticker,
      text: raw.text,
      source: raw.source,
      url: raw.url,
      publishedAt: raw.publishedAt,
    });
    ingested += 1;
  }

  return { headlinesIngested: ingested };
}
