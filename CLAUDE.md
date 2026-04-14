# IPL Mock Auction — Project Guide

## Active files
- `index.html` — auction app (room creation, live bidding, team management)
- `fantasy.html` — fantasy league app (leaderboard, squads, schedule, points, sync)
- `sw.js` — service worker (caches images only)
- `manifest.json` — PWA manifest

## Obsolete — never edit
- `auctioneer.html` — replaced by index.html, kept for reference only

## Stack
- Pure HTML/CSS/JS, no build step
- Firebase Realtime Database (compat SDK v9.23) — all state lives here
- Cloudflare Worker proxy: `https://ipl-fantasy-proxy.choprashrey17.workers.dev` — fetches Cricbuzz match data for score sync
- PWA (installable on mobile via Add to Home Screen)

## Firebase structure
- `rooms/<code>/` — auction room data (teams, players, bids, participants)
- `fantasy/<code>/` — fantasy data per room (matches, captains, syncedIds, matchLabels)
- `fantasy/global/` — global match results/labels shared across all rooms

## Player name matching (score distribution)
- `NAME_EXPANSIONS` in fantasy.html maps word-level abbreviations to full forms (e.g. `chakravarthy → chakaravarthy`)
- `getPhotoByName` aliases in fantasy.html map full old auction names to current PLAYERS names
- Both must be updated together when a new name mismatch is discovered
- Similarity threshold is 0.85 — scores below this write `null` silently
- PLAYERS array names should match Cricbuzz API names exactly where possible

## IPL_TEAM map
- Keys must cover both auction-stored names (for squads tab) and Cricbuzz API names (for points tab)
- When a player's API name differs from auction name, add both keys pointing to the same team

## Score sync flow
1. Admin fetches match scorecard via Cloudflare Worker
2. `stageForReview` stores raw stats keyed by API player name
3. `distributeToAllRooms` matches API names → PLAYERS via `similarity()`, applies C/VC multipliers, writes to Firebase
4. Rooms created after a match's date get `null` points (ineligible), not skipped

## C/VC multipliers
- Captain: `Math.round(total * 2)` — intentional rounding
- Vice-Captain: `total * 1.5` — no rounding, fractional points preserved

## Known player aliases (current)
- `Varun Chakaravarthy` — PLAYERS spelling; API returns `Varun Chakravarthy`; handled via NAME_EXPANSIONS
- `Philip Salt` — PLAYERS spelling; auction may have stored `Phil Salt`; handled via getPhotoByName alias
- `Digvesh Singh Rathi` — PLAYERS spelling; auction may have stored `Digvesh Rathi`; handled via alias
- `Rasikh Salam Dar` — PLAYERS spelling (Cricbuzz API name); old rooms may have `Rasikh Salam`; handled via alias

## IPL 2026 season
- 70 matches (M1 Mar 28 — M70 May 24)
- Auto-sync triggers ~4.5h after match start
- Re-sync available via admin panel if data needs correction
