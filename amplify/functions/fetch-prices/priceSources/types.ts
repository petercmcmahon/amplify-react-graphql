import type { PriceBar } from '../../run-backtest/engine/types';

export interface PriceSourceAdapter {
  name: string;
  fetchPrices(params: { ticker: string; startDate: string; endDate: string }): Promise<PriceBar[]>;
}
