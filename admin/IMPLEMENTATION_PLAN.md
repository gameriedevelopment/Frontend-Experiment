# Gamerie Admin (v2)

The operator console for Gamerie, rebuilt beside the v2 website and app. It replaces `frontend-revamp/admin` (16 pages, ~17k lines of hand-written CSS) with a Tailwind-only, feature-based app that shares the v2 design language but is tuned for dense, daily operational work.

## Principles

- **Calm by default.** No eyebrow labels or filler copy: the breadcrumb says where you are, titles say what the page is, and descriptions appear only when they add something.
- **The queue comes first.** Admins open the console to act, not to browse. Everything that needs a decision (reports, disputes, flagged content) is counted in one work queue, badged in the sidebar and listed on the Overview.
- **Every entity has an address.** Users, teams, hubs, tournaments, ladders and leagues get their own URL (`/users/:id`). Drawers are for a quick look; pages are for work and can be shared in a chat.
- **Destructive actions leave a receipt.** Bans, removals, corrections and deletions ask for a reason, show what will happen, and land in the audit log with the operator's name.
- **You always know where you are.** An environment ribbon shows when the console points at production, so nobody tests against live data by mistake.
- **Fast by keyboard.** `⌘K` searches everything and runs actions; `g` then a letter jumps between sections.

## Stack and rules

- Vite, React 18, TypeScript, React Router 7, TanStack Query 5. **Tailwind v4 for all styling.** `src/styles/theme.css` holds tokens only, and `npm run check:styles` fails the build on any other stylesheet.
- Phosphor icons only, through `<Icon>`. `motion` (`m.*` with LazyMotion) for UI motion.
- `@tanstack/react-table` for data tables, `recharts` for charts, `cmdk` for the command palette.
- Feature folders: `src/features/<area>/{api.ts, hooks.ts, types.ts, components/, pages}`. Shared UI in `src/components/ui`, app chrome in `src/app/shell`, helpers in `src/lib`.
- Talks to backend-two at `/api/v1/admin/*` with the `admin_auth_token` cookie, exactly like the current admin, so both can run side by side during the switch.
- Errors are always the screen's own wording (`getApiErrorMessage`), never raw API text.

## Design system

Shared with the v2 app (`frontend-experiment/app/src/styles/theme.css`), plus density for operators.

| Role | Value |
| --- | --- |
| Page titles | Archivo, `type-display`, `text-display-sm`, one per page |
| Body and tables | Archivo at 14px, `tabular-nums` for every figure |
| Labels, IDs, timestamps | Geist Mono (`type-label`, `font-mono`) |
| Stage | `ink-950` page, `ink-900` panels, `ink-850` rows on hover |
| Brand | `lavender-400` for focus, selection and the active nav item |
| Signal | `signal` lime only for live and healthy states |
| Danger | `danger` for destructive actions and breached thresholds |
| Radii | `rounded-tile` for controls, `rounded-card` for panels |

Signature pieces: a mono ticker of live platform figures on the Overview, case-file "dossier" pages for people with status stamps (Banned, Verified, Admin), and queue counts that tick down as work is done.

## Information architecture

| Group | Pages |
| --- | --- |
| Operate | Overview, Work queue |
| People | Users (+ dossier), Teams, Hubs |
| Competition | Tournaments, Ladders, Leagues, Challenges, Disputes desk |
| Trust & safety | Reports, Flagged content, Restrictions (bans, creator locks, organizer restrictions) |
| Catalog | Games, Achievements |
| Growth | Analytics, Referrals, Communications |
| System | Administrators, Audit log, Settings |

What changes from the current admin:

1. **Disputes desk.** Tournament reports, ladder disputes and league disputes are one list with one decision flow, instead of three tabs on three pages.
2. **Restrictions center.** Account bans, ladder and league creator locks, and tournament organizer restrictions live together, with expiry and who set them.
3. **User dossier.** One page per user with profile, teams, hubs, competitions, reports filed and received, GP history and every admin action taken on them.
4. **Achievements.** The backend already has endpoints; the old admin never had a screen.
5. **Saved views and export.** Tables keep filters in the URL, remember column choices, and export CSV.

