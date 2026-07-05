import type {
  EngineInput,
  EngineOutput,
  EquityPoint,
  ExitReason,
  PriceBar,
  Trade,
} from './types';
import { computeMetrics } from './metrics';

interface OpenPosition {
  entryDate: string;
  entryPrice: number;
  shares: number;
  daysHeld: number;
}

function dayOf(isoDateTime: string): string {
  return isoDateTime.slice(0, 10);
}

/**
 * Pure, side-effect-free backtest simulation. Takes historical prices and
 * pre-scored sentiment headlines and simulates a single "buy on qualifying
 * sentiment, hold until an exit trigger fires" strategy across a shared
 * capital pool. No network/AWS access — deterministic given its inputs.
 */
export function runBacktest(input: EngineInput): EngineOutput {
  const { prices, sentimentEvents, params } = input;
  const tickers = Object.keys(prices);

  // Union of all trading days across every ticker, sorted ascending.
  const calendarSet = new Set<string>();
  for (const ticker of tickers) {
    for (const bar of prices[ticker]) calendarSet.add(bar.date);
  }
  const calendar = Array.from(calendarSet).sort();

  const barByTickerDate: Record<string, Map<string, PriceBar>> = {};
  for (const ticker of tickers) {
    const map = new Map<string, PriceBar>();
    for (const bar of prices[ticker]) map.set(bar.date, bar);
    barByTickerDate[ticker] = map;
  }

  // Group qualifying-check-ready headlines by ticker -> publish day.
  const headlinesByTickerDate: Record<string, Map<string, { sentimentScore: number; relevanceScore: number }[]>> = {};
  for (const ticker of tickers) {
    const map = new Map<string, { sentimentScore: number; relevanceScore: number }[]>();
    for (const headline of sentimentEvents[ticker] ?? []) {
      const day = dayOf(headline.publishedAt);
      const list = map.get(day) ?? [];
      list.push({ sentimentScore: headline.sentimentScore, relevanceScore: headline.relevanceScore });
      map.set(day, list);
    }
    headlinesByTickerDate[ticker] = map;
  }

  function hasQualifyingSignal(ticker: string, date: string): boolean {
    const headlines = headlinesByTickerDate[ticker]?.get(date) ?? [];
    return headlines.some(
      (h) => h.sentimentScore >= params.sentimentBuyThreshold && h.relevanceScore >= params.relevanceMinThreshold,
    );
  }

  const openPositions: Record<string, OpenPosition | null> = {};
  const pendingEntry: Record<string, boolean> = {};
  const lastKnownPrice: Record<string, number> = {};
  for (const ticker of tickers) {
    openPositions[ticker] = null;
    pendingEntry[ticker] = false;
  }

  const trades: Trade[] = [];
  const equityCurve: EquityPoint[] = [];
  let realizedCapital = params.startingCapital;

  function closePosition(ticker: string, pos: OpenPosition, exitPrice: number, exitDate: string, exitReason: ExitReason) {
    const pnl = pos.shares * (exitPrice - pos.entryPrice);
    const pnlPct = (exitPrice - pos.entryPrice) / pos.entryPrice;
    realizedCapital += pnl;
    trades.push({
      ticker,
      entryDate: pos.entryDate,
      exitDate,
      entryPrice: pos.entryPrice,
      exitPrice,
      shares: pos.shares,
      pnl,
      pnlPct,
      exitReason,
    });
    openPositions[ticker] = null;
  }

  for (const date of calendar) {
    // 1. Execute any entries scheduled from a prior day's qualifying signal.
    for (const ticker of tickers) {
      if (!pendingEntry[ticker]) continue;
      const bar = barByTickerDate[ticker].get(date);
      if (!bar) continue; // wait for this ticker's next actual trading day
      const entryPrice = bar.open;
      const currentEquity =
        realizedCapital +
        tickers.reduce((sum, t) => {
          const pos = openPositions[t];
          if (!pos) return sum;
          const price = barByTickerDate[t].get(date)?.close ?? lastKnownPrice[t] ?? pos.entryPrice;
          return sum + pos.shares * (price - pos.entryPrice);
        }, 0);
      const shares = (currentEquity * params.positionSizePct) / entryPrice;
      openPositions[ticker] = { entryDate: date, entryPrice, shares, daysHeld: 0 };
      pendingEntry[ticker] = false;
    }

    // 2. Evaluate exits for tickers currently holding a position.
    for (const ticker of tickers) {
      const pos = openPositions[ticker];
      if (!pos || pos.entryDate === date) continue; // no exit check on entry day itself
      const bar = barByTickerDate[ticker].get(date);
      if (!bar) continue;
      pos.daysHeld += 1;
      const unrealizedPct = (bar.close - pos.entryPrice) / pos.entryPrice;

      let exitReason: ExitReason | null = null;
      if (params.stopLossPct !== undefined && unrealizedPct <= params.stopLossPct) {
        exitReason = 'STOP_LOSS';
      } else if (params.takeProfitPct !== undefined && unrealizedPct >= params.takeProfitPct) {
        exitReason = 'TAKE_PROFIT';
      } else if (pos.daysHeld >= params.holdingPeriodDays) {
        exitReason = 'HOLDING_PERIOD_EXPIRED';
      }

      if (exitReason) {
        closePosition(ticker, pos, bar.close, date, exitReason);
      }
    }

    // 3. Look for new qualifying signals; schedule entry for the ticker's next trading day.
    for (const ticker of tickers) {
      if (openPositions[ticker] || pendingEntry[ticker]) continue; // no pyramiding in v1
      if (hasQualifyingSignal(ticker, date)) {
        pendingEntry[ticker] = true;
      }
    }

    // 4. Update last-known prices and mark the portfolio to market for today.
    let unrealizedTotal = 0;
    for (const ticker of tickers) {
      const bar = barByTickerDate[ticker].get(date);
      if (bar) lastKnownPrice[ticker] = bar.close;
      const pos = openPositions[ticker];
      if (pos) {
        const price = bar?.close ?? lastKnownPrice[ticker] ?? pos.entryPrice;
        unrealizedTotal += pos.shares * (price - pos.entryPrice);
      }
    }
    equityCurve.push({ date, equityValue: realizedCapital + unrealizedTotal });
  }

  // Force-close any still-open positions at the last known price so every
  // trade and every dollar of the final equity value is fully realized.
  const lastDate = calendar[calendar.length - 1];
  for (const ticker of tickers) {
    const pos = openPositions[ticker];
    if (!pos) continue;
    const exitPrice = barByTickerDate[ticker].get(lastDate)?.close ?? lastKnownPrice[ticker] ?? pos.entryPrice;
    closePosition(ticker, pos, exitPrice, lastDate, 'END_OF_BACKTEST');
  }

  const metrics = computeMetrics(equityCurve, trades, params.startingCapital);

  return { equityCurve, trades, metrics };
}
