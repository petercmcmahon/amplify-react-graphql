import { a, defineData, type ClientSchema } from '@aws-amplify/backend';
import { findMatches } from '../functions/find-matches/resource';
import { acceptMatchRequest } from '../functions/accept-match-request/resource';

const schema = a.schema({
  MeetingPreference: a.enum(['VIRTUAL', 'IN_PERSON', 'EITHER']),
  MatchRequestStatus: a.enum([
    'PENDING',
    'ACCEPTED',
    'DECLINED',
    'SCHEDULED',
    'COMPLETED',
    'CANCELLED',
  ]),
  MatchDirection: a.enum(['THEY_MENTOR_YOU', 'YOU_MENTOR_THEM', 'BOTH']),

  UserProfile: a
    .model({
      userId: a.string().required(),
      displayName: a.string().required(),
      bio: a.string(),
      industry: a.string(),
      currentRoleTitle: a.string(),
      mentorTopics: a.string().array(),
      seekingTopics: a.string().array(),
      meetingPreference: a.ref('MeetingPreference').required(),
      city: a.string(),
      availabilityNote: a.string(),
      linkedInUrl: a.string(),
    })
    .identifier(['userId'])
    .authorization((allow) => [
      allow.ownerDefinedIn('userId').identityClaim('sub'),
      allow.authenticated().to(['read']),
    ]),

  MatchRequest: a
    .model({
      requesterId: a.string().required(),
      recipientId: a.string().required(),
      participants: a.string().array().required(),
      status: a.ref('MatchRequestStatus').required(),
      requestedAt: a.datetime().required(),
      matchedTopics: a.string().array(),
      message: a.string(),
      icebreakers: a.string().array(),
      meetingMode: a.enum(['VIRTUAL', 'IN_PERSON']),
      proposedTime: a.datetime(),
      proposedBy: a.string(),
      proposedLocationOrLink: a.string(),
      confirmedTime: a.datetime(),
    })
    .secondaryIndexes((idx) => [
      idx('recipientId').sortKeys(['requestedAt']),
      idx('requesterId').sortKeys(['requestedAt']),
    ])
    .authorization((allow) => [allow.ownersDefinedIn('participants').identityClaim('sub')]),

  MatchCandidate: a.customType({
    userId: a.string().required(),
    displayName: a.string().required(),
    bio: a.string(),
    industry: a.string(),
    currentRoleTitle: a.string(),
    mentorTopics: a.string().array(),
    seekingTopics: a.string().array(),
    meetingPreference: a.ref('MeetingPreference').required(),
    city: a.string(),
    score: a.float().required(),
    matchReasons: a.string().array().required(),
    matchedTopics: a.string().array().required(),
    direction: a.ref('MatchDirection').required(),
  }),

  findMatches: a
    .query()
    .returns(a.ref('MatchCandidate').array())
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(findMatches)),

  acceptMatchRequest: a
    .mutation()
    .arguments({ requestId: a.id().required() })
    .returns(a.ref('MatchRequest'))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(acceptMatchRequest)),
}).authorization((allow) => [
  // find-matches needs to read every profile/request to compute matches;
  // accept-match-request needs to read both profiles and update the request it's accepting.
  allow.resource(findMatches),
  allow.resource(acceptMatchRequest),
]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
