# Gamerie admin console: handoff for the remaining pages

You are finishing the v2 admin console in `frontend-experiment/admin`. Phases 1–5 are built and reviewed. Your job is Phase 6 (Analytics, Referrals, Communications) and Phase 7 (Administrators, Audit log, Settings, QA pass). The owner reviews every page visually, so a new page should be indistinguishable in quality and style from the ones already here.

Read `IMPLEMENTATION_PLAN.md` first, then open the reference pages named below before writing anything. When a pattern already exists, copy it. Do not invent a new one.

## Rules that are not negotiable

1. **Tailwind only.** No `.css` files, no `style={{}}` for styling, no CSS-in-JS. `npm run check:styles` enforces this. New design tokens go in `src/styles/theme.css` and nowhere else.
2. **Icons come only from `<Icon name="…">`** (`src/components/ui/Icon.tsx`, Phosphor). To add an icon, add it to that map.
3. **Never show raw API error text.** Use `getApiErrorMessage(error, "Plain fallback.")` from `src/lib/errors.ts`.
4. **Every sentence must be true.** Before writing copy about what an action does ("both players are told", "it can be restored"), read the backend service and confirm it.
5. **Keep copy minimal.** No eyebrow labels above page titles, and no filler descriptions; add a description only when it tells the admin something they need. Use sentence case and plain words.
6. **Topics to keep out of copy.** Never mention tips, creator subscriptions or a mobile app, and never state a number of connectable games.
7. **Back end:**
   - Never run `npm run migration:run`. It may connect to the production database on Render.
   - Never edit or print `backend-two/.env`, and never echo secrets.
   - Write migrations as files only; the owner runs them by hand.
   - Check SQL with `psql -h localhost -d gamerie -U $USER` only.
8. **No sweeping reformat.** Do not run `npm run format`, `npx prettier --write` or `eslint --fix` across the repo. Format your own lines by hand to match the file (Prettier width 100 in `backend-two`).
9. **Do not commit, push or deploy** unless the owner asks.
10. **Leave port 5181 alone.** The owner's dev server may be running there. Use 5191 for your own checks, and stop only the processes you started.

## Project map

```
src/
  app/App.tsx                 lazy routes, one per page
  app/shell/navigation.ts     sidebar groups; items with `phase` render PendingPage
  app/shell/crumb.ts          useBreadcrumb(label) names a record page in the top bar
  components/ui/              the kit: Button, Dialog, Field, OptionCards, ChoiceChips, Combobox, TagInput, FileDrop, Segmented, FilterMenu, Notice, StatePanel, Skeleton, Avatar…
  components/data/            DataTable, SegmentStrip, SearchField, TableFooter, RefreshButton
  components/layout/          PageHeader (title, description, refresh, actions), Panel
  components/record/          DossierHeader, Facts, Stamp, ReasonDialog, ActivityFeed, RichText, BackLink
  features/<name>/            types.ts, api.ts, hooks.ts, <Name>Page.tsx, components/
  lib/                        api (axios + unwrap), errors, format, time, toast, csv, richText, useQueryState, useDebouncedValue, useDocumentTitle, paths
mock-api/                     local mock of the admin API for visual checks (port 8799)
```

Back end: `backend-two/src/modules/admin`: `admin.controller.ts`, `services/`, `dto/`, `types/`. The old admin to port from is `frontend-revamp/admin/src/features/` (hand-written CSS, so take only its behaviour, never its markup).

## How each kind of page is built

### Lists
Reference: `features/ladders/LaddersPage.tsx` and `features/challenges/ChallengesPage.tsx`.
- Page root: `<div className="grid grid-cols-[minmax(0,1fr)] gap-6">`.
- `PageHeader` with `refresh={[["admin", "<feature>"]]}`, and primary actions in `actions` (`size="sm"`).
- Keep URL state in `useQueryState(DEFAULTS)`. Changing any key resets `page` unless the patch sets `page` itself.
- `SegmentStrip` for headline counts. It needs a summary endpoint; add one in the back end if none exists (see `games/summary`, `challenges/summary`).
- Filter row: `SearchField` (`w-full sm:w-72`), `FilterMenu`, `Segmented`.
- `DataTable`:
  - Pass `rowHref` for rows that open a page, or `onRowClick` for rows that open a dialog.
  - The first cell is a `Link` or `button`, so keyboard users can open the row.
  - `minWidth` stops columns from crushing; the table scrolls inside itself.
  - Always pass an `empty` state, plus `error` and `onRetry`.
- `TableFooter` only when `total > limit`.
- A card grid instead of a table: `features/games/GamesPage.tsx`.

