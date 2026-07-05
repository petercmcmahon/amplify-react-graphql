import type { EquityPoint, Metrics, Trade } from './types';

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function stdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const m = mean(values);
  const variance = mean(values.map((v) => (v - m) ** 2));
  return Math.sqrt(variance);
}

const TRADING_DAYS_PER_YEAR = 252;

/**
 * Sharpe assumes a 0% risk-free rate and annualizes daily returns by
 * sqrt(252); v1 has no transaction costs/slippage modeled. Both are
 * documented simplifications, not oversights.
 */
export function computeMetrics(equityCurve: EquityPoint[], trades: Trade[], startingCapital: number): Metrics {
  if (equityCurve.length === 0) {
    return { totalReturnPct: 0, sharpeRatio: 0, maxDrawdownPct: 0, winRatePct: 0, totalTrades: 0 };
  }

  const finalEquity = equityCurve[equityCurve.length - 1].equityValue;
  const totalReturnPct = (finalEquity - startingCapital) / startingCapital;

  const dailyReturns: number[] = [];
  for (let i = 1; i < equityCurve.length; i++) {
    const prev = equityCurve[i - 1].equityValue;
    const curr = equityCurve[i].equityValue;
    if (prev === 0) continue;
    dailyReturns.push((curr - prev) / prev);
  }
  const stdDaily = stdDev(dailyReturns);
  const sharpeRatio = stdDaily === 0 ? 0 : (mean(dailyReturns) / stdDaily) * Math.sqrt(TRADING_DAYS_PER_YEAR);

  let peak = equityCurve[0].equityValue;
  let maxDrawdownPct = 0;
  for (const point of equityCurve) {
    peak = Math.max(peak, point.equityValue);
    const drawdown = (point.equityValue - peak) / peak;
    maxDrawdownPct = Math.min(maxDrawdownPct, drawdown);
  }

  const winningTrades = trades.filter((t) => t.pnl > 0).length;
  const winRatePct = trades.length === 0 ? 0 : winningTrades / trades.length;

  return {
    totalReturnPct,
    sharpeRatio,
    maxDrawdownPct,
    winRatePct,
    totalTrades: trades.length,
  };
}
