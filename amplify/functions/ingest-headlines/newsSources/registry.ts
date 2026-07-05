import type { NewsSourceAdapter } from './types';
import { seedCsvSource } from './seedCsvSource';
import { gdeltSource } from './gdeltSource';
import { userUploadSource } from './userUploadSource';

const ADAPTERS: Record<string, NewsSourceAdapter> = {
  'seed-csv': seedCsvSource,
  gdelt: gdeltSource,
  'user-upload': userUploadSource,
};

export function getNewsSource(name: string): NewsSourceAdapter {
  const adapter = ADAPTERS[name];
  if (!adapter) {
    throw new Error(`Unknown news source adapter "${name}". Available: ${Object.keys(ADAPTERS).join(', ')}`);
  }
  return adapter;
}

export const NEWS_SOURCE_NAMES = Object.keys(ADAPTERS);