### Records and editors
Reference: `features/games/GameEditorPage.tsx`, `features/challenges/ChallengePage.tsx`, and for entity dossiers `features/ladders/LadderPage.tsx`.
- Call `useBreadcrumb(name)` and `useDocumentTitle(name)`. Use `BackLink` **only** on the error state.
- Layout: `grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start`, with `Panel` sections.
- **Save bar:**
  - Sticky at `bottom-4`.
  - Appears **only when something changed**, with Discard and Save.
  - On a create page it is always visible.
- **Saving:**
  - Send only the changed fields; the audit log names them.
  - Key the editor on the record's `updatedAt`, not React Query's `dataUpdatedAt`, so a background refetch doesn't wipe unsaved edits.

### Dialogs and actions
- Any action the audit log records goes through `ReasonDialog` (`components/record/ReasonDialog.tsx`):
  - The reason must be at least 5 characters.
  - Use `askReason={false}` when the API takes no reason.
  - Put extra fields in `children`, and set `size` when it holds a form.
- Raw `Dialog` sizes: `sm` (24rem) for a yes/no question, `md` (32rem) for a reason or a field or two, `lg` (40rem) for a short form, `xl` for a workspace. On phones it becomes a bottom sheet and the footer buttons share the width.
- Never use `window.confirm` or `alert`.
- After a mutation:
  - Call `toast.success(...)` or `toast.info(...)` from `lib/toast`.
  - Invalidate the feature root, plus `["admin", "queue"]` or `["admin", "overview"]` if those counts change.

### Forms
- **Fields:** `TextField`, `TextAreaField` (with `maxLength` it shows a counter).
- **Choices:**
  - `ChoiceGroup` with `ChoiceChip` for short choices; pass `multiple` for a multi-select.
  - `OptionCards` for 2–3 choices that need a line of explanation each.
- **Pickers:**
  - `Combobox` for remote search.
  - `features/people/components/EntityPicker` for a player or team.
  - `features/games/GamePicker` for a game.
- `TagInput` for free lists, and `FileDrop` (`shape="cover"` or `"banner"`) for images.
- Date and time: `TextField type="datetime-local"`. Converters live in `features/challenges/labels.ts` (`toLocalInput`, `fromLocalInput`); move them to `lib/time.ts` once a second feature needs them.
- Validate on submit, and show errors on the field (`error` prop). Inside forms and dialogs, show API failures in a `Notice tone="danger"`.
- Multipart uploads: pass a `FormData`. `lib/api.ts` already sets the right content type.

### Look and feel
- The owner wants it "premium, clean, calm, not AI-looking". Use existing tokens only (`ink-*`, `mist-*`, `lavender-*`, `signal`, `danger`, `rounded-card`, `type-display`, `type-label`). No new gradients, glows or colours.
- Use `Stamp` for status marks, `figure()` for counts, `formatDate`, `formatDateTime` and `timeAgo` for dates, `describeAction()` for audit actions, and `statusLabel()` for snake_case states.
- Charts use `recharts` and copy `features/overview/components/GrowthChart.tsx` and `MatchesChart.tsx` (palette `#b9b1c6`, `#c6a3ff`, `#8967bd`, `#6b46a8`, plus the same axes, grid and tooltip styling).
- `Avatar` takes `size` and `shape` props; `className` only reaches its wrapper.
- Any single-column grid needs `grid-cols-[minmax(0,1fr)]`, or long content overflows on phones.
- Post and announcement text renders through `components/record/RichText` (`lib/richText`).

### Wiring a page in
1. Add the lazy route in `src/app/App.tsx` the way the others are added.
2. Remove `phase: 6` or `phase: 7` from its item in `src/app/shell/navigation.ts`. Administrators keeps `superAdmin: true`.
3. Use the feature root `["admin", "<feature>"]` for every query key.

## The remaining pages

Before each page:
- Read the old admin feature folder named here, for behaviour and response shapes.
- Read the backend service, for what each action really does.
- Add any missing back end first: a DTO, a service with tests, and the route.

### Phase 6: Growth

**Analytics** at `/analytics` (shortcut `a`). Old: `frontend-revamp/admin/src/features/analytics`.
- Endpoints:
  - `GET /admin/post-analytics?filter=24h|7d|30d|90d` (`modules/analytics`, `getPostAnalyticsDashboardData`).
  - `GET /admin/retention-analytics?filter=…` (`services/admin-retention-analytics.service.ts`).
  - Also available: `user-growth`, `platform-stats`, `engagement-data` and `dashboard-metrics`.
- The Overview already shows headline growth and matches. Analytics goes deeper, so don't repeat the Overview.
- Keep the period in the URL with a `Segmented` control. Name the period on every figure. Show only measured numbers; never estimate or extrapolate.

