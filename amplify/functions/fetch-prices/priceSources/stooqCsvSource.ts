import type { PriceSourceAdapter } from './types';

/** Free, keyless fallback for daily OHLCV history, used if yahoo-finance2 errors or rate-limits. */
export const stooqCsvSource: PriceSourceAdapter = {
  name: 'stooq',
  async fetchPrices({ ticker, startDate, endDate }) {
    const d1 = startDate.replace(/-/g, '');
    const d2 = endDate.replace(/-/g, '');
    const url = `https://stooq.com/q/d/l/?s=${ticker.toLowerCase()}.us&d1=${d1}&d2=${d2}&i=d`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Stooq request failed for ${ticker}: HTTP ${res.status}`);
    }
    const csvText = await res.text();
    if (!csvText.trim() || !csvText.startsWith('Date,')) {
      throw new Error(`Stooq returned no usable data for ${ticker}`);
    }

    const [, ...rows] = csvText.trim().split('\n');
    return rows
      .filter((row) => row.trim().length > 0)
      .map((row) => {
        const [date, open, high, low, close, volume] = row.split(',');
        return {
          date,
          open: Number(open),
          high: Number(high),
          low: Number(low),
          close: Number(close),
          volume: Number(volume),
        };
      });
  },
};
