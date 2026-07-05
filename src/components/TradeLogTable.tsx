import type { Trade } from '../lib/backtestTypes';

interface TradeLogTableProps {
  trades: Trade[];
}

export function TradeLogTable({ trades }: TradeLogTableProps) {
  if (trades.length === 0) {
    return <p>No trades were triggered for this configuration.</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Ticker</th>
          <th>Entry date</th>
          <th>Entry price</th>
          <th>Exit date</th>
          <th>Exit price</th>
          <th>P&amp;L %</th>
          <th>Exit reason</th>
        </tr>
      </thead>
      <tbody>
        {trades.map((t, i) => (
          <tr key={`${t.ticker}-${t.entryDate}-${i}`}>
            <td>{t.ticker}</td>
            <td>{t.entryDate}</td>
            <td>{t.entryPrice.toFixed(2)}</td>
            <td>{t.exitDate}</td>
            <td>{t.exitPrice.toFixed(2)}</td>
            <td>{(t.pnlPct * 100).toFixed(2)}%</td>
            <td>{t.exitReason}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