**Referrals** at `/referrals`. Old: `features/finance` (FinanceGrowthPage).
- Endpoints:
  - `GET /admin/growth/referrals?status=active|inactive|expired&search&page&limit`
  - `POST /admin/growth/referrals { code, source, expiresAt?, reason }`. The code is uppercased; it allows A–Z, 0–9, `_` and `-`, at 3–50 characters.
  - `GET /admin/growth/referrals/:id/signups`
  - `PATCH /admin/growth/referrals/:id/status { status: active|inactive, reason }`
  - `PATCH /admin/growth/referral-signups/:id/payment { paid, reason }`
  - `DELETE /admin/growth/referrals/:id { reason }`
- Layout: a list with status segments, plus a record (page or desk) per code showing its sign-ups and the paid toggle.
- The Users list "Came from" column already names codes; link them up if that's cheap.

**Communications** at `/communications`. Old: `features/communications`.
- Endpoints:
  - `GET /admin/posts?cursor&limit`. The old admin listed announcement history with it; check what it actually returns before you rely on it.
  - `POST /admin/announcements { content (≤5000), reason }`
  - `POST /admin/brevo/resync { dryRun, reason, confirmation? }`
- Layout: a composer with a live `RichText` preview, plus the history.
- Brevo re-sync is a guarded panel:
  - Dry run first, and show the receipt it returns.
  - A live run needs `confirmation` to be exactly `CONFIRM CRM SYNC`, so make the admin type it.

### Phase 7: System

**Administrators** at `/administrators`. Super admins only: the sidebar hides it, but the page must also show a `StatePanel` to anyone else. Old: `features/operators`.
- Endpoints:
  - `GET /admin/operators`
  - `GET /admin/operator-invites`
  - `POST /admin/operators/invite { email }`
  - `POST /admin/operator-invites/:id/resend`
  - `DELETE /admin/operator-invites/:id`
  - `PATCH /admin/operators/:id { status: active|suspended, reason }`
  - `DELETE /admin/operators/:id { reason }`
- The protected super admin (`isProtected`) can't be suspended or removed.

**Audit log** at `/audit`. Old: `features/audit`.
- Endpoint: `GET /admin/audit-logs?page&limit&search&actorId&action&targetType&targetId&from&to`.
  - It already filters by entity (`targetType` + `targetId`), so the plan's `?entity=` item needs no new endpoint; mark it covered.
  - Read `services/admin-audit-query.service.ts` for the row shape (actor, before/after).
- Layout:
  - A filterable table.
  - A row opens a detail view with the reason and a readable before/after comparison.
  - Link targets with `entityPath` (`lib/paths.ts`) where the kind is known.
  - CSV export like `features/users/UsersPage.tsx`.

**Settings** at `/settings`. There is no backend for it and no old page.
- Build only from what exists: the signed-in admin from `/admin/session`, sign out, the keyboard shortcuts (the `key` values in `navigation.ts` plus ⌘K) and the environment (`lib/env.ts`).
- Ask the owner before adding any back-end setting.

**QA pass.** Go through every page from Phase 1 to Phase 7:
- 1440px and 390px wide, with no horizontal page scroll.
- Loading, empty and error states.
- Keyboard focus visible and Escape closing dialogs.
- No raw API text anywhere.
- Copy read against the rules above.

Fix what you find. Deploying (`vercel.json`) is the owner's call; hand back instead.

## Checking your work

```bash
cd frontend-experiment/admin
node mock-api/server.mjs                                              # mock API on 8799
VITE_API_PROXY_TARGET=http://localhost:8799 npx vite --port 5191 --strictPort
# sign in with any email and password
```

- The mock covers Phases 1–5 (`mock-api/*.mjs`, one module per area, wired in `server.mjs` like `catalog.mjs`). Add a module for each new area, with response shapes copied from the real services.
- Run `npm run build` (style check, `tsc`, Vite build) and fix everything it reports.
- For back-end changes, run these from `backend-two`:
  - `npx tsc --noEmit -p tsconfig.json`
  - `npx jest src/modules/admin`, then `npx jest` for the full suite (141 suites passed at handoff)
  - `npx eslint <changed files>`
- SQL goes against the local database through psql only.
- Migrations: add a file in `backend-two/src/common/database/migrations`, named like `202611240001-AllowOrganiserRecordedMatches.ts`. List each one in your report so the owner can run it by hand.

## When a phase is finished
- In `IMPLEMENTATION_PLAN.md`, mark the phase Done and the next one Next, and add any new endpoints to the "Backend additions" table.
- Report back:
  - what you built
  - what changed in the back end
  - migrations waiting to be run
  - anything you could not verify, and why

## Open items you inherit
- Migration `202611240001-AllowOrganiserRecordedMatches` has been applied locally but not in production. Until it runs there, recording an organiser result fails in production.
- The new Phase 5 endpoints (games, challenges and organiser-results routes) need a backend restart wherever the API is running.
