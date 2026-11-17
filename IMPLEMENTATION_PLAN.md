# Gamerie frontend experiment

An experimental public website (and later, app) for Gamerie. The homepage comes first and sets the design system the app will adopt.

## Concept: the board

The Gamerie mark (a circle head over a capsule body) is a player token. The homepage is one continuous, scroll-driven scene where that token is the main character:

1. **Hero**: your token, rendered as a halftone 3D object, stands under the headline.
2. **Identity**: the camera pulls back, the board appears, and linked games orbit the token.
3. **Community**: other players rise from the board, and the best fits link to you.
4. **Teams**: your fits march into formation on a team platform.
5. **Competition**: rivals rise, the match resolves, rivals topple, and your token takes the podium.

A DOM Player Card levels up next to the scene, driven by the same scroll progress, until the result is verified and the player levels up. On mobile, a milestone HUD replaces the card.

## Stack and rules

- Vite, React 18, TypeScript. **Tailwind v4 for all styling, with no hand-written component CSS.** `src/styles/theme.css` holds only tokens, three small utilities and base styles.
- `three` for the board scene (custom halftone shaders, no post-processing), `motion` for UI and scroll-linked motion, and `lenis` for smooth scroll.
- Typed variants with `class-variance-authority`, merged with `cn()` (`tailwind-merge`, extended for the custom text sizes).
- Reduced motion: no smooth scroll, idle animation or intro. The scene still follows scroll position.

## Design system

