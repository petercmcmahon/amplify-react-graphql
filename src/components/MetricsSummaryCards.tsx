import type { Metrics } from '../lib/backtestTypes';

interface MetricsSummaryCardsProps {
  metrics: Metrics;
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: '1px solid #444', borderRadius: 8, padding: '0.75rem 1rem', minWidth: 140 }}>
      <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{label}</div>
      <div style={{ fontSize: '1.4rem', fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function pct(v: number | null | undefined): string {
  return v == null ? '—' : `${(v * 100).toFixed(2)}%`;
}

export function MetricsSummaryCards({ metrics }: MetricsSummaryCardsProps) {
  return (
    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
      <Card label="Total return" value={pct(metrics.totalReturnPct)} />
      <Card label="Sharpe ratio" value={metrics.sharpeRatio == null ? '—' : metrics.sharpeRatio.toFixed(2)} />
      <Card label="Max drawdown" value={pct(metrics.maxDrawdownPct)} />
      <Card label="Win rate" value={pct(metrics.winRatePct)} />
      <Card label="Total trades" value={metrics.totalTrades == null ? '—' : String(metrics.totalTrades)} />
    </div>
  );
}
