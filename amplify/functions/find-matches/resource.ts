import { defineFunction } from '@aws-amplify/backend';

export const findMatches = defineFunction({
  name: 'find-matches',
  entry: './handler.ts',
});
