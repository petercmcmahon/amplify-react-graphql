import { NEWS_SOURCE_OPTIONS } from '../lib/newsSourceOptions';

interface NewsSourceSelectProps {
  value: string;
  onChange: (adapter: string) => void;
}

export function NewsSourceSelect({ value, onChange }: NewsSourceSelectProps) {
  return (
    <label>
      News source
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {NEWS_SOURCE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
