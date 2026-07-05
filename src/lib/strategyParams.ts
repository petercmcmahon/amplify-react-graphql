export interface StrategyParams {
  sentimentBuyThreshold: number;
  relevanceMinThreshold: number;
  positionSizePct: number;
  holdingPeriodDays: number;
  stopLossPct: number | null;
  takeProfitPct: number | null;
  startingCapital: number;
}

export const DEFAULT_STRATEGY_PARAMS: StrategyParams = {
  sentimentBuyThreshold: 0.5,
  relevanceMinThreshold: 0.3,
  positionSizePct: 0.1,
  holdingPeriodDays: 10,
  stopLossPct: -0.05,
  takeProfitPct: 0.1,
  startingCapital: 100_000,
};
