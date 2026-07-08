import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { findMatches } from './functions/find-matches/resource';
import { acceptMatchRequest } from './functions/accept-match-request/resource';

defineBackend({
  auth,
  data,
  findMatches,
  acceptMatchRequest,
});
