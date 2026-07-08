import { useCallback, useEffect, useState } from 'react';
import { client } from '../lib/dataClient';
import { getCurrentUserId } from '../lib/currentUser';
import { RequestCard } from '../components/RequestCard';
import type { MatchRequestRecord, MeetingMode } from '../lib/matchTypes';

export function RequestsPage() {
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [incoming, setIncoming] = useState<MatchRequestRecord[]>([]);
  const [outgoing, setOutgoing] = useState<MatchRequestRecord[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const userId = await getCurrentUserId();
    setMyUserId(userId);
    const [{ data: recv }, { data: sent }] = await Promise.all([
      client.models.MatchRequest.listMatchRequestByRecipientIdAndRequestedAt(
        { recipientId: userId },
        { sortDirection: 'DESC' },
      ),
      client.models.MatchRequest.listMatchRequestByRequesterIdAndRequestedAt(
        { requesterId: userId },
        { sortDirection: 'DESC' },
      ),
    ]);
    setIncoming(recv);
    setOutgoing(sent);

    const otherIds = Array.from(
      new Set([...recv.map((r: MatchRequestRecord) => r.requesterId), ...sent.map((r: MatchRequestRecord) => r.recipientId)]),
    );
    const entries = await Promise.all(
      otherIds.map(async (id) => {
        const { data } = await client.models.UserProfile.get({ userId: id });
        return [id, data?.displayName ?? 'Unknown'] as const;
      }),
    );
    setProfiles(Object.fromEntries(entries));
  }, []);

  useEffect(() => {
    refresh()
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load requests.'))
      .finally(() => setLoading(false));
  }, [refresh]);

  async function handleAccept(request: MatchRequestRecord) {
    const { errors } = await client.mutations.acceptMatchRequest({ requestId: request.id });
    if (errors && errors.length > 0) throw new Error(errors[0].message);
    await refresh();
  }

  async function handleDecline(request: MatchRequestRecord) {
    await client.models.MatchRequest.update({ id: request.id, status: 'DECLINED' });
    await refresh();
  }

  async function handlePropose(
    request: MatchRequestRecord,
    meetingMode: MeetingMode,
    time: string,
    locationOrLink: string,
  ) {
    const userId = myUserId ?? (await getCurrentUserId());
    await client.models.MatchRequest.update({
      id: request.id,
      meetingMode,
      proposedTime: time,
      proposedBy: userId,
      proposedLocationOrLink: locationOrLink,
    });
    await refresh();
  }

  async function handleConfirm(request: MatchRequestRecord) {
    await client.models.MatchRequest.update({
      id: request.id,
      status: 'SCHEDULED',
      confirmedTime: request.proposedTime,
    });
    await refresh();
  }

  async function handleComplete(request: MatchRequestRecord) {
    await client.models.MatchRequest.update({ id: request.id, status: 'COMPLETED' });
    await refresh();
  }

  async function handleCancel(request: MatchRequestRecord) {
    await client.models.MatchRequest.update({ id: request.id, status: 'CANCELLED' });
    await refresh();
  }

  if (loading || !myUserId) return <p>Loading your requests…</p>;

  return (
    <div>
      <h2>My requests</h2>
      {error && <p className="form-error">{error}</p>}

      <section>
        <h3>Incoming</h3>
        {incoming.length === 0 && <p className="muted">No incoming requests yet.</p>}
        <div className="card-grid">
          {incoming.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              myUserId={myUserId}
              otherDisplayName={profiles[request.requesterId] ?? '…'}
              onAccept={handleAccept}
              onDecline={handleDecline}
              onPropose={handlePropose}
              onConfirm={handleConfirm}
              onComplete={handleComplete}
              onCancel={handleCancel}
            />
          ))}
        </div>
      </section>

      <section>
        <h3>Outgoing</h3>
        {outgoing.length === 0 && <p className="muted">No outgoing requests yet.</p>}
        <div className="card-grid">
          {outgoing.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              myUserId={myUserId}
              otherDisplayName={profiles[request.recipientId] ?? '…'}
              onAccept={handleAccept}
              onDecline={handleDecline}
              onPropose={handlePropose}
              onConfirm={handleConfirm}
              onComplete={handleComplete}
              onCancel={handleCancel}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
