export interface WatchlistTicker {
  symbol: string;
  name: string;
  sector: string;
}

export const AI_TECH_WATCHLIST: WatchlistTicker[] = [
  { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'AI / Semiconductors' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'AI / Cloud' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'AI / Search & Cloud' },
  { symbol: 'META', name: 'Meta Platforms, Inc.', sector: 'AI / Social' },
  { symbol: 'AMD', name: 'Advanced Micro Devices, Inc.', sector: 'AI / Semiconductors' },
  { symbol: 'PLTR', name: 'Palantir Technologies Inc.', sector: 'AI / Software' },
  { symbol: 'SMCI', name: 'Super Micro Computer, Inc.', sector: 'AI / Infrastructure' },
  { symbol: 'AMZN', name: 'Amazon.com, Inc.', sector: 'AI / Cloud' },
];
