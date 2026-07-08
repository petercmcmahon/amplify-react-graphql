import { useState, type FormEvent } from 'react';
import { TagInput } from './TagInput';
import type { MeetingPreference } from '../lib/matchTypes';

export interface ProfileFormValues {
  displayName: string;
  bio: string;
  industry: string;
  currentRoleTitle: string;
  mentorTopics: string[];
  seekingTopics: string[];
  meetingPreference: MeetingPreference;
  city: string;
  availabilityNote: string;
  linkedInUrl: string;
}

interface ProfileFormProps {
  initialValues: ProfileFormValues;
  onSubmit: (values: ProfileFormValues) => Promise<void>;
  submitLabel?: string;
}

export function ProfileForm({ initialValues, onSubmit, submitLabel = 'Save profile' }: ProfileFormProps) {
  const [values, setValues] = useState(initialValues);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof ProfileFormValues>(key: K, value: ProfileFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!values.displayName.trim()) {
      setError('Display name is required.');
      return;
    }
    if (values.mentorTopics.length === 0 && values.seekingTopics.length === 0) {
      setError('Add at least one topic you can mentor in, or one you want mentorship in.');
      return;
    }
    setSaving(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="stacked-form" onSubmit={handleSubmit}>
      <label>
        Display name
        <input
          value={values.displayName}
          onChange={(e) => set('displayName', e.target.value)}
          placeholder="How others will see you"
        />
      </label>

      <label>
        Bio
        <textarea
          value={values.bio}
          onChange={(e) => set('bio', e.target.value)}
          placeholder="A couple of sentences about you"
        />
      </label>

      <div className="field-row">
        <label>
          Current role / title
          <input
            value={values.currentRoleTitle}
            onChange={(e) => set('currentRoleTitle', e.target.value)}
            placeholder="e.g. Senior Product Designer"
          />
        </label>
        <label>
          Industry
          <input
            value={values.industry}
            onChange={(e) => set('industry', e.target.value)}
            placeholder="e.g. Tech, Healthcare, Nonprofit"
          />
        </label>
      </div>

      <TagInput
        label="I can mentor others in…"
        values={values.mentorTopics}
        onChange={(v) => set('mentorTopics', v)}
        placeholder="Type a topic and press Enter"
      />
      <TagInput
        label="I'm looking for mentorship in…"
        values={values.seekingTopics}
        onChange={(v) => set('seekingTopics', v)}
        placeholder="Type a topic and press Enter"
      />

      <div className="field-row">
        <label>
          Meeting preference
          <select
            value={values.meetingPreference}
            onChange={(e) => set('meetingPreference', e.target.value as MeetingPreference)}
          >
            <option value="EITHER">Either virtual or in person</option>
            <option value="VIRTUAL">Virtual only</option>
            <option value="IN_PERSON">In person only</option>
          </select>
        </label>
        <label>
          City (for in-person matches)
          <input value={values.city} onChange={(e) => set('city', e.target.value)} placeholder="e.g. Seattle" />
        </label>
      </div>

      <label>
        Availability
        <input
          value={values.availabilityNote}
          onChange={(e) => set('availabilityNote', e.target.value)}
          placeholder="e.g. weekday evenings, Friday afternoons"
        />
      </label>

      <label>
        LinkedIn URL (optional)
        <input
          value={values.linkedInUrl}
          onChange={(e) => set('linkedInUrl', e.target.value)}
          placeholder="https://linkedin.com/in/…"
        />
      </label>

      {error && <p className="form-error">{error}</p>}
      <button type="submit" disabled={saving}>
        {saving ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}
