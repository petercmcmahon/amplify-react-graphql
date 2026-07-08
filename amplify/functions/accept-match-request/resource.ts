import { defineFunction, secret } from '@aws-amplify/backend';

export const acceptMatchRequest = defineFunction({
  name: 'accept-match-request',
  entry: './handler.ts',
  environment: {
    ANTHROPIC_API_KEY: secret('ANTHROPIC_API_KEY'),
  },
});
