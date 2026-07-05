export interface RawHeadline {
  ticker: string;
  text: string;
  url?: string;
  publishedAt: string; // ISO date or datetime
  source: string; // adapter name, stamped for provenance
}

export interface NewsSourceAdapter {
  name: string;
  fetchHeadlines(params: { tickers: string[]; startDate: string; endDate: string }): Promise<RawHeadline[]>;
}
