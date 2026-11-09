# HireMind — Recruiter App

The recruitment agency's app: jobs, applicants ranked by AI match score, candidate
comparison, clients, team management, matching criteria and subscriptions. Served on
`recruiter.hiremind.co.in`.

Company registration lives here (`/register/company`), as does `/set-password`, where
provisioned team members land on first sign-in.

## Routes

| Route | Screen |
|---|---|
| `/login` | Sign-in, role fixed to recruiter |
| `/register/company` | Company registration, 3 steps |
| `/set-password` | Forced reset for provisioned team members |
| `/company/dashboard` | Recruiter dashboard, Hiring Overview |
| `/company/jobs` | Jobs, with the create/edit wizard |
| `/company/jobs/[id]/applications` | Applicants, ranked by match score |
| `/company/jobs/[id]/compare` | Compare up to 4 candidates |
| `/company/jobs/[id]/candidates/[candidateId]/match` | Candidate Match Analysis |
| `/company/applications` | Agency-wide applications |
| `/company/candidates` | Candidate pool and bulk résumé parsing |
| `/company/clients` | Client organisations |
| `/company/team` | Team members, roles, permissions |
| `/company/settings`, `/company/settings/matching` | Settings and matching criteria |

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # before every deploy
npx tsc --noEmit
```

With no `.env.local`, the API rewrites fall back to `localhost:5001/5002/5003`, so a
native local backend works with nothing to set. To develop against the deployed backend
instead, create `.env.local`:

```
USERS_API_URL=https://api.hiremind.co.in/user-service
CANDIDATE_API_URL=https://api.hiremind.co.in/candidate-service
COMPANY_API_URL=https://api.hiremind.co.in/company-service
```

> **The rewrites are evaluated at build time.** Changing these needs a dev-server restart
> locally, and a rebuild in Docker — they are build args, not runtime env. Never prefix
> them with `NEXT_PUBLIC_`: that exposes them to the browser and bypasses the proxy that
> exists so there is no CORS anywhere.

## How this app was split out

Split from `hiremind_web`, which keeps the marketing website. Each app is **fully
self-contained** — its own copy of the design system (`app/globals.css`), `components/ui`,
`components/shell`, `lib/` and the parts of `modules/auth` it needs. Nothing is shared at
build time, so each repo clones, installs and deploys on its own.

The cost of that choice is duplication: **a fix to a shared component must be applied in
every app that carries it.** The files below exist in more than one repo and will drift
apart silently if only one copy is changed.

| Shared with | Files |
|---|---|
| **candidate** | **`modules/company/matching/**` — the browser match engine** |
| candidate | `modules/company/jobs/services/**`, `modules/company/jobs/shared/**` |
| admin, candidate, website | `app/globals.css`, `components/ui/**`, `components/shell/**`, `lib/**` |
| candidate, website | `modules/auth/**` |

> ⚠️ **The match engine is the one to watch.** The recruiter's Candidate Match Analysis
> and the candidate's dashboard run the *same* engine — that is what made the two sides
> finally agree on a score, after a spell where the same application read 33% to the
> recruiter and 40% to the candidate. If these two copies drift, that bug comes back
> silently. `npm run test:matching` runs in both repos; keep them both green, and port any
> engine change to both on the same day.

There is no `proxy.ts` and no `lib/hosts.ts` here. Those existed to decide which app a
hostname should serve; this app *is* one app on one hostname, so the audience is settled
by which repo is deployed, not by a `Host` header. The login route is correspondingly
simple — no role picker, no chooser.
