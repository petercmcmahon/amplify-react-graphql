import { describe, expect, it } from 'vitest';
import { scoreMatch, type MatchProfileInput } from './scoreMatch';

function profile(overrides: Partial<MatchProfileInput> = {}): MatchProfileInput {
  return {
    userId: 'u1',
    displayName: 'Test User',
    mentorTopics: [],
    seekingTopics: [],
    meetingPreference: 'EITHER',
    ...overrides,
  };
}

describe('scoreMatch', () => {
  it('returns null when there is no topic overlap in either direction', () => {
    const me = profile({ seekingTopics: ['React'] });
    const candidate = profile({ mentorTopics: ['Cooking'] });
    expect(scoreMatch(me, candidate)).toBeNull();
  });

  it('matches when the candidate can mentor me', () => {
    const me = profile({ seekingTopics: ['React', 'Career growth'] });
    const candidate = profile({ mentorTopics: ['React', 'Leadership'] });

    const result = scoreMatch(me, candidate);
    expect(result?.direction).toBe('THEY_MENTOR_YOU');
    expect(result?.matchedTopics).toEqual(['React']);
    expect(result?.score).toBe(10 + 3); // topic overlap + compatible meeting pref (both default to EITHER)
    expect(result?.reasons).toContain('They can mentor you in: React');
  });

  it('matches when I can mentor the candidate', () => {
    const me = profile({ mentorTopics: ['Product management'] });
    const candidate = profile({ seekingTopics: ['Product management'] });

    const result = scoreMatch(me, candidate);
    expect(result?.direction).toBe('YOU_MENTOR_THEM');
    expect(result?.reasons).toContain('You can mentor them in: Product management');
  });

  it('marks direction BOTH when mentorship flows both ways', () => {
    const me = profile({ seekingTopics: ['React'], mentorTopics: ['Public speaking'] });
    const candidate = profile({ mentorTopics: ['React'], seekingTopics: ['Public speaking'] });

    const result = scoreMatch(me, candidate);
    expect(result?.direction).toBe('BOTH');
    expect(result?.score).toBe(20 + 3); // topic overlap + compatible meeting pref (both default to EITHER)
  });

  it('is case-insensitive when matching topics', () => {
    const me = profile({ seekingTopics: ['react'] });
    const candidate = profile({ mentorTopics: ['React'] });

    const result = scoreMatch(me, candidate);
    expect(result?.matchedTopics).toEqual(['react']);
  });

  it('adds an industry bonus when both share an industry', () => {
    const me = profile({ seekingTopics: ['React'], industry: 'Tech' });
    const candidate = profile({ mentorTopics: ['React'], industry: 'tech' });

    const result = scoreMatch(me, candidate);
    expect(result?.score).toBe(10 + 5 + 3); // topic + industry + compatible meeting pref (both EITHER)
    expect(result?.reasons).toContain('Both work in Tech');
  });

  it('adds a bigger bonus for same-city in-person matches than a generic meeting-pref bonus', () => {
    const me = profile({ seekingTopics: ['React'], meetingPreference: 'IN_PERSON', city: 'Seattle' });
    const candidate = profile({ mentorTopics: ['React'], meetingPreference: 'IN_PERSON', city: 'Seattle' });

    const result = scoreMatch(me, candidate);
    expect(result?.score).toBe(10 + 8);
    expect(result?.reasons).toContain('Both based in Seattle');
  });

  it('does not add a meeting bonus when preferences are incompatible', () => {
    const me = profile({ seekingTopics: ['React'], meetingPreference: 'VIRTUAL' });
    const candidate = profile({ mentorTopics: ['React'], meetingPreference: 'IN_PERSON' });

    const result = scoreMatch(me, candidate);
    expect(result?.score).toBe(10);
    expect(result?.reasons).not.toContain('Compatible meeting preferences');
  });
});
