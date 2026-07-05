import { defineBackend } from '@aws-amplify/backend';
import { data } from './data/resource';
import { runBacktest } from './functions/run-backtest/resource';

defineBackend({
  data,
  runBacktest,
});
