import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { EquityPoint } from '../lib/backtestTypes';

interface EquityCurveChartProps {
  equityCurve: EquityPoint[];
}

export function EquityCurveChart({ equityCurve }: EquityCurveChartProps) {
  return (
    <div style={{ width: '100%', height: 320 }}>
      <ResponsiveContainer>
        <LineChart data={equityCurve}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" minTickGap={40} />
          <YAxis domain={['auto', 'auto']} tickFormatter={(v: number) => `$${Math.round(v).toLocaleString()}`} />
          <Tooltip
            formatter={(v) => `$${Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
          />
          <Line type="monotone" dataKey="equityValue" stroke="#4f8adb" dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
