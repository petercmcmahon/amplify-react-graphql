import type { NewsSourceAdapter, RawHeadline } from './types';
import { parseHeadlineCsv } from './csvUtil';
import { SEED_HEADLINES_CSV } from './data/seedHeadlinesCsv';

/**
 * Illustrative, hand-curated headlines paraphrasing well-known real AI/tech
 * industry events (Oct 2022 - Jul 2023) — not scraped from any publisher, no
 * verified source URLs. Exists purely to make the demo/verification flow
 * deterministic and available offline. Swap to the `gdelt` or `user-upload`
 * adapter for research against a real historical news archive.
 */
export const seedCsvSource: NewsSourceAdapter = {
  name: 'seed-csv',
  async fetchHeadlines({ tickers, startDate, endDate }): Promise<RawHeadline[]> {
    const allHeadlines = parseHeadlineCsv(SEED_HEADLINES_CSV, 'seed-csv');
    const tickerSet = new Set(tickers.map((t) => t.toUpperCase()));
    return allHeadlines.filter(
      (h) => tickerSet.has(h.ticker) && h.publishedAt >= startDate && h.publishedAt <= endDate,
    );
  },
};
