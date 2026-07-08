import { getCurrentUser } from 'aws-amplify/auth';

/** Returns the caller's Cognito sub, used as the UserProfile identifier and MatchRequest participant id. */
export async function getCurrentUserId(): Promise<string> {
  const user = await getCurrentUser();
  return user.userId;
}
