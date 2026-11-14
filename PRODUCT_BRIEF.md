# Turtle Tracks product and App Store release brief

Owner: Hague Williams. Updated November 14, 2026. This is the development and release mandate; it does not claim the current prototype is App Store ready.

## Assignment

Finish Turtle Tracks as a dependable, inviting field companion for observing turtles, recording encounters over time, learning how to protect them, and contributing reviewed sightings to the scientific community. Use the original Tilly front cover with part of Learn behind Tilly. This is a cover-only correction; keep the improved icons, other pages, and functional work. Improve recording for someone who cannot identify the animal while preserving the app's cream/forest-green identity. Develop and validate incremental changes on GitHub `main`, the single working version. Have Hague review only https://turtletracks.haguewilliams.com/. Continue authorized code, design, documentation, and testing independently. Ask Hague only when credentials, account ownership, spending, binding terms, or a consequential product choice is required. Never claim background work, successful publication, AI accuracy, or scientific submission without evidence.

## Product direction

- Hague clarified that the selected cover is the original Tilly composition with part of Learn behind her. Remove the photographic cover and switch. Keep the improved Learn/Help icons and other pages unchanged.
- Use shared Material Design role styling with visible focus, readable labels, generous touch targets, and consistent interactions. Check narrow and short phone viewports; allow natural scrolling, keep navigation reachable, and avoid forced tall desktop layouts. Respect iOS platform conventions in the native release.
- Use one primary path: photograph, confirm time/place, optionally review an identification, save. Do not require anatomy checkboxes, a species, sex, age, or individual turtle identity.
- Make Home, Record, My Tracks, Learn, and Help predictable. Citizen Scientist is available after saving and through the journal, Learn, and menu.
- Keep local recording useful without an account. Explain browser/device storage and backups until native durable storage is implemented.

## Definition of done

### Record and track

One photo input experience; editable observation date/time; GPS on explicit request; manual location fallback; optional behavior, habitat, and notes. Old-photo uploads must not silently acquire today's place as their sighting location. Saving, editing, deletion, imports, and photo replacement preserve existing data and report failures honestly. Users can leave an individual unassigned, deliberately start tracking a new turtle, or select a previous turtle. No automatic individual recognition claim. Journal search, repeat-sighting history, backup export, and recovery work on supported devices.

### Photo analysis

The selected implementation runs a small, self-hosted model in the browser without an API account or paid inference. An explicit action checks the photo locally, and a visitor reviews the result before saving. The experimental trial suggests only a possible Eastern box turtle or unknown. Age and sex are required future capabilities but are not working in this trial. Never derive exact age from shell rings, use eye color alone to determine sex, infer hidden anatomy, or tell users to handle wildlife. Each field needs its own reliable visible evidence and validation. Suggestions remain labeled AI and are saved only after the user chooses them. Handle timeouts, malformed output, photo changes, unsupported browsers and download failure. Test real images reviewed by a knowledgeable turtle identifier before making accuracy claims; retain error and abstention counts. Confidence wording is not a calibrated probability.

### Citizen Scientist

For the first release, keep the existing manual iNaturalist handoff: choose a saved sighting, prepare the photograph/date/GPS, open the official uploader, and have the visitor review and submit there under their own account. Explain that downloading or opening the uploader does not send the observation. Provide location-privacy guidance; do not claim a submission or Research Grade result that Turtle Tracks cannot verify. Test only locally with synthetic records; never send them to scientific datasets.

Direct iNaturalist authorization and submission are deferred to a later release and must not block this experience. Retain the implemented code in the same GitHub version with `INAT_ENABLED=false`. Later activation needs an approved application, each contributor’s authorization, explicit consent, obscured/private location review, verified receipts, and safe retry handling. Hague can build owner-account eligibility on iNaturalist’s ordinary website while Turtle Tracks proceeds. Linking iNaturalist does not automatically grant access to its computer-vision service.

### Learn and Help

Concise, sourced material on natural history, behavior, habitat, conservation, and lifespan. Match icons and type across Learn and Help. Keep urgent help easy to reach; provide verified wildlife-rehabilitation resources. Tilly and quests remain optional. A family-friendly option does not by itself imply enrollment in Apple's Kids Category.

### Accessibility and field use

Check VoiceOver, keyboard navigation, contrast, text enlargement, focus return, reachable controls, safe areas, small screens, older devices, reduced motion, weak connectivity, denied camera/location permissions, photo-format failures, and storage pressure. The first useful sighting should be savable without reading a tutorial. Observe a small pilot group of novice and experienced users; resolve blocking points before release.

## Release stages

1. Retain the verified original overlapping Tilly cover and matching icons. Use the manual iNaturalist uploader handoff for the first release.
2. Evaluate the free browser species trial and improve it using independent expert-reviewed photographs. Develop separately validated age and sex estimates; retain unknown when evidence is insufficient. No paid service or account is authorized by this stage.
3. Verify the first-release manual Citizen Scientist handoff and finish recording, backup, accessibility, and phone usability checks. Build iNaturalist account eligibility separately; direct API integration is a later update and does not block the remaining release stages.
4. Package for iOS with appropriate native camera/photo-library/location support and durable local storage. Evaluate a maintained native container versus a native implementation; do not assume a web URL alone meets App Store requirements. Provide meaningful field functionality, offline journal behavior, and safe data migration.
5. Complete device testing and TestFlight beta. Prepare privacy policy, support page, third-party data disclosures, consent screens, data deletion/export behavior, age rating, app icon, screenshots, description, accessibility review, and reviewer instructions.
6. Hague completes Apple Developer ownership, agreements, credentials, and any payments. Configure signing and App Store Connect, upload the verified build, and submit for review with accurate capability disclosures. Address review feedback. Publication is complete only when Apple's approved release is verified; approval is not guaranteed.

## Current status and account dependencies

The original Tilly design and simplified recording flow remain. The default photo mode uses a local MobileNet-based custom species classifier on GitHub Pages. The additional frozen evaluation gave 17 correct and 2 mistaken suggestions from 143 photos, leaving most uncertain; the 95% precision target was not met. It is a clearly disclosed experimental trial, not a finished identifier. Sex and life-stage classifiers failed validation and remain disabled. Upload, analyze, accept, save and reopen work in desktop Chrome; physical device testing remains outstanding. The existing OpenAI backend is retained but inactive and is not required for this trial.

Citizen Scientist uses the manual iNaturalist uploader. Direct submission remains deferred. Native packaging, TestFlight and App Store submission have not started. No Render or OpenAI API account has been activated or paid service purchased. GitHub is already connected. Apple Developer enrollment can wait until native testing is ready.

## Reference patterns and requirements

- iNaturalist observation flow: https://help.inaturalist.org/en/support/solutions/articles/151000192921-how-to-make-an-observation
- iNaturalist and Seek: https://help.inaturalist.org/en/support/solutions/articles/151000169914-what-is-the-difference-between-inaturalist-and-seek-by-inaturalist-
- Merlin Photo ID: https://support.ebird.org/en/support/solutions/articles/48000966224-merlin-photo-id
- Material theming: https://material-web.dev/theming/material-theming/
- Material typography: https://material-web.dev/theming/typography/
- OpenAI image inputs: https://developers.openai.com/api/docs/guides/images-vision
- Apple review requirements: https://developer.apple.com/app-store/review/guidelines/
- Apple privacy disclosures: https://developer.apple.com/app-store/app-privacy-details/
