import type { NewsSourceAdapter, RawHeadline } from './types';
import { parseHeadlineCsv } from './csvUtil';

/**
 * Reads a user-supplied headline CSV (same `ticker,text,url,publishedAt`
 * shape as the seed dataset) from the USER_HEADLINES_CSV environment
 * variable. This is a v1 placeholder for bringing a proprietary/paid
 * historical headline archive without code changes — a future iteration
 * should replace this with an Amplify Storage (S3) upload backing it
 * instead of an env var, once the UI has an upload flow.
 */
export const userUploadSource: NewsSourceAdapter = {
  name: 'user-upload',
  async fetchHeadlines({ tickers, startDate, endDate }): Promise<RawHeadline[]> {
    const csvText = process.env.USER_HEADLINES_CSV;
    if (!csvText) {
      throw new Error(
        'user-upload news source selected, but no USER_HEADLINES_CSV was configured. Provide a headline CSV (ticker,text,url,publishedAt) via that environment variable.',
      );
    }
    const allHeadlines = parseHeadlineCsv(csvText, 'user-upload');
    const tickerSet = new Set(tickers.map((t) => t.toUpperCase()));
    return allHeadlines.filter(
      (h) => tickerSet.has(h.ticker) && h.publishedAt >= startDate && h.publishedAt <= endDate,
    );
  },
};
