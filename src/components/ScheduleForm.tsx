import { useState, type FormEvent } from 'react';
import type { MatchRequestRecord, MeetingMode } from '../lib/matchTypes';

interface ScheduleFormProps {
  request: MatchRequestRecord;
  myUserId: string;
  onPropose: (meetingMode: MeetingMode, time: string, locationOrLink: string) => Promise<void>;
  onConfirm: () => Promise<void>;
}

function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ScheduleForm({ request, myUserId, onPropose, onConfirm }: ScheduleFormProps) {
  const hasProposal = Boolean(request.proposedTime);
  const proposedByMe = request.proposedBy === myUserId;
  const [editing, setEditing] = useState(!hasProposal);
  const [meetingMode, setMeetingMode] = useState<MeetingMode>(request.meetingMode ?? 'VIRTUAL');
  const [time, setTime] = useState(request.proposedTime ? toLocalInputValue(request.proposedTime) : '');
  const [locationOrLink, setLocationOrLink] = useState(request.proposedLocationOrLink ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePropose(e: FormEvent) {
    e.preventDefault();
    if (!time) {
      setError('Pick a date and time.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onPropose(meetingMode, new Date(time).toISOString(), locationOrLink);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to propose a time.');
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirm() {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm.');
    } finally {
      setBusy(false);
    }
  }

  if (!editing && hasProposal && request.proposedTime) {
    return (
      <div className="schedule-box">
        <p>
          <strong>Proposed:</strong> {new Date(request.proposedTime).toLocaleString()} (
          {request.meetingMode === 'IN_PERSON' ? 'In person' : 'Virtual'})
        </p>
        {request.proposedLocationOrLink && <p className="muted">{request.proposedLocationOrLink}</p>}
        {error && <p className="form-error">{error}</p>}
        <div className="button-row">
          {!proposedByMe && (
            <button type="button" onClick={handleConfirm} disabled={busy}>
              {busy ? 'Confirming…' : 'Confirm this time'}
            </button>
          )}
          <button type="button" className="secondary" onClick={() => setEditing(true)} disabled={busy}>
            {proposedByMe ? 'Change proposal' : 'Propose a different time'}
          </button>
        </div>
        {proposedByMe && <p className="muted">Waiting for them to confirm.</p>}
      </div>
    );
  }

  return (
    <form className="schedule-box stacked-form" onSubmit={handlePropose}>
      <label>
        Meeting mode
        <select value={meetingMode} onChange={(e) => setMeetingMode(e.target.value as MeetingMode)}>
          <option value="VIRTUAL">Virtual</option>
          <option value="IN_PERSON">In person</option>
        </select>
      </label>
      <label>
        Date &amp; time
        <input type="datetime-local" value={time} onChange={(e) => setTime(e.target.value)} />
      </label>
      <label>
        {meetingMode === 'IN_PERSON' ? 'Location' : 'Video call link (optional)'}
        <input
          value={locationOrLink}
          onChange={(e) => setLocationOrLink(e.target.value)}
          placeholder={meetingMode === 'IN_PERSON' ? 'e.g. Blue Bottle Coffee, Downtown' : 'e.g. Zoom/Meet link'}
        />
      </label>
      {error && <p className="form-error">{error}</p>}
      <div className="button-row">
        <button type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Propose this time'}
        </button>
        {hasProposal && (
          <button type="button" className="secondary" onClick={() => setEditing(false)} disabled={busy}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
