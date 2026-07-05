import { createHash } from 'node:crypto';
import type { RawHeadline } from './newsSources/types';

/** Content-addressed dedupe key so re-ingesting the same headline is a no-op. */
export function hashHeadline(headline: Pick<RawHeadline, 'source' | 'publishedAt' | 'text'>): string {
  return createHash('sha256').update(`${headline.source}|${headline.publishedAt}|${headline.text}`).digest('hex');
}
