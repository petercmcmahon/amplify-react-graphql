import { a, defineData, type ClientSchema } from '@aws-amplify/backend';
import { runBacktest } from '../functions/run-backtest/resource';

const schema = a.schema({
  Ticker: a
    .model({
      symbol: a.string().required(),
      name: a.string(),
      sector: a.string(),
      isPreset: a.boolean().default(true),
    })
    .identifier(['symbol'])
    .authorization((allow) => [allow.publicApiKey()]),

  Headline: a
    .model({
      headlineHash: a.string().required(),
      ticker: a.string().required(),
      text: a.string().required(),
      source: a.string(),
      url: a.string(),
      publishedAt: a.datetime().required(),
      sentimentScore: a.float(),
      relevanceScore: a.float(),
      sentimentModel: a.string(),
      scoredAt: a.datetime(),
    })
    .identifier(['headlineHash'])
    .secondaryIndexes((idx) => [idx('ticker').sortKeys(['publishedAt'])])
    .authorization((allow) => [allow.publicApiKey()]),

  BacktestConfig: a
    .model({
      name: a.string(),
      tickers: a.string().array().required(),
      startDate: a.date().required(),
      endDate: a.date().required(),
      sentimentBuyThreshold: a.float().required(),
      relevanceMinThreshold: a.float().default(0.3),
      positionSizePct: a.float().required(),
      holdingPeriodDays: a.integer().required(),
      stopLossPct: a.float(),
      takeProfitPct: a.float(),
      startingCapital: a.float().default(100000),
      newsSourceAdapter: a.string().default('seed-csv'),
      results: a.hasOne('BacktestResult', 'configId'),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  BacktestResult: a
    .model({
      configId: a.id().required(),
      config: a.belongsTo('BacktestConfig', 'configId'),
      status: a.enum(['PENDING', 'RUNNING', 'COMPLETE', 'FAILED']),
      errorMessage: a.string(),
      totalReturnPct: a.float(),
      sharpeRatio: a.float(),
      maxDrawdownPct: a.float(),
      winRatePct: a.float(),
      totalTrades: a.integer(),
      equityCurveJson: a.json(),
      tradeLogJson: a.json(),
      completedAt: a.datetime(),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  runBacktest: a
    .mutation()
    .arguments({ configId: a.id().required() })
    .returns(a.customType({ resultId: a.id(), status: a.string() }))
    .authorization((allow) => [allow.publicApiKey()])
    .handler(a.handler.function(runBacktest)),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: { expiresInDays: 30 },
  },
});
