import type { RawHeadline } from './types';

/** Minimal RFC4180-ish CSV line splitter: handles double-quoted fields containing commas. */
function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

/** Parses a `ticker,text,url,publishedAt` CSV (with header row) into RawHeadline[]. */
export function parseHeadlineCsv(csvText: string, source: string): RawHeadline[] {
  const lines = csvText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length === 0) return [];

  const [header, ...rows] = lines;
  const columns = splitCsvLine(header).map((c) => c.trim().toLowerCase());
  const tickerIdx = columns.indexOf('ticker');
  const textIdx = columns.indexOf('text');
  const urlIdx = columns.indexOf('url');
  const publishedAtIdx = columns.indexOf('publishedat');

  if (tickerIdx === -1 || textIdx === -1 || publishedAtIdx === -1) {
    throw new Error('Headline CSV must have at least "ticker", "text", and "publishedAt" columns');
  }

  return rows.map((row) => {
    const fields = splitCsvLine(row);
    return {
      ticker: fields[tickerIdx]?.trim().toUpperCase() ?? '',
      text: fields[textIdx]?.trim() ?? '',
      url: urlIdx !== -1 ? fields[urlIdx]?.trim() || undefined : undefined,
      publishedAt: fields[publishedAtIdx]?.trim() ?? '',
      source,
    };
  });
}
