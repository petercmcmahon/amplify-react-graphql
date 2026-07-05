interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (range: { startDate: string; endDate: string }) => void;
}

export function DateRangePicker({ startDate, endDate, onChange }: DateRangePickerProps) {
  return (
    <fieldset>
      <legend>Date range</legend>
      <label>
        Start
        <input
          type="date"
          value={startDate}
          onChange={(e) => onChange({ startDate: e.target.value, endDate })}
        />
      </label>
      <label style={{ marginLeft: '1rem' }}>
        End
        <input
          type="date"
          value={endDate}
          onChange={(e) => onChange({ startDate, endDate: e.target.value })}
        />
      </label>
    </fieldset>
  );
}
