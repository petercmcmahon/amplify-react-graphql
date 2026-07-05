import type { NewsSourceAdapter, RawHeadline } from './types';

/** Free-text company/query terms GDELT should search for per ticker. */
const COMPANY_QUERY_TERMS: Record<string, string> = {
  NVDA: 'Nvidia',
  MSFT: 'Microsoft',
  GOOGL: 'Google OR Alphabet',
  META: 'Meta OR Facebook',
  AMD: 'AMD OR "Advanced Micro Devices"',
  PLTR: 'Palantir',
  SMCI: '"Super Micro Computer" OR Supermicro',
  AMZN: 'Amazon',
  AAPL: 'Apple',
};

interface GdeltArticle {
  url: string;
  title: string;
  seendate: string; // e.g. "20230115T120000Z"
  domain: string;
}

interface GdeltResponse {
  articles?: GdeltArticle[];
}

function parseGdeltDate(seendate: string): string {
  const y = seendate.slice(0, 4);
  const mo = seendate.slice(4, 6);
  const d = seendate.slice(6, 8);
  const h = seendate.slice(9, 11) || '00';
  const mi = seendate.slice(11, 13) || '00';
  const s = seendate.slice(13, 15) || '00';
  return `${y}-${mo}-${d}T${h}:${mi}:${s}Z`;
}

function toGdeltDateTime(dateIso: string, endOfDay: boolean): string {
  return `${dateIso.replace(/-/g, '')}${endOfDay ? '235959' : '000000'}`;
}

function addDaysToDate(dateIso: string, days: number): string {
  const d = new Date(`${dateIso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** GDELT DOC 2.0 caps results per query, so each ticker/date-range is queried in weekly windows. */
async function fetchWindow(ticker: string, windowStart: string, windowEnd: string): Promise<RawHeadline[]> {
  const companyTerm = COMPANY_QUERY_TERMS[ticker] ?? ticker;
  const query = `(${companyTerm}) AND (AI OR "artificial intelligence")`;
  const url = new URL('https://api.gdeltproject.org/api/v2/doc/doc');
  url.searchParams.set('query', query);
  url.searchParams.set('mode', 'artlist');
  url.searchParams.set('format', 'json');
  url.searchParams.set('maxrecords', '250');
  url.searchParams.set('startdatetime', toGdeltDateTime(windowStart, false));
  url.searchParams.set('enddatetime', toGdeltDateTime(windowEnd, true));

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`GDELT request failed for ${ticker} (${windowStart}..${windowEnd}): HTTP ${res.status}`);
  }
  const body = (await res.json()) as GdeltResponse;
  return (body.articles ?? []).map((article) => ({
    ticker,
    text: article.title,
    url: article.url,
    publishedAt: parseGdeltDate(article.seendate),
    source: 'gdelt',
  }));
}

/**
 * Free, keyless historical news search via the GDELT Project's DOC 2.0 API
 * (coverage back to 2015+). This is the "real" historical adapter for
 * research use, as opposed to the offline seed-csv demo dataset.
 */
export const gdeltSource: NewsSourceAdapter = {
  name: 'gdelt',
  async fetchHeadlines({ tickers, startDate, endDate }): Promise<RawHeadline[]> {
    const results: RawHeadline[] = [];
    for (const ticker of tickers) {
      let windowStart = startDate;
      while (windowStart <= endDate) {
        const candidateEnd = addDaysToDate(windowStart, 7);
        const windowEnd = candidateEnd > endDate ? endDate : candidateEnd;
        const batch = await fetchWindow(ticker, windowStart, windowEnd);
        results.push(...batch);
        if (windowEnd >= endDate) break;
        windowStart = addDaysToDate(windowEnd, 1);
      }
    }
    return results;
  },
};
