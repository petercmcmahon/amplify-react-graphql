export interface EquityPoint {
  date: string;
  equityValue: number;
}

export interface Trade {
  ticker: string;
  entryDate: string;
  exitDate: string;
  entryPrice: number;
  exitPrice: number;
  shares: number;
  pnl: number;
  pnlPct: number;
  exitReason: 'STOP_LOSS' | 'TAKE_PROFIT' | 'HOLDING_PERIOD_EXPIRED' | 'END_OF_BACKTEST';
}

export interface Metrics {
  totalReturnPct: number | null;
  sharpeRatio: number | null;
  maxDrawdownPct: number | null;
  winRatePct: number | null;
  totalTrades: number | null;
}
