import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TickerPicker } from '../components/TickerPicker';
import { DateRangePicker } from '../components/DateRangePicker';
import { StrategyParamsForm } from '../components/StrategyParamsForm';
import { NewsSourceSelect } from '../components/NewsSourceSelect';
import { DEFAULT_STRATEGY_PARAMS } from '../lib/strategyParams';
import { client } from '../lib/dataClient';

export function BacktestConfigPage() {
  const navigate = useNavigate();
  const [tickers, setTickers] = useState<string[]>(['NVDA', 'MSFT']);
  const [startDate, setStartDate] = useState('2023-01-01');
  const [endDate, setEndDate] = useState('2023-06-30');
  const [params, setParams] = useState(DEFAULT_STRATEGY_PARAMS);
  const [newsSourceAdapter, setNewsSourceAdapter] = useState('seed-csv');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (tickers.length === 0) {
      setError('Select at least one ticker.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { data: config, errors } = await client.models.BacktestConfig.create({
        tickers,
        startDate,
        endDate,
        sentimentBuyThreshold: params.sentimentBuyThreshold,
        relevanceMinThreshold: params.relevanceMinThreshold,
        positionSizePct: params.positionSizePct,
        holdingPeriodDays: params.holdingPeriodDays,
        stopLossPct: params.stopLossPct,
        takeProfitPct: params.takeProfitPct,
        startingCapital: params.startingCapital,
        newsSourceAdapter,
      });
      if (errors || !config) {
        throw new Error(errors?.map((err) => err.message).join('; ') ?? 'Failed to create config');
      }

      const { data: runResult, errors: runErrors } = await client.mutations.runBacktest({
        configId: config.id,
      });
      if (runErrors || !runResult?.resultId) {
        throw new Error(runErrors?.map((err) => err.message).join('; ') ?? 'Failed to start backtest');
      }

      navigate(`/results/${runResult.resultId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 640 }}>
      <h1>Backtest an AI/tech news-sentiment strategy</h1>
      <TickerPicker value={tickers} onChange={setTickers} />
      <DateRangePicker startDate={startDate} endDate={endDate} onChange={({ startDate: s, endDate: e }) => {
        setStartDate(s);
        setEndDate(e);
      }} />
      <StrategyParamsForm value={params} onChange={setParams} />
      <NewsSourceSelect value={newsSourceAdapter} onChange={setNewsSourceAdapter} />
      {error && <p style={{ color: '#ff6b6b' }}>{error}</p>}
      <button type="submit" disabled={submitting}>
        {submitting ? 'Starting backtest…' : 'Run backtest'}
      </button>
    </form>
  );
}
