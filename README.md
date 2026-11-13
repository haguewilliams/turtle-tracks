# Turtle Tracks

An Eastern Box Turtle field guide and personal observation journal. The cream and forest-green field-guide identity remains the foundation. The photographic Field Guide home is the selected default, with Tilly available through the cover switch. The layout adapts to phone width and height while preserving the cream/forest-green palette, simplified sighting workflow, and functional improvements.

Production: https://turtletracks.haguewilliams.com/

Development branch: `work/final-stages`. Changes on this branch are for review; do not merge or deploy until the remaining release checks are complete.

## Files

- `index.html`: existing field guide, interactions, artwork, and journal UI.
- `journal-core.js`: validation, backup merging, sorting, and safe share summaries.
- `citizen-science.js`: contribution preparation, photo download, and manual iNaturalist handoff.
- `journal-core.test.cjs`: regression tests using Node's built-in test runner.

Run checks with `npm test` (25 checks), and run the same-origin app/API with `npm start` on Node 22+. The frontend can still be served statically, with photo analysis unavailable. GPS on a deployed site requires HTTPS and visitor permission.

## Review changes

The photograph is attached directly to the sighting. Field-guide comparison and additional details are optional; a user can save without identification or a turtle ID. The save confirmation offers Citizen Scientist. Learn, Help, journal, and quest controls share outline icons. `material-theme.css` applies the shared Material Design 3 role theme and responsive phone layout. Home uses a height-aware photo, compact spacing, and fixed navigation with safe-area padding; smaller screens can scroll naturally.

`server.mjs`, `photo-analysis-core.js`, and `photo-analysis.js` implement real photo analysis through OpenAI image inputs and structured output. No API credential is configured, so the service is not active. Tests use controlled provider responses; they are not a live accuracy evaluation. See `DEPLOYMENT.md` for secure activation and `PRODUCT_BRIEF.md` for the App Store release mandate.

## Data and contributions

Observations remain in the browser's local storage under the existing `turtleTracksMasterV2` key. Export a backup before switching browsers/devices or clearing browser data. Version 2 backups and legacy record arrays remain accepted; new backups use version 3. Imports are validated before review, merge preserves existing records, and replacing the journal requires a separate confirmation. Failed storage writes do not commit changes in memory or clear the encounter form.

Citizen Scientist checks for a photo, observation date, and GPS before preparing an observation. It provides a downloadable photo and separate date/location/notes fields for the official iNaturalist uploader. This is a manual submission path, not an API integration. Turtle Tracks does not claim a submission succeeded, grant Research Grade, or submit anything without the contributor's review.

## Direct iNaturalist submission

The requested direct-submit workflow remains to be connected. Register a Turtle Tracks application with iNaturalist, choose its production callback URL, implement its supported OAuth/PKCE authorization, and use the supported API to create the photo and observation. Do not put a client secret or user's credentials in this repository. Each contributor must authorize their own account.

Required behavior: review the photo/date/location, default the app's submitted observation to obscured geoprivacy, request explicit submission consent, preserve returned observation IDs/URLs, handle partial uploads and retry without duplicate observations, and mark submitted only after a successful provider response. Confirm API behavior and platform requirements against current documentation before implementation. No live wildlife observations or test records have been submitted during development.

Official references:

- https://www.inaturalist.org/pages/api+reference
- https://www.inaturalist.org/pages/api+recommended+practices
- https://help.inaturalist.org/en/support/solutions/articles/151000169938
- https://help.inaturalist.org/en/support/solutions/articles/151000170346-which-inaturalist-observations-are-exported-for-gbif-and-how-often-does-this-export-happen-
- https://www.herpmapper.org/content/pdf/herpmapper-announcement.pdf

See `RELEASE_CHECKLIST.md` for verified work and outstanding release checks.
