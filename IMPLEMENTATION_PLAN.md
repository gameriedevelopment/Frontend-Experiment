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

`<Icon name="…" weight="regular | bold | …" />` is the single API. Gamerie's identity glyphs (token, identity, community, team, verified, hub) are drawn in-house on the token motif. Everything else, including brand logos (Discord, X and so on), comes from [Phosphor](https://phosphoricons.com). The custom glyphs follow Phosphor's stroke weights (regular 1.5, bold 2.25), so the two sets match. To add an icon, map a name to a Phosphor `*Icon` export in `components/ui/Icon.tsx`.

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

## Next

- App pilot in `app/`: Player Card and challenge detail, built on the same tokens and components.
- Real profile screenshots or recordings in the feature bento once the app screens exist.
- Per-chapter sound (opt-in) and haptics on mobile.
