import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { client } from '../lib/dataClient';
import { EquityCurveChart } from '../components/EquityCurveChart';
import { TradeLogTable } from '../components/TradeLogTable';
import { MetricsSummaryCards } from '../components/MetricsSummaryCards';
import type { EquityPoint, Trade } from '../lib/backtestTypes';

type ResultStatus = 'PENDING' | 'RUNNING' | 'COMPLETE' | 'FAILED' | null | undefined;

export function BacktestResultsPage() {
  const { resultId } = useParams<{ resultId: string }>();
  const [status, setStatus] = useState<ResultStatus>('RUNNING');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [equityCurve, setEquityCurve] = useState<EquityPoint[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [metrics, setMetrics] = useState({
    totalReturnPct: null as number | null,
    sharpeRatio: null as number | null,
    maxDrawdownPct: null as number | null,
    winRatePct: null as number | null,
    totalTrades: null as number | null,
  });

  useEffect(() => {
    if (!resultId) return;

    function applyResult(result: {
      status?: ResultStatus;
      errorMessage?: string | null;
      equityCurveJson?: unknown;
      tradeLogJson?: unknown;
      totalReturnPct?: number | null;
      sharpeRatio?: number | null;
      maxDrawdownPct?: number | null;
      winRatePct?: number | null;
      totalTrades?: number | null;
    }) {
      setStatus(result.status);
      setErrorMessage(result.errorMessage ?? null);
      setEquityCurve((result.equityCurveJson as EquityPoint[] | undefined) ?? []);
      setTrades((result.tradeLogJson as Trade[] | undefined) ?? []);
      setMetrics({
        totalReturnPct: result.totalReturnPct ?? null,
        sharpeRatio: result.sharpeRatio ?? null,
        maxDrawdownPct: result.maxDrawdownPct ?? null,
        winRatePct: result.winRatePct ?? null,
        totalTrades: result.totalTrades ?? null,
      });
    }

    client.models.BacktestResult.get({ id: resultId }).then(({ data }) => {
      if (data) applyResult(data);
    });

    const subscription = client.models.BacktestResult.onUpdate({
      filter: { id: { eq: resultId } },
    }).subscribe({
      next: (data) => applyResult(data),
    });

    return () => subscription.unsubscribe();
  }, [resultId]);

  if (status === 'RUNNING' || status === 'PENDING') {
    return <p>Running backtest… (fetching prices, ingesting headlines, scoring sentiment)</p>;
  }
  if (status === 'FAILED') {
    return <p style={{ color: '#ff6b6b' }}>Backtest failed: {errorMessage}</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h1>Backtest results</h1>
      <MetricsSummaryCards metrics={metrics} />
      <EquityCurveChart equityCurve={equityCurve} />
      <h2>Trade log</h2>
      <TradeLogTable trades={trades} />
    </div>
  );
}
