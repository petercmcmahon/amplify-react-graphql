import { useState } from 'react';
import { AI_TECH_WATCHLIST } from '../lib/watchlistPresets';

interface TickerPickerProps {
  value: string[];
  onChange: (tickers: string[]) => void;
}

export function TickerPicker({ value, onChange }: TickerPickerProps) {
  const [customTicker, setCustomTicker] = useState('');

  function toggle(symbol: string) {
    if (value.includes(symbol)) {
      onChange(value.filter((t) => t !== symbol));
    } else {
      onChange([...value, symbol]);
    }
  }

  function addCustom() {
    const symbol = customTicker.trim().toUpperCase();
    if (symbol && !value.includes(symbol)) {
      onChange([...value, symbol]);
    }
    setCustomTicker('');
  }

  return (
    <fieldset>
      <legend>Tickers (AI / tech watchlist)</legend>
      {AI_TECH_WATCHLIST.map((t) => (
        <label key={t.symbol} style={{ display: 'block' }}>
          <input type="checkbox" checked={value.includes(t.symbol)} onChange={() => toggle(t.symbol)} />
          {' '}
          {t.symbol} — {t.name} ({t.sector})
        </label>
      ))}
      <div style={{ marginTop: '0.5rem' }}>
        <input
          type="text"
          placeholder="Add ticker (e.g. AAPL)"
          value={customTicker}
          onChange={(e) => setCustomTicker(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addCustom();
            }
          }}
        />
        <button type="button" onClick={addCustom}>
          Add
        </button>
      </div>
    </fieldset>
  );
}
