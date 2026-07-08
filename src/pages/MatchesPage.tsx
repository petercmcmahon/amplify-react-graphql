import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { client } from '../lib/dataClient';
import { getCurrentUserId } from '../lib/currentUser';
import { MatchCandidateCard } from '../components/MatchCandidateCard';
import type { MatchCandidate, MeetingMode } from '../lib/matchTypes';

export function MatchesPage() {
  const [candidates, setCandidates] = useState<MatchCandidate[] | null>(null);
  const [hasProfile, setHasProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const userId = await getCurrentUserId();
        const { data: profile } = await client.models.UserProfile.get({ userId });
        if (cancelled) return;
        if (!profile) {
          setHasProfile(false);
          setCandidates([]);
          return;
        }
        const { data, errors } = await client.queries.findMatches();
        if (cancelled) return;
        if (errors && errors.length > 0) {
          setError(errors[0].message);
        } else {
          setCandidates((data ?? []).filter((c): c is MatchCandidate => c !== null));
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load matches.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleRequest(candidate: MatchCandidate, message: string, meetingMode: MeetingMode) {
    const myUserId = await getCurrentUserId();
    const { errors } = await client.models.MatchRequest.create({
      requesterId: myUserId,
      recipientId: candidate.userId,
      participants: [myUserId, candidate.userId],
      status: 'PENDING',
      requestedAt: new Date().toISOString(),
      matchedTopics: candidate.matchedTopics,
      message,
      meetingMode,
    });
    if (errors && errors.length > 0) {
      throw new Error(errors[0].message);
    }
    setCandidates((prev) => (prev ? prev.filter((c) => c.userId !== candidate.userId) : prev));
  }

  if (!hasProfile) {
    return (
      <div>
        <h2>Find a mentorship match</h2>
        <p className="page-intro">
          You need a profile before we can find matches for you. <Link to="/profile">Create your profile</Link>.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2>Find a mentorship match</h2>
      {error && <p className="form-error">{error}</p>}
      {candidates === null && <p>Finding matches…</p>}
      {candidates !== null && candidates.length === 0 && !error && (
        <p className="page-intro">
          No new matches right now. Try adding more topics to{' '}
          <Link to="/profile">your profile</Link>, or check back later as more people join.
        </p>
      )}
      <div className="card-grid">
        {candidates?.map((candidate) => (
          <MatchCandidateCard key={candidate.userId} candidate={candidate} onRequest={handleRequest} />
        ))}
      </div>
    </div>
  );
}
