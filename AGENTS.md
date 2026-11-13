# Turtle Tracks working agreement

- Keep one working version: `main` in `haguewilliams/turtle-tracks`.
- The user reviews https://turtletracks.haguewilliams.com/. Do not send branch choices or alternate app links unless Hague explicitly asks.
- Make approved incremental changes on `main`, verify deployment, and retain commit history for rollback. Do not keep a parallel design branch active.
- Preserve the cream/forest-green field-guide design and original Tilly front cover, with part of “Learn” behind Tilly. Keep the matching Learn and Help outline icons.
- First release uses the existing manual iNaturalist uploader handoff. Direct account connection/submission is deferred to a later release and must not block finishing Turtle Tracks. Keep its code disabled and preserve it for later.
- Photo analysis remains an active unfinished integration. Show unavailable states until real configuration and end-to-end verification pass. Never claim activation from code alone.
- Keep API keys and OAuth secrets on the backend, never in GitHub files or browser code.
- Do not submit synthetic wildlife observations.
- Run appropriate existing checks before a functional update. Current checks: `npm test`.
- Keep a gentle shared-habitat theme: making room for wild turtles can invite people to slow down, spend time outside, and care for home. Avoid medical promises or implying a turtle sighting proves ecosystem health.
