import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import type { AppSyncIdentityCognito } from 'aws-lambda';
import { env } from '$amplify/env/find-matches';
import type { Schema } from '../../data/resource';
import { scoreMatch, type MatchProfileInput } from './matching/scoreMatch';

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);
const client = generateClient<Schema>();

const MAX_RESULTS = 20;

type ProfileRecord = {
  userId: string;
  displayName: string;
  bio?: string | null;
  industry?: string | null;
  currentRoleTitle?: string | null;
  mentorTopics?: (string | null)[] | null;
  seekingTopics?: (string | null)[] | null;
  meetingPreference: string;
  city?: string | null;
};

function toMatchInput(profile: ProfileRecord): MatchProfileInput {
  return {
    userId: profile.userId,
    displayName: profile.displayName,
    bio: profile.bio,
    industry: profile.industry,
    currentRoleTitle: profile.currentRoleTitle,
    mentorTopics: profile.mentorTopics,
    seekingTopics: profile.seekingTopics,
    meetingPreference: profile.meetingPreference as MatchProfileInput['meetingPreference'],
    city: profile.city,
  };
}

export const handler: Schema['findMatches']['functionHandler'] = async (event) => {
  const identity = event.identity as AppSyncIdentityCognito | undefined;
  const myUserId = identity?.sub;
  if (!myUserId) {
    throw new Error('findMatches requires an authenticated caller');
  }

  const { data: myProfile } = await client.models.UserProfile.get({ userId: myUserId });
  if (!myProfile) {
    return [];
  }

  const [{ data: allProfiles }, { data: sentRequests }, { data: receivedRequests }] = await Promise.all([
    client.models.UserProfile.list(),
    client.models.MatchRequest.matchRequestsByRequesterIdAndCreatedAt({ requesterId: myUserId }),
    client.models.MatchRequest.matchRequestsByRecipientIdAndCreatedAt({ recipientId: myUserId }),
  ]);

  const alreadyContacted = new Set<string>();
  for (const req of [...sentRequests, ...receivedRequests]) {
    alreadyContacted.add(req.requesterId === myUserId ? req.recipientId : req.requesterId);
  }

  const myInput = toMatchInput(myProfile);

  return allProfiles
    .filter((profile) => profile.userId !== myUserId && !alreadyContacted.has(profile.userId))
    .map((profile) => {
      const match = scoreMatch(myInput, toMatchInput(profile));
      if (!match) return null;
      return {
        userId: profile.userId,
        displayName: profile.displayName,
        bio: profile.bio,
        industry: profile.industry,
        currentRoleTitle: profile.currentRoleTitle,
        mentorTopics: profile.mentorTopics,
        seekingTopics: profile.seekingTopics,
        meetingPreference: profile.meetingPreference,
        city: profile.city,
        score: match.score,
        matchReasons: match.reasons,
        matchedTopics: match.matchedTopics,
        direction: match.direction,
      };
    })
    .filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESULTS);
};
