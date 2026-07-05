export interface PriceBar {
  date: string; // ISO date, e.g. "2023-11-15"
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ScoredHeadline {
  headlineHash: string;
  publishedAt: string; // ISO datetime
  sentimentScore: number; // -1..1
  relevanceScore: number; // 0..1
}

export type ExitReason =
  | 'STOP_LOSS'
  | 'TAKE_PROFIT'
  | 'HOLDING_PERIOD_EXPIRED'
  | 'END_OF_BACKTEST';

export interface Trade {
  ticker: string;
  entryDate: string;
  exitDate: string;
  entryPrice: number;
  exitPrice: number;
  shares: number;
  pnl: number;
  pnlPct: number;
  exitReason: ExitReason;
}

export interface EquityPoint {
  date: string;
  equityValue: number;
}

export interface Metrics {
  totalReturnPct: number;
  sharpeRatio: number;
  maxDrawdownPct: number;
  winRatePct: number;
  totalTrades: number;
}

export interface EngineParams {
  sentimentBuyThreshold: number;
  relevanceMinThreshold: number;
  positionSizePct: number;
  holdingPeriodDays: number;
  stopLossPct?: number;
  takeProfitPct?: number;
  startingCapital: number;
}

export interface EngineInput {
  prices: Record<string, PriceBar[]>;
  sentimentEvents: Record<string, ScoredHeadline[]>;
  params: EngineParams;
}

export interface EngineOutput {
  equityCurve: EquityPoint[];
  trades: Trade[];
  metrics: Metrics;
}
