import { useState } from 'react';
import type { MatchCandidate, MeetingMode } from '../lib/matchTypes';

interface MatchCandidateCardProps {
  candidate: MatchCandidate;
  onRequest: (candidate: MatchCandidate, message: string, meetingMode: MeetingMode) => Promise<void>;
}

const DIRECTION_LABEL: Record<string, string> = {
  THEY_MENTOR_YOU: 'They can mentor you',
  YOU_MENTOR_THEM: 'You can mentor them',
  BOTH: 'Mutual mentorship',
};

export function MatchCandidateCard({ candidate, onRequest }: MatchCandidateCardProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [meetingMode, setMeetingMode] = useState<MeetingMode>(
    candidate.meetingPreference === 'IN_PERSON' ? 'IN_PERSON' : 'VIRTUAL',
  );
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    setSending(true);
    setError(null);
    try {
      await onRequest(candidate, message, meetingMode);
      setSent(true);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send request.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3>{candidate.displayName}</h3>
        <span className="badge">{DIRECTION_LABEL[candidate.direction] ?? candidate.direction}</span>
      </div>
      {candidate.currentRoleTitle && (
        <p className="muted">
          {candidate.currentRoleTitle}
          {candidate.industry ? ` · ${candidate.industry}` : ''}
        </p>
      )}
      {candidate.bio && <p>{candidate.bio}</p>}
      <ul className="reasons">
        {candidate.matchReasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>

      {sent ? (
        <p className="form-success">Request sent!</p>
      ) : open ? (
        <div className="request-form">
          <textarea
            placeholder="Say a bit about why you'd like to connect…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <label>
            Meeting mode
            <select value={meetingMode} onChange={(e) => setMeetingMode(e.target.value as MeetingMode)}>
              <option value="VIRTUAL">Virtual</option>
              <option value="IN_PERSON">In person</option>
            </select>
          </label>
          {error && <p className="form-error">{error}</p>}
          <div className="button-row">
            <button type="button" onClick={handleSend} disabled={sending}>
              {sending ? 'Sending…' : 'Send request'}
            </button>
            <button type="button" className="secondary" onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setOpen(true)}>
          Request a coffee chat
        </button>
      )}
    </div>
  );
}
