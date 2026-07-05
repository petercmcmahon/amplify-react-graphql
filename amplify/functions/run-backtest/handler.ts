import type { Handler } from 'aws-lambda';
import Anthropic from '@anthropic-ai/sdk';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/run-backtest';
import type { Schema } from '../../data/resource';
import { fetchPricesWithFallback } from '../fetch-prices/priceSources';
import { ingestHeadlinesCore } from '../ingest-headlines/ingestHeadlinesCore';
import { scoreSentimentCore } from '../score-sentiment/scoreSentimentCore';
import { runBacktest as runBacktestEngine } from './engine/engine';
import type { PriceBar, ScoredHeadline } from './engine/types';

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);
const client = generateClient<Schema>();
const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

export interface RunBacktestInput {
  configId: string;
}

export interface RunBacktestOutput {
  resultId: string;
  status: string;
}

export const handler: Handler<RunBacktestInput, RunBacktestOutput> = async (event) => {
  const { data: config } = await client.models.BacktestConfig.get({ id: event.configId });
  if (!config) {
    throw new Error(`BacktestConfig not found: ${event.configId}`);
  }

  const { data: result } = await client.models.BacktestResult.create({
    configId: config.id,
    status: 'RUNNING',
  });
  if (!result) {
    throw new Error('Failed to create BacktestResult');
  }

  try {
    if (config.endDate < config.startDate) {
      throw new Error(`endDate (${config.endDate}) is before startDate (${config.startDate})`);
    }
    if (config.tickers.length === 0) {
      throw new Error('At least one ticker is required');
    }

    const prices: Record<string, PriceBar[]> = {};
    for (const ticker of config.tickers) {
      prices[ticker] = await fetchPricesWithFallback({
        ticker,
        startDate: config.startDate,
        endDate: config.endDate,
      });
    }

    await ingestHeadlinesCore(client, {
      tickers: [...config.tickers],
      startDate: config.startDate,
      endDate: config.endDate,
      adapter: config.newsSourceAdapter ?? 'seed-csv',
    });

    await scoreSentimentCore(client, anthropic, {
      tickers: [...config.tickers],
      startDate: config.startDate,
      endDate: config.endDate,
    });

    const sentimentEvents: Record<string, ScoredHeadline[]> = {};
    for (const ticker of config.tickers) {
      const { data: headlines } = await client.models.Headline.list({
        filter: {
          ticker: { eq: ticker },
          publishedAt: { ge: config.startDate, le: config.endDate },
        },
      });
      sentimentEvents[ticker] = headlines
        .filter((h) => h.sentimentScore != null && h.relevanceScore != null)
        .map((h) => ({
          headlineHash: h.headlineHash,
          publishedAt: h.publishedAt,
          sentimentScore: h.sentimentScore as number,
          relevanceScore: h.relevanceScore as number,
        }));
    }

    const { equityCurve, trades, metrics } = runBacktestEngine({
      prices,
      sentimentEvents,
      params: {
        sentimentBuyThreshold: config.sentimentBuyThreshold,
        relevanceMinThreshold: config.relevanceMinThreshold ?? 0.3,
        positionSizePct: config.positionSizePct,
        holdingPeriodDays: config.holdingPeriodDays,
        stopLossPct: config.stopLossPct ?? undefined,
        takeProfitPct: config.takeProfitPct ?? undefined,
        startingCapital: config.startingCapital ?? 100_000,
      },
    });

    await client.models.BacktestResult.update({
      id: result.id,
      status: 'COMPLETE',
      totalReturnPct: metrics.totalReturnPct,
      sharpeRatio: metrics.sharpeRatio,
      maxDrawdownPct: metrics.maxDrawdownPct,
      winRatePct: metrics.winRatePct,
      totalTrades: metrics.totalTrades,
      equityCurveJson: equityCurve,
      tradeLogJson: trades,
      completedAt: new Date().toISOString(),
    });

    return { resultId: result.id, status: 'COMPLETE' };
  } catch (err) {
    await client.models.BacktestResult.update({
      id: result.id,
      status: 'FAILED',
      errorMessage: err instanceof Error ? err.message : String(err),
      completedAt: new Date().toISOString(),
    });
    return { resultId: result.id, status: 'FAILED' };
  }
};
