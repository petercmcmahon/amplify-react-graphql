import type { StrategyParams } from '../lib/strategyParams';

interface StrategyParamsFormProps {
  value: StrategyParams;
  onChange: (params: StrategyParams) => void;
}

function numberField(
  label: string,
  key: keyof StrategyParams,
  value: StrategyParams,
  onChange: (params: StrategyParams) => void,
  step = 0.01,
  nullable = false,
) {
  const raw = value[key];
  return (
    <label style={{ display: 'block', marginBottom: '0.5rem' }}>
      {label}
      <input
        type="number"
        step={step}
        value={raw ?? ''}
        onChange={(e) => {
          const next = e.target.value === '' ? null : Number(e.target.value);
          onChange({ ...value, [key]: nullable ? next : (next ?? 0) });
        }}
      />
    </label>
  );
}

export function StrategyParamsForm({ value, onChange }: StrategyParamsFormProps) {
  return (
    <fieldset>
      <legend>Strategy parameters</legend>
      {numberField('Sentiment buy threshold (-1 to 1)', 'sentimentBuyThreshold', value, onChange, 0.05)}
      {numberField('Relevance minimum threshold (0 to 1)', 'relevanceMinThreshold', value, onChange, 0.05)}
      {numberField('Position size (% of portfolio, 0-1)', 'positionSizePct', value, onChange, 0.01)}
      {numberField('Max holding period (trading days)', 'holdingPeriodDays', value, onChange, 1)}
      {numberField('Stop-loss (% as decimal, e.g. -0.05)', 'stopLossPct', value, onChange, 0.01, true)}
      {numberField('Take-profit (% as decimal, e.g. 0.10)', 'takeProfitPct', value, onChange, 0.01, true)}
      {numberField('Starting capital ($)', 'startingCapital', value, onChange, 1000)}
    </fieldset>
  );
}
