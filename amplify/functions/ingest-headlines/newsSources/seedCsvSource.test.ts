import { describe, expect, it } from 'vitest';
import { seedCsvSource } from './seedCsvSource';

describe('seedCsvSource', () => {
  it('parses the checked-in CSV and filters by ticker and date range', async () => {
    const headlines = await seedCsvSource.fetchHeadlines({
      tickers: ['NVDA'],
      startDate: '2023-01-01',
      endDate: '2023-03-31',
    });

    expect(headlines.length).toBeGreaterThan(0);
    for (const h of headlines) {
      expect(h.ticker).toBe('NVDA');
      expect(h.publishedAt >= '2023-01-01').toBe(true);
      expect(h.publishedAt <= '2023-03-31').toBe(true);
      expect(h.source).toBe('seed-csv');
      expect(h.text.length).toBeGreaterThan(0);
    }
  });

  it('correctly parses a headline whose text contains a comma', async () => {
    const headlines = await seedCsvSource.fetchHeadlines({
      tickers: ['MSFT'],
      startDate: '2022-11-30',
      endDate: '2022-11-30',
    });

    expect(headlines).toHaveLength(1);
    expect(headlines[0].text).toBe('OpenAI launches ChatGPT, drawing attention to Microsoft-backed AI research');
  });

  it('returns an empty array for a ticker with no matching headlines', async () => {
    const headlines = await seedCsvSource.fetchHeadlines({
      tickers: ['ZZZZ'],
      startDate: '2000-01-01',
      endDate: '2030-01-01',
    });

    expect(headlines).toEqual([]);
  });
});
