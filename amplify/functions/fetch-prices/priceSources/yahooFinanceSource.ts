import yahooFinance from 'yahoo-finance2';
import type { PriceSourceAdapter } from './types';

export const yahooFinanceSource: PriceSourceAdapter = {
  name: 'yahoo-finance2',
  async fetchPrices({ ticker, startDate, endDate }) {
    const result = await yahooFinance.chart(ticker, {
      period1: startDate,
      period2: endDate,
      interval: '1d',
    });

    return result.quotes
      .filter((q) => q.open != null && q.high != null && q.low != null && q.close != null)
      .map((q) => ({
        date: new Date(q.date).toISOString().slice(0, 10),
        open: q.open as number,
        high: q.high as number,
        low: q.low as number,
        close: q.close as number,
        volume: q.volume ?? 0,
      }));
  },
};
