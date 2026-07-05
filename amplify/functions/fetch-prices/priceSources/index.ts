import type { PriceBar } from '../../run-backtest/engine/types';
import { yahooFinanceSource } from './yahooFinanceSource';
import { stooqCsvSource } from './stooqCsvSource';

export async function fetchPricesWithFallback(params: {
  ticker: string;
  startDate: string;
  endDate: string;
}): Promise<PriceBar[]> {
  try {
    return await yahooFinanceSource.fetchPrices(params);
  } catch (err) {
    console.warn(`yahoo-finance2 failed for ${params.ticker}, falling back to Stooq:`, err);
    return await stooqCsvSource.fetchPrices(params);
  }
}
