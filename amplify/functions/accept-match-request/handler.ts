import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import Anthropic from '@anthropic-ai/sdk';
import type { AppSyncIdentityCognito } from 'aws-lambda';
import { env } from '$amplify/env/accept-match-request';
import type { Schema } from '../../data/resource';
import { generateIcebreakers } from './icebreakers/generateIcebreakers';

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);
const client = generateClient<Schema>();
const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

export const handler: Schema['acceptMatchRequest']['functionHandler'] = async (event) => {
  const identity = event.identity as AppSyncIdentityCognito | undefined;
  const myUserId = identity?.sub;
  if (!myUserId) {
    throw new Error('acceptMatchRequest requires an authenticated caller');
  }

  const { requestId } = event.arguments;
  const { data: request } = await client.models.MatchRequest.get({ id: requestId });
  if (!request) {
    throw new Error(`MatchRequest not found: ${requestId}`);
  }
  if (request.recipientId !== myUserId) {
    throw new Error('Only the recipient can accept a match request');
  }
  if (request.status !== 'PENDING') {
    throw new Error(`Cannot accept a request with status ${request.status}`);
  }

  // Icebreaker generation is best-effort: a Claude failure shouldn't block accepting the request.
  let icebreakers: string[] = [];
  try {
    const [{ data: requester }, { data: recipient }] = await Promise.all([
      client.models.UserProfile.get({ userId: request.requesterId }),
      client.models.UserProfile.get({ userId: request.recipientId }),
    ]);
    if (requester && recipient) {
      icebreakers = await generateIcebreakers(anthropic, {
        requester: {
          displayName: requester.displayName,
          bio: requester.bio,
          currentRoleTitle: requester.currentRoleTitle,
          industry: requester.industry,
        },
        recipient: {
          displayName: recipient.displayName,
          bio: recipient.bio,
          currentRoleTitle: recipient.currentRoleTitle,
          industry: recipient.industry,
        },
        matchedTopics: (request.matchedTopics ?? []).filter((topic): topic is string => !!topic),
      });
    }
  } catch {
    icebreakers = [];
  }

  const { data: updated } = await client.models.MatchRequest.update({
    id: request.id,
    status: 'ACCEPTED',
    icebreakers,
  });

  if (!updated) {
    throw new Error(`Failed to update MatchRequest: ${requestId}`);
  }

  return updated;
};
