import { useState } from 'react';
import { ScheduleForm } from './ScheduleForm';
import type { MatchRequestRecord, MatchRequestStatus, MeetingMode } from '../lib/matchTypes';

interface RequestCardProps {
  request: MatchRequestRecord;
  myUserId: string;
  otherDisplayName: string;
  onAccept: (request: MatchRequestRecord) => Promise<void>;
  onDecline: (request: MatchRequestRecord) => Promise<void>;
  onPropose: (
    request: MatchRequestRecord,
    meetingMode: MeetingMode,
    time: string,
    locationOrLink: string,
  ) => Promise<void>;
  onConfirm: (request: MatchRequestRecord) => Promise<void>;
  onComplete: (request: MatchRequestRecord) => Promise<void>;
  onCancel: (request: MatchRequestRecord) => Promise<void>;
}

const STATUS_LABEL: Record<MatchRequestStatus, string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted — schedule your chat',
  DECLINED: 'Declined',
  SCHEDULED: 'Scheduled',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export function RequestCard({
  request,
  myUserId,
  otherDisplayName,
  onAccept,
  onDecline,
  onPropose,
  onConfirm,
  onComplete,
  onCancel,
}: RequestCardProps) {
  const isRecipient = request.recipientId === myUserId;
  const icebreakers = (request.icebreakers ?? []).filter((q: string | null): q is string => !!q);
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <h4>{otherDisplayName}</h4>
        <span className="badge">{STATUS_LABEL[request.status]}</span>
      </div>
      {request.message && <p className="muted">&ldquo;{request.message}&rdquo;</p>}
      {request.matchedTopics && request.matchedTopics.length > 0 && (
        <p className="muted">Topics: {request.matchedTopics.filter(Boolean).join(', ')}</p>
      )}

      {request.status === 'PENDING' && isRecipient && (
        <div className="button-row">
          <button type="button" onClick={() => run(() => onAccept(request))} disabled={busy}>
            Accept
          </button>
          <button type="button" className="secondary" onClick={() => run(() => onDecline(request))} disabled={busy}>
            Decline
          </button>
        </div>
      )}
      {request.status === 'PENDING' && !isRecipient && <p className="muted">Waiting for a response…</p>}

      {request.status === 'ACCEPTED' && (
        <>
          {icebreakers.length > 0 && (
            <div className="icebreakers">
              <p>
                <strong>Conversation starters:</strong>
              </p>
              <ul>
                {icebreakers.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </div>
          )}
          <ScheduleForm
            request={request}
            myUserId={myUserId}
            onPropose={(mode, time, loc) => onPropose(request, mode, time, loc)}
            onConfirm={() => onConfirm(request)}
          />
        </>
      )}

      {request.status === 'SCHEDULED' && (
        <>
          <p>
            <strong>{request.confirmedTime ? new Date(request.confirmedTime).toLocaleString() : ''}</strong>{' '}
            ({request.meetingMode === 'IN_PERSON' ? 'In person' : 'Virtual'})
          </p>
          {request.proposedLocationOrLink && <p className="muted">{request.proposedLocationOrLink}</p>}
          <div className="button-row">
            <button type="button" onClick={() => run(() => onComplete(request))} disabled={busy}>
              Mark completed
            </button>
            <button type="button" className="secondary" onClick={() => run(() => onCancel(request))} disabled={busy}>
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
