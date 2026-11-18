# Gamerie UI QA and Christy demo

Wednesday, 18 November 2026 at 12:00 p.m. WAT (Africa/Lagos)

## Open before the call

- [Experimental website](http://localhost:5178/) for the opening walkthrough.
- [Experimental app](http://localhost:5179/home) for sign-in and the product demo. Open the app directly. The website registration and sign-in buttons currently point to port 5173.
- [Backend API health](http://localhost:8000/api/v1/health). The local API was started successfully and returned HTTP 200. Postgres and Redis were already running.
- [Second app origin](http://127.0.0.1:5180/home) for a separate browser session. The fixture username is `qa-christy-20261118`. Credentials stay out of this document.
- Load the [sample post](http://localhost:5179/post/6525997a-c555-4b5d-aac0-40ab16d0dc5f), [QA team](http://localhost:5179/teams/qa-nov18-christy-team), [QA hub](http://localhost:5179/hubs/qa-nov18-christy-hub), [QA calendar event](http://localhost:5179/calendar?event=fab29cc8-ec27-42cd-9637-faa0190725ae), [tournament draft review](http://localhost:5179/tournaments/14163db5-5762-48fb-b622-c63df18e4994/edit?step=review), and [ladder draft review](http://localhost:5179/ladders/98316cce-726c-4e8f-8fc3-66243bbfb50d/edit?step=review) in advance if useful.
- **Skip the live Challenges and Ladder Standings/Matches walkthrough on this snapshot.** The local API returns 500 for those flows. The ladder draft wizard and its Review step worked.

If the local processes are down, run `npm run start` in `backend-two/`, then `npm run dev` in `frontend-experiment/app/` and `frontend-experiment/website/` in separate terminals. The experimental app proxies through to the local API.

## Walkthrough for the call

1. **Website and product premise.** Play the hero and use its Identity, Community, Teams, and Competition buttons. Show the result-proof steps, a FAQ answer, and the layout on a narrower screen. Switch to the app tab for sign-in.
2. **Home and player identity.** Sign in with the supplied account. Expand the onboarding checklist, open Ways to earn GP, then open the profile and Player Card. Show Career, Games, Matches, Posts, and Achievements. In a test profile, edit the bio, save, and refresh.
3. **Feed and discovery.** Open the sample post. Create a short QA post, edit it from Post options, react to it, and add a comment. Copy its link and reopen it. Search for the QA player or Counter-Strike 2, use a filter, and open a result.
4. **Messages and notifications.** Use the two sessions. Open New in Messages, pick the QA opponent, send a short message, edit it, then reply from the other session. Invite the QA player to a spare team to show the unread notification and the accept flow.
5. **Teams and hubs.** Open the QA team, compare Overview and Roster, and visit Manage. Create a spare team with a unique name and edit its description from More team actions. Open the private QA hub, then its management tools and Sponsor report.
6. **Tournaments and ladder preview.** Reopen the QA tournament draft and show the saved best-of-five rule, registration deadline, and schedule. View a seeded tournament’s Bracket, Matches, Participants and Rules. Ladders are still under development. Show the list and four-step draft wizard if time allows. Use the saved private QA ladder to show Review.
7. **Calendar and matches.** Create an event with a future date and reminder set to None for the demo. Check that Agenda and Month show the same time, open the event, and cancel a disposable test event if useful. Open Log a match to show the prerequisite screen. The current local catalog has no screenshot-enabled game fixture. Use a configured game and approved test evidence when available.
8. **Preferences and mobile.** Open Settings and view Profile, Privacy, Notifications, and Account. Switch to phone width, use the bottom navigation, then try the main feed and message actions. End the demo with the customer journey you want Christy to evaluate.

## Copy-ready demo inputs

Use your existing signed-in session and the separate QA player session for two-person flows. The QA player’s username is `qa-christy-20261118`. The QA player already belongs to the saved QA team and hub, so use fresh names below to replay invitations and join requests. Change `01` to `02` on a repeat run. All times are WAT. If you replay after 18 November, move the dates forward and keep the same order and duration.

| Page or task | Enter or select | Expected result |
| --- | --- | --- |
| Home | Use **Set up your player ID**, **Ways to earn GP**, and **Your Player Card**. No text input. | Each control opens the relevant step, guide, or card. |
| Profile and Player Card | On the QA profile, set Bio to `I play support and organize weekend scrims in Lagos.` Select **West Africa**. For **Add a game**, select **Counter-Strike 2**, enter `ChristyDemo01` as In-game name, and select **PC** and **Intermediate**. Use the existing game’s edit action if it is already listed. | Bio and game details survive reload. **Save image** downloads the owner’s Player Card. |
| Feed and post detail | Post `Christy Demo 01 — Who is up for a Counter-Strike 2 scrim this weekend?` Edit it to `Christy Demo 01 — Counter-Strike 2 scrim on Saturday at 6 p.m. WAT.` Comment `I can play at 6 p.m.` | The edited text, reaction, and comment appear after reopening the copied post link. |
| Discover and search | Search `qa-christy-20261118` for a player, `Counter-Strike 2` for a game, and `Christy Demo Team 01` after creating the team below. For the empty state, search `qa-no-match-zzzzz-20261118`. | Matching results link to their pages. The unmatched query shows the empty-results message. |
| Games | Search `Counter-Strike 2`. Open the game’s **Players** tab and search `ChristyDemo01` or the QA username after updating the profile. | The catalog opens the correct game. The Players tab applies the query and shows a result or an explicit empty state. |
| Teams | Name `Christy Demo Team 01`, description `A local QA roster for weekend Counter-Strike 2 scrims.`, level **Amateur**, region **West Africa**, country `Nigeria`, platform **PC**, game **Counter-Strike 2**. Edit the description to `Weekend Counter-Strike 2 scrims. Next practice is Saturday at 6 p.m. WAT.` Invite `qa-christy-20261118` from Manage. | The updated description persists. Accepting the invite in the second session increases the roster to two. |
| Hubs | Name `Christy Demo Hub 01`, description `A private local QA hub for Lagos esports teams.`, type **Community**, visibility **Private**, access **By request**, region **West Africa**, country `Nigeria`. From the second session, request to join with `Please add me for the weekend scrims.` | The owner sees and can approve the request. The member can enter the hub. Sponsor report remains limited to its authorized team. |
| Messages | Recipient `qa-christy-20261118`. Send `Christy Demo 01 — Are you free for a scrim at 6 p.m.?` Edit to `Christy Demo 01 — Are you free for a scrim at 7 p.m.?` Reply from the second session with `Yes, 7 p.m. WAT works.` | Send, edit, and reply appear in both sessions without a reload. |
| Notifications | Use the fresh invitation to `Christy Demo Team 01` or the fresh request for `Christy Demo Hub 01`. In Notifications, select **Teams and hubs**, turn on **Unread only**, and open the relevant notification. | The notification routes to the matching invite or request. **Mark all read** clears remaining unread items in the test account. |
| Calendar | Title `Christy Demo 01 — Team practice`, type **Practice**, starts **19 Nov 2026 at 12:30 p.m.**, length **1 hr**, timezone **Africa/Lagos**, game **Counter-Strike 2**, reminder **None**, notes `Warm-up followed by two scrims.` | Agenda and Month both show 12:30–13:30 WAT. Open the event details. Cancel a disposable copy to verify the cancelled state. |
| Tournaments | Name `Christy Demo Cup 01`, description `Local no-prize Counter-Strike 2 cup.`, game **Counter-Strike 2**, platform **PC**, region **Africa**, **Online**, **Players**, **Single elimination**, bracket size **16**, minimum **4**, **Best of 5**, entries **Open**, entries close **19 Nov at 18:00**, bracket starts **20 Nov at 20:00**, **No prize**. Save each step and stop at Review for this walkthrough. | Review shows the saved format, registration cutoff, start time, and no prize. Reopen Match rules to change the format and confirm Review reflects the edit. |
| Ladders | Name `Christy Demo Ladder 01`, description `Private local ladder for the demo.`, game **Counter-Strike 2**, platform **PC**, region **Africa**, entrants **Players**, entry **Private**, starts **19 Nov at 18:00**, ends **27 Nov at 18:00**, **No prize**. Save through Review. | The private eight-day season appears on Review. To test validation, an end date of **21 Nov at 18:00** should be rejected as shorter than one week. |
| Leaderboard | Select **Players → Wins**, then **Teams → Wins**. Try **Win rate** as a second metric. | The metric label and ranking rows update. Player links open profiles and team links open team pages. |
| Settings | On the QA profile, select **Privacy → Only you**, click **Save**, then open that profile from the first account. Restore **Everyone** and click **Save** when finished. | The other session sees the restricted profile while Only you is saved. |
| Challenges — after QA-01 is cleared | Type **Player**, opponent `qa-christy-20261118`, game **Counter-Strike 2**, **Best of 3**, **19 Nov at 18:00**, note `Local QA challenge for the demo.` After the scheduled start, report **2–1** and confirm from the second session. | Both sides see the invite and the same final result. The accepted schedule appears on Calendar, and the confirmed result appears on both records. |
| Matches — after QA-07 is cleared | Use an enabled **EA FC**, **Mobile Legends**, or **BGMI** fixture. Use the in-game name printed on an approved result screenshot. For a score-based fixture, compare OCR to the visible scores and correct any mismatch before confirming. | The reviewed result persists in Matches and the player’s record. |

### Highest-value end-to-end checks still open

1. Link the QA team to a hub, approve the request as a hub manager, and verify both rosters and permissions. The player-to-hub request and team invitation were already verified separately.
2. Once Challenges works, run invite → accept → calendar → score → confirm → player records from both accounts.
3. On an approved tournament, run publish → register → check in → bracket → report and confirm a result. The draft and Review steps were verified.
4. With the completed ladder schema, run publish → join/invite → play → record a result → confirm the standings change. Leagues can follow once its player-facing pages are ready.
5. Use a configured OCR game and test screenshot for the full upload and result flow. Use dedicated test inboxes and provider accounts for signup verification, password reset delivery, OAuth, and SMS.

## Findings

### QA-01 — Challenges return HTTP 500 on the current local schema

- **Severity** Blocker for the Challenges demo.
- **Reproduce** Open Challenges and switch For you, Team, and History. Then start a solo challenge, choose the QA opponent and a game, set a future time, and submit.
- **Observed** `GET /api/v1/challenges/mine` and `POST /api/v1/challenges` returned 500. The new challenge form displayed “Internal Server Error.” The expiry job reported the same missing column.
- **Evidence** Postgres reports `challenges.league_id` missing. The in-progress `202611200001-CreateLeagues.ts` migration adds it. The app and API were using the existing local database. No migrations were applied during QA.
- **Retest** Once your current schema work is ready, run the list and send flow again before testing accept, reschedule, result confirmation, dispute, and calendar or record updates.

### QA-02 — Website account buttons use the wrong port in the local demo

- **Severity** High for the website-to-app handoff.
- **Observed** Marketing sign-in and registration links resolve to `http://localhost:5173/signin` and `http://localhost:5173/register`. No process was listening on 5173. The experimental app responds on 5179.
- **Evidence** The website process’s local `VITE_APP_URL` is set to port 5173. This is an environment finding. The app’s link back to the website targets 5178 and the page loads there.
- **Demo** Open the app directly in a separate tab.

### QA-03 — New posts, comments, and team invitations show “1h” immediately

- **Severity** Medium.
- **Reproduce** Post a QA message in Feed, add a comment, then invite the local QA player from a team you own. View the recipient notification immediately.
- **Observed** The fresh post, its fresh comment, and the new invitation displayed “1h” within minutes of creation. A direct message displayed the correct local clock time. The calendar showed the expected Africa/Lagos time when entered through the native date input.
- **Expected** Newly created items should display “now” or a few seconds/minutes ago. Check timestamp serialization and how the relative-time components parse it in GMT+1.

### QA-04 — A past tournament appears in Home’s “Open for entry” list

- **Severity** Medium.
- **Observed** On 18 November, Home showed the existing “Anthens club” fixture under “Open for entry,” with “Starts Sun 1 Nov” and “Starting soon.” A separate player opening the card saw “Registration is closed.” The owner also had an organizer decision notification dated 2 November because nobody checked in.
- **Expected** Give tournaments awaiting an organizer decision a distinct status, and show them in the join list only if entry is actually available.
- **Fixture** [Anthens club](http://localhost:5179/tournaments/0aa9f69f-473c-4d8a-94b1-38707310b40b).

### QA-05 — Homepage industry figures need dates and sources

- **Severity** Medium if used as current figures in a funding discussion.
- **Observed** The page displays `$70M` for the Esports World Cup and `$2M` for Dota 2’s The International. The figures have no year or source. The organizer reports `$75M` for the 2026 Esports World Cup. Valve shows `$3,906,263` for the 2026 International. The audience count and market projection also lack an as-of date or source.
- **References** [Esports Foundation 2026 release](https://www.prnewswire.com/news-releases/esports-world-cup-2026-opens-in-paris-marking-a-new-global-chapter-for-competitive-gaming-302821128.html) · [Valve 2026 tournament page](https://www.dota2.com/esports/ti15/schedule/19719/41)

### QA-06 — The website cookie banner’s Privacy Policy link opens the homepage

- **Severity** Medium.
- **Reproduce** Open the marketing website in a fresh browser session and inspect or open “Privacy Policy ↗” in the cookie banner.
- **Observed** The link points to `/privacy-policy` on the local website. That URL renders the marketing homepage. The separate footer Privacy policy link points to the GitHub-hosted policy.

### QA-07 — The local match logger has no eligible game to test

- **Severity** Local demo blocker for OCR.
- **Observed** Log a match prompts you to add a screenshot-supported game. The local game catalog contains no configured `matchVerificationAdapter` row. Searching for Mobile Legends in Add a game yielded no result. Adding Counter-Strike 2 to the QA profile worked, and that game does not qualify for screenshot verification.
- **Retest** Use a catalog fixture configured for EA FC, Mobile Legends, or BGMI and an approved screenshot. Verify upload, extraction, review, confirmation, retries, and the result on the record.

### QA-08 — Ladder Standings and Matches show empty states after failed requests

- **Severity** High for the current ladders work.
- **Reproduce** Open [Lagos Weekend Ladder QA](http://localhost:5179/ladders/2dc01b5b-6e91-40b8-a620-53ddac9b664b) and select Standings, then Matches.
- **Observed** Standings displays “The table is empty” and Matches displays “No matches yet.” The corresponding endpoints both returned HTTP 500. The Participants endpoint returned 200.
- **Evidence** Backend logs cite the same missing `challenges.league_id` column as QA-01. Retest with the aligned schema and distinguish a request failure from a genuinely empty ladder.

## Coverage and retest notes

Tested on 18 November against experimental frontend commit `6d41034` and backend commit `a923c83`, both with the work-in-progress changes already present in the checkout. Used the real local API with no mocked browser responses. The app and website production builds passed. The app’s Tailwind-only check passed. The backend unit suite passed all 648 tests across 139 suites. Production builds emitted chunk-size warnings for the app’s main bundle and the website’s main and 3D bundles. A 390 px Chromium sweep covered 16 app pages without document-level horizontal overflow. Feed and the More menu worked from the bottom navigation. The website rendered at 390 px with reduced motion enabled. This was browser emulation.

| Page or feature | Verified through the local UI | Continue with Christy or on a later pass |
| --- | --- | --- |
| Website | Homepage renders with all sections. Competition chapter activates and changes the board story. The proof control selected Report the score. The FAQ opens by keyboard, internal anchor targets exist, and cookie settings open. | Recheck brand and legal destinations in deployment. See QA-02, QA-05 and QA-06. |
| Sign-in and session | Protected Home redirected to sign-in in a signed-out session. Blank required fields were flagged. A wrong password on the QA account showed “Invalid credentials.” Both valid accounts reached Home on the real API. Signed out the QA account and confirmed a protected route redirected to sign-in. Registration and recovery field validation worked, and a bogus email-confirmation token showed “Invalid or expired token.” | Use a test email inbox for signup and reset delivery. Use approved provider test accounts for OAuth and SMS. |
| Home | Greeting and onboarding, quick-start links, level, Up next, player recommendations and tournaments render. | Complete a setup item and refresh to verify GP and progress; separately retest QA-04. |
| Feed and post detail | Created, opened, edited, liked, and commented on a real QA post. The copied permalink opened the edited post with the comment and reaction intact. | Exercise media, repost, comment edit and moderation on approved disposable content. |
| Discover and search | Players and games render. Search found the QA profile and showed an explicit empty result for an unmatched query. Follow and unfollow both worked on the QA profile. | Check combinations of Game, Region, Platform, and Level, and try search across Posts and Hubs. |
| Profile and public card | Opened the profile and tabs. Saved a QA bio, added Counter-Strike 2 with an in-game name, opened the public card, and downloaded the owner’s PNG. | Test photo uploads and additional skill, links, endorsement, and follower cases with approved test media. |
| Games | Game directory and Counter-Strike 2 detail load. Opened its Players tab and verified its search field and detail URL. | Exercise catalog filters and provider connect and disconnect with linked test accounts. |
| Teams | Created and edited a team. Invited the QA player, opened the notification, accepted the invite, and verified the roster grew to two. Opened the owner tools. | Exercise role changes, hub association, Team chat and referral link. Use a safe test fixture for any wallet, transfer or ownership workflow. |
| Hubs | Created and edited a private hub, approved a request as owner, and verified both members. The owner could open the Sponsor report, while the other account was denied both before and after joining as a regular member. | Exercise the separate team-to-hub request, role changes, posts, and PDF print output. |
| Messages | Sent, edited, and replied between two live browser sessions. The counterpart saw the edit and reply without reloading. | Try conversation search, Teams, quote reply, close/reopen, and delete confirmation on an isolated test message. |
| Notifications | Team invitation arrived unread and clicked through to its invitation. Filtering and Mark all read worked on the QA account, which showed “Nothing unread.” | Verify other categories and external delivery with controlled fixtures. |
| Calendar | Created a personal QA event for 19 Nov, 12:30–13:30 WAT and verified the saved date and direct link in Agenda and Month. Cancelled a separate QA event via confirmation. | Test filters, reminder delivery, and challenge/tournament links. The current personal event detail exposes cancellation, with no edit control for title or time. |
| Challenges | List/form routes rendered and the opponent/game pickers worked. Both list data and send were blocked by QA-01. | Test solo/team invites, accept/reject, schedule, score reporting, dispute and record updates after schema sync. |
| Tournaments | Opened directory and a seeded detail. Created a QA draft and advanced through all six steps. Reopened Review and verified best-of-five, valid dates, and no prize. | Automatic review blocked publishing the QA draft because publication creates durable competition state and can trigger downstream effects. Publish, register, check in, bracket start, and score confirmation remain unverified. |
| Ladders | Opened the directory, a seeded detail, and Manage. Created a private draft, verified the sub-week season validation, and reached Review with a valid eight-day season. See QA-08 for the seeded standings and matches. | Retest publish, join, groups, roster, standings and result changes with the completed schema. |
| Leagues | Leaderboard exposes a disabled “Leagues Soon” control. | In development, with no completed player-facing UI to exercise in this checkout. |
| Leaderboard | Switched to Wins and confirmed the metric and ranking data updated. Switched from Players to Teams and verified team links and data. | Verify remaining metrics and per-game filters. Retest competition views with populated fixtures. |
| Matches and Log a match | Opened the record and screenshot prerequisite dialog. Confirmed QA-07 via a read-only catalog check. | Submit an approved screenshot, verify OCR fields and score edits, confirm the result and check it appears on record. |
| Settings | Opened Settings sections. Saved Only you on the QA profile, confirmed a second session could see only the restricted view, then restored Everyone. | Exercise notification preferences, email changes, password changes, and phone verification with approved recovery resources. |

## Test data and limits

The team, hub, post, calendar event, competition drafts, and conversation in this document were created as labeled local QA fixtures. A temporary player was provisioned through the existing service on the loopback database with external provisioning integrations mocked, so message and invite checks could use a controlled recipient. Application source and database schema were untouched. Test objects were written to the local database. Full release acceptance still requires provider callbacks and delivery, OCR with an approved image, permission checks with more roles, and the unfinished competition flows.
