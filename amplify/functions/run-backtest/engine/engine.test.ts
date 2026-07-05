import { describe, expect, it } from 'vitest';
import { runBacktest } from './engine';
import { computeMetrics } from './metrics';
import type { EngineParams, PriceBar, ScoredHeadline, Trade } from './types';

function bar(date: string, close: number, open = close): PriceBar {
  return { date, open, high: Math.max(open, close), low: Math.min(open, close), close, volume: 1_000_000 };
}

function headline(publishedAt: string, sentimentScore: number, relevanceScore: number): ScoredHeadline {
  return { headlineHash: `h-${publishedAt}-${sentimentScore}`, publishedAt, sentimentScore, relevanceScore };
}

const baseParams: EngineParams = {
  sentimentBuyThreshold: 0.5,
  relevanceMinThreshold: 0.3,
  positionSizePct: 0.1,
  holdingPeriodDays: 10,
  startingCapital: 100_000,
};

describe('runBacktest', () => {
  it('opens a position the trading day after a qualifying signal', () => {
    const prices = {
      A: [bar('2024-01-01', 100), bar('2024-01-02', 100), bar('2024-01-03', 105), bar('2024-01-04', 110), bar('2024-01-05', 110)],
    };
    const sentimentEvents = { A: [headline('2024-01-01T12:00:00Z', 0.8, 0.8)] };

    const { trades } = runBacktest({ prices, sentimentEvents, params: baseParams });

    expect(trades).toHaveLength(1);
    expect(trades[0].entryDate).toBe('2024-01-02');
    expect(trades[0].entryPrice).toBe(100);
  });

  it('does not enter when sentiment is below the buy threshold', () => {
    const prices = {
      A: [bar('2024-01-01', 100), bar('2024-01-02', 100), bar('2024-01-03', 105)],
    };
    const sentimentEvents = { A: [headline('2024-01-01T12:00:00Z', 0.2, 0.8)] };

    const { trades, equityCurve } = runBacktest({ prices, sentimentEvents, params: baseParams });

    expect(trades).toHaveLength(0);
    expect(equityCurve.every((p) => p.equityValue === baseParams.startingCapital)).toBe(true);
  });

  it('does not enter when relevance is below the minimum threshold', () => {
    const prices = {
      A: [bar('2024-01-01', 100), bar('2024-01-02', 100), bar('2024-01-03', 105)],
    };
    const sentimentEvents = { A: [headline('2024-01-01T12:00:00Z', 0.9, 0.1)] };

    const { trades } = runBacktest({ prices, sentimentEvents, params: baseParams });

    expect(trades).toHaveLength(0);
  });

  it('exits on take-profit before the holding period expires', () => {
    const prices = {
      A: [bar('2024-01-01', 100), bar('2024-01-02', 100), bar('2024-01-03', 105), bar('2024-01-04', 115)],
    };
    const sentimentEvents = { A: [headline('2024-01-01T12:00:00Z', 0.8, 0.8)] };
    const params: EngineParams = { ...baseParams, stopLossPct: -0.5, takeProfitPct: 0.1, holdingPeriodDays: 10 };

    const { trades } = runBacktest({ prices, sentimentEvents, params });

    expect(trades).toHaveLength(1);
    expect(trades[0].exitReason).toBe('TAKE_PROFIT');
    expect(trades[0].exitDate).toBe('2024-01-04');
    expect(trades[0].exitPrice).toBe(115);
    expect(trades[0].pnlPct).toBeCloseTo(0.15, 10);
  });

  it('exits on stop-loss before the holding period expires', () => {
    const prices = {
      A: [bar('2024-01-01', 100), bar('2024-01-02', 100), bar('2024-01-03', 90)],
    };
    const sentimentEvents = { A: [headline('2024-01-01T12:00:00Z', 0.8, 0.8)] };
    const params: EngineParams = { ...baseParams, stopLossPct: -0.05, takeProfitPct: 0.5, holdingPeriodDays: 10 };

    const { trades } = runBacktest({ prices, sentimentEvents, params });

    expect(trades).toHaveLength(1);
    expect(trades[0].exitReason).toBe('STOP_LOSS');
    expect(trades[0].exitDate).toBe('2024-01-03');
    expect(trades[0].exitPrice).toBe(90);
  });

  it('exits on holding-period expiry when no other trigger fires', () => {
    const prices = {
      A: [bar('2024-01-01', 100), bar('2024-01-02', 100), bar('2024-01-03', 102), bar('2024-01-04', 103)],
    };
    const sentimentEvents = { A: [headline('2024-01-01T12:00:00Z', 0.8, 0.8)] };
    const params: EngineParams = { ...baseParams, stopLossPct: -0.5, takeProfitPct: 0.5, holdingPeriodDays: 2 };

    const { trades } = runBacktest({ prices, sentimentEvents, params });

    expect(trades).toHaveLength(1);
    expect(trades[0].exitReason).toBe('HOLDING_PERIOD_EXPIRED');
    expect(trades[0].exitDate).toBe('2024-01-04');
    expect(trades[0].exitPrice).toBe(103);
  });

  it('ignores a second qualifying signal while already holding a position (no pyramiding)', () => {
    const prices = {
      A: [
        bar('2024-01-01', 100),
        bar('2024-01-02', 100),
        bar('2024-01-03', 101),
        bar('2024-01-04', 102),
        bar('2024-01-05', 103),
      ],
    };
    const sentimentEvents = {
      A: [headline('2024-01-01T12:00:00Z', 0.8, 0.8), headline('2024-01-03T12:00:00Z', 0.9, 0.9)],
    };
    const params: EngineParams = { ...baseParams, holdingPeriodDays: 100 };

    const { trades } = runBacktest({ prices, sentimentEvents, params });

    expect(trades).toHaveLength(1);
  });

  it('force-closes any still-open position at the end of the backtest range', () => {
    const prices = {
      A: [bar('2024-01-01', 100), bar('2024-01-02', 100), bar('2024-01-03', 108)],
    };
    const sentimentEvents = { A: [headline('2024-01-01T12:00:00Z', 0.8, 0.8)] };
    const params: EngineParams = { ...baseParams, holdingPeriodDays: 100 };

    const { trades } = runBacktest({ prices, sentimentEvents, params });

    expect(trades).toHaveLength(1);
    expect(trades[0].exitReason).toBe('END_OF_BACKTEST');
    expect(trades[0].exitDate).toBe('2024-01-03');
    expect(trades[0].exitPrice).toBe(108);
  });

  it('aggregates multi-ticker equity so the final equity reflects every trade', () => {
    const prices = {
      A: [
        bar('2024-01-01', 100),
        bar('2024-01-02', 100),
        bar('2024-01-03', 105),
        bar('2024-01-04', 110),
      ],
      B: [
        bar('2024-01-01', 50),
        bar('2024-01-02', 50),
        bar('2024-01-03', 48),
        bar('2024-01-04', 47.5),
      ],
    };
    const sentimentEvents = {
      A: [headline('2024-01-01T12:00:00Z', 0.8, 0.8)],
      B: [headline('2024-01-01T12:00:00Z', 0.8, 0.8)],
    };
    const params: EngineParams = { ...baseParams, holdingPeriodDays: 100 };

    const { trades, equityCurve } = runBacktest({ prices, sentimentEvents, params });

    expect(trades).toHaveLength(2);
    expect(trades.map((t) => t.ticker).sort()).toEqual(['A', 'B']);

    const finalEquity = equityCurve[equityCurve.length - 1].equityValue;
    const expectedFinalEquity = params.startingCapital + trades.reduce((sum, t) => sum + t.pnl, 0);
    expect(finalEquity).toBeCloseTo(expectedFinalEquity, 6);
  });
});

