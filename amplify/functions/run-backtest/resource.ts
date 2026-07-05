import { defineFunction, secret } from '@aws-amplify/backend';

export const runBacktest = defineFunction({
  name: 'run-backtest',
  entry: './handler.ts',
  timeoutSeconds: 300,
  environment: {
    ANTHROPIC_API_KEY: secret('ANTHROPIC_API_KEY'),
  },
});
