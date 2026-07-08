import type { Schema } from '../../amplify/data/resource';

export type MeetingPreference = Schema['UserProfile']['type']['meetingPreference'];
export type MatchRequestStatus = Schema['MatchRequest']['type']['status'];
export type MeetingMode = NonNullable<Schema['MatchRequest']['type']['meetingMode']>;
export type MatchCandidate = Schema['MatchCandidate']['type'];
export type MatchRequestRecord = Schema['MatchRequest']['type'];
export type UserProfileRecord = Schema['UserProfile']['type'];
