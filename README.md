# Mentor Coffee — mentorship coffee-chat matching

A React + AWS Amplify (Gen 2) app that matches people for mentorship-focused
coffee chats, in person or virtual. You build a profile listing what you can
mentor others in and what you'd like mentorship in; the app finds people whose
topics complement yours, and you send them a coffee-chat request. Once
accepted, Claude suggests a few tailored conversation starters and you agree
on a time together in the app.

## How it works

1. **Sign in** with email/password (Amplify Cognito, via `@aws-amplify/ui-react`'s `<Authenticator>`).
2. **Build a profile** (`/profile`): what you can mentor others in, what you
   want mentorship in, your industry/role, meeting preference (virtual,
   in-person, or either), city, and availability. Fill in either side, or both.
3. **Find matches** (`/`): a Lambda-backed query scores every other profile
   against yours by topic overlap (in either mentoring direction), industry,
   and meeting-preference/city compatibility, and returns your best matches
   with a plain-language explanation of why each one matched.
4. **Send a request**: pick a meeting mode and add a short note.
5. **Respond to requests** (`/requests`): accept or decline incoming
   requests. Accepting triggers a Lambda that asks Claude for 3 conversation
   starters tailored to both people's profiles and the topics you matched on.
6. **Schedule**: either person proposes a meeting mode, date/time, and a
   location or video-call link; the other confirms (or counter-proposes).

## Architecture

- **`amplify/auth/resource.ts`** — Cognito email/password auth.
- **`amplify/data/resource.ts`** — Amplify Data (AppSync + DynamoDB) schema:
  - `UserProfile` — one per user (keyed by Cognito `sub`), owner-authorized,
    readable by any authenticated user so matching can browse it.
  - `MatchRequest` — the coffee-chat request/lifecycle (`PENDING` →
    `ACCEPTED`/`DECLINED` → `SCHEDULED` → `COMPLETED`/`CANCELLED`), authorized
    via `ownersDefinedIn('participants')` so both requester and recipient can
    read and update it.
  - Custom query **`findMatches`** and custom mutation **`acceptMatchRequest`**,
    each backed by a Lambda. The schema grants both Lambdas resource-level
    access (`allow.resource(...)`) since they need to read across every
    profile/request, not just the caller's own rows.
- **`amplify/functions/find-matches/`**
  - `matching/scoreMatch.ts` — pure, unit-tested scoring function (topic
    overlap in each mentoring direction, industry bonus, meeting-mode/city
    compatibility bonus). No AWS dependencies, so its tests run instantly.
  - `handler.ts` — thin Lambda handler: loads the caller's profile and every
    other profile/request, scores candidates, returns the top 20.
- **`amplify/functions/accept-match-request/`**
  - `icebreakers/generateIcebreakers.ts` — calls the Claude API (forced
    structured tool output, same pattern as scoring functions) for 3 tailored
    conversation starters. Best-effort: a Claude failure still accepts the
    request, just without icebreakers.
  - `handler.ts` — verifies the caller is the recipient of a `PENDING`
    request, generates icebreakers, and marks it `ACCEPTED`.
- **`src/`** — the React frontend: `MatchesPage`, `ProfilePage`, `RequestsPage`
  and their supporting components, talking to the backend only through the
  Amplify Data GraphQL API.

## Getting started

```bash
npm install
npx ampx sandbox secret set ANTHROPIC_API_KEY   # your Anthropic API key
npx ampx sandbox                                 # deploys the backend, generates amplify_outputs.json
npm run dev                                      # in a second terminal
```

Then sign up two test accounts (e.g. with `+tag` email aliases), give each a
profile with complementary `mentorTopics`/`seekingTopics`, and try the full
flow: match → request → accept (icebreakers appear) → propose a time →
confirm from the other account.

## Testing

```bash
npm test        # vitest — unit tests for the match-scoring engine and the icebreaker generator
npm run build   # type-check + production build of the frontend and backend definitions
npm run lint    # oxlint
```

`scoreMatch` and `generateIcebreakers` are pure/mockable functions with no
AWS dependencies, so their tests run instantly and deterministically. The
Lambda handlers and the full sign-up → match → request → schedule flow
require a deployed sandbox (`npx ampx sandbox`) and real AWS credentials to
exercise end-to-end — that step wasn't run in this environment, so treat it
as the next thing to verify locally.
