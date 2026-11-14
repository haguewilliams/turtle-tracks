# Activating Turtle Tracks integrations

Status: November 14, 2026. The default photo check is now an experimental on-device species trial on the existing GitHub Pages site. It needs no new account, API key, paid inference service, or server host. Sex/life-stage estimates remain unavailable. The retained OpenAI and direct iNaturalist integrations are inactive.

## One app, one source

Keep `main` in `haguewilliams/turtle-tracks` as the single working version and https://turtletracks.haguewilliams.com/ as the public app. GitHub Pages serves the static files, including `assets/ml-runtime`, `models/eastern-box-v1`, and the worker. `app-config.js` selects `analysisMode: 'on-device'`; `model-manifest.json` enables only the experimental trial. A false manifest flag disables the button. Both the availability flag and classifier must permit execution. Never enable sex or life-stage heads without separate validation.

The runtime/model download is about 5 MB before HTTP compression. Photos stay in the browser. No service worker or guaranteed offline model availability is provided. Initial use needs connectivity; memory and speed vary by device. Web Workers and WebAssembly are required. On failure, the photo remains savable. Run `npm test` and use `npm start` on Node 22+ for local development. The Node server is not required in production for the free trial.

See `models/eastern-box-v1/README.md` and `evaluation.json` for actual errors, abstentions, provenance, and release limits. The fresh evaluation missed the 95% precision target. This is an owner-requested experimental trial with explicit review, not full biological validation. Physical iPhone and Android checks remain outstanding.

## Deferred backend options

Everything below describes retained, inactive integrations. It is not required to run the current species trial. Do not activate accounts, incur costs, or move hosting merely because these instructions exist. If a later owner decision activates a backend, retain the existing HTTPS origin so browser journals remain accessible and export a backup before migration.

### Backend storage for a later server integration

Use ONE running Node process with a persistent Linux filesystem mounted outside the repository and public assets. Set:

- `NODE_ENV=production`
- `APP_ORIGIN=https://turtletracks.haguewilliams.com` after that domain points to the backend
- `TT_DATA_DIR` to the absolute persistent-volume directory
- `TT_DATA_DURABLE=true` only after confirming the directory survives restarts and deployments

The private store keeps daily request counts and submission recovery receipts. It does not store photographs, GPS coordinates, notes, or OAuth tokens. Files are private, written atomically, and flushed before upstream writes. Back up this volume securely. Losing its ledgers loses duplicate protection and request accounting; do not resume pending contributions after losing or replacing it without reconciliation.

Do not run multiple processes or replicas against these files. The locks are process-local. Horizontal scaling requires a shared transactional database and distributed request limiter first. Never mark an ephemeral free-host filesystem durable just to enable the buttons.

### Inactive OpenAI photo-analysis option

1. Connect the owner's OpenAI account and backend host. Enter `OPENAI_API_KEY` only through the host's secure environment settings, never chat, a command argument, browser code, or GitHub.
2. Optionally set `OPENAI_MODEL` (default `gpt-4.1-mini`). Keep `ANALYSIS_DAILY_LIMIT=0` during initial hosting setup; choose a small evaluation allowance with the owner before enabling calls. Default when omitted is 50 attempts per UTC day.
3. Configure provider spending controls and alerts with the owner. The app's persistent daily request allowance survives restarts and counts attempts before contacting the provider, including failed calls. It is not a monetary billing cap. Two concurrent analyses and ten attempts/hour per connecting socket IP are additional in-memory controls. Behind a proxy, visitors can share that IP bucket; do not trust arbitrary forwarded-IP headers. Add host-level abuse controls appropriate to the actual proxy before public activation.
4. Verify `/api/status` reports `photoAnalysis:true`, then test explicit consent, reviewed real turtle photos, non-turtles, uncertain results, timeout/refusal behavior, and saving reviewed suggestions. A configuration flag and mocked tests do not establish biological accuracy.
5. The app sends only the resized photograph, requests `store:false`, and avoids payload logging. Provider data policies still apply; `store:false` does not promise zero retention. Estimates remain cautious suggestions: no exact ages, no sex claim from eye color alone, no individual-turtle recognition.

Production analysis stays off without an API key, positive limit, exact HTTPS origin, and an explicitly configured persistent data directory. Corrupt or unwritable usage records fail closed.

## Later release: iNaturalist owner and application approval

First-release decision: keep the existing official-uploader handoff and `INAT_ENABLED=false`. Direct submission is deferred and must not block photo analysis, phone testing, or app release. The existing direct-submission code is retained for a later update.

Each contributor authorizes their own account. Do not use a shared group account for everyone's sightings.

The normal app-owner application is restricted to an account older than two months with at least ten improving identifications of OTHER users' observations in the past month. Staff approval is required before application registration. These requirements were checked against iNaturalist's current official application controller on November 13, 2026. A new signup alone cannot activate direct submission immediately. Use genuine, competent identifications; do not manufacture activity to meet the requirement.

### Building eligibility without a Turtle Tracks integration

