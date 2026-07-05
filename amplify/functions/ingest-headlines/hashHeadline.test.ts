import { describe, expect, it } from 'vitest';
import { hashHeadline } from './hashHeadline';

describe('hashHeadline', () => {
  it('is deterministic for identical input', () => {
    const headline = { source: 'seed-csv', publishedAt: '2023-01-01', text: 'Nvidia rallies' };
    expect(hashHeadline(headline)).toBe(hashHeadline({ ...headline }));
  });

  it('differs when the text differs', () => {
    const a = hashHeadline({ source: 'seed-csv', publishedAt: '2023-01-01', text: 'Nvidia rallies' });
    const b = hashHeadline({ source: 'seed-csv', publishedAt: '2023-01-01', text: 'Nvidia falls' });
    expect(a).not.toBe(b);
  });
});
