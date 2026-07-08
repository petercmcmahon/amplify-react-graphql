export type MeetingPreference = 'VIRTUAL' | 'IN_PERSON' | 'EITHER';
export type MatchDirection = 'THEY_MENTOR_YOU' | 'YOU_MENTOR_THEM' | 'BOTH';

export interface MatchProfileInput {
  userId: string;
  displayName: string;
  bio?: string | null;
  industry?: string | null;
  currentRoleTitle?: string | null;
  mentorTopics?: readonly (string | null)[] | null;
  seekingTopics?: readonly (string | null)[] | null;
  meetingPreference: MeetingPreference;
  city?: string | null;
}

export interface MatchScore {
  score: number;
  reasons: string[];
  direction: MatchDirection;
  matchedTopics: string[];
}

const TOPIC_OVERLAP_WEIGHT = 10;
const INDUSTRY_BONUS = 5;
const MEETING_MODE_BONUS = 3;
const SAME_CITY_BONUS = 8;

function normalizeTopics(topics?: readonly (string | null)[] | null): string[] {
  return (topics ?? []).filter((t): t is string => typeof t === 'string' && t.trim().length > 0);
}

/** Case-insensitive intersection, returned using the casing from `preferred`. */
function overlap(a: string[], b: string[]): string[] {
  const bLower = new Set(b.map((t) => t.toLowerCase()));
  const seen = new Set<string>();
  const result: string[] = [];
  for (const topic of a) {
    const key = topic.toLowerCase();
    if (bLower.has(key) && !seen.has(key)) {
      seen.add(key);
      result.push(topic);
    }
  }
  return result;
}

function meetingModesCompatible(a: MeetingPreference, b: MeetingPreference): boolean {
  if (a === 'EITHER' || b === 'EITHER') return true;
  return a === b;
}

/**
 * Scores how good a mentorship-coffee-chat match `candidate` is for `me`.
 * Returns null when there is no topic overlap in either direction, since a
 * match with nothing to talk about isn't worth surfacing.
 */
export function scoreMatch(me: MatchProfileInput, candidate: MatchProfileInput): MatchScore | null {
  const mySeeking = normalizeTopics(me.seekingTopics);
  const myMentoring = normalizeTopics(me.mentorTopics);
  const theirSeeking = normalizeTopics(candidate.seekingTopics);
  const theirMentoring = normalizeTopics(candidate.mentorTopics);

  const theyMentorYou = overlap(mySeeking, theirMentoring);
  const youMentorThem = overlap(myMentoring, theirSeeking);

  if (theyMentorYou.length === 0 && youMentorThem.length === 0) {
    return null;
  }

  const reasons: string[] = [];
  let score = (theyMentorYou.length + youMentorThem.length) * TOPIC_OVERLAP_WEIGHT;

  if (theyMentorYou.length > 0) {
    reasons.push(`They can mentor you in: ${theyMentorYou.join(', ')}`);
  }
  if (youMentorThem.length > 0) {
    reasons.push(`You can mentor them in: ${youMentorThem.join(', ')}`);
  }

  if (me.industry && candidate.industry && me.industry.toLowerCase() === candidate.industry.toLowerCase()) {
    score += INDUSTRY_BONUS;
    reasons.push(`Both work in ${me.industry}`);
  }

  if (meetingModesCompatible(me.meetingPreference, candidate.meetingPreference)) {
    const sameCity =
      me.city && candidate.city && me.city.trim().toLowerCase() === candidate.city.trim().toLowerCase();
    if (
      sameCity &&
      (me.meetingPreference === 'IN_PERSON' || me.meetingPreference === 'EITHER') &&
      (candidate.meetingPreference === 'IN_PERSON' || candidate.meetingPreference === 'EITHER')
    ) {
      score += SAME_CITY_BONUS;
      reasons.push(`Both based in ${me.city}`);
    } else {
      score += MEETING_MODE_BONUS;
      reasons.push('Compatible meeting preferences');
    }
  }

  const direction: MatchDirection =
    theyMentorYou.length > 0 && youMentorThem.length > 0
      ? 'BOTH'
      : theyMentorYou.length > 0
        ? 'THEY_MENTOR_YOU'
        : 'YOU_MENTOR_THEM';

  const matchedTopics = Array.from(new Set([...theyMentorYou, ...youMentorThem]));

  return { score, reasons, direction, matchedTopics };
}
