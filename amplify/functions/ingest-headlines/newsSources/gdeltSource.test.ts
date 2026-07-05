import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { gdeltSource } from './gdeltSource';

function jsonResponse(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body } as Response;
}

describe('gdeltSource', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('chunks a date range longer than a week into multiple weekly windows', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ articles: [] }));

    await gdeltSource.fetchHeadlines({ tickers: ['NVDA'], startDate: '2023-01-01', endDate: '2023-01-10' });

    // 10-day range -> [01-01..01-08], [01-09..01-10]
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('builds a query URL with the ticker company term and correct GDELT date format', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ articles: [] }));

    await gdeltSource.fetchHeadlines({ tickers: ['NVDA'], startDate: '2023-01-01', endDate: '2023-01-03' });

    const calledUrl = new URL(fetchMock.mock.calls[0][0] as string);
    expect(calledUrl.origin + calledUrl.pathname).toBe('https://api.gdeltproject.org/api/v2/doc/doc');
    expect(calledUrl.searchParams.get('query')).toContain('Nvidia');
    expect(calledUrl.searchParams.get('mode')).toBe('artlist');
    expect(calledUrl.searchParams.get('format')).toBe('json');
    expect(calledUrl.searchParams.get('startdatetime')).toBe('20230101000000');
    expect(calledUrl.searchParams.get('enddatetime')).toBe('20230103235959');
  });

  it('maps GDELT articles into RawHeadline shape with parsed dates', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        articles: [
          {
            url: 'https://example-news.test/nvidia-ai',
            title: 'Nvidia rallies on AI chip demand',
            seendate: '20230115T093000Z',
            domain: 'example-news.test',
          },
        ],
      }),
    );

    const headlines = await gdeltSource.fetchHeadlines({
      tickers: ['NVDA'],
      startDate: '2023-01-15',
      endDate: '2023-01-15',
    });

    expect(headlines).toEqual([
      {
        ticker: 'NVDA',
        text: 'Nvidia rallies on AI chip demand',
        url: 'https://example-news.test/nvidia-ai',
        publishedAt: '2023-01-15T09:30:00Z',
        source: 'gdelt',
      },
    ]);
  });

  it('throws a descriptive error when GDELT returns a non-OK response', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, false, 503));

    await expect(
      gdeltSource.fetchHeadlines({ tickers: ['NVDA'], startDate: '2023-01-01', endDate: '2023-01-01' }),
    ).rejects.toThrow(/HTTP 503/);
  });
});
