# Gamerie frontend experiment

Build an experimental public website and authenticated app around Gamerie's player identity, community, and competition. The homepage comes first and establishes the visual system the app can adopt.

## Project structure

- `website/` owns the public site, content, assets, routes, and app links.
- `app/` owns the future authenticated experience, feature modules, and product integrations.
- Each project owns its package manifest, lockfile, Tailwind theme, and build. Follow the Vite, React, TypeScript, and feature-oriented structure in `frontend-revamp`.
- Tailwind is required for UI styling in both projects. Use semantic theme tokens, utility classes, and typed component variants. Keep the homepage’s motion code with the story feature.
- Use the dedicated [Frontend-Experiment repository](https://github.com/gameriedevelopment/Frontend-Experiment). Keep its environment and deployment configuration local to each project.

## Visual direction

- Use near-black violet on the stage, Gamerie lavender for actions and active states, and a low-saturation paper surface for the editorial sections. Reserve warm gold for earned recognition. Keep these roles in the Tailwind theme.
- Use Swiss 721 BT and Swiss 721 Black BT for body and display type. Both webfont files come from the Codemania reference.
- Draw on the reference's typography hierarchy, spacing, and card variants. Keep typography roles and spacing in the Tailwind theme and compose typed controls and card variants from them.
- Keep the Gamerie logo. Use the custom Gamerie icon set for identity, players, teams, competition, and interface actions. Use the same 20-unit grid, stroke weight, and corner treatment, and use the diamond detail on achievement and identity marks.
- Use Tender’s visual storytelling and interactive walkthrough as references. Give Gamerie a portrait-led scene where the same Player Card moves through identity, community, team, and competition. Drive the card’s perspective, background imagery, progress, and details from the same timeline.

## 1. Homepage

- Establish the Tailwind theme, responsive layout, action variants, and card variants.
- Open with a clearly labeled sample Player Card, a custom portrait, and paths to registration and the walkthrough. Use desktop scroll and chapter controls to move through the same scene. Keep chapter controls available on mobile and with reduced motion.
- Build a four-step preview covering player identity, meeting players and communities, building teams, and competing. Show how results and achievements become a player record.
- Carry over the existing homepage's player, team, community, and organizer content, its FAQ, and its community and policy links. Use configurable URLs for the app and main external destinations.
- Verify desktop and mobile layout, touch and keyboard navigation, reduced motion, CTA targets, and the production build. Keep the hero and content readable with motion disabled.

### Homepage artwork

The hero portrait was generated with the built-in ImageGen tool and is stored at `website/public/media/player-portrait.jpg`. Community, team, competition, and audience photography comes from the existing Gamerie website.

<details>
<summary>Show the ImageGen prompt</summary>

> Create one premium editorial esports PORTRAIT photograph, vertical 4:5 framing, for the visual artwork inside a physical dark lavender collectible player credential (only provide the photograph itself, no card UI, no text at all). Center a confident young adult Black Nigerian woman esports player, striking sculptural close-cropped dark hair with micro-braids tight to her head, small silver earrings, serious focused expression, calm with eyes looking straight into camera, slight three-quarter body orientation, wearing a minimal black high-neck sportswear top and real matte-black gaming headset around her neck. Head and shoulders framed generously with her eyes roughly 42 percent down, negative space above and some room at either edge. Dramatic deep electric violet studio lighting and a crisp very pale lilac rim along cheek, very subtle natural film grain, high-end location fashion campaign quality, dark plum near-black backdrop with one wide soft vertical lavender glow behind her like a light strip well out of focus, deep contrast but luminous face with real pores and real dark skin tone. Controlled, sophisticated, photographic, no costume, no neon cyber accessories, no graphics, no typography, no trademarks, no holograms, no extra people. Think expensive global sportswear campaign photography, juxtapose solid inky shadows with dimensional lavender edge light.

</details>

## 2. App visual pilot

- Give `app/` its own build and Tailwind setup. Keep route shells, data access, and feature components in the same ownership structure as the existing app.
- Start with the Player Card and a challenge detail flow. Bring over existing data models and behavior where needed, including recorded results, provenance, and challenge phases.
- Verify new-player, populated, loading, empty, and error states. Test on mobile before extending the system to the feed, teams, and other screens.

## 3. Iteration

Compare the homepage and app pilot at the same viewport sizes. Refine the reusable tokens, component variants, motion, and custom icons based on those screens. Use the same few core flows when reviewing subsequent iterations so the experiment can be resumed incrementally.

## Run the homepage locally

Run these commands from the experiment root.

```sh
cd website
npm ci
npm run dev
```

Vite serves the homepage at `http://localhost:5178/`. For a production check, run `npm run build` from `website/`. See `website/.env.example` for public link overrides. The registration and sign-in links use the existing Gamerie app by default.