1. Create or sign into Hague’s ordinary iNaturalist account on the official website. An existing account may already satisfy the account-age condition; check its actual creation date before estimating a wait.
2. Use iNaturalist’s own Identify page: https://www.inaturalist.org/observations/identify. Filter for organisms and places Hague knows, inspect the evidence, and add only identifications he can independently justify. This does not require Turtle Tracks or API access.
3. Understand what counts: an “improving” ID is the first suggestion of a taxon that the community later agrees with. Uploading ten personal observations or adding ten agreements does not establish this requirement. The current eligibility check counts improving IDs on other users’ observations created within the preceding month, so activity must be recent when applying; future community agreement is not guaranteed.
4. Once the account is older than two months and the recent qualifying count reaches ten, submit the app-owner request explaining the real Turtle Tracks use case. Keep normal use and development moving meanwhile.
5. If the eligibility path is impractical, ask iNaturalist staff at help@inaturalist.org for guidance and whether an earlier review is possible for this educational field-guide project. Describe the existing app, contributor consent, location protection, and lack of automated identifications. An exception is not promised. No inquiry has been sent.

The two-month condition belongs to the user account, not the age of Turtle Tracks or its API code. The public app can direct visitors to the normal uploader now. These developer requirements do not apply to ordinary visitors uploading their own sightings through iNaturalist.

Sources: https://help.inaturalist.org/en/support/solutions/articles/151000171681 and https://help.inaturalist.org/en/support/solutions/articles/151000170241

Prepared registration details, once eligible and approved:

- Name: Turtle Tracks
- Website: https://turtletracks.haguewilliams.com/
- Purpose: A turtle field guide and personal sighting journal. Contributors review a real photograph, date, location, public notes, and privacy before submitting under their own iNaturalist account.
- Authorization: OAuth authorization code with S256 PKCE; scopes `write login`.
- Production callback implemented in this build: `https://turtletracks.haguewilliams.com/api/inaturalist/callback`. Register it only after the backend serves that exact HTTPS origin. If technical staging is required, register its exact callback separately; do not substitute it for the public app.

Secure backend environment:

- `INAT_CLIENT_ID` and `INAT_CLIENT_SECRET` from the approved application
- `INAT_SESSION_KEY`: 32 cryptographically random bytes encoded as 64 hex characters, generated and entered through secure hosting tools
- `INAT_ENABLED=true` only after registration and backend setup are ready
- The shared persistent storage and exact `APP_ORIGIN` settings above

The authorization cookie is encrypted, HttpOnly, Secure, SameSite=Lax, and expires after 24 hours. OAuth credentials are not returned to frontend JavaScript. Disconnect revokes the provider token and clears the cookie. Restrict host log access and redact callback query strings; OAuth codes must not enter analytics or diagnostics. Rotating the session key signs everyone out.

## Direct contribution behavior

The implemented flow connects the contributor's account, reviews the photo/date/GPS, defaults to obscured geoprivacy, offers private visibility, and requires explicit sharing consent. The provider receives exact coordinates even when the public location is obscured or private. Only separately reviewed public notes are sent; private journal notes and AI identification/sex suggestions are excluded. Only the observation date is sent because the journal does not capture an observation time zone.

A browser-saved UUID and backend ledger are written before submission. The API creates an observation and attaches its photo, then returns a receipt only after both confirmations are verified. Unknown responses are looked up by UUID instead of blindly repeating writes. A confirmed receipt survives journal backup/import and backend restarts. Local journal edits do not edit iNaturalist.

If a response remains uncertain and lookup never finds the object or photo, the app keeps the contribution pending. It cannot safely assume the first request failed. Check the authenticated iNaturalist account and reconcile the private ledger before resetting the submission. Do not delete the ledger or use the website uploader to resend an uncertain contribution. This conservative behavior prevents automatic duplicate submissions; it does not promise recovery from every provider failure.

Provider requests are serialized at approximately one per second, with a persistent allowance of 9,000 requests per UTC day and a bounded queue. This is a single-instance implementation. No Research Grade status is implied by a successful upload.

Before enabling publicly, verify OAuth, revocation, and the full user flow with the actual approved application. Submit only an explicitly authorized, genuine wildlife observation; do not create synthetic public test observations. Until then, the official-uploader handoff remains available and direct submission stays inactive.

## Prepared Render configuration

`render.yaml` is an inactive free-host starter using `main`; it has NOT created a service. It runs checks before building, disables automatic deployments, sets analysis allowance to zero, and leaves direct submission and durable storage disabled. A persistent volume is not provisioned by this free template. Choose and approve any paid hosting/storage plan before creating it, then mount persistent storage and configure secure credentials. Connecting a plugin alone does not approve a paid plan.

## Verification and references

`npm test` currently runs 54 automated journal, photo-analysis, authorization, privacy, quota, receipt, and retry checks using controlled provider responses. Local browser QA confirms the existing manual contribution path remains usable while integrations are off. Full model validation, real-device testing, accessibility, and native App Store packaging remain release gates.

- https://www.inaturalist.org/pages/api+reference
- https://www.inaturalist.org/pages/api+recommended+practices
- https://github.com/inaturalist/inaturalist/blob/main/app/controllers/oauth_applications_controller.rb
- https://github.com/inaturalist/iNaturalistAPI/blob/main/lib/views/swagger_v1.yml.ejs
- https://render.com/docs/blueprint-spec

See [INATURALIST_PLAN.md](INATURALIST_PLAN.md) for the parallel account-approval plan and the prepared app-owner application description.
