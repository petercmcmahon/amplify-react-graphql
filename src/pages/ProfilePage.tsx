import { useEffect, useState } from 'react';
import { client } from '../lib/dataClient';
import { getCurrentUserId } from '../lib/currentUser';
import { ProfileForm, type ProfileFormValues } from '../components/ProfileForm';

const EMPTY_VALUES: ProfileFormValues = {
  displayName: '',
  bio: '',
  industry: '',
  currentRoleTitle: '',
  mentorTopics: [],
  seekingTopics: [],
  meetingPreference: 'EITHER',
  city: '',
  availabilityNote: '',
  linkedInUrl: '',
};

export function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState<ProfileFormValues>(EMPTY_VALUES);
  const [exists, setExists] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const userId = await getCurrentUserId();
      const { data: profile } = await client.models.UserProfile.get({ userId });
      if (cancelled) return;
      if (profile) {
        setExists(true);
        setValues({
          displayName: profile.displayName,
          bio: profile.bio ?? '',
          industry: profile.industry ?? '',
          currentRoleTitle: profile.currentRoleTitle ?? '',
          mentorTopics: (profile.mentorTopics ?? []).filter((t: string | null): t is string => !!t),
          seekingTopics: (profile.seekingTopics ?? []).filter((t: string | null): t is string => !!t),
          meetingPreference: profile.meetingPreference,
          city: profile.city ?? '',
          availabilityNote: profile.availabilityNote ?? '',
          linkedInUrl: profile.linkedInUrl ?? '',
        });
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(formValues: ProfileFormValues) {
    const userId = await getCurrentUserId();
    if (exists) {
      await client.models.UserProfile.update({ userId, ...formValues });
    } else {
      await client.models.UserProfile.create({ userId, ...formValues });
      setExists(true);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) return <p>Loading your profile…</p>;

  return (
    <div>
      <h2>Your mentorship profile</h2>
      <p className="page-intro">
        List what you can mentor others in and what you&rsquo;re looking for mentorship in &mdash; fill in either, or
        both.
      </p>
      {saved && <p className="form-success">Profile saved.</p>}
      <ProfileForm initialValues={values} onSubmit={handleSubmit} submitLabel={exists ? 'Save changes' : 'Create profile'} />
    </div>
  );
}
