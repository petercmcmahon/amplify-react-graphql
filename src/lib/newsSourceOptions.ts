export const NEWS_SOURCE_OPTIONS = [
  { value: 'seed-csv', label: 'Seed demo dataset (offline, deterministic)' },
  { value: 'gdelt', label: 'GDELT (free, live historical news search)' },
  { value: 'user-upload', label: 'User-supplied CSV' },
] as const;