## Backend additions

| Phase | Endpoint | Purpose |
| --- | --- | --- |
| 1 | `GET /admin/queue` | Counts and oldest item for each queue (reports, tournament reports, ladder and league disputes) |
| 2 | `GET /admin/search?q=` | One search across users, teams, hubs, tournaments, ladders and leagues for `⌘K` |
| 2 | `GET /admin/users/:id/overview`, `/teams/:id/overview`, `/hubs/:id/overview` | Each dossier in one call |
| 2 | `GET /admin/people/summary` | Segment counts for the user, team and hub directories |
| 3 | `GET /admin/competitions/summary` | Status counts for the three competition directories (disputes are merged in the console from the three existing queues) |
| 4 | `GET /admin/reports?scope=community&order=oldest` | Community reports without tournament disputes, oldest first (restrictions are merged in the console from their five sources) |
| 4 | `GET /admin/competitions/matches-by-week` | Matches played per week for the Overview chart |
| 5 | `GET /admin/games/summary`, `GET /admin/games/:id` | Catalog counts with the integration keys and verification adapters a game can use, and one game for its editor |
| 5 | `GET /admin/challenges/summary`, `GET /admin/challenges/:id` | Status counts and one challenge. The list now holds player challenges only; competition matches stay on their competition |
| 5 | `GET /admin/organiser-results` | Results recorded from outside events, newest first |
| 5 | Migration `202611240001-AllowOrganiserRecordedMatches` | The source check never allowed `organiser`, so every organiser result was rejected |
| 6 | `GET /admin/post-analytics?filter=` | Adds publishing, reaction and comment counts by hour or day for the selected period |
| 6 | `GET /admin/growth/referrals/summary`, `GET /admin/growth/referrals/:id` | Referral status counts and the sign-up and payment totals for one code |
| 6 | `GET /admin/announcements?cursor&limit` | Cursor-paginated history of posts published through the audited announcement action |
| 7 | Existing `GET /admin/audit-logs?targetType=&targetId=` | Filters to one entity and applies pagination to the joined results |
| 7 | Existing `/admin/operators` and `/admin/operator-invites` routes | Stable list ordering and corrected invitation expiry handling |

## Build phases

Each phase ships working pages end to end (backend, data layer, UI, checks) before the next starts.

| Phase | Pages | Status |
| --- | --- | --- |
| 1. Foundation | Project, design system, shell, sign-in, accept invite, `⌘K` navigation, Overview with work queue | Done |
| 2. People | Users + dossier, Teams + dossier, Hubs + dossier, global search | Done |
| 3. Competition | Tournaments, Ladders, Leagues (directories + control pages), Disputes desk | Done |
| 4. Trust & safety | Reports desk, Flagged content, Restrictions (bans, creator locks, hosting) | Done |
| 5. Catalog & matches | Games, Achievements, Challenges and organizer results | Done |
| 6. Growth | Analytics, Referrals, Communications | Done |
| 7. System | Administrators, Audit log, Settings, full-console QA | Done |

Phase 6 was checked against the mock API at 1440px and 390px. It adds no database migrations.
The admin and API accept referral codes up to 50 characters. The player registration forms currently cap codes at 32 characters.

Phase 7 passed 164 checks across 37 views against the mock API at 1440px and 390px, including loading, empty and error states where applicable. Mock checks also covered protected administrator access, invitation and access changes, audit filters and CSV export, and keyboard focus and Escape in dialogs. The frontend build and all 673 backend tests passed. Phase 7 adds no database migrations. Real invitation delivery and production behaviour still need verification when the owner deploys.

## Running it

```bash
cd frontend-experiment/admin
npm install
npm run dev        # http://localhost:5181, API through the Vite proxy
```

`VITE_API_URL` defaults to `/api/v1`, proxied to `VITE_API_PROXY_TARGET` (default `http://localhost:8000`).