describe('computeMetrics', () => {
  it('computes total return and max drawdown from a fixed equity curve', () => {
    const equityCurve = [
      { date: '2024-01-01', equityValue: 100 },
      { date: '2024-01-02', equityValue: 110 },
      { date: '2024-01-03', equityValue: 105 },
      { date: '2024-01-04', equityValue: 121 },
    ];
    const trades: Trade[] = [];

    const metrics = computeMetrics(equityCurve, trades, 100);

    expect(metrics.totalReturnPct).toBeCloseTo(0.21, 10);
    expect(metrics.maxDrawdownPct).toBeCloseTo((105 - 110) / 110, 10);
  });

  it('computes win rate from a fixed trade list', () => {
    const equityCurve = [
      { date: '2024-01-01', equityValue: 100 },
      { date: '2024-01-02', equityValue: 105 },
    ];
    const trades: Trade[] = [
      { ticker: 'A', entryDate: '', exitDate: '', entryPrice: 1, exitPrice: 1, shares: 1, pnl: 100, pnlPct: 0.1, exitReason: 'TAKE_PROFIT' },
      { ticker: 'A', entryDate: '', exitDate: '', entryPrice: 1, exitPrice: 1, shares: 1, pnl: -50, pnlPct: -0.05, exitReason: 'STOP_LOSS' },
      { ticker: 'A', entryDate: '', exitDate: '', entryPrice: 1, exitPrice: 1, shares: 1, pnl: 200, pnlPct: 0.2, exitReason: 'HOLDING_PERIOD_EXPIRED' },
    ];

    const metrics = computeMetrics(equityCurve, trades, 100);

    expect(metrics.winRatePct).toBeCloseTo(2 / 3, 10);
    expect(metrics.totalTrades).toBe(3);
  });

  it('does not throw and returns zeroed metrics for a zero-trade, single-point curve', () => {
    const metrics = computeMetrics([{ date: '2024-01-01', equityValue: 100_000 }], [], 100_000);

    expect(metrics.totalTrades).toBe(0);
    expect(metrics.winRatePct).toBe(0);
    expect(metrics.sharpeRatio).toBe(0);
    expect(metrics.totalReturnPct).toBe(0);
  });

  it('does not throw for a completely empty equity curve', () => {
    const metrics = computeMetrics([], [], 100_000);

    expect(metrics).toEqual({ totalReturnPct: 0, sharpeRatio: 0, maxDrawdownPct: 0, winRatePct: 0, totalTrades: 0 });
  });
});