| Role | Value |
| --- | --- |
| Display | Archivo Variable, 118% width, 800 weight, uppercase (`type-display`) |
| Body | Archivo Variable at normal width |
| Labels / HUD | Geist Mono, uppercase and tracked (`type-label`) |
| Accent | Instrument Serif italic, one phrase per section (`Accent`) |
| Stage | `ink-950` to `ink-600`, near-black violet |
| Brand | `lavender-50` to `lavender-800`; `lavender-400` (#C6A3FF) is the Gamerie neon |
| Light sections | `paper`, `paper-deep` |
| Signal | `signal` (#D4FF5A), only for live, verified and unlock states |
| Radii | `rounded-tile`, `rounded-card`, `rounded-panel` |

Headlines are two-tone: the first line in ink or mist, the second in lavender. On dark backgrounds the second line uses `lavender-400`; on light backgrounds it uses `lavender-700` (#6b46a8, 6:1 contrast on paper).

## Icons

`<Icon name="…" weight="regular | bold | …" />` is the single API, and every icon is [Phosphor](https://phosphoricons.com), including brand logos (Discord, X and so on). The only custom shape is the Gamerie logo mark (`TokenMark`). To add an icon, map a name to a Phosphor `*Icon` export in `components/ui/Icon.tsx`. Don't use Lucide.

## SEO, sharing and analytics

`plugins/site-head.ts` builds the `<head>` and crawler files from env:

| Env | Effect |
| --- | --- |
| `VITE_SITE_URL` | Canonical, share-image and sitemap URLs (default `https://gamerie.gg`) |
| `VITE_SITE_INDEXABLE=true` | Production only. Indexable robots meta, `robots.txt` with sitemap, `sitemap.xml`. Otherwise `noindex` and a disallow-all `robots.txt` |
| `VITE_ENZUZO_ID` | Enzuzo cookie banner and a footer "Cookie settings" control |
| `VITE_GTM_ID`, `VITE_GA_MEASUREMENT_ID` | GTM and GA4, behind Google Consent Mode v2 defaults (denied until consent), same as the live site |

The share image is `public/og-image.png` (1200×630), captured from the real hero.

## Layout

```
website/src/
  app/            App shell, smooth-scroll provider
  config/         Public links (env-overridable)
  lib/            cn(), easing
  styles/         Tailwind theme
  components/ui/  Button, Card, Tag, Icon set, TokenMark, SectionHeader, motion primitives
  components/site/ Header, Footer, Brand
  features/landing/
    board-story/  Sticky story section, overlays, PlayerCard, story timeline/content
      scene/      BoardScene (three.js), materials (GLSL), token rig, choreography
    audiences/ stats/ features/ perks/ faq/ final-call/
    content/      Copy carried over from the live homepage
```

`scene/choreography.ts` is a pure function from scroll progress to poses, camera keys and effects. Tune the story there.

## Run

```sh
cd website
npm ci
npm run dev     # http://localhost:5178
npm run build
```

Codex's previous version is archived at `.backup/codex-v1-website.tar.gz` (git-ignored).

## App

`app/` is a standalone project, like `website/`: Vite, React 18, Tailwind v4, React Router 7, TanStack Query, Zustand, react-hook-form with Zod, motion and Phosphor. It copies the website's tokens and `components/ui` rather than sharing files.

- **Behaviour source:** `frontend-revamp/app`. Its non-UI code is ported unchanged: API client and interceptors, auth store, session handling, route guard, query keys, schemas and route paths. Only the presentation is new.
- **API:** the real backend-two through `VITE_API_URL`, the same as the revamp app (local backend-two on `:8000`).
- **Tailwind only:** `npm run check:styles` runs before every build and fails on any stylesheet other than `src/styles/theme.css`, or any CSS import other than the theme and font packages.

```
app/src/
  app/            App.tsx (routes), shell/ (sidebar, header, profile menu, mobile dock, placeholder)
  components/ui/  Button, Card, Tag, Icon, TokenMark, Field, Notice, Avatar, Loader, PageHeader
  config/ lib/    links, API client, errors, cn
  features/       auth/, home/, profile/, challenges/, tournaments/, ladders/, leaderboard/, feed/ (post
                  primitives), games/ (incl. connections/), plus data-only progression/, calendar/,
                  communities/, discovery/, messages/, notifications/
  styles/         theme.css
```

```sh
cd app
cp .env.example .env   # point VITE_API_URL at backend-two
npm ci
npm run dev            # http://localhost:5179
```

### Status

- **Done:**
  - **Home** (`/home`), where players land after sign-in, sign-up and the root URL. A new player gets a six-step setup (main game, linked game account, photo, follow three players, team, first challenge). Each step shows the GP the backend's live rules award for it, and is marked done from real data. The setup can be hidden, and finished steps fold away. Returning players get "Needs you" (incoming challenges, team and hub invites with accept/decline), "Up next" from their calendar, a level and GP card with a "Ways to earn GP" guide, players to follow, and their teams. Feed stays its own page. Home also has a "Start something" row (challenge, tournament, log a match, team) and an "Open for entry" list of hosted tournaments, and a hidden setup list can be brought back from the level card.
  - **Challenges** (`/challenges`, `/challenges/:id`). The inbox has For you, Team and History tabs, search, and direction/status filters. For you is grouped into Needs you, Coming up and Waiting on others. Each challenge is a ticket with one-tap accept/decline. The detail page shows a versus stage (with the score once played), a Sent → Accepted → Played → Result timeline, the terms, team lineups with a picker, and a "next step" panel. That panel covers accept/decline, submitting the score on a scoreboard, proposing or answering a new time, sending an expired challenge again, cancel/delete, reporting a result, and messaging the opponent. The composer (`?compose=user|team&target=…`) searches opponents and games, suggests your own games, and has a day-and-time picker in your time zone. Behaviour matches the revamp's lifecycle rules.
  - The signed-in layout (collapsible sidebar, header with search and unread counts, profile menu, mobile dock and "More" sheet).
  - Sign-in, three-step sign-up (live password checklist, chips, segmented date-of-birth field), and verify-email.
  - **Profile** (`/profile/:username`): cover and identity header, follow/message/challenge (Following turns into Unfollow on hover, errors are toasts), follower and following counts read from the connections endpoint (the profile payload has no following count), followers and following dialog, completion meter, and URL-backed tabs. The Player Card is pinned beside it on large screens.
    - **Overview:** about, skill endorsements with endorser lists, "Looking for" needs, and your referral link with the players it brought in.
    - **Career:** a level ring with progression, teams, tournament history (self-reported entries you add, edit and remove, plus Gamerie-verified results), and a milestones timeline.
    - **Games:** games played (add, edit, remove) with rankings, and linked game accounts (Steam and Lichess redirect; tag, Riot ID, PUBG and Battle.net through a dialog; unlink). `/steam/connect/callback` and `/lichess/connect/callback` finish the redirect.
    - **Matches:** recorded matches with their source, or challenge history.
    - **Market value** (Career): the estimated monthly benchmark, range with confidence, the factors driving it, recent estimates, and "Raise your value" suggestions that link to the right edit section. Ported from the revamp's salary insights.
    - **Posts:** the player's posts with rich text, media viewer, likes, threaded comments, reposts and share.
    - **Achievements** with reward claiming.
    - **Edit profile** (`?edit=photos|identity|personal|skills|links`): one dialog with sections; photos upload immediately. Setup steps and the completion meter link straight to the right section.
  - **Public Player Card** (`/card/:username`, `/s/:username`) with copy link, share and "Save image" (a 1080×1350 PNG drawn on canvas to match the card).
  - **Leaderboard** (`/leaderboard`): players or teams, a game picker, metric tabs plus tournament points, a podium with a lime first place, ranked rows with your own row highlighted, and pagination.
  - **Ladders** (`/ladders`, `/ladders/:id`, `/ladders/create`, `/ladders/:id/edit`).
    - **Directory:** active, in progress, upcoming, completed and yours, with search and an entry filter.
    - **Ladder page:** a hero with your next action (continue setup, answer an invite, awaiting approval, on the ladder, join), Overview with updates, Standings with challenge buttons (only for opponents your group rules allow) and groups, Matches as fixture cards (avatars, score, lime winner, status and deadlines; respond, report, confirm, dispute), Participants, Rules, and leaving.
    - **Manage:** invite, approve and remove entries; a live per-group tally with Save enabled only after changes; shuffle groups; post updates; readable activity entries.
    - **Hosting wizard:** identity, competition, access and dates, review; the draft saves after each step. Logic (`create/draft.ts`, hooks, utils) is ported unchanged; live updates poll every 20s instead of the socket.
  - **Tournaments "Yours"** view: everything you host or entered, grouped into active and finished.
  - **Feed** (`/feed`): composer (Markdown toolbar, paste or drop images, live link preview, ⌘/Ctrl+Enter), a region prompt that snoozes for a week, For you / Following / Teams tabs in the URL, infinite scroll with an "all caught up" end, and a rail with trending topics and players to follow.
  - **Post page** (`/post/:postId`, `?team=` / `?hub=`): the full post with comments open, exact time, owner performance (views, reach, engagement), the author card, and owner or community-owner removal.
  - **Post card** (shared by Feed, profile Posts and the post page): team and hub posts lead with the community, "Show more" on long posts, link previews, edit post, view tracking at 50% visibility, repost rules from the revamp. Comments can be edited inline and deleting one asks first.
  - **Teams and Hubs** (`/teams`, `/hubs`, `/:kind/create`, `/:kind/:slug`, `/:kind/:slug/edit`). Data layer ported unchanged from the revamp (`features/communities`).
    - **Directory:** invitations to accept or decline, Discover with search and Level/Type/Region filters in the URL, and the teams or hubs you're in with your role.
    - **Page:** a compact hero (banner, logo, level or type, region, privacy, your standing), Team chat / Join / Ask to join / Follow and a menu (edit, challenge, message, copy link, leave, report), and a stats strip. Tabs: Overview (about, team message, games, record, recent posts, details, roster, linked hubs or teams), Roster or Members (searchable), Teams, Competition (game rankings, tournaments, achievements, milestones), Posts (wall with a composer for members and announcements for managers), Followers. Private hubs show a locked view.
    - **Manage:** for teams: people (invite, requests, invited), roster titles and removal, hubs (invitations, ask to join), the wallet (balance, flows, filtered activity, send tokens with an idempotency key), and ownership. For hubs: a dashboard (counts, 14-day growth, referral link and funnel), people, teams, roles, access (visibility and joining), and ownership. Transfer and delete ask for the name, typed.
    - **Form:** one page with sections and a live card preview; validation matches the revamp.
  - **Messages** (`/messages`, `?tab=user|team&conversation=`): realtime over socket.io (`RealtimeBridge` in the shell; Vite proxies `/socket.io`). Direct and team tabs, search, unread badges, a two-pane layout on desktop and a full-screen thread on phones. The thread groups messages, separates days, shows quoted replies, team announcements (leads only) and sending state; reply, edit and delete on hover or tap; older messages on demand; marks read on open. New message searches players or teams (a team you're not on goes to its inbox). Data layer ported unchanged from the revamp.
  - **Messages, realtime:** events update caches in place (no refetch per message), deduped by eventId; a reconnect refetches once. Typing indicators (`typing.started`/`stopped`, throttled) and "Seen" receipts in direct chats. Optimistic sends reconcile with the realtime echo without duplicates.
  - **Emoji:** `components/ui/EmojiButton` opens emoji-mart (lazy chunk, themed to the palette) in the feed composer, message composer and comments.
  - **Notifications** (`/notifications`): filter tabs (all, social, teams, matches, wallet, updates), unread only, grouped by day, type badges, open marks read and follows the link; header bell opens a quick-look popover on sm+. Hub invite and join-request notifications open `HubMembershipDialog` on the hub page.
  - **Search** (`/search?q=&type=`, `?tag=` from hashtags and trending topics): one large field (focused by `/`), tabs Top, Players, Teams, Hubs, Games and Posts. Top shows a few of each with "See all"; the other tabs scroll for more. The URL is the source of truth: typing writes it after a pause, links into search fill the field. Empty state: recent searches (per account, in local storage), trending topics and popular games. Terms under two characters don't search.
  - **Players** (`/users`): cards with follow, filters for game, level, platform and region in the URL; counts only when filtering.
  - **Games** (`/games`, `/games/:gameId?view=`): directory with search, genre and platform filters and a Most played / A–Z sort; stats load per page so "Show more" never refetches earlier cards. The game page has a hero (host a tournament with the game chosen, official site), a stats strip, and tabs: Overview (about, modes and skills, open tournaments, pro schedule preview, top players and teams, a "connect your account" card when the game has a linked provider you haven't connected, official channels), Players and Teams (ranked, searchable, teams by region), and Pro schedule for Counter-Strike 2 and Dota 2.
  - **Settings** (`/settings?section=`): Profile, Privacy, Notifications and Account. A side list on desktop; on phones a list that opens each section (back returns to the list). Profile summarises each part of the profile and opens the profile's own edit dialog, plus a link to games and linked accounts. Privacy (visibility as cards, activity and personal-detail switches) and Notifications (groups, quiet hours with time zone, bundling, daily limit) save only their own slice through an "Unsaved changes" bar that also guards closing the tab. Account: email change by confirmation link, password change (signs out everywhere), phone verification by SMS code with a country picker (`libphonenumber-js`, loaded only when the phone form opens), and sign out. Accounts that sign in with Google, Facebook, Discord or Apple are told their email and password are managed there. `components/ui/TimeZoneField` is shared with the team and hub form.
  - **Matches** (`/matches?page=`): your record (played, wins, losses, win rate), every recorded result newest first with its source, numbered pages, and a detail dialog. **Log a match** (`/matches/log`, `/matches/log/:submissionId`, `?game=` preselects) is a three-step dialog: upload a result screenshot (only games whose catalogue entry has a screenshot reader; others are told which titles qualify), review what Gamerie read (the win or loss is read-only, as the API enforces; changed scores or a named opponent need a note), then record: GP, level progress, streak and a share prompt. An unfinished upload resumes after a reload; retries reuse the idempotency key. Verifiable game pages offer "Log a match".
  - **Calendar** (`/calendar?view=&period=&month=&day=&source=&game=&event=`): agenda (upcoming from the start of today, or past) grouped by day, and a Monday-first month grid with the selected day's events beside it. Times use the time zone from Settings. Filters for source and game. Event detail shows schedule, status, game, team, place and reminder; personal events can be confirmed, marked done or cancelled (with a confirm), and challenge or tournament events link to their source. The composer takes a title, type, start and length, time zone, game, team, place, notes and a reminder, and asks before discarding typed details. Home's "Up next" opens events directly.
  - **Pickers:** Combobox has a `browse` mode, so game and time zone pickers open on click (popular games first; every time zone with the device's first). Menus render in a layer above the page so clipped cards never cut them off. Teams and hubs filter by game, and counts only show while searching or filtering.
  - **Event heroes:** an uploaded banner keeps its own space and fades into the card, so busy images never sit behind the title; generated art stays behind it (`tournaments/components/HeroBanner`, used by tournaments and ladders).
- **Auth is fully native:** `/forgot-password` and `/reset-password` (same password rules as sign-up), `/verify-phone` (the Settings phone flow), `/confirm-email/:token`, `/confirm-email-change/:token`, and `/auth/callback` (first social sign-in finishes the profile; the token is stripped from the address at once). Nothing hands off to the live app any more.
- **Fixed during the port:** match rows label tournament results as "Tournament result". The revamp labelled anything that wasn't a challenge or organiser result as "Screenshot verified".
  - **Tournaments, phase 1** (`/tournaments`, `/tournaments/:id`).
    - **Directory:** Upcoming, Live and Finished tabs, search, filters for where it's hosted (Gamerie or elsewhere) and solo or team entry, and a "Yours" strip. Cards show banner art or a generated plate, phase, capacity and prize; external events link out.
    - **Tournament page:** a hero with the next action for your state (register, answer an invite, check in, your match, waiting).
    - **Overview:** your entry and next match, withdraw, a schedule timeline, prize split, key rules and the organizer.
    - **Bracket:** columns joined by drawn connectors. Pointing at a name traces that entrant's path. Round robin shows standings, and a podium appears once the event is finished.
    - **Matches:** filters, and expandable rows with the ready check, declare score (one tap from the valid series scores), accepting a result or proposed time, proposing a time, and reporting.
    - **Participants and rules:** participants with seeds, progress, rosters and roster editing; rules generated from the settings, plus house rules.
    - **Registration dialog:** solo ticket, or team starters and subs; accepting an invite; a "You're in" state with what happens next.
    - Logic ported unchanged: `viewer.ts`, `score.ts`, `bracketLayout.ts`, `rules.ts`, `utils.ts`, `types.ts`.
  - **Tournaments, phase 2:**
    - **Hosting wizard** (`/tournaments/create`, `/tournaments/:id/edit`): six steps (basics, format, match rules, registration, schedule and prize, review).
      - The draft saves after each step, and steps lock as the tournament moves on.
      - Format shows the bracket's shape and match count. Schedule shows a round timetable and suggests a prize split.
      - A live directory-card preview sits beside the form.
      - Form logic (`create/draftForm.ts`) is ported unchanged.
    - **Manage tab** for organizers:
      - **Overview:** counts, a "Needs your attention" list (below the minimum, approvals, matches without a time, reports), and controls (pause, resume, redraw, cancel, edit).
      - **Entrants:** invite, approve or decline, give waitlisted entrants a place, remove, and disqualify with a reason.
      - **Seeding:** drag or arrow reordering.
      - **Announcements**, the **activity log**, and transferring ownership.
- **Challenges, finished:**
  - New challenges are a full page (`/challenges/new`) with the live invite preview beside the form. It can be prefilled with `type`, `target`, `targetName`, `game`, `format`, `size` and `from`.
  - Finished challenges have **Rematch**, which prefills the same opponent and terms.
  - Old `?compose=` links redirect to the new page.
- **Shared UI added:**
  - Tabs, Segmented, Combobox, ScheduleField (with a day range, month markers, and the chosen day scrolled into view), TextAreaField.
  - OptionCards, Switch, FileDrop, Menu (action menu) and TagInput.
  - Rich text through `@tailwindcss/typography` (`@plugin` in theme.css), with markdown-it, DOMPurify and highlight.js ported from the revamp's renderer.
  - ConfirmDialog, styled as an alert with danger styling.
  - Toaster: `toast.success`, `toast.info`, `toast.error`, with a lime check for success.
  - Dialog: sizes from sm to xl, an icon and tone mark, a bottom sheet on phones, and a spring entrance.
- **Lime (signal) means done, verified, live or won:** won results, final scores, the champion, completed setup steps, checked-in entrants, ready players, and success toasts.
- **Layout rules** (each one fixed a sideways-scrolling phone page):
  - Every hidden native input sits in a `relative` label, and every fieldset is `min-w-0`.
  - Every `overflow-x-auto` wrapper is `relative`, so `sr-only` text inside it (table headers) can't escape the clip.
  - Single-column grids that hold truncated text or wide tables use `grid-cols-[minmax(0,1fr)]`, including grids whose columns only start at `lg:`.
  - Heroes over banner art size to their content (art is `absolute inset-0`, the text block is in flow with a minimum height), so long names never clip on phones.
- **Backend note:** unfollowing writes to `referral_follow_opt_outs` (migration `AddReferralFollows1794787200001`). Without that migration every unfollow returns a 500.
- **Feed algorithm (backend-two):** For you is candidate → score → diversify with a cached ranked session, then newest-first; Following and Teams are newest-first. See `newsfeed-feed.repository.ts`, `feed-ranking.service.ts` (with spec) and `get-feed.use-case.ts`. Indexes: `AddPostFeedIndexes`, `AddFeedRankingIndexes`.
- **No page eyebrows.** Headers are the title and a line of description; lime stays reserved for live, done, verified and won.
- **Backend additions:** `GET /games?sort=popular` orders by how many players list each game (default stays by name). Search gains `hubs` (public, unbanned hubs only, since results are cached per term for everyone); team search returns `slug`; banned teams and players no longer appear; a `#tag` term matches post tags exactly (case-insensitive) or the hashtag in the text. `GET /tournaments` now honours `source`, `entrantType` and `format`, which the directory's "Where" and "Entry" filters send (they were silently ignored), and the directory filters by game. Settings: `timezone` must be a real IANA zone (`@IsTimeZone`), and the owner's own profile now includes `signInProvider` (never shown to others; covered by `user-profile.presenter.spec.ts`). Message delivery is pushed as soon as an event is enqueued (the 5s cron remains for retries) and outbox claims are atomic across instances (`message-delivery.processor.spec.ts`).
- **Shared pieces added late:** `components/ui/Pagination` (leaderboard and matches), `components/ui/TimeZoneField`, and `app/shell/RouteTitle`, which names the browser tab after the section.
- **Theme fix:** Tailwind 4.2+ ships its own `mist` palette, so the 41 uses of `mist-100` were rendering a cool blue-grey. `theme.css` now defines `mist-100` and clears the default `mist-*`.
- **Audit pass (2026-11-17):**
  - Performance: auth pages lazy, `LazyMotion` with `m.*` (features load after paint), default query staleTime 20s, lazy images in lists. First download 295 → 220 KB gzipped. Polling for unread counts and notifications drops to 2 min while the socket is connected (30s when it isn't); ladder matches poll only while the ladder runs.
  - Resilience: `ErrorBoundary` around routes (resets on navigation; stale-deploy chunk errors offer a reload), a Not found page inside the shell, guarded localStorage.
  - Floating layers: `useAnchoredLayer` positions Menu and GameFilter in a portal, flipping and clamping to the viewport (fixes the calendar Game filter overflow).
  - Calendar: tournament check-in label, readable fallback for unknown types, "+1" on events past midnight. Schedule field gains "Later date" beyond the strip (backend has no cap).
  - Notifications: tabs All, Social, Teams and hubs, Matches, Tournaments, Updates (Wallet removed); the Settings wallet switch is gone (wallet notices are always delivered anyway).
  - Analytics: `plugins/analytics.ts` injects Consent Mode defaults, Enzuzo and GTM/GA like the website; route views report from `RouteTitle`. Detail pages title the tab after what's open.
  - Deploy: `vercel.json` (SPA rewrite and `/s/:username` share previews) and `api/share.ts` + `api/card-image.tsx` (OG card in the v2 palette).
- **Backend changes in the audit:** migrations `AddHotPathIndexes` (60 indexes on foreign keys and hot paths: messaging, notifications, events, profile joins, rosters, brackets, wallets), `AddSearchTrigramIndexes` (pg_trgm on every searched column), `SentenceCaseNotificationTitles`; notification list filters share the preference category rules (`notification-filters.ts`, with spec) and add `matches`/`tournaments`; the check-in shortfall notice reads naturally.
- **Next:** an authenticated end-to-end pass against backend-two, then commit.
